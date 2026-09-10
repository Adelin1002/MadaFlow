import pytest
from unittest.mock import Mock

from apps.common.tests.factories import UserFactory
from apps.reports.permissions import IsOwnerOrReadOnly
from apps.reports.tests.factories import ReportFactory


@pytest.mark.django_db
class TestIsOwnerOrReadOnly:
    def test_safe_method_always_allowed_at_object_level(self):
        owner = UserFactory()
        other = UserFactory()
        report = ReportFactory(reporter=owner)

        permission = IsOwnerOrReadOnly()
        request = Mock(method="GET", user=other)
        assert permission.has_object_permission(request, None, report) is True

    def test_owner_can_write(self):
        owner = UserFactory()
        report = ReportFactory(reporter=owner)

        permission = IsOwnerOrReadOnly()
        request = Mock(method="PATCH", user=owner)
        assert permission.has_object_permission(request, None, report) is True

    def test_non_owner_cannot_write(self):
        owner = UserFactory()
        other = UserFactory()
        report = ReportFactory(reporter=owner)

        permission = IsOwnerOrReadOnly()
        request = Mock(method="PATCH", user=other)
        assert permission.has_object_permission(request, None, report) is False

    def test_unauthenticated_denied_at_view_level(self):
        permission = IsOwnerOrReadOnly()
        request = Mock(user=None)
        assert permission.has_permission(request, None) is False
