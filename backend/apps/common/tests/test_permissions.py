import pytest
from unittest.mock import Mock

from apps.common.permissions import IsOrganizationAdmin, IsOrganizationMember
from apps.common.tests.factories import OrganizationFactory, OrganizationMemberFactory, UserFactory
from apps.organizations.models import OrganizationMember


@pytest.mark.django_db
class TestIsOrganizationMember:
    def test_member_has_access(self):
        org = OrganizationFactory()
        membership = OrganizationMemberFactory(organization=org)

        obj = Mock(organization=org)
        request = Mock(user=membership.user)
        permission = IsOrganizationMember()

        assert permission.has_object_permission(request, None, obj) is True

    def test_non_member_denied(self):
        org = OrganizationFactory()
        outsider = UserFactory()

        obj = Mock(organization=org)
        request = Mock(user=outsider)
        permission = IsOrganizationMember()

        assert permission.has_object_permission(request, None, obj) is False

    def test_object_without_organization_denied(self):
        """Ne doit jamais accorder l'accès par défaut si l'objet n'a pas d'organisation rattachée."""
        obj = Mock(spec=[])  # aucun attribut organization
        request = Mock(user=UserFactory())
        permission = IsOrganizationMember()

        assert permission.has_object_permission(request, None, obj) is False

    def test_member_of_another_organization_denied(self):
        """Isolation multi-tenant critique : un membre d'une autre org ne doit jamais avoir accès."""
        org_a = OrganizationFactory()
        org_b = OrganizationFactory()
        member_of_b = OrganizationMemberFactory(organization=org_b).user

        obj = Mock(organization=org_a)
        request = Mock(user=member_of_b)
        permission = IsOrganizationMember()

        assert permission.has_object_permission(request, None, obj) is False


@pytest.mark.django_db
class TestIsOrganizationAdmin:
    def test_owner_has_access(self):
        org = OrganizationFactory()
        membership = OrganizationMemberFactory(organization=org, role=OrganizationMember.Role.OWNER)

        obj = Mock(organization=org)
        request = Mock(user=membership.user)
        permission = IsOrganizationAdmin()

        assert permission.has_object_permission(request, None, obj) is True

    def test_plain_member_denied(self):
        """Un simple membre (role=member) ne doit pas avoir les droits admin."""
        org = OrganizationFactory()
        membership = OrganizationMemberFactory(organization=org, role=OrganizationMember.Role.MEMBER)

        obj = Mock(organization=org)
        request = Mock(user=membership.user)
        permission = IsOrganizationAdmin()

        assert permission.has_object_permission(request, None, obj) is False
