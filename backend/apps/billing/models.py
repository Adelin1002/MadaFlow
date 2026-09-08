import uuid
from django.db import models


class Subscription(models.Model):
    class Plan(models.TextChoices):
        FREE = "free", "Gratuit"
        PRO = "pro", "Pro"
        BUSINESS = "business", "Business"
        ENTERPRISE = "enterprise", "Enterprise"
        GOVERNMENT = "government", "Government"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.OneToOneField(
        "organizations.Organization", on_delete=models.CASCADE, related_name="subscription"
    )
    plan = models.CharField(max_length=20, choices=Plan.choices, default=Plan.FREE)
    is_active = models.BooleanField(default=True)
    current_period_end = models.DateTimeField(null=True, blank=True)


class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="MGA")
    # Référence externe uniquement (ex: Stripe payment_intent id).
    # Aucune clé secrète ou donnée de carte n'est jamais stockée ici.
    provider_reference = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
