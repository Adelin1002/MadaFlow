import uuid
from django.contrib.gis.db import models


class Alert(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization", on_delete=models.CASCADE, related_name="alerts"
    )
    name = models.CharField(max_length=150)
    area = models.PolygonField(geography=True, null=True, blank=True)
    category = models.ForeignKey(
        "categories.Category", on_delete=models.CASCADE, null=True, blank=True
    )
    min_severity = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
