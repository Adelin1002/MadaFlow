import pytest
from django.urls import reverse

from apps.common.tests.factories import CategoryFactory, DistrictFactory
from apps.reports.models import Report
from apps.reports.tests.factories import ReportFactory


@pytest.mark.django_db
class TestReportCreate:
    def test_create_requires_authentication(self, api_client):
        url = reverse("reports:report-list")
        response = api_client.post(url, {})
        assert response.status_code == 401

    def test_citizen_can_create_report(self, citizen_client, citizen):
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Nid-de-poule rue principale",
            "description": "Trou profond, dangereux la nuit.",
            "severity": "high",
            "latitude": -21.4536,
            "longitude": 47.0833,
            "approximate_address": "Rue principale, Fianarantsoa",
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 201
        assert response.data["reporter"]["username"] == citizen.username
        assert response.data["status"] == "new"

    def test_created_report_has_correct_geolocation(self, citizen_client):
        """Test géospatial : le point PostGIS créé correspond bien aux coordonnées envoyées."""
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Fuite d'eau",
            "description": "Eau qui coule en continu depuis 3 jours.",
            "severity": "medium",
            "latitude": -21.4536,
            "longitude": 47.0833,
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 201

        report = Report.objects.get(id=response.data["id"])
        assert round(report.location.point.y, 4) == -21.4536  # latitude
        assert round(report.location.point.x, 4) == 47.0833  # longitude

    def test_create_rejects_out_of_range_latitude(self, citizen_client):
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Test",
            "description": "Test",
            "severity": "low",
            "latitude": 200,
            "longitude": 47.0833,
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 400
        assert "latitude" in response.data

    def test_create_rejects_out_of_range_longitude(self, citizen_client):
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Test",
            "description": "Test",
            "severity": "low",
            "latitude": -21.4536,
            "longitude": 300,
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 400
        assert "longitude" in response.data

    def test_create_requires_latitude_and_longitude(self, citizen_client):
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Test",
            "description": "Test",
            "severity": "low",
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 400

    def test_reporter_is_set_automatically_not_from_payload(self, citizen_client, citizen, other_citizen):
        """Un utilisateur ne doit jamais pouvoir créer un signalement au nom d'un autre."""
        category = CategoryFactory()
        url = reverse("reports:report-list")
        payload = {
            "category": str(category.id),
            "title": "Test usurpation",
            "description": "Test",
            "severity": "low",
            "latitude": -21.45,
            "longitude": 47.08,
            "reporter": str(other_citizen.id),
        }
        response = citizen_client.post(url, payload, format="json")
        assert response.status_code == 201
        assert response.data["reporter"]["username"] == citizen.username


