from celery import shared_task

from apps.reports.models import Report

from .services import compute_priority_score


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def compute_priority_score_task(self, report_id: str) -> None:
    try:
        report = Report.objects.select_related("location__district", "category").get(id=report_id)
    except Report.DoesNotExist:
        return

    try:
        compute_priority_score(report)
    except Exception as exc:  # pragma: no cover - filet de sécurité, retry plutôt que silence total
        raise self.retry(exc=exc)
