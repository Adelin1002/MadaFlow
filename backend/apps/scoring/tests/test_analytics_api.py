import pytest
from django.urls import reverse

from apps.reports.tests.factories import ReportFactory


@pytest.mark.django_db
class TestAnalyticsPermissions:
    """Les 4 endpoints partagent la même permission — vérifiée une fois par endpoint."""

    @pytest.mark.parametrize("url_name", ["overview", "districts", "timeline", "heatmap"])
    def test_citizen_forbidden(self, citizen_client, url_name):
        url = reverse(f"analytics:{url_name}")
        response = citizen_client.get(url)
        assert response.status_code == 403

    @pytest.mark.parametrize("url_name", ["overview", "districts", "timeline", "heatmap"])
    def test_unauthenticated_denied(self, api_client, url_name):
        url = reverse(f"analytics:{url_name}")
        response = api_client.get(url)
        assert response.status_code == 401

    @pytest.mark.parametrize("url_name", ["overview", "districts", "timeline", "heatmap"])
    def test_municipal_admin_allowed(self, municipal_admin_client, url_name):
        url = reverse(f"analytics:{url_name}")
        response = municipal_admin_client.get(url)
        assert response.status_code == 200

    @pytest.mark.parametrize("url_name", ["overview", "districts", "timeline", "heatmap"])
    def test_platform_admin_allowed(self, platform_admin_client, url_name):
        url = reverse(f"analytics:{url_name}")
        response = platform_admin_client.get(url)
        assert response.status_code == 200

    def test_business_user_forbidden(self, business_user):
        from rest_framework.test import APIClient

        client = APIClient()
        client.force_authenticate(user=business_user)
        url = reverse("analytics:overview")
        response = client.get(url)
        assert response.status_code == 403


@pytest.mark.django_db
class TestOverviewEndpoint:
    def test_returns_real_counts(self, municipal_admin_client):
        ReportFactory()
        ReportFactory()

        url = reverse("analytics:overview")
        response = municipal_admin_client.get(url)
        assert response.data["total_reports"] == 2


@pytest.mark.django_db
class TestTimelineEndpoint:
    def test_days_query_param_respected(self, municipal_admin_client):
        url = reverse("analytics:timeline")
        response = municipal_admin_client.get(url, {"days": 7})
        assert response.data["window_days"] == 7

    def test_invalid_days_param_falls_back_to_default(self, municipal_admin_client):
        url = reverse("analytics:timeline")
        response = municipal_admin_client.get(url, {"days": "not-a-number"})
        assert response.status_code == 200
        assert response.data["window_days"] == 30


@pytest.mark.django_db
class TestHeatmapEndpoint:
    def test_returns_list_of_points(self, municipal_admin_client):
        ReportFactory()
        url = reverse("analytics:heatmap")
        response = municipal_admin_client.get(url)
        assert response.status_code == 200
        assert len(response.data) == 1
        assert "lat" in response.data[0]
        assert "lon" in response.data[0]
