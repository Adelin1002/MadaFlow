import uuid
from django.conf import settings
from django.contrib.gis.db import models


class Report(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Nouveau"
        CONFIRMED = "confirmed", "Confirmé"
        IN_PROGRESS = "in_progress", "En cours"
        RESOLVED = "resolved", "Résolu"
        REJECTED = "rejected", "Rejeté"

    class Severity(models.TextChoices):
        LOW = "low", "Faible"
        MEDIUM = "medium", "Moyenne"
        HIGH = "high", "Élevée"
        CRITICAL = "critical", "Critique"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports"
    )
    category = models.ForeignKey("categories.Category", on_delete=models.PROTECT)

    # Localisation extraite en modèle séparé (apps.geo.Location) — réutilisable,
    # indexée, et point d'ancrage commun pour la détection de doublons géospatiaux.
    location = models.ForeignKey(
        "geo.Location", on_delete=models.PROTECT, related_name="reports"
    )

    title = models.CharField(max_length=200)
    description = models.TextField()

    severity = models.CharField(max_length=20, choices=Severity.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)

    # Détection de doublons (section 9) : lien vers le signalement "maître"
    duplicate_of = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="duplicates"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["category"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return self.title


class ReportImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reports/%Y/%m/")
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ReportConfirmation(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, related_name="confirmations"
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Un utilisateur ne peut confirmer un même signalement qu'une seule fois
        unique_together = ("report", "user")
