from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Documentation API
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),

    # API v1 — chaque app expose ses propres urls.py (créés à l'étape suivante)
    path("api/v1/auth/", include("apps.users.urls_auth")),
    path("api/v1/users/", include("apps.users.urls")),
    path("api/v1/organizations/", include("apps.organizations.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
    path("api/v1/categories/", include("apps.categories.urls")),
    path("api/v1/areas/", include("apps.geo.urls")),
    path("api/v1/alerts/", include("apps.alerts.urls")),
    path("api/v1/analytics/", include("apps.scoring.urls")),
    path("api/v1/ai/", include("apps.ai_engine.urls")),
    path("api/v1/subscriptions/", include("apps.billing.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
