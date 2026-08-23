import pytest
from unittest.mock import Mock

from apps.common.tests.factories import UserFactory
from apps.reports.permissions import IsMunicipalOrPlatformAdmin, IsOwnerOrReadOnly
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


@pytest.mark.django_db
class TestIsMunicipalOrPlatformAdmin:
    def test_citizen_denied(self):
        citizen = UserFactory(user_type=UserFactory._meta.model.UserType.CITIZEN)
        permission = IsMunicipalOrPlatformAdmin()
        request = Mock(user=citizen)
        assert permission.has_permission(request, None) is False

    def test_municipal_admin_allowed(self):
        admin = UserFactory(user_type=UserFactory._meta.model.UserType.MUNICIPAL_ADMIN)
        permission = IsMunicipalOrPlatformAdmin()
        request = Mock(user=admin)
        assert permission.has_permission(request, None) is True

    def test_platform_admin_allowed(self):
        admin = UserFactory(user_type=UserFactory._meta.model.UserType.PLATFORM_ADMIN)
        permission = IsMunicipalOrPlatformAdmin()
        request = Mock(user=admin)
        assert permission.has_permission(request, None) is True

    def test_business_user_denied(self):
        business = UserFactory(user_type=UserFactory._meta.model.UserType.BUSINESS)
        permission = IsMunicipalOrPlatformAdmin()
        request = Mock(user=business)
        assert permission.has_permission(request, None) is False
