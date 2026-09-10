import pytest
from django.urls import reverse

from apps.common.tests.factories import CategoryFactory
from apps.reports.tests.factories import ReportFactory
from apps.scoring.models import PriorityScore


@pytest.mark.django_db
class TestPriorityScoreOnCreate:
    def test_creating_report_computes_priority_score(self, citizen_client):
        """
        CELERY_TASK_ALWAYS_EAGER=True (config/settings/test.py) rend la chaîne
        de tâches (pipeline IA -> scoring) synchrone : le score existe déjà
        dans la réponse HTTP de création, sans polling ni attente.
        """
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Trou dangereux",
            "description": "Nid-de-poule profond",
            "severity": "critical",
            "latitude": -21.4536,
            "longitude": 47.0833,
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 201

        assert response.data["priority_score"] is not None
        assert response.data["priority_score"]["level"] in ("low", "medium", "high", "critical")
        assert "factors" in response.data["priority_score"]["explanation"]

    def test_priority_score_visible_to_any_authenticated_user(self, other_citizen_client):
        """Transparence citoyenne (section 8) : pas réservé aux admins, contrairement à ai_analyses."""
        report = ReportFactory()
        from apps.scoring import services

        services.compute_priority_score(report)

        url = reverse("reports:report-detail", args=[report.id])
        response = other_citizen_client.get(url)
        assert response.status_code == 200
        assert response.data["priority_score"] is not None


@pytest.mark.django_db
class TestPriorityScoreOnConfirm:
    def test_confirming_report_recomputes_score(self, other_citizen_client):
        report = ReportFactory()
        from apps.scoring import services

        before = services.compute_priority_score(report)

        url = reverse("reports:report-confirm", args=[report.id])
        response = other_citizen_client.post(url)
        assert response.status_code == 201

        after = PriorityScore.objects.get(report=report)
        assert after.score > before.score


@pytest.mark.django_db
class TestPriorityFilterAndOrdering:
    def test_filter_by_priority_level(self, citizen_client):
        from apps.scoring import services

        low = ReportFactory(severity="low")
        critical = ReportFactory(severity="critical")
        services.compute_priority_score(low)
        services.compute_priority_score(critical)

        url = reverse("reports:report-list")
        # Le niveau réel dépend des autres facteurs (confirmations, etc.), donc on
        # interroge simplement le niveau effectivement calculé pour "critical"
        # plutôt que de supposer un niveau fixe.
        critical_level = PriorityScore.objects.get(report=critical).level
        response = citizen_client.get(url, {"priority": critical_level})
        assert response.status_code == 200
        returned_ids = {r["id"] for r in response.data["results"]}
        assert str(critical.id) in returned_ids

    def test_order_by_priority_score(self, citizen_client):
        from apps.scoring import services

        low = ReportFactory(severity="low")
        critical = ReportFactory(severity="critical")
        services.compute_priority_score(low)
        services.compute_priority_score(critical)

        url = reverse("reports:report-list")
        response = citizen_client.get(url, {"ordering": "-priority_score__score"})
        assert response.status_code == 200
        ids_in_order = [r["id"] for r in response.data["results"]]
        assert ids_in_order.index(str(critical.id)) < ids_in_order.index(str(low.id))
