import uuid
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models


class User(AbstractUser):
    class UserType(models.TextChoices):
        CITIZEN = "citizen", "Citoyen"
        BUSINESS = "business", "Entreprise"
        MUNICIPAL_ADMIN = "municipal_admin", "Administrateur municipal"
        PLATFORM_ADMIN = "platform_admin", "Administrateur plateforme"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_type = models.CharField(
        max_length=20, choices=UserType.choices, default=UserType.CITIZEN
    )
    phone_number = models.CharField(max_length=20, blank=True)
    is_verified = models.BooleanField(default=False)

    # Donnée sensible RGPD (section 24) : jamais exposée publiquement via l'API.
    # Utilisée uniquement pour des calculs internes (ex: notifications de proximité).
    last_known_location = models.PointField(geography=True, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=["user_type"])]

    def __str__(self):
        return self.username
