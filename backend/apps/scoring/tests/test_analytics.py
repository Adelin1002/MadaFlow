import pytest
from django.utils import timezone

from apps.common.tests.factories import CategoryFactory, DistrictFactory, LocationFactory
from apps.reports.models import Report
from apps.reports.tests.factories import ReportFactory
from apps.scoring import analytics, services


@pytest.mark.django_db
class TestOverview:
    def test_empty_database_returns_zeros_not_errors(self):
        result = analytics.get_overview()
        assert result["total_reports"] == 0
        assert result["active_reports"] == 0
        assert result["avg_resolution_hours"] is None

    def test_counts_total_and_active_reports(self):
        ReportFactory(status=Report.Status.NEW)
        ReportFactory(status=Report.Status.IN_PROGRESS)
        ReportFactory(status=Report.Status.RESOLVED)

        result = analytics.get_overview()
        assert result["total_reports"] == 3
        assert result["active_reports"] == 2  # résolu exclu

    def test_by_status_breakdown(self):
        ReportFactory(status=Report.Status.NEW)
        ReportFactory(status=Report.Status.NEW)
        ReportFactory(status=Report.Status.RESOLVED)

        result = analytics.get_overview()
        assert result["by_status"]["new"] == 2
        assert result["by_status"]["resolved"] == 1
        assert result["by_status"]["rejected"] == 0  # présent même à zéro

    def test_by_severity_breakdown(self):
        ReportFactory(severity=Report.Severity.CRITICAL)
        ReportFactory(severity=Report.Severity.LOW)

        result = analytics.get_overview()
        assert result["by_severity"]["critical"] == 1
        assert result["by_severity"]["low"] == 1
        assert result["by_severity"]["medium"] == 0

    def test_by_category_breakdown(self):
        category = CategoryFactory(name="Route")
        ReportFactory(category=category)
        ReportFactory(category=category)

        result = analytics.get_overview()
        route_entry = next(c for c in result["by_category"] if c["category"] == "Route")
        assert route_entry["count"] == 2

    def test_avg_resolution_hours_none_without_resolved_reports(self):
        ReportFactory(status=Report.Status.NEW)
        result = analytics.get_overview()
        assert result["avg_resolution_hours"] is None

    def test_avg_resolution_hours_computed_correctly(self):
        created = timezone.now() - timezone.timedelta(hours=10)
        resolved = timezone.now()
        report = ReportFactory(status=Report.Status.RESOLVED)
        Report.objects.filter(id=report.id).update(created_at=created, resolved_at=resolved)

        result = analytics.get_overview()
        assert result["avg_resolution_hours"] == pytest.approx(10.0, abs=0.1)

    def test_resolved_without_resolved_at_excluded_from_average(self):
        """Garde-fou : un statut resolved sans resolved_at ne doit jamais fausser la moyenne."""
        report = ReportFactory(status=Report.Status.RESOLVED)
        Report.objects.filter(id=report.id).update(resolved_at=None)

        result = analytics.get_overview()
        assert result["avg_resolution_hours"] is None


@pytest.mark.django_db
class TestDistrictStats:
    def test_district_without_reports_excluded(self):
        DistrictFactory()  # aucun signalement
        result = analytics.get_district_stats()
        assert result == []

    def test_district_with_reports_included(self):
        district = DistrictFactory()
        ReportFactory(location=LocationFactory(district=district))

        result = analytics.get_district_stats()
        assert len(result) == 1
        assert result[0]["district"] == district.name
        assert result[0]["total_reports"] == 1

    def test_resolved_count_correct(self):
        district = DistrictFactory()
        ReportFactory(location=LocationFactory(district=district), status=Report.Status.RESOLVED)
        ReportFactory(location=LocationFactory(district=district), status=Report.Status.NEW)

        result = analytics.get_district_stats()
        assert result[0]["resolved_reports"] == 1
        assert result[0]["active_reports"] == 1

    def test_critical_active_reports_counted_via_priority_score(self):
        district = DistrictFactory()
        critical_report = ReportFactory(
            location=LocationFactory(district=district), severity=Report.Severity.CRITICAL
        )
        services.compute_priority_score(critical_report)
        # Forcer le niveau critique pour un test déterministe, indépendant des seuils par défaut.
        critical_report.priority_score.level = "critical"
        critical_report.priority_score.save(update_fields=["level"])

        result = analytics.get_district_stats()
        assert result[0]["critical_active_reports"] == 1

    def test_sorted_by_critical_count_descending(self):
        low_district = DistrictFactory()
        high_district = DistrictFactory()

        ReportFactory(location=LocationFactory(district=low_district))

        for _ in range(2):
            report = ReportFactory(location=LocationFactory(district=high_district))
            services.compute_priority_score(report)
            report.priority_score.level = "critical"
            report.priority_score.save(update_fields=["level"])

        result = analytics.get_district_stats()
        assert result[0]["district"] == high_district.name

    def test_reports_without_district_do_not_crash(self):
        ReportFactory(location=LocationFactory(district=None))
        result = analytics.get_district_stats()
        assert result == []  # aucun quartier renseigné, rien à agréger


@pytest.mark.django_db
class TestTimeline:
    def test_empty_returns_empty_lists(self):
        result = analytics.get_timeline()
        assert result["created"] == []
        assert result["resolved"] == []

    def test_counts_created_within_window(self):
        ReportFactory()
        ReportFactory()

        result = analytics.get_timeline(days=30)
        total_created = sum(day["count"] for day in result["created"])
        assert total_created == 2

    def test_excludes_reports_outside_window(self):
        report = ReportFactory()
        old_date = timezone.now() - timezone.timedelta(days=60)
        Report.objects.filter(id=report.id).update(created_at=old_date)

        result = analytics.get_timeline(days=30)
        total_created = sum(day["count"] for day in result["created"])
        assert total_created == 0

    def test_counts_resolved_within_window(self):
        report = ReportFactory(status=Report.Status.RESOLVED)
        Report.objects.filter(id=report.id).update(resolved_at=timezone.now())

        result = analytics.get_timeline(days=30)
        total_resolved = sum(day["count"] for day in result["resolved"])
        assert total_resolved == 1

    def test_days_parameter_clamped_to_valid_range(self):
        result = analytics.get_timeline(days=0)
        assert result["window_days"] == 1

        result = analytics.get_timeline(days=10000)
        assert result["window_days"] == analytics.MAX_TIMELINE_DAYS


@pytest.mark.django_db
class TestHeatmapPoints:
    def test_empty_returns_empty_list(self):
        assert analytics.get_heatmap_points() == []

    def test_active_report_included_with_coordinates(self):
        report = ReportFactory()
        points = analytics.get_heatmap_points()
        assert len(points) == 1
        assert points[0]["report_id"] == str(report.id)
        assert isinstance(points[0]["lat"], float)
        assert isinstance(points[0]["lon"], float)

    def test_resolved_report_excluded(self):
        ReportFactory(status=Report.Status.RESOLVED)
        assert analytics.get_heatmap_points() == []

    def test_weight_uses_priority_score_when_available(self):
        report = ReportFactory()
        priority = services.compute_priority_score(report)

        points = analytics.get_heatmap_points()
        assert points[0]["weight"] == priority.score

    def test_weight_defaults_to_one_without_priority_score(self):
        ReportFactory()  # aucun compute_priority_score appelé
        points = analytics.get_heatmap_points()
        assert points[0]["weight"] == 1.0
