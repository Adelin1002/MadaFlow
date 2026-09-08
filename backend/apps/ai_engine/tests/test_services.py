import pytest
from django.contrib.gis.geos import Point

from apps.ai_engine import services
from apps.ai_engine.models import AIAnalysis
from apps.common.tests.factories import LocationFactory
from apps.reports.models import Report
from apps.reports.tests.factories import ReportFactory


@pytest.mark.django_db
class TestRunClassification:
    def test_creates_analysis_record(self):
        report = ReportFactory(title="Trou sur la route", description="Nid-de-poule dangereux")
        analysis = services.run_classification(report)

        assert analysis.analysis_type == AIAnalysis.AnalysisType.CLASSIFICATION
        assert analysis.result["category_guess"] == "route"
        assert analysis.data_source == AIAnalysis.DataSource.REAL

    def test_never_overwrites_the_reports_actual_category(self):
        """L'IA suggère, elle ne décide jamais seule (section 8)."""
        report = ReportFactory(title="Trou sur la route", description="Nid-de-poule")
        original_category = report.category
        services.run_classification(report)
        report.refresh_from_db()
        assert report.category_id == original_category.id


@pytest.mark.django_db
class TestRunSummary:
    def test_creates_summary_analysis(self):
        report = ReportFactory(description="Un problème sérieux. Deuxième phrase ignorée.")
        analysis = services.run_summary(report)
        assert analysis.analysis_type == AIAnalysis.AnalysisType.SUMMARY
        assert "Un problème sérieux." in analysis.result["summary"]


@pytest.mark.django_db
class TestRunDuplicateDetection:
    def test_no_candidates_creates_empty_analysis(self):
        report = ReportFactory()
        analysis = services.run_duplicate_detection(report)
        assert analysis.result["duplicates"] == []
        report.refresh_from_db()
        assert report.duplicate_of_id is None

    def test_links_when_score_above_threshold(self, settings):
        settings.AI_DUPLICATE_AUTO_LINK_THRESHOLD = 0.5  # seuil bas pour le test

        location = LocationFactory(point=Point(47.0833, -21.4536, srid=4326))
        existing = ReportFactory(
            title="Fuite d'eau importante",
            description="Eau qui coule en continu",
            location=location,
        )
        # Même texte, à 5m du premier — doit matcher fortement.
        nearby_location = LocationFactory(point=Point(47.0834, -21.4536, srid=4326))
        new_report = ReportFactory(
            title="Fuite d'eau importante",
            description="Eau qui coule en continu",
            category=existing.category,
            location=nearby_location,
        )

        services.run_duplicate_detection(new_report)
        new_report.refresh_from_db()

        assert new_report.duplicate_of_id == existing.id

    def test_does_not_link_when_score_below_threshold(self, settings):
        settings.AI_DUPLICATE_AUTO_LINK_THRESHOLD = 0.95  # seuil très haut

        location = LocationFactory(point=Point(47.0833, -21.4536, srid=4326))
        existing = ReportFactory(
            title="Trou dans la route",
            description="Nid-de-poule",
            location=location,
        )
        nearby_location = LocationFactory(point=Point(47.0834, -21.4536, srid=4326))
        # Texte partiellement différent : similarité modérée, sous le seuil très haut.
        new_report = ReportFactory(
            title="Problème de voirie signalé",
            description="Chaussée abîmée à cet endroit",
            category=existing.category,
            location=nearby_location,
        )

        services.run_duplicate_detection(new_report)
        new_report.refresh_from_db()

        assert new_report.duplicate_of_id is None

    def test_ignores_reports_from_different_category(self):
        location = LocationFactory(point=Point(47.0833, -21.4536, srid=4326))
        existing = ReportFactory(title="Identique", description="Identique", location=location)
        nearby_location = LocationFactory(point=Point(47.0834, -21.4536, srid=4326))
        new_report = ReportFactory(
            title="Identique", description="Identique", location=nearby_location
        )  # catégorie différente par défaut (factory séquentielle)

        assert new_report.category_id != existing.category_id
        analysis = services.run_duplicate_detection(new_report)
        assert analysis.result["duplicates"] == []

    def test_ignores_resolved_reports_as_candidates(self):
        location = LocationFactory(point=Point(47.0833, -21.4536, srid=4326))
        resolved = ReportFactory(
            title="Identique", description="Identique", location=location, status=Report.Status.RESOLVED
        )
        nearby_location = LocationFactory(point=Point(47.0834, -21.4536, srid=4326))
        new_report = ReportFactory(
            title="Identique", description="Identique", category=resolved.category, location=nearby_location
        )

        analysis = services.run_duplicate_detection(new_report)
        assert analysis.result["duplicates"] == []

    def test_does_not_overwrite_existing_duplicate_link(self, settings):
        settings.AI_DUPLICATE_AUTO_LINK_THRESHOLD = 0.1  # tout matche

        location = LocationFactory(point=Point(47.0833, -21.4536, srid=4326))
        original = ReportFactory(title="A", description="A", location=location)
        already_linked = ReportFactory(
            title="A",
            description="A",
            category=original.category,
            location=location,
            duplicate_of=original,
        )

        services.run_duplicate_detection(already_linked)
        already_linked.refresh_from_db()

        assert already_linked.duplicate_of_id == original.id  # inchangé


@pytest.mark.django_db
class TestRunAiPipeline:
    def test_creates_all_three_analysis_types(self):
        report = ReportFactory(title="Trou sur la route", description="Nid-de-poule dangereux")
        services.run_ai_pipeline(report)

        types = set(report.ai_analyses.values_list("analysis_type", flat=True))
        assert types == {
            AIAnalysis.AnalysisType.CLASSIFICATION,
            AIAnalysis.AnalysisType.SUMMARY,
            AIAnalysis.AnalysisType.DUPLICATE_DETECTION,
        }
