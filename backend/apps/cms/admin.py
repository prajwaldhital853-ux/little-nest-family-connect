from django.contrib import admin

from .models import Faq, MediaItem, Post, PressArticle, Publication


class ContentAdmin( admin.ModelAdmin ):
    list_display = ( "status", "order", "published_at", "updated_at" )
    list_filter = ( "status", )
    ordering = ( "order", )


@admin.register( Post )
class PostAdmin( ContentAdmin ):
    list_display = ( "title", "topic", "status", "order", "published_at" )
    prepopulated_fields = { "slug": ( "title", ) }
    search_fields = ( "title", "topic", "excerpt" )


@admin.register( MediaItem )
class MediaItemAdmin( ContentAdmin ):
    list_display = ( "title", "kind", "source", "status", "order" )
    search_fields = ( "title", "source", "url" )


@admin.register( PressArticle )
class PressArticleAdmin( ContentAdmin ):
    list_display = ( "title", "source", "status", "order" )
    search_fields = ( "title", "source" )


@admin.register( Publication )
class PublicationAdmin( ContentAdmin ):
    list_display = ( "title", "venue", "year", "status", "order" )
    ordering = ( "-year", "order" )
    search_fields = ( "title", "authors", "venue" )


@admin.register( Faq )
class FaqAdmin( ContentAdmin ):
    list_display = ( "question", "group", "status", "order" )
    list_filter = ( "status", "group" )
    search_fields = ( "question", "answer" )
