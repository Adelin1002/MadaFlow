"""
Logique d'agrégation pour le tableau de bord (section 12). Séparée des vues
pour rester testable sans passer par le client HTTP, même logique que
apps.ai_engine.services et apps.scoring.services.

Principe strict (section 29) : jamais de statistique fabriquée présentée
comme réelle. Quand une moyenne n'a pas de sens faute de données (aucun
signalement résolu, par exemple), la fonction retourne None explicitement —
jamais un zéro trompeur qui laisserait croire à une résolution instantanée.
"""

from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F
from django.db.models.functions import TruncDate
from django.utils import timezone

from apps.geo.models import District
from apps.reports.models import Report
from apps.scoring.models import PriorityScore

ACTIVE_STATUSES_EXCLUDED = [Report.Status.RESOLVED, Report.Status.REJECTED]

DEFAULT_TIMELINE_DAYS = 30
MAX_TIMELINE_DAYS = 365
HEATMAP_MAX_POINTS = 1000


def get_overview() -> dict:
    total = Report.objects.count()
    active = Report.objects.exclude(status__in=ACTIVE_STATUSES_EXCLUDED).count()

    by_status = dict(Report.objects.values_list("status").annotate(count=Count("id")).order_by())
    by_severity = dict(Report.objects.values_list("severity").annotate(count=Count("id")).order_by())

    by_category = list(
        Report.objects.values("category__name")
        .annotate(count=Count("id"))
        .order_by("-count")
        .values("category__name", "count")
    )
    by_category = [{"category": row["category__name"], "count": row["count"]} for row in by_category]

    resolved_qs = Report.objects.filter(status=Report.Status.RESOLVED, resolved_at__isnull=False)
    avg_resolution_hours = None
    if resolved_qs.exists():
        duration = ExpressionWrapper(F("resolved_at") - F("created_at"), output_field=DurationField())
        avg_duration = resolved_qs.annotate(duration=duration).aggregate(avg=Avg("duration"))["avg"]
        avg_resolution_hours = round(avg_duration.total_seconds() / 3600, 1) if avg_duration else None

    return {
        "total_reports": total,
        "active_reports": active,
        "resolved_reports": by_status.get(Report.Status.RESOLVED, 0),
        "rejected_reports": by_status.get(Report.Status.REJECTED, 0),
        "by_status": {choice: by_status.get(choice, 0) for choice, _ in Report.Status.choices},
        "by_severity": {choice: by_severity.get(choice, 0) for choice, _ in Report.Severity.choices},
        "by_category": by_category,
        "avg_resolution_hours": avg_resolution_hours,
    }


def get_district_stats() -> list[dict]:
    """
    Statistiques par quartier, triées par nombre de signalements actifs
    critiques décroissant (approximation de "zones critiques", section 12 —
    pas une donnée de zone importante externe, voir la limite documentée
    dans apps.scoring.services sur ce point).
    """
    results = []
    districts = District.objects.annotate(report_count=Count("locations__reports", distinct=True)).filter(
        report_count__gt=0
    )

    for district in districts:
        reports = Report.objects.filter(location__district=district)
        active_reports = reports.exclude(status__in=ACTIVE_STATUSES_EXCLUDED)
        critical_active = active_reports.filter(priority_score__level=PriorityScore.Level.CRITICAL).count()
        avg_priority = PriorityScore.objects.filter(report__location__district=district).aggregate(
            avg=Avg("score")
        )["avg"]

        results.append(
            {
                "district": district.name,
                "district_id": str(district.id),
                "total_reports": reports.count(),
                "active_reports": active_reports.count(),
                "resolved_reports": reports.filter(status=Report.Status.RESOLVED).count(),
                "critical_active_reports": critical_active,
                "avg_priority_score": round(avg_priority, 2) if avg_priority is not None else None,
            }
        )

    results.sort(key=lambda r: (r["critical_active_reports"], r["avg_priority_score"] or 0), reverse=True)
    return results


def get_timeline(days: int = DEFAULT_TIMELINE_DAYS) -> dict:
    """
    Évolution temporelle : signalements créés et résolus par jour sur la
    fenêtre demandée (30 jours par défaut, 365 maximum).
    """
    days = max(1, min(days, MAX_TIMELINE_DAYS))
    since = timezone.now() - timezone.timedelta(days=days)

    created_by_day = (
        Report.objects.filter(created_at__gte=since)
        .annotate(day=TruncDate("created_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )
    resolved_by_day = (
        Report.objects.filter(resolved_at__gte=since, resolved_at__isnull=False)
        .annotate(day=TruncDate("resolved_at"))
        .values("day")
        .annotate(count=Count("id"))
        .order_by("day")
    )

    return {
        "window_days": days,
        "created": [{"date": row["day"].isoformat(), "count": row["count"]} for row in created_by_day],
        "resolved": [{"date": row["day"].isoformat(), "count": row["count"]} for row in resolved_by_day],
    }


def get_heatmap_points() -> list[dict]:
    """
    Points géolocalisés pondérés pour une carte thermique — uniquement les
    signalements actifs (résoudre un problème devrait le faire disparaître
    de la carte de chaleur). Le poids est le score de priorité s'il existe
    déjà, sinon 1.0 par défaut (signalement tout juste créé, score pas
    encore calculé par la tâche asynchrone).
    """
    active_reports = (
        Report.objects.exclude(status__in=ACTIVE_STATUSES_EXCLUDED)
        .select_related("location", "priority_score")
        .filter(location__isnull=False)[:HEATMAP_MAX_POINTS]
    )
    return [
        {
            "report_id": str(report.id),
            "lat": report.location.point.y,
            "lon": report.location.point.x,
            "weight": report.priority_score.score if hasattr(report, "priority_score") else 1.0,
        }
        for report in active_reports
    ]
