"""
Tests géospatiaux (section 28). Valident le comportement réel de PostGIS
(dwithin, distance, containment) plutôt que la seule mécanique Django ORM —
essentiel puisque ces requêtes serviront aux futures fonctionnalités de
recherche de proximité (dashboard entreprise, section 13) et de détection
de doublons géographiques (section 9).
"""
import pytest
from django.contrib.gis.geos import Point, Polygon
from django.contrib.gis.measure import D

from apps.geo.models import Location


@pytest.mark.django_db
class TestLocationProximity:
    def test_dwithin_finds_nearby_points(self):
        # Deux points à Fianarantsoa, distants d'environ 200m.
        center = Location.objects.create(point=Point(47.0833, -21.4536, srid=4326))
        nearby = Location.objects.create(point=Point(47.0850, -21.4536, srid=4326))
        # Un point à Antananarivo, à ~350km de distance.
        far = Location.objects.create(point=Point(47.5079, -18.8792, srid=4326))

        results = Location.objects.filter(point__dwithin=(center.point, D(km=5)))

        assert center in results
        assert nearby in results
        assert far not in results

    def test_dwithin_excludes_points_outside_radius(self):
        center = Location.objects.create(point=Point(47.0833, -21.4536, srid=4326))
        far = Location.objects.create(point=Point(47.5079, -18.8792, srid=4326))

        results = Location.objects.filter(point__dwithin=(center.point, D(km=1)))

        assert far not in results
        assert results.count() == 1  # uniquement le centre lui-même

    def test_distance_annotation_orders_by_proximity(self):
        from django.contrib.gis.db.models.functions import Distance

        reference = Point(47.0833, -21.4536, srid=4326)
        near = Location.objects.create(point=Point(47.0840, -21.4536, srid=4326))
        mid = Location.objects.create(point=Point(47.1200, -21.4536, srid=4326))
        far = Location.objects.create(point=Point(47.5079, -18.8792, srid=4326))

        ordered = list(
            Location.objects.annotate(distance=Distance("point", reference)).order_by("distance")
        )

        assert ordered[0] == near
        assert ordered[-1] == far
        assert ordered[1] == mid


@pytest.mark.django_db
class TestAreaContainment:
    def test_point_within_polygon(self):
        from apps.common.tests.factories import UserFactory
        from apps.geo.models import Area

        # Petit polygone couvrant un carré autour du centre de Fianarantsoa.
        polygon = Polygon((
            (47.07, -21.46),
            (47.10, -21.46),
            (47.10, -21.44),
            (47.07, -21.44),
            (47.07, -21.46),
        ), srid=4326)

        area = Area.objects.create(
            name="Zone test", polygon=polygon, created_by=UserFactory()
        )

        inside = Point(47.0833, -21.4536, srid=4326)
        outside = Point(47.5079, -18.8792, srid=4326)

        assert Area.objects.filter(id=area.id, polygon__contains=inside).exists()
        assert not Area.objects.filter(id=area.id, polygon__contains=outside).exists()
