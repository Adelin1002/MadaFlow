from django.db import models


class PriorityScore(models.Model):
    class Level(models.TextChoices):
        LOW = "low", "Faible"
        MEDIUM = "medium", "Moyenne"
        HIGH = "high", "Élevée"
        CRITICAL = "critical", "Critique"

    report = models.OneToOneField(
        "reports.Report", on_delete=models.CASCADE, related_name="priority_score"
    )
    score = models.FloatField()
    level = models.CharField(max_length=20, choices=Level.choices)

    # Explicabilité obligatoire (section 8) : jamais de boîte noire.
    # Ex: {"gravite": 0.4, "confirmations": 0.2, "anciennete": 0.1, ...}
    explanation = models.JSONField(
        default=dict, help_text="Détail des facteurs ayant contribué au score"
    )
    computed_at = models.DateTimeField(auto_now=True)
