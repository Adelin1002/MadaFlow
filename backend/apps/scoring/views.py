from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsMunicipalOrPlatformAdmin

from . import analytics


class OverviewView(APIView):
    """
    Compteurs globaux, répartition par statut/gravité/catégorie, temps moyen
    de résolution (section 12). `avg_resolution_hours` vaut `null` tant
    qu'aucun signalement n'a été résolu — jamais un zéro trompeur.
    """

    permission_classes = [IsMunicipalOrPlatformAdmin]

    def get(self, request):
        return Response(analytics.get_overview())


class DistrictStatsView(APIView):
    """Statistiques par quartier, triées par concentration de signalements critiques actifs."""

    permission_classes = [IsMunicipalOrPlatformAdmin]

    def get(self, request):
        return Response(analytics.get_district_stats())


class TimelineView(APIView):
    """
    Évolution temporelle des créations/résolutions. Paramètre `?days=` (1 à
    365, défaut 30) — toute valeur hors bornes est silencieusement ramenée
    à la borne la plus proche plutôt que de renvoyer une erreur.
    """

    permission_classes = [IsMunicipalOrPlatformAdmin]

    def get(self, request):
        try:
            days = int(request.query_params.get("days", analytics.DEFAULT_TIMELINE_DAYS))
        except (TypeError, ValueError):
            days = analytics.DEFAULT_TIMELINE_DAYS
        return Response(analytics.get_timeline(days))


class HeatmapView(APIView):
    """
    Points géolocalisés pondérés pour une carte thermique, limités aux
    signalements actifs (voir apps.scoring.analytics.HEATMAP_MAX_POINTS
    pour la limite de taille de réponse).
    """

    permission_classes = [IsMunicipalOrPlatformAdmin]

    def get(self, request):
        return Response(analytics.get_heatmap_points())
