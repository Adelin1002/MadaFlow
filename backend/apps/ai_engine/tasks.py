from celery import shared_task

from apps.reports.models import Report

from . import services


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def run_report_ai_pipeline(self, report_id: str) -> None:
    """
    Exécute classification + résumé + détection de doublons pour un
    signalement fraîchement créé. Ne doit jamais bloquer ni faire échouer la
    création du signalement elle-même — voir apps.reports.views.perform_create,
    où l'appel est asynchrone (.delay).

    Déclenche ensuite le calcul du score de priorité (apps.scoring) pour ce
    signalement, et pour celui dont il vient d'être déclaré doublon le cas
    échéant — ce dernier vient de gagner un signal de corroboration
    indépendant qui doit se refléter dans son score (section 8).
    """
    try:
        report = Report.objects.select_related("location", "category").get(id=report_id)
    except Report.DoesNotExist:
        return

    try:
        services.run_ai_pipeline(report)
    except Exception as exc:  # pragma: no cover - filet de sécurité, retry plutôt que silence total
        raise self.retry(exc=exc)

    from apps.scoring.tasks import compute_priority_score_task

    compute_priority_score_task.delay(str(report.id))

    report.refresh_from_db(fields=["duplicate_of_id"])
    if report.duplicate_of_id:
        compute_priority_score_task.delay(str(report.duplicate_of_id))
