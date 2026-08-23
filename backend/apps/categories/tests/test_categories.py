import pytest
from django.urls import reverse

from apps.common.tests.factories import CategoryFactory


@pytest.mark.django_db
class TestCategoryPermissions:
    def test_list_requires_authentication(self, api_client):
        url = reverse("categories:category-list")
        response = api_client.get(url)
        assert response.status_code == 401

    def test_citizen_can_list_categories(self, citizen_client):
        CategoryFactory()
        url = reverse("categories:category-list")
        response = citizen_client.get(url)
        assert response.status_code == 200
        assert response.data["count"] >= 1

    def test_citizen_cannot_create_category(self, citizen_client):
        url = reverse("categories:category-list")
        response = citizen_client.post(url, {"name": "Test", "slug": "test"})
        assert response.status_code == 403

    def test_business_cannot_create_category(self, business_user):
        from rest_framework.test import APIClient
        client = APIClient()
        client.force_authenticate(user=business_user)
        url = reverse("categories:category-list")
        response = client.post(url, {"name": "Test", "slug": "test"})
        assert response.status_code == 403

    def test_platform_admin_can_create_category(self, platform_admin_client):
        url = reverse("categories:category-list")
        response = platform_admin_client.post(url, {"name": "Nouvelle catégorie", "slug": "nouvelle"})
        assert response.status_code == 201

    def test_platform_admin_can_update_category(self, platform_admin_client):
        category = CategoryFactory()
        url = reverse("categories:category-detail", args=[category.id])
        response = platform_admin_client.patch(url, {"color": "#123456"})
        assert response.status_code == 200
        assert response.data["color"] == "#123456"

    def test_municipal_admin_cannot_create_category(self, municipal_admin_client):
        """Seul platform_admin gère les catégories, pas municipal_admin (section 5)."""
        url = reverse("categories:category-list")
        response = municipal_admin_client.post(url, {"name": "Test", "slug": "test2"})
        assert response.status_code == 403
