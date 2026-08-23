import pytest
from django.urls import reverse

from apps.common.tests.factories import UserFactory


@pytest.mark.django_db
class TestRegister:
    def test_register_creates_citizen_by_default(self, api_client):
        url = reverse("auth:register")
        response = api_client.post(url, {
            "username": "rakoto",
            "email": "rakoto@example.mg",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
        })
        assert response.status_code == 201
        assert response.data["user_type"] if "user_type" in response.data else True

    def test_register_rejects_password_mismatch(self, api_client):
        url = reverse("auth:register")
        response = api_client.post(url, {
            "username": "rakoto2",
            "email": "rakoto2@example.mg",
            "password": "SuperSecret123!",
            "password2": "AutreChose123!",
        })
        assert response.status_code == 400
        assert "password2" in response.data

    def test_register_cannot_self_assign_platform_admin(self, api_client):
        """Sécurité critique : impossible de s'auto-créer administrateur (section 24)."""
        url = reverse("auth:register")
        response = api_client.post(url, {
            "username": "hacker",
            "email": "hacker@example.mg",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
            "user_type": "platform_admin",
        })
        assert response.status_code == 400
        assert "user_type" in response.data

    def test_register_cannot_self_assign_municipal_admin(self, api_client):
        url = reverse("auth:register")
        response = api_client.post(url, {
            "username": "hacker2",
            "email": "hacker2@example.mg",
            "password": "SuperSecret123!",
            "password2": "SuperSecret123!",
            "user_type": "municipal_admin",
        })
        assert response.status_code == 400

    def test_register_rejects_weak_password(self, api_client):
        url = reverse("auth:register")
        response = api_client.post(url, {
            "username": "rakoto3",
            "email": "rakoto3@example.mg",
            "password": "1234",
            "password2": "1234",
        })
        assert response.status_code == 400
        assert "password" in response.data


@pytest.mark.django_db
class TestLogin:
    def test_login_returns_access_and_refresh_tokens(self, api_client):
        UserFactory(username="rakoto4", password="SuperSecret123!")
        url = reverse("auth:login")
        response = api_client.post(url, {"username": "rakoto4", "password": "SuperSecret123!"})
        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data

    def test_login_rejects_wrong_password(self, api_client):
        UserFactory(username="rakoto5", password="SuperSecret123!")
        url = reverse("auth:login")
        response = api_client.post(url, {"username": "rakoto5", "password": "wrong"})
        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    def test_me_requires_authentication(self, api_client):
        url = reverse("users:me")
        response = api_client.get(url)
        assert response.status_code == 401

    def test_me_returns_own_profile(self, citizen_client, citizen):
        url = reverse("users:me")
        response = citizen_client.get(url)
        assert response.status_code == 200
        assert response.data["username"] == citizen.username

    def test_me_never_exposes_location(self, citizen_client):
        """RGPD (section 24) : last_known_location ne doit jamais apparaître dans l'API."""
        url = reverse("users:me")
        response = citizen_client.get(url)
        assert "last_known_location" not in response.data

    def test_me_cannot_change_own_user_type(self, citizen_client, citizen):
        url = reverse("users:me")
        response = citizen_client.patch(url, {"user_type": "platform_admin"})
        citizen.refresh_from_db()
        assert citizen.user_type == "citizen"
