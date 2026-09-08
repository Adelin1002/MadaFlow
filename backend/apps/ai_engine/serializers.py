from rest_framework import serializers

from .models import AIAnalysis


class AIAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIAnalysis
        fields = ["id", "analysis_type", "provider", "result", "confidence", "data_source", "created_at"]
        read_only_fields = fields
