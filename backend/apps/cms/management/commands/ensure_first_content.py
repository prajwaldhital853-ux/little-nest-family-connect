"""Put the first content into a database that has none, so the panel has something to edit.

A fresh production database arrives with tables and no rows. The panel then opens on empty lists while
the public site keeps rendering the wording it ships with, which reads as though the content was lost.
This runs on every boot and loads only what is genuinely missing, so it can never step on an edit the
doctor has made.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand

from apps.cms.models import Faq, MediaItem, PageCopy, Post, PressArticle, Publication

ROWS = ( Post, MediaItem, PressArticle, Publication, Faq )


class Command( BaseCommand ):
    help = "Load the shipped page wording and CMS rows, but only into a database that does not have them."

    def handle( self, *args, **options ):
        if PageCopy.objects.exists():
            self.stdout.write( f"Page wording is already on file ({ PageCopy.objects.count() } pages), nothing was loaded." )
        else:
            call_command( "seed_page_copy" )

        if any( model.objects.exists() for model in ROWS ):
            self.stdout.write( "Posts, media, press, publications and FAQs are already on file, nothing was loaded." )
        else:
            call_command( "import_site_content" )
