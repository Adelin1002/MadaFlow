from django.urls import path

from .views import DistrictStatsView, HeatmapView, OverviewView, TimelineView

app_name = "analytics"

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="overview"),
    path("districts/", DistrictStatsView.as_view(), name="districts"),
    path("timeline/", TimelineView.as_view(), name="timeline"),
    path("heatmap/", HeatmapView.as_view(), name="heatmap"),
]
