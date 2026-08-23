from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

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
