from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from django.utils import timezone
from rest_framework import serializers

from apps.geo.models import District, Location

from .models import Report, ReportImage

User = get_user_model()


class ReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportImage
        fields = ["id", "image", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class LocationSerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(source="point.y", read_only=True)
    longitude = serializers.FloatField(source="point.x", read_only=True)

    class Meta:
        model = Location
        fields = ["id", "latitude", "longitude", "approximate_address", "district"]
        read_only_fields = fields


class ReporterSerializer(serializers.ModelSerializer):
    """Vue minimale du reporter — jamais d'email ni de localisation exposés ici."""

    class Meta:
        model = User
        fields = ["id", "username", "user_type"]
        read_only_fields = fields


class ReportSerializer(serializers.ModelSerializer):
    reporter = ReporterSerializer(read_only=True)
    location = LocationSerializer(read_only=True)
    images = ReportImageSerializer(many=True, read_only=True)
    confirmations_count = serializers.IntegerField(source="confirmations.count", read_only=True)

    # Champs d'écriture pour la localisation (section 7) : le client envoie des
    # coordonnées simples, le serializer construit/actualise le Location associé
    # plutôt que d'exposer directement le modèle Location en écriture.
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    approximate_address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    district = serializers.PrimaryKeyRelatedField(
        queryset=District.objects.all(), write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = Report
        fields = [
            "id",
            "reporter",
            "category",
            "location",
            "latitude",
            "longitude",
            "approximate_address",
            "district",
            "title",
            "description",
            "severity",
            "status",
            "duplicate_of",
            "images",
            "confirmations_count",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = [
            "id",
            "reporter",
            "location",
            "status",
            "duplicate_of",
            "images",
            "confirmations_count",
            "created_at",
            "updated_at",
            "resolved_at",
        ]

    def validate(self, attrs):
        lat = attrs.get("latitude")
        lon = attrs.get("longitude")
        if lat is not None and not (-90 <= lat <= 90):
            raise serializers.ValidationError({"latitude": "Doit être comprise entre -90 et 90."})
        if lon is not None and not (-180 <= lon <= 180):
            raise serializers.ValidationError({"longitude": "Doit être comprise entre -180 et 180."})
        return attrs

    def create(self, validated_data):
        latitude = validated_data.pop("latitude", None)
        longitude = validated_data.pop("longitude", None)
        if latitude is None or longitude is None:
            raise serializers.ValidationError(
                {"latitude": "latitude et longitude sont requises à la création."}
            )
        approximate_address = validated_data.pop("approximate_address", "")
        district = validated_data.pop("district", None)

        location = Location.objects.create(
            point=Point(longitude, latitude, srid=4326),
            approximate_address=approximate_address,
            district=district,
        )
        validated_data["location"] = location
        validated_data["reporter"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        latitude = validated_data.pop("latitude", None)
        longitude = validated_data.pop("longitude", None)
        approximate_address = validated_data.pop("approximate_address", None)
        district = validated_data.pop("district", None)

        if latitude is not None and longitude is not None:
            instance.location.point = Point(longitude, latitude, srid=4326)
            if approximate_address is not None:
                instance.location.approximate_address = approximate_address
            if district is not None:
                instance.location.district = district
            instance.location.save()

        return super().update(instance, validated_data)


class ReportStatusSerializer(serializers.ModelSerializer):
    """Utilisé uniquement par l'action admin `status/` — jamais exposé en écriture directe."""

    class Meta:
        model = Report
        fields = ["status", "resolved_at"]
        read_only_fields = ["resolved_at"]

    def save(self, **kwargs):
        if self.validated_data.get("status") == Report.Status.RESOLVED and not self.instance.resolved_at:
            self.validated_data["resolved_at"] = timezone.now()
        return super().save(**kwargs)
