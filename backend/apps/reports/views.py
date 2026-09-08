from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.ai_engine.serializers import AIAnalysisSerializer
from apps.ai_engine.tasks import run_report_ai_pipeline

from .filters import ReportFilter
from .models import Report, ReportConfirmation
from .permissions import IsMunicipalOrPlatformAdmin, IsOwnerOrReadOnly
from .serializers import ReportImageSerializer, ReportSerializer, ReportStatusSerializer


class ReportViewSet(viewsets.ModelViewSet):
    queryset = (
        Report.objects.select_related("location", "category", "reporter")
        .prefetch_related("images", "confirmations")
        .order_by("-created_at")
    )
    serializer_class = ReportSerializer
    permission_classes = [IsOwnerOrReadOnly]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    filterset_class = ReportFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "severity"]

    def perform_create(self, serializer):
        report = serializer.save()
        # Asynchrone et non bloquant : la création du signalement répond
        # immédiatement, l'analyse IA (classification, résumé, doublons)
        # tourne en tâche de fond (section 10).
        run_report_ai_pipeline.delay(str(report.id))

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def confirm(self, request, pk=None):
        """Un tiers confirme qu'un problème existe bien (section 7). Auto-confirmation interdite."""
        report = self.get_object()
        if report.reporter_id == request.user.id:
            return Response(
                {"detail": "Vous ne pouvez pas confirmer votre propre signalement."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, created = ReportConfirmation.objects.get_or_create(report=report, user=request.user)
        if not created:
            return Response({"detail": "Signalement déjà confirmé."}, status=status.HTTP_200_OK)
        return Response({"detail": "Signalement confirmé."}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=[IsOwnerOrReadOnly])
    def images(self, request, pk=None):
        """Ajout d'une photo à un signalement existant, réservé à son auteur."""
        report = self.get_object()
        serializer = ReportImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(report=report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], permission_classes=[IsMunicipalOrPlatformAdmin])
    def status_update(self, request, pk=None):
        """Changement de statut réservé aux admins municipaux/plateforme (section 6.C)."""
        report = self.get_object()
        serializer = ReportStatusSerializer(report, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["get"], permission_classes=[IsMunicipalOrPlatformAdmin])
    def ai_analyses(self, request, pk=None):
        """
        Résultats IA bruts (classification suggérée, résumé, candidats doublons)
        pour un signalement — diagnostic interne réservé aux admins, jamais
        exposé aux citoyens (section 8 : l'IA fournit une recommandation
        explicable, mais la traçabilité de ce raisonnement reste un outil
        d'administration, pas une donnée publique du signalement).
        """
        report = self.get_object()
        analyses = report.ai_analyses.all().order_by("-created_at")
        serializer = AIAnalysisSerializer(analyses, many=True)
        return Response(serializer.data)
