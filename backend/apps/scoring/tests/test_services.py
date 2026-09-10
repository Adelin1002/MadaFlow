import pytest
from django.utils import timezone

from apps.common.tests.factories import DistrictFactory, LocationFactory, UserFactory
from apps.reports.models import Report
from apps.reports.tests.factories import ReportFactory
from apps.scoring import services
from apps.scoring.models import PriorityScore


@pytest.mark.django_db
class TestSeverityFactor:
    def test_low_severity_baseline(self):
        report = ReportFactory(severity=Report.Severity.LOW)
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["severity"]["score"] == 25.0

    def test_medium_severity(self):
        report = ReportFactory(severity=Report.Severity.MEDIUM)
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["severity"]["score"] == 50.0

    def test_high_severity(self):
        report = ReportFactory(severity=Report.Severity.HIGH)
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["severity"]["score"] == 75.0

    def test_critical_severity(self):
        report = ReportFactory(severity=Report.Severity.CRITICAL)
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["severity"]["score"] == 100.0

    def test_higher_severity_yields_higher_total_score(self):
        low = services.compute_priority_score(ReportFactory(severity=Report.Severity.LOW))
        critical = services.compute_priority_score(ReportFactory(severity=Report.Severity.CRITICAL))
        assert critical.score > low.score


@pytest.mark.django_db
class TestConfirmationsFactor:
    def test_no_confirmations_scores_zero(self):
        report = ReportFactory()
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["confirmations"]["score"] == 0.0

    def test_confirmations_increase_score(self):
        from apps.reports.models import ReportConfirmation

        report = ReportFactory()
        ReportConfirmation.objects.create(report=report, user=UserFactory())
        ReportConfirmation.objects.create(report=report, user=UserFactory())

        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["confirmations"]["count"] == 2
        assert score.explanation["factors"]["confirmations"]["score"] == 40.0  # 2/5 * 100

    def test_confirmations_score_capped_at_100(self):
        from apps.reports.models import ReportConfirmation

        report = ReportFactory()
        for _ in range(10):  # bien au-delà du plafond de 5
            ReportConfirmation.objects.create(report=report, user=UserFactory())

        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["confirmations"]["score"] == 100.0


@pytest.mark.django_db
class TestDuplicatesFactor:
    def test_no_linked_duplicates_scores_zero(self):
        report = ReportFactory()
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["duplicates"]["score"] == 0.0

    def test_linked_duplicates_increase_score(self):
        original = ReportFactory()
        ReportFactory(duplicate_of=original)

        score = services.compute_priority_score(original)
        assert score.explanation["factors"]["duplicates"]["count"] == 1
        assert score.explanation["factors"]["duplicates"]["score"] > 0

    def test_only_counts_reports_pointing_to_this_one_not_the_other_way(self):
        """Le doublon lui-même ne doit pas voir son propre score gonflé par ce lien."""
        original = ReportFactory()
        duplicate = ReportFactory(duplicate_of=original)

        score = services.compute_priority_score(duplicate)
        assert score.explanation["factors"]["duplicates"]["count"] == 0


@pytest.mark.django_db
class TestAgeFactor:
    def test_fresh_report_has_near_zero_age_score(self):
        report = ReportFactory()
        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["age"]["score"] == 0.0

    def test_older_report_scores_higher(self):
        report = ReportFactory()
        old_date = timezone.now() - timezone.timedelta(days=15)
        Report.objects.filter(id=report.id).update(created_at=old_date)
        report.refresh_from_db()

        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["age"]["days"] == 15
        assert score.explanation["factors"]["age"]["score"] == 50.0  # 15/30 * 100

    def test_age_score_capped_at_100(self):
        report = ReportFactory()
        very_old = timezone.now() - timezone.timedelta(days=90)
        Report.objects.filter(id=report.id).update(created_at=very_old)
        report.refresh_from_db()

        score = services.compute_priority_score(report)
        assert score.explanation["factors"]["age"]["score"] == 100.0


