from rest_framework import serializers

from .models import PriorityScore


class PriorityScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriorityScore
        fields = ["score", "level", "explanation", "computed_at"]
        read_only_fields = fields
