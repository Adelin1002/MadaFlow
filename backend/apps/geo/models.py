import uuid
from django.conf import settings
from django.contrib.gis.db import models


class Municipality(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    boundary = models.MultiPolygonField(geography=True, null=True, blank=True)

    class Meta:
        verbose_name_plural = "municipalities"

    def __str__(self):
        return self.name


class District(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    municipality = models.ForeignKey(Municipality, on_delete=models.CASCADE, related_name="districts")
    name = models.CharField(max_length=150)
    boundary = models.MultiPolygonField(geography=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.municipality.name})"


class Location(models.Model):
    """
    Localisation géographique réutilisable. Extraite de Report pour permettre
    de la partager entre plusieurs entités (signalements, futurs commerces,
    capteurs...) et pour que la détection de doublons géospatiaux (section 9)
    et les recherches de proximité s'appuient sur un modèle dédié et indexé,
    plutôt que sur un champ éclaté dans chaque table qui en a besoin.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    point = models.PointField(geography=True)
    approximate_address = models.CharField(max_length=255, blank=True)
    district = models.ForeignKey(
        District, on_delete=models.SET_NULL, null=True, blank=True, related_name="locations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["district"])]

    def __str__(self):
        return self.approximate_address or f"Location {self.id}"


class Area(models.Model):
    """
    Zone d'intérêt libre dessinée par un utilisateur ou une entreprise
    pour l'analyse géographique (section 13 — dashboard entreprise).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    polygon = models.PolygonField(geography=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="areas")
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="areas",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["organization"])]

    def __str__(self):
        return self.name
