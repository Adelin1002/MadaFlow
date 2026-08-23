import uuid
from django.conf import settings
from django.db import models


class Organization(models.Model):
    class OrgType(models.TextChoices):
        BUSINESS = "business", "Entreprise"
        MUNICIPALITY = "municipality", "Collectivité"
        GOVERNMENT = "government", "Gouvernement"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    org_type = models.CharField(max_length=20, choices=OrgType.choices)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["slug"])]

    def __str__(self):
        return self.name


class OrganizationMember(models.Model):
    """
    Isolation multi-tenant (section 21) : toute vue accédant à des données
    d'organisation DOIT filtrer par appartenance via ce modèle — jamais
    seulement par organization_id passé en paramètre de requête.
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Propriétaire"
        ADMIN = "admin", "Admin"
        MEMBER = "member", "Membre"

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name="members"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "user")
