from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Profil utilisateur exposé via l'API.
    `last_known_location` est volontairement exclu : donnée sensible RGPD
    (section 24) jamais exposée publiquement, même à l'utilisateur concerné
    via cet endpoint générique.
    """

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "user_type", "phone_number", "is_verified", "date_joined",
        ]
        read_only_fields = ["id", "user_type", "is_verified", "date_joined"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2", "user_type", "phone_number"]

    def validate_user_type(self, value):
        # L'inscription publique ne permet jamais de s'auto-créer administrateur.
        if value in (User.UserType.MUNICIPAL_ADMIN, User.UserType.PLATFORM_ADMIN):
            raise serializers.ValidationError(
                "Ce type de compte ne peut pas être créé via l'inscription publique."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Les mots de passe ne correspondent pas."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
