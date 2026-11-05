import mimetypes
import os
import re

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.db import IntegrityError, transaction
from django.http import FileResponse, Http404
from django.utils import timezone
from django.utils._os import safe_join
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import leaf_diff, pair, record
from config.pagination import FeedPagination, MediaFeedPagination
from config.throttling import PublicFeedThrottle

from .models import PageCopy, PublishStatus, Faq, MediaItem, Post, PressArticle, Publication, SiteImage
from .permissions import IsAdminOrReadOnly
from .serializers import (
    FaqSerializer,
    MediaItemSerializer,
    PageCopySerializer,
    PostSerializer,
    PressArticleSerializer,
    PublicationSerializer,
    SiteImageSerializer,
)

WRITE_FIELDS = [ "status", "order", "title", "slug", "topic", "excerpt", "minutes", "blocks", "body", "photo", "photo_url",
                 "photo_alt", "kind", "source", "url", "poster_url", "blurb", "authors", "venue", "year", "link",
                 "tag", "group", "question", "answer" ]
IGNORED_IN_DIFF = { "status_display", "kind_display", "group_display", "published_at", "created_at", "updated_at", "next_statuses" }


def paragraphs( body ):
    return [ block.strip() for block in re.split( r"\n\s*\n", body ) if block.strip() ]


def article_body( post ):
    """The article as the site reads it: the blocks he typed, with the plain paragraphs kept
    beside them so a post written before blocks still renders."""

    return {
        "blocks": post.blocks if isinstance( post.blocks, list ) else [],
        "body": paragraphs( post.body ),
    }


def display_date( moment ):
    if not moment:
        return ""
    local = timezone.localtime( moment )
    return f"{ local.strftime( '%B' ) } { local.day }, { local.year }"


def post_card( post ):
    return {
        "slug": post.slug,
        "title": post.title,
        "topic": post.topic,
        "excerpt": post.excerpt,
        "date": display_date( post.published_at ),
        "minutes": post.minutes,
        "photo": post.photo,
        "photo_url": post.photo_url,
        "photo_alt": post.photo_alt,
    }


def media_card( item ):
    return {
        "url": item.url,
        "kind": item.get_kind_display(),
        "title": item.title,
        "source": item.source,
        "poster_url": item.poster_url,
    }


class PublishedUnlessStaffMixin:
    """Anonymous traffic only ever sees published rows; staff see drafts too."""

    permission_classes = [ IsAdminOrReadOnly ]

    def get_queryset( self ):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            return queryset.filter( status = PublishStatus.PUBLISHED )
        wanted = self.request.query_params.get( "status" )
        if wanted in PublishStatus.values:
            return queryset.filter( status = wanted )
        return queryset


class AuditedWritesMixin:
    """Every edit the panel makes leaves a readable line in the history."""

    def _snapshot( self, instance ):
        return { field: getattr( instance, field, None ) for field in WRITE_FIELDS if hasattr( instance, field ) }

    def _save( self, serializer, **extra ):
        """The database has the last word on duplicates, so answer its refusal as a 400 the
        panel can show rather than a 500 the panel cannot explain."""

        try:
            with transaction.atomic():
                return serializer.save( **extra )
        except IntegrityError:
            raise ValidationError(
                { "detail": [ "That entry is already in the site. Edit the one that is there instead of adding a second copy." ] }
            ) from None

    def perform_create( self, serializer ):
        instance = self._save( serializer )
        record( "cms.created", request = self.request, target = instance, detail = { "fields": sorted( self._snapshot( instance ) ) } )
        return instance

    def perform_update( self, serializer ):
        before = self._snapshot( serializer.instance )
        instance = self._save( serializer )
        after = self._snapshot( instance )
        changes = {
            key: pair( before[ key ], after[ key ] )
            for key in before
            if before[ key ] != after[ key ] and key not in IGNORED_IN_DIFF
        }
        record( "cms.updated", request = self.request, target = instance, detail = changes )
        return instance

    def perform_destroy( self, instance ):
        record( "cms.deleted", request = self.request, target = instance, target_label = str( instance ) )
        instance.delete()


