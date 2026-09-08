import pytest
from django.urls import reverse

from apps.ai_engine.models import AIAnalysis
from apps.common.tests.factories import CategoryFactory
from apps.reports.tests.factories import ReportFactory


@pytest.mark.django_db
class TestAIPipelineTriggeredOnCreate:
    def test_creating_report_via_api_generates_ai_analyses(self, citizen_client):
        """
        CELERY_TASK_ALWAYS_EAGER=True en settings de test (config/settings/test.py)
        rend la tâche synchrone : pas besoin de mock ni d'attente, le résultat
        est immédiatement disponible après la réponse HTTP.
        """
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Trou dangereux sur la route",
            "description": "Nid-de-poule profond, risque pour les motos",
            "severity": "high",
            "latitude": -21.4536,
            "longitude": 47.0833,
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 201

        report_id = response.data["id"]
        analyses = AIAnalysis.objects.filter(report_id=report_id)
        assert analyses.count() == 3
        types = set(analyses.values_list("analysis_type", flat=True))
        assert types == {
            AIAnalysis.AnalysisType.CLASSIFICATION,
            AIAnalysis.AnalysisType.SUMMARY,
            AIAnalysis.AnalysisType.DUPLICATE_DETECTION,
        }


@pytest.mark.django_db
class TestAIAnalysesEndpoint:
    def test_citizen_cannot_view_ai_analyses(self, citizen_client):
        report = ReportFactory()
        url = reverse("reports:report-ai-analyses", args=[report.id])
        response = citizen_client.get(url)
        assert response.status_code == 403

    def test_municipal_admin_can_view_ai_analyses(self, municipal_admin_client):
        report = ReportFactory()
        from apps.ai_engine import services

        services.run_classification(report)

        url = reverse("reports:report-ai-analyses", args=[report.id])
        response = municipal_admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert response.data[0]["analysis_type"] == "classification"

    def test_unauthenticated_cannot_view_ai_analyses(self, api_client):
        report = ReportFactory()
        url = reverse("reports:report-ai-analyses", args=[report.id])
        response = api_client.get(url)
        assert response.status_code == 401
