from django.conf import settings
from django.db import DatabaseError, connection
from django.http import JsonResponse
from django.urls import include, path

if settings.DJANGO_ADMIN_ENABLED:
    from django.contrib import admin

    admin.site.site_header = "Dr. Ramesh Kandel, site administration"
    admin.site.site_title = "Kandel site administration"
    admin.site.index_title = "Content and appointments"


def health( request ):
    """Small probe for the panel and for hosting health checks."""

    try:
        connection.ensure_connection()
        database = "ok"
    except DatabaseError:
        database = "unavailable"
    return JsonResponse( { "status": "ok", "database": database } )


urlpatterns = [
    path( "api/health/", health ),
    path( "api/auth/", include( "apps.accounts.urls" ) ),
    path( "api/appointments/", include( "apps.appointments.urls" ) ),
    path( "api/cms/", include( "apps.cms.urls" ) ),
    path( "api/analytics/", include( "apps.analytics.urls" ) ),
    path( "api/audit/", include( "apps.audit.urls" ) ),
]

if settings.DJANGO_ADMIN_ENABLED:
    urlpatterns.insert( 0, path( "admin/", admin.site.urls ) )

if settings.DEBUG:
    from django.conf.urls.static import static

    # Uploaded pictures, served by the dev server. A deployed host serves them itself or
    # forwards /media here; production never reaches this line.
    urlpatterns += static( settings.MEDIA_URL, document_root = settings.MEDIA_ROOT )
