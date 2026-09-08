import uuid
from django.db import models


class AIAnalysis(models.Model):
    class AnalysisType(models.TextChoices):
        CLASSIFICATION = "classification", "Classification"
        DUPLICATE_DETECTION = "duplicate_detection", "Détection de doublons"
        SUMMARY = "summary", "Résumé"
        IMAGE_ANALYSIS = "image_analysis", "Analyse d'image"
        ANOMALY = "anomaly", "Anomalie"
        PREDICTION = "prediction", "Prédiction"

    class DataSource(models.TextChoices):
        REAL = "real", "Réelle"
        DEMO = "demo", "Démo"
        PREDICTED = "predicted", "Prédite"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(
        "reports.Report",
        on_delete=models.CASCADE,
        related_name="ai_analyses",
        null=True,
        blank=True,
    )
    analysis_type = models.CharField(max_length=30, choices=AnalysisType.choices)
    # Nom du provider concret utilisé (ex: "anthropic", "internal-model-v1")
    # — jamais couplé en dur ailleurs dans le code, voir services.py / AIProvider
    provider = models.CharField(max_length=50)
    result = models.JSONField()
    confidence = models.FloatField(null=True, blank=True)

    # Distinction obligatoire (section 29) entre données réelles, démo, prédites
    data_source = models.CharField(max_length=20, choices=DataSource.choices, default=DataSource.REAL)
    created_at = models.DateTimeField(auto_now_add=True)