@pytest.mark.django_db
class TestReportPermissions:
    def test_owner_can_update_own_report(self, citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-detail", args=[report.id])
        response = citizen_client.patch(url, {"title": "Titre corrigé"}, format="json")
        assert response.status_code == 200
        assert response.data["title"] == "Titre corrigé"

    def test_owner_can_update_location(self, citizen_client, citizen):
        """Test géospatial : la mise à jour lat/lon déplace bien le point PostGIS existant."""
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-detail", args=[report.id])
        response = citizen_client.patch(
            url,
            {"latitude": -18.8792, "longitude": 47.5079, "approximate_address": "Antananarivo"},
            format="json",
        )
        assert response.status_code == 200
        report.refresh_from_db()
        assert round(report.location.point.y, 4) == -18.8792
        assert round(report.location.point.x, 4) == 47.5079
        assert report.location.approximate_address == "Antananarivo"

    def test_non_owner_cannot_update_report(self, other_citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-detail", args=[report.id])
        response = other_citizen_client.patch(url, {"title": "Titre modifié"}, format="json")
        assert response.status_code == 403

    def test_non_owner_cannot_delete_report(self, other_citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-detail", args=[report.id])
        response = other_citizen_client.delete(url)
        assert response.status_code == 403

    def test_citizen_cannot_change_status_via_main_endpoint(self, citizen_client, citizen):
        """Le champ status est read_only sur le serializer principal — vérifie qu'il est ignoré."""
        report = ReportFactory(reporter=citizen, status=Report.Status.NEW)
        url = reverse("reports:report-detail", args=[report.id])
        response = citizen_client.patch(url, {"status": "resolved"}, format="json")
        assert response.status_code == 200  # accepté mais status ignoré, pas d'erreur
        report.refresh_from_db()
        assert report.status == Report.Status.NEW

    def test_citizen_cannot_use_status_update_action(self, citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-status-update", args=[report.id])
        response = citizen_client.patch(url, {"status": "resolved"}, format="json")
        assert response.status_code == 403

    def test_municipal_admin_can_change_status(self, municipal_admin_client):
        report = ReportFactory()
        url = reverse("reports:report-status-update", args=[report.id])
        response = municipal_admin_client.patch(url, {"status": "in_progress"}, format="json")
        assert response.status_code == 200
        assert response.data["status"] == "in_progress"

    def test_status_update_to_resolved_sets_resolved_at(self, platform_admin_client):
        report = ReportFactory()
        assert report.resolved_at is None
        url = reverse("reports:report-status-update", args=[report.id])
        response = platform_admin_client.patch(url, {"status": "resolved"}, format="json")
        assert response.status_code == 200
        assert response.data["resolved_at"] is not None


@pytest.mark.django_db
class TestReportConfirmation:
    def test_can_confirm_others_report(self, other_citizen_client):
        report = ReportFactory()
        url = reverse("reports:report-confirm", args=[report.id])
        response = other_citizen_client.post(url)
        assert response.status_code == 201
        assert report.confirmations.count() == 1

    def test_cannot_confirm_own_report(self, citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-confirm", args=[report.id])
        response = citizen_client.post(url)
        assert response.status_code == 400

    def test_confirming_twice_does_not_duplicate(self, other_citizen_client, other_citizen):
        report = ReportFactory()
        url = reverse("reports:report-confirm", args=[report.id])
        other_citizen_client.post(url)
        response = other_citizen_client.post(url)
        assert response.status_code == 200
        assert report.confirmations.count() == 1


@pytest.mark.django_db
class TestReportFilters:
    def test_filter_by_category(self, citizen_client):
        cat_a = CategoryFactory()
        cat_b = CategoryFactory()
        ReportFactory(category=cat_a)
        ReportFactory(category=cat_b)

        url = reverse("reports:report-list")
        response = citizen_client.get(url, {"category": str(cat_a.id)})
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_filter_by_status(self, citizen_client):
        ReportFactory(status=Report.Status.NEW)
        ReportFactory(status=Report.Status.RESOLVED)

        url = reverse("reports:report-list")
        response = citizen_client.get(url, {"status": "resolved"})
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_filter_by_district(self, citizen_client):
        district_a = DistrictFactory()
        district_b = DistrictFactory()
        from apps.common.tests.factories import LocationFactory

        ReportFactory(location=LocationFactory(district=district_a))
        ReportFactory(location=LocationFactory(district=district_b))

        url = reverse("reports:report-list")
        response = citizen_client.get(url, {"district": str(district_a.id)})
        assert response.status_code == 200
        assert response.data["count"] == 1

    def test_search_by_title(self, citizen_client):
        ReportFactory(title="Fuite d'eau majeure")
        ReportFactory(title="Nid-de-poule dangereux")

        url = reverse("reports:report-list")
        response = citizen_client.get(url, {"search": "fuite"})
        assert response.status_code == 200
        assert response.data["count"] == 1


@pytest.mark.django_db
class TestReportImages:
    # GIF 1x1 valide et complet — un header tronqué serait rejeté par la
    # validation Pillow d'ImageField, ce qui est le comportement correct.
    _VALID_GIF = (
        b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01"
        b"\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
    )

    def test_owner_can_upload_image(self, citizen_client, citizen):
        from django.core.files.uploadedfile import SimpleUploadedFile

        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-images", args=[report.id])
        image = SimpleUploadedFile("trou.gif", self._VALID_GIF, content_type="image/gif")
        response = citizen_client.post(url, {"image": image}, format="multipart")
        assert response.status_code == 201
        assert report.images.count() == 1

    def test_non_owner_cannot_upload_image(self, other_citizen_client, citizen):
        from django.core.files.uploadedfile import SimpleUploadedFile

        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-images", args=[report.id])
        image = SimpleUploadedFile("trou.gif", self._VALID_GIF, content_type="image/gif")
        response = other_citizen_client.post(url, {"image": image}, format="multipart")
        assert response.status_code == 403
        assert report.images.count() == 0

    def test_upload_without_image_fails(self, citizen_client, citizen):
        report = ReportFactory(reporter=citizen)
        url = reverse("reports:report-images", args=[report.id])
        response = citizen_client.post(url, {}, format="multipart")
        assert response.status_code == 400
