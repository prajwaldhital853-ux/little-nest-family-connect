from django.conf import settings
from django.db import DatabaseError, connection
from django.db.migrations.executor import MigrationExecutor
from django.http import JsonResponse
from django.urls import include, path

from apps.accounts.emails import can_send_mail

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

    return "configured" if can_send_mail() else "not configured"


def content_state():
    """Whether the panel has anything to edit.

    A database that was created by this deploy has tables and no rows, and a panel that opens on empty
    lists reads as a broken install even though the site still shows the wording it ships with.
    """

    from apps.cms.models import PageCopy, Post

    try:
        return f"{ PageCopy.objects.count() } pages, { Post.objects.count() } posts"
    except DatabaseError:
        return "unreadable"


def health( request ):
    """Small probe for the panel and for hosting health checks."""

    try:
        connection.ensure_connection()
        database = "ok"
    except DatabaseError:
        database = "unavailable"
    return JsonResponse(
        {
            "status": "ok",
            "database": database,
            "schema": schema_state(),
            "content": content_state(),
            "mail": mail_state(),
            "otp": "required" if settings.OTP_REQUIRED else "off",
        }
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
else:
    from django.urls import re_path

    from apps.cms.views import serve_upload

    # On Render nothing but this process stands between a browser and MEDIA_ROOT, so the pictures the
    # panel uploads have to be answered here. Without the line every /media/ address picked in the
    # panel shows as a broken image on the live site.
    urlpatterns += [ re_path( rf"^{ settings.MEDIA_URL.strip( '/' ) }/(?P<path>.*)$", serve_upload ) ]
