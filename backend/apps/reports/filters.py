import django_filters

from .models import Report


class ReportFilter(django_filters.FilterSet):
    category = django_filters.UUIDFilter(field_name="category_id")
    district = django_filters.UUIDFilter(field_name="location__district_id")
    status = django_filters.ChoiceFilter(choices=Report.Status.choices)
    severity = django_filters.ChoiceFilter(choices=Report.Severity.choices)
    created_after = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="gte")
    created_before = django_filters.DateTimeFilter(field_name="created_at", lookup_expr="lte")

    class Meta:
        model = Report
        fields = ["category", "district", "status", "severity"]
