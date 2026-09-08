"""
Permissions partagées entre apps. Toute vue exposant des données rattachées
à une Organization doit utiliser IsOrganizationMember / IsOrganizationAdmin
ci-dessous plutôt que de faire confiance à un organization_id passé en
paramètre de requête — c'est la garantie d'isolation multi-tenant (section 21).
"""

from rest_framework import permissions


class IsPlatformAdminOrReadOnly(permissions.BasePermission):
    """Lecture pour tout utilisateur authentifié, écriture réservée à platform_admin."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.user_type == request.user.UserType.PLATFORM_ADMIN


class IsOrganizationMember(permissions.BasePermission):
    """
    Vérifie que l'utilisateur appartient à l'organisation propriétaire de
    l'objet consulté. À utiliser pour toute ressource ayant un champ
    `organization` (Area, Alert, Subscription...).
    """

    def has_object_permission(self, request, view, obj):
        organization = getattr(obj, "organization", None)
        if organization is None:
            return False
        return organization.members.filter(user=request.user).exists()


class IsOrganizationAdmin(permissions.BasePermission):
    """Variante stricte : rôle owner/admin requis au sein de l'organisation."""

    def has_object_permission(self, request, view, obj):
        organization = getattr(obj, "organization", None)
        if organization is None:
            return False
        return organization.members.filter(user=request.user, role__in=["owner", "admin"]).exists()
