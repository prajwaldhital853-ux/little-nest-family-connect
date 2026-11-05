from django.conf import settings
from django.db import DatabaseError, connection
from django.db.migrations.executor import MigrationExecutor
from django.http import JsonResponse
from django.urls import include, path

if settings.DJANGO_ADMIN_ENABLED:
    from django.contrib import admin

    admin.site.site_header = "Dr. Ramesh Kandel, site administration"
    admin.site.site_title = "Kandel site administration"
    admin.site.index_title = "Content and appointments"


def schema_state():
    """Whether the tables the site needs are actually in the database.

    A deploy that skipped its migrations answers every page with a 500 that names a missing table,
    which is impossible to see from the panel. This is the same question, asked without a shell.
    """

    try:
        executor = MigrationExecutor( connection )
        pending = executor.migration_plan( executor.loader.graph.leaf_nodes() )
    except DatabaseError:
        return "unreadable"
    return "current" if not pending else "not migrated yet"


def mail_state():
    """Whether a one time code can reach anyone.

    Without a mail account the codes are written into a folder inside the container, and a host that
    gives no shell cannot read that folder, so signing in from a new device stops with no explanation.
    """

    if settings.EMAIL_BACKEND.endswith( "smtp.EmailBackend" ) and settings.EMAIL_HOST and settings.EMAIL_HOST_USER:
        return "configured"
    return "not configured"


def health( request ):
    """Small probe for the panel and for hosting health checks."""

    try:
        connection.ensure_connection()
        database = "ok"
    except DatabaseError:
        database = "unavailable"
    return JsonResponse(
        { "status": "ok", "database": database, "schema": schema_state(), "mail": mail_state() }
    )


urlpatterns = [
    # A host that health checks the bare root gets the same answer as /api/health/ rather than a 404,
    # which would read as a broken deploy.
    path( "", health ),
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
