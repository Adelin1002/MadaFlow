"""
Logique métier IA. Séparée des vues (apps.reports.views) et des tâches
Celery (apps.ai_engine.tasks) pour rester testable sans passer par le client
HTTP ni par un broker — c'est ce fichier qui décide *quoi* faire avec le
résultat d'un AIProvider, jamais le provider lui-même (section 8 : l'IA
fournit une recommandation, elle ne prend pas seule de décision critique).
"""

from django.conf import settings
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from django.utils import timezone

from apps.reports.models import Report

from .models import AIAnalysis
from .providers.base import get_ai_provider

DUPLICATE_SEARCH_RADIUS_M = 150
DUPLICATE_SEARCH_WINDOW_DAYS = 30
DUPLICATE_MAX_CANDIDATES = 10


def _nearby_candidates(report: Report) -> list[dict]:
    """
    Pré-filtre géographique/temporel/catégoriel avant tout raisonnement IA :
    même catégorie, non résolus/rejetés, à moins de DUPLICATE_SEARCH_RADIUS_M
    mètres, créés dans les DUPLICATE_SEARCH_WINDOW_DAYS derniers jours.
    Garde le provider concentré sur un petit ensemble de candidats plausibles
    plutôt que de lui faire comparer le signalement à toute la base.
    """
    cutoff = timezone.now() - timezone.timedelta(days=DUPLICATE_SEARCH_WINDOW_DAYS)
    queryset = (
        Report.objects.exclude(id=report.id)
        .exclude(status__in=[Report.Status.RESOLVED, Report.Status.REJECTED])
        .filter(
            category_id=report.category_id,
            created_at__gte=cutoff,
            location__point__dwithin=(report.location.point, D(m=DUPLICATE_SEARCH_RADIUS_M)),
        )
        .annotate(distance=Distance("location__point", report.location.point))
        .select_related("location")
        .order_by("distance")[:DUPLICATE_MAX_CANDIDATES]
    )
    return [
        {
            "id": str(candidate.id),
            "text": f"{candidate.title} {candidate.description}",
            "distance_m": round(candidate.distance.m, 1),
        }
        for candidate in queryset
    ]


def run_classification(report: Report) -> AIAnalysis:
    """Suggestion de catégorie — n'écrase jamais la catégorie choisie par le citoyen."""
    provider = get_ai_provider()
    ai_result = provider.classify_report(report.title, report.description)
    return AIAnalysis.objects.create(
        report=report,
        analysis_type=AIAnalysis.AnalysisType.CLASSIFICATION,
        provider=ai_result.provider_name,
        result=ai_result.result,
        confidence=ai_result.confidence,
        data_source=AIAnalysis.DataSource.REAL,
    )


def run_summary(report: Report) -> AIAnalysis:
    provider = get_ai_provider()
    ai_result = provider.summarize(report.description)
    return AIAnalysis.objects.create(
        report=report,
        analysis_type=AIAnalysis.AnalysisType.SUMMARY,
        provider=ai_result.provider_name,
        result=ai_result.result,
        confidence=ai_result.confidence,
        data_source=AIAnalysis.DataSource.REAL,
    )


def run_duplicate_detection(report: Report) -> AIAnalysis:
    """
    Détecte les signalements probablement liés au même événement (section 9).
    Ne lie automatiquement `duplicate_of` que si le score dépasse
    AI_DUPLICATE_AUTO_LINK_THRESHOLD ; sinon le résultat reste une
    recommandation consultable par un admin via l'action `ai_analyses`
    (aucune décision administrative critique prise seule par l'IA — section 8).
    """
    provider = get_ai_provider()
    candidates = _nearby_candidates(report)
    reference_text = f"{report.title} {report.description}"

    ai_result = provider.detect_duplicates(reference_text, candidates)

    analysis = AIAnalysis.objects.create(
        report=report,
        analysis_type=AIAnalysis.AnalysisType.DUPLICATE_DETECTION,
        provider=ai_result.provider_name,
        result=ai_result.result,
        confidence=ai_result.confidence,
        data_source=AIAnalysis.DataSource.REAL,
    )

    duplicates = ai_result.result.get("duplicates", [])
    if duplicates and not report.duplicate_of_id:
        top = duplicates[0]
        if top.get("score", 0) >= settings.AI_DUPLICATE_AUTO_LINK_THRESHOLD:
            candidate_id = top.get("id")
            candidate_report = Report.objects.filter(id=candidate_id).first() if candidate_id else None
            if candidate_report:
                report.duplicate_of = candidate_report
                report.save(update_fields=["duplicate_of"])

    return analysis


def run_ai_pipeline(report: Report) -> None:
    """Point d'entrée unique appelé par la tâche Celery post-création (apps.ai_engine.tasks)."""
    run_classification(report)
    run_summary(report)
    run_duplicate_detection(report)