class PostViewSet( AuditedWritesMixin, PublishedUnlessStaffMixin, viewsets.ModelViewSet ):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    lookup_field = "slug"
    search_fields = [ "title", "topic", "excerpt", "body" ]
    ordering_fields = [ "order", "published_at", "title", "created_at" ]


class MediaItemViewSet( AuditedWritesMixin, PublishedUnlessStaffMixin, viewsets.ModelViewSet ):
    queryset = MediaItem.objects.all()
    serializer_class = MediaItemSerializer
    search_fields = [ "title", "source" ]
    ordering_fields = [ "order", "published_at", "title" ]


class PressArticleViewSet( AuditedWritesMixin, PublishedUnlessStaffMixin, viewsets.ModelViewSet ):
    queryset = PressArticle.objects.all()
    serializer_class = PressArticleSerializer
    search_fields = [ "title", "source", "blurb" ]
    ordering_fields = [ "order", "published_at", "title" ]


class PublicationViewSet( AuditedWritesMixin, PublishedUnlessStaffMixin, viewsets.ModelViewSet ):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer
    search_fields = [ "title", "authors", "venue", "tag" ]
    ordering_fields = [ "year", "order", "title" ]

    def get_queryset( self ):
        queryset = super().get_queryset()
        year = self.request.query_params.get( "year" )
        if year and year.isdigit():
            queryset = queryset.filter( year = int( year ) )
        tag = self.request.query_params.get( "tag" )
        if tag:
            queryset = queryset.filter( tag = tag )
        kind = self.request.query_params.get( "kind" )
        if kind:
            queryset = queryset.filter( kind = kind )
        return queryset


class FaqViewSet( AuditedWritesMixin, PublishedUnlessStaffMixin, viewsets.ModelViewSet ):
    queryset = Faq.objects.all()
    serializer_class = FaqSerializer
    search_fields = [ "question", "answer" ]
    ordering_fields = [ "order", "question" ]

    def get_queryset( self ):
        queryset = super().get_queryset()
        group = self.request.query_params.get( "group" )
        if group:
            queryset = queryset.filter( group = group )
        return queryset


class PageCopyViewSet( viewsets.ModelViewSet ):
    """One blob of wording per page. The panel edits it, the site reads it."""

    permission_classes = [ IsAdminOrReadOnly ]
    serializer_class = PageCopySerializer
    queryset = PageCopy.objects.all()
    lookup_field = "key"
    http_method_names = [ "get", "put", "patch", "head", "options" ]

    def get_queryset( self ):
        rows = super().get_queryset()
        if not self.request.user.is_staff:
            rows = rows.filter( published = True )
        return rows

    def perform_update( self, serializer ):
        before = dict( serializer.instance.data or {} )
        page = serializer.save( updated_by = self.request.user )
        after = dict( page.data or {} )
        changed = leaf_diff( before, after )
        record( "copy.updated", request = self.request, target = page, detail = changed )
        return page


class SiteImageViewSet( viewsets.ModelViewSet ):
    """Pictures the panel uploads. A page names one by its url, and deleting one never leaves
    a hole: the site falls back to the bundled photo it used before."""

    permission_classes = [ IsAdminOrReadOnly ]
    serializer_class = SiteImageSerializer
    queryset = SiteImage.objects.all()
    parser_classes = [ MultiPartParser, FormParser, JSONParser ]
    http_method_names = [ "get", "post", "delete", "head", "options" ]

    def perform_create( self, serializer ):
        serializer.save( uploaded_by = self.request.user )


def published_rows( request, model, order ):
    rows = model.objects.all()
    if not request.user.is_staff:
        rows = rows.filter( status = PublishStatus.PUBLISHED )
    return rows.order_by( *order )


# The same sequence the cursor feeds walk, so a first page from /site/ and a later page
# from /feed/ can never repeat a row or skip one.
FEED_ORDER = ( "order", "id" )


