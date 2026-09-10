from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    - Lecture : tout utilisateur authentifié.
    - Création : tout utilisateur authentifié (le reporter est fixé au user courant).
    - Modification/suppression du contenu (titre, description, catégorie...) :
      réservée à l'auteur du signalement.
    - Le changement de `status` passe par une action dédiée protégée par
      IsMunicipalOrPlatformAdmin (voir apps.common.permissions) — jamais par cette permission.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.reporter_id == request.user.id