@pytest.mark.django_db
class TestRecurrenceFactor:
    def test_no_district_returns_zero_with_note(self):
        location = LocationFactory(district=None)
        report = ReportFactory(location=location)

        score = services.compute_priority_score(report)
        recurrence = score.explanation["factors"]["recurrence"]
        assert recurrence["score"] == 0.0
        assert recurrence["note"] == "district non renseigné"

    def test_recurring_reports_in_same_district_and_category_increase_score(self):
        district = DistrictFactory()
        category = ReportFactory().category  # catégorie de référence

        # 3 autres signalements dans le même quartier/catégorie récemment.
        for _ in range(3):
            ReportFactory(category=category, location=LocationFactory(district=district))

        target = ReportFactory(category=category, location=LocationFactory(district=district))
        score = services.compute_priority_score(target)

        recurrence = score.explanation["factors"]["recurrence"]
        assert recurrence["count"] == 3
        assert recurrence["district"] == district.name
        assert recurrence["score"] == 60.0  # 3/5 * 100

    def test_different_category_not_counted_as_recurrence(self):
        district = DistrictFactory()
        # catégorie différente (factory séquentielle) : ne doit pas compter dans la récurrence
        ReportFactory(location=LocationFactory(district=district))
        target = ReportFactory(location=LocationFactory(district=district))

        score = services.compute_priority_score(target)
        assert score.explanation["factors"]["recurrence"]["count"] == 0

    def test_old_reports_outside_window_not_counted(self):
        district = DistrictFactory()
        category = ReportFactory().category
        old_report = ReportFactory(category=category, location=LocationFactory(district=district))
        old_date = timezone.now() - timezone.timedelta(days=200)  # hors fenêtre de 90 jours
        Report.objects.filter(id=old_report.id).update(created_at=old_date)

        target = ReportFactory(category=category, location=LocationFactory(district=district))
        score = services.compute_priority_score(target)
        assert score.explanation["factors"]["recurrence"]["count"] == 0


@pytest.mark.django_db
class TestExplanationTransparency:
    def test_lists_not_implemented_factors(self):
        """Section 29 : jamais de donnée fabriquée présentée comme réelle."""
        report = ReportFactory()
        score = services.compute_priority_score(report)
        assert "proximite_zone_importante" in score.explanation["not_implemented_factors"]

    def test_every_implemented_factor_has_weight_and_contribution(self):
        report = ReportFactory()
        score = services.compute_priority_score(report)
        for name in ("severity", "confirmations", "duplicates", "age", "recurrence"):
            factor = score.explanation["factors"][name]
            assert "weight" in factor
            assert "contribution" in factor

    def test_weights_sum_to_one(self):
        assert round(sum(services.WEIGHTS.values()), 6) == 1.0


@pytest.mark.django_db
class TestResolvedRejectedGuard:
    def test_resolved_report_returns_none_and_creates_no_score(self):
        report = ReportFactory(status=Report.Status.RESOLVED)
        result = services.compute_priority_score(report)
        assert result is None
        assert not PriorityScore.objects.filter(report=report).exists()

    def test_rejected_report_returns_none(self):
        report = ReportFactory(status=Report.Status.REJECTED)
        result = services.compute_priority_score(report)
        assert result is None

    def test_recompute_leaves_existing_score_untouched_if_now_resolved(self):
        """Le score déjà calculé reste consultable comme trace historique."""
        report = ReportFactory(status=Report.Status.NEW)
        services.compute_priority_score(report)
        original_score = PriorityScore.objects.get(report=report).score

        report.status = Report.Status.RESOLVED
        report.save(update_fields=["status"])
        services.compute_priority_score(report)  # ne doit rien changer

        assert PriorityScore.objects.get(report=report).score == original_score


@pytest.mark.django_db
class TestLevelThresholds:
    def test_score_just_below_low_max_is_low(self, settings):
        settings.PRIORITY_LOW_MAX = 25.0
        assert services._level_for_score(24.99) == PriorityScore.Level.LOW

    def test_score_at_low_max_is_medium(self, settings):
        settings.PRIORITY_LOW_MAX = 25.0
        settings.PRIORITY_MEDIUM_MAX = 50.0
        assert services._level_for_score(25.0) == PriorityScore.Level.MEDIUM

    def test_score_at_high_max_is_critical(self, settings):
        settings.PRIORITY_HIGH_MAX = 75.0
        assert services._level_for_score(75.0) == PriorityScore.Level.CRITICAL

    def test_thresholds_are_configurable(self, settings):
        """Ajustable sans changement de code — utile pour une collectivité qui veut sa propre sensibilité."""
        settings.PRIORITY_LOW_MAX = 10.0
        assert services._level_for_score(15.0) != PriorityScore.Level.LOW


@pytest.mark.django_db
class TestUpdateOrCreate:
    def test_recomputing_updates_existing_record_not_duplicate(self):
        report = ReportFactory()
        services.compute_priority_score(report)
        services.compute_priority_score(report)
        assert PriorityScore.objects.filter(report=report).count() == 1

    def test_recompute_reflects_new_confirmations(self):
        from apps.reports.models import ReportConfirmation

        report = ReportFactory()
        first = services.compute_priority_score(report)
        ReportConfirmation.objects.create(report=report, user=UserFactory())
        second = services.compute_priority_score(report)
        assert second.score > first.score