class PostFeedView( APIView ):
    """Blog cards, a page at a time, walking forward with a cursor instead of an offset."""

    permission_classes = [ IsAdminOrReadOnly ]
    throttle_classes = [ PublicFeedThrottle ]

    def get( self, request ):
        paginator = FeedPagination()
        rows = paginator.paginate_queryset( published_rows( request, Post, FEED_ORDER ), request, self )
        return paginator.get_paginated_response( [ post_card( post ) for post in rows ] )


class PostDetailFeedView( APIView ):
    permission_classes = [ IsAdminOrReadOnly ]
    throttle_classes = [ PublicFeedThrottle ]

    def get( self, request, slug ):
        post = published_rows( request, Post, FEED_ORDER ).filter( slug = slug ).first()
        if post is None:
            return Response( { "detail": [ "Not found." ] }, status = 404 )
        card = post_card( post ) | article_body( post )
        return Response( card )


class MediaFeedView( APIView ):
    permission_classes = [ IsAdminOrReadOnly ]
    throttle_classes = [ PublicFeedThrottle ]

    def get( self, request ):
        paginator = MediaFeedPagination()
        rows = paginator.paginate_queryset( published_rows( request, MediaItem, FEED_ORDER ), request, self )
        return paginator.get_paginated_response( [ media_card( item ) for item in rows ] )


class SiteContentView( APIView ):
    """The whole published editorial corpus in one response, shaped like the data the
    site bundles so the browser can swap one source for the other."""

    permission_classes = [ IsAdminOrReadOnly ]
    throttle_classes = [ PublicFeedThrottle ]

    def get( self, request ):
        posts = [ post_card( post ) | article_body( post ) for post in Post.objects.published().order_by( *FEED_ORDER ) ]
        videos = [ media_card( item ) for item in MediaItem.objects.published().order_by( *FEED_ORDER ) ]
        press = [
            {
                "href": article.url,
                "topic": article.topic,
                "title": article.title,
                "source": article.source,
                "blurb": article.blurb,
                "photo": article.photo,
                "photo_url": article.photo_url,
                "photo_alt": article.photo_alt,
            }
            for article in PressArticle.objects.published().order_by( "order", "-published_at" )
        ]
        faqs = [
            { "group": faq.group, "q": faq.question, "a": faq.answer }
            for faq in Faq.objects.published().order_by( "group", "order", "question" )
        ]
        publications = [
            {
                "year": entry.year,
                "title": entry.title,
                "authors": entry.authors,
                "venue": entry.venue,
                "link": entry.link,
                "tag": entry.tag,
                "kind": entry.kind,
            }
            for entry in Publication.objects.published().order_by( "order", "-year", "title" )
        ]
        copy_rows = PageCopy.objects.all()
        if not request.user.is_staff:
            copy_rows = copy_rows.filter( published = True )
        copy = { page.key: page.data for page in copy_rows }

        return Response( {
            "posts": posts,
            "videos": videos,
            "press": press,
            "faqs": faqs,
            "publications": publications,
            "copy": copy,
        } )


def serve_upload( request, path ):
    """Hand one uploaded picture back.

    In development the dev server serves MEDIA_ROOT on its own. A deployed API has no web server in
    front of it, so without this every /media/ address the doctor picked in the panel would 404 on
    the live site and a hero would come up empty.
    """
    try:
        full = safe_join( str( settings.MEDIA_ROOT ), path.lstrip( "/" ) )
    except SuspiciousFileOperation:
        raise Http404( "That is not a file inside the uploads." ) from None
    if not os.path.isfile( full ):
        raise Http404( "No such upload." )

    guessed, _ = mimetypes.guess_type( full )
    response = FileResponse( open( full, "rb" ), content_type = guessed or "application/octet-stream" )
    # A second upload of the same name is stored under a different file, so a picture never changes
    # underneath a browser that already has it.
    response[ "Cache-Control" ] = "public, max-age=31536000, immutable"
    return response
