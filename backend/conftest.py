import pytest
from rest_framework.test import APIClient

from apps.common.tests.factories import UserFactory


@pytest.fixture
def api_client():
    return APIClient()


def _authenticated_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def citizen(db):
    return UserFactory(user_type=UserFactory._meta.model.UserType.CITIZEN)


@pytest.fixture
def other_citizen(db):
    return UserFactory(user_type=UserFactory._meta.model.UserType.CITIZEN)


@pytest.fixture
def business_user(db):
    return UserFactory(user_type=UserFactory._meta.model.UserType.BUSINESS)


@pytest.fixture
def municipal_admin(db):
    return UserFactory(user_type=UserFactory._meta.model.UserType.MUNICIPAL_ADMIN)


@pytest.fixture
def platform_admin(db):
    return UserFactory(user_type=UserFactory._meta.model.UserType.PLATFORM_ADMIN)


@pytest.fixture
def citizen_client(citizen):
    return _authenticated_client(citizen)


@pytest.fixture
def other_citizen_client(other_citizen):
    return _authenticated_client(other_citizen)


@pytest.fixture
def municipal_admin_client(municipal_admin):
    return _authenticated_client(municipal_admin)


@pytest.fixture
def platform_admin_client(platform_admin):
    return _authenticated_client(platform_admin)
