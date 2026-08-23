"""
Factories partagées entre les apps. Centralisées ici plutôt que dupliquées
dans chaque app, pour que UserFactory/CategoryFactory/LocationFactory restent
cohérentes partout où elles sont utilisées.
"""
import factory
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point

from apps.categories.models import Category
from apps.geo.models import District, Location, Municipality
from apps.organizations.models import Organization, OrganizationMember

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@example.mg")
    user_type = User.UserType.CITIZEN

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        self.set_password(extracted or "TestPass123!")
        if create:
            self.save()


class MunicipalityFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Municipality

    name = "Fianarantsoa"


class DistrictFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = District

    municipality = factory.SubFactory(MunicipalityFactory)
    name = factory.Sequence(lambda n: f"Quartier {n}")


class LocationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Location

    # Coordonnées par défaut : centre approximatif de Fianarantsoa.
    point = factory.LazyFunction(lambda: Point(47.0833, -21.4536, srid=4326))
    approximate_address = "Fianarantsoa, Madagascar"
    district = factory.SubFactory(DistrictFactory)


class CategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Category
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Catégorie {n}")
    slug = factory.Sequence(lambda n: f"categorie-{n}")


class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization
        django_get_or_create = ("slug",)

    name = factory.Sequence(lambda n: f"Organisation {n}")
    slug = factory.Sequence(lambda n: f"org-{n}")
    org_type = Organization.OrgType.BUSINESS


class OrganizationMemberFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = OrganizationMember

    organization = factory.SubFactory(OrganizationFactory)
    user = factory.SubFactory(UserFactory)
    role = OrganizationMember.Role.MEMBER
