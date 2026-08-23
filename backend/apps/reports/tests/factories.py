import factory

from apps.common.tests.factories import CategoryFactory, LocationFactory, UserFactory
from apps.reports.models import Report


class ReportFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Report

    reporter = factory.SubFactory(UserFactory)
    category = factory.SubFactory(CategoryFactory)
    location = factory.SubFactory(LocationFactory)
    title = factory.Sequence(lambda n: f"Nid-de-poule dangereux #{n}")
    description = "Gros trou sur la route, dangereux pour les deux-roues."
    severity = Report.Severity.MEDIUM
    status = Report.Status.NEW
