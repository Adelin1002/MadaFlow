from rest_framework import viewsets

from apps.common.permissions import IsPlatformAdminOrReadOnly

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [IsPlatformAdminOrReadOnly]
    filterset_fields = ["is_active"]
    search_fields = ["name"]
