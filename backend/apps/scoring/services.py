"""
Moteur de scoring de priorité (section 8). Combine plusieurs signaux
observables — gravité déclarée, confirmations citoyennes, signalements liés
comme doublons, ancienneté, récurrence dans le quartier — en un score
explicable : chaque facteur, son poids et sa contribution sont conservés
dans PriorityScore.explanation. Aucune décision administrative n'est prise
automatiquement à partir de ce score (section 8) : il informe, il ne décide
pas — le statut du signalement reste entièrement entre les mains des admins
(voir apps.common.permissions.IsMunicipalOrPlatformAdmin).

Un facteur explicitement prévu par le cahier des charges n'est PAS implémenté
ici : la "proximité d'une zone importante". Faute de source de données réelle
sur les zones sensibles/stratégiques de Madagascar à ce stade du projet,
plutôt que d'inventer une donnée, ce facteur est absent du calcul et listé
dans `not_implemented_factors` de l'explication — voir section 29 : ne jamais
présenter une donnée fabriquée comme réelle.

Choix de conception délibéré : le facteur "duplicates" ne compte que les
signalements effectivement liés via `duplicate_of` (donc déjà passés le
seuil de confiance AI_DUPLICATE_AUTO_LINK_THRESHOLD dans
apps.ai_engine.services), pas les scores de similarité bruts sous ce seuil.
Cela évite qu'un signal IA de faible confiance influence silencieusement un
score de priorité qui peut orienter une intervention administrative réelle.
"""

from django.conf import settings
from django.utils import timezone

from apps.reports.models import Report

from .models import PriorityScore

# La somme des poids des facteurs implémentés doit rester égale à 1.0.
WEIGHTS = {
    "severity": 0.35,
    "confirmations": 0.20,
    "duplicates": 0.15,
    "age": 0.15,
    "recurrence": 0.15,
}

SEVERITY_SCORES = {
    Report.Severity.LOW: 25.0,
    Report.Severity.MEDIUM: 50.0,
    Report.Severity.HIGH: 75.0,
    Report.Severity.CRITICAL: 100.0,
}

CONFIRMATIONS_CAP = 5  # au-delà de 5 confirmations, score plafonné à 100
DUPLICATES_CAP = 3  # au-delà de 3 signalements liés, score plafonné à 100
AGE_CAP_DAYS = 30  # au-delà de 30 jours sans résolution, score plafonné à 100
RECURRENCE_CAP = 5  # au-delà de 5 signalements récents dans le même quartier/catégorie
RECURRENCE_WINDOW_DAYS = 90

NOT_IMPLEMENTED_FACTORS = ["proximite_zone_importante"]


def _capped_ratio_score(value: float, cap: float) -> float:
    if not cap:  # pragma: no cover - garde défensive, tous les caps sont des constantes > 0
        return 0.0
    return round(min(100.0, (value / cap) * 100.0), 2)


def _severity_factor(report: Report) -> dict:
    return {"value": report.severity, "score": SEVERITY_SCORES.get(report.severity, 0.0)}


def _confirmations_factor(report: Report) -> dict:
    count = report.confirmations.count()
    return {"count": count, "score": _capped_ratio_score(count, CONFIRMATIONS_CAP)}


def _duplicates_factor(report: Report) -> dict:
    """
    Nombre d'autres signalements pointant vers celui-ci via `duplicate_of` —
    un signal de corroboration indépendant, produit par la détection de
    doublons IA (section 8 : "signaux provenant d'autres sources").
    """
    count = Report.objects.filter(duplicate_of_id=report.id).count()
    return {"count": count, "score": _capped_ratio_score(count, DUPLICATES_CAP)}


def _age_factor(report: Report) -> dict:
    age_days = (timezone.now() - report.created_at).days
    return {"days": age_days, "score": _capped_ratio_score(age_days, AGE_CAP_DAYS)}


def _recurrence_factor(report: Report) -> dict:
    """Problème récurrent dans le même quartier/catégorie récemment — signal de négligence."""
    district = report.location.district
    if district is None:
        return {"count": None, "district": None, "score": 0.0, "note": "district non renseigné"}

    cutoff = timezone.now() - timezone.timedelta(days=RECURRENCE_WINDOW_DAYS)
    count = (
        Report.objects.exclude(id=report.id)
        .filter(
            location__district_id=district.id,
            category_id=report.category_id,
            created_at__gte=cutoff,
        )
        .count()
    )
    return {"count": count, "district": district.name, "score": _capped_ratio_score(count, RECURRENCE_CAP)}


def _level_for_score(score: float) -> str:
    if score < settings.PRIORITY_LOW_MAX:
        return PriorityScore.Level.LOW
    if score < settings.PRIORITY_MEDIUM_MAX:
        return PriorityScore.Level.MEDIUM
    if score < settings.PRIORITY_HIGH_MAX:
        return PriorityScore.Level.HIGH
    return PriorityScore.Level.CRITICAL


def compute_priority_score(report: Report) -> PriorityScore | None:
    """
    Calcule (ou recalcule) le score de priorité d'un signalement actif.
    Retourne None sans rien modifier si le signalement est déjà résolu/rejeté
    — un score de priorité n'a plus d'utilité une fois le problème traité,
    et le recalculer donnerait l'illusion trompeuse d'un suivi actif.
    """
    if report.status in (Report.Status.RESOLVED, Report.Status.REJECTED):
        return None

    factors = {
        "severity": _severity_factor(report),
        "confirmations": _confirmations_factor(report),
        "duplicates": _duplicates_factor(report),
        "age": _age_factor(report),
        "recurrence": _recurrence_factor(report),
    }

    total = 0.0
    for name, weight in WEIGHTS.items():
        contribution = round(factors[name]["score"] * weight, 2)
        factors[name]["weight"] = weight
        factors[name]["contribution"] = contribution
        total += contribution
    total = round(total, 2)

    explanation = {
        "factors": factors,
        "not_implemented_factors": NOT_IMPLEMENTED_FACTORS,
    }

    priority_score, _ = PriorityScore.objects.update_or_create(
        report=report,
        defaults={"score": total, "level": _level_for_score(total), "explanation": explanation},
    )
    return priority_score
