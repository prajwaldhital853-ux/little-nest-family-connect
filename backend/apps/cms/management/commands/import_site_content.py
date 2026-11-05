"""Load the content that was lifted out of the public site into the CMS."""

import json
import re
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.cms.models import PublishStatus, Faq, MediaItem, Post, PressArticle, Publication, PUBLICATION_KIND_BY_HEADING

MONTHS = { name.lower(): number for number, name in enumerate( [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
], start = 1 ) }

KIND_BY_LABEL = { MediaItem.Kind( value ).label: value for value, label in MediaItem.Kind.choices }


def parse_date( value ):
    """The site shows dates like "October 28, 2026"; turn one into a midday moment."""
    match = re.fullmatch( r"\s*([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s*", value or "" )
    if not match:
        return None
    month, day, year = match.groups()
    if month.lower() not in MONTHS:
        return None
    return timezone.make_aware(
        datetime( int( year ), MONTHS[ month.lower() ], int( day ), 12 ),
        timezone.get_current_timezone(),
    )


class Command( BaseCommand ):
    help = "Import db/site-content.json into the CMS, matching on slug, title or link."

    def add_arguments( self, parser ):
        parser.add_argument( "--file", default = str( Path( settings.BASE_DIR ) / "db" / "site-content.json" ) )
        parser.add_argument( "--draft", action = "store_true", help = "Import as drafts instead of publishing." )

    def handle( self, *args, **options ):
        path = Path( options[ "file" ] )
        if not path.exists():
            raise CommandError( f"No content file at { path }" )
        payload = json.loads( path.read_text( encoding = "utf-8" ) )
        self.status = PublishStatus.DRAFT if options[ "draft" ] else PublishStatus.PUBLISHED
        self.created = self.updated = 0

        with transaction.atomic():
            for name, rows, load in [
                ( "blog posts", payload[ "posts" ], self.post ),
                ( "media items", payload[ "videos" ], self.media ),
                ( "press articles", payload[ "press" ], self.press ),
                ( "publications", payload[ "publications" ], self.publication ),
                ( "FAQ items", payload[ "faqs" ], self.faq ),
            ]:
                for order, row in enumerate( rows ):
                    load( row, order )
                self.stdout.write( f"{ name }: { len( rows ) } rows" )

        self.stdout.write( self.style.SUCCESS(
            f"{ self.created } created, { self.updated } updated, all imported as { self.status }."
        ) )

    def record( self, manager, label, match, defaults ):
        """One row per identity: a link, a title and a year, not whichever field was typed last.
        A clash means the file and the database disagree, so say which line rather than traceback."""

        try:
            with transaction.atomic():
                obj, created = manager.update_or_create( **match, defaults = defaults )
        except IntegrityError as error:
            raise CommandError( f"{ label }: { match } already exists under another entry. { error }" ) from None
        self.created += created
        self.updated += not created
        return obj

    def post( self, row, order ):
        self.record( Post.objects, "post " + row[ "slug" ], { "slug": row[ "slug" ] }, {
            "title": row[ "title" ],
            "topic": row[ "topic" ],
            "excerpt": row[ "excerpt" ],
            "minutes": row[ "minutes" ],
            "photo": row[ "photo" ],
            "body": "\n\n".join( row[ "body" ] ),
            "order": order,
            "status": self.status,
            "published_at": parse_date( row[ "date" ] ),
        } )

    def media( self, row, order ):
        self.record( MediaItem.objects, "media " + row[ "url" ], { "url": row[ "url" ] }, {
            "title": row[ "title" ],
            "kind": KIND_BY_LABEL.get( row[ "kind" ], MediaItem.Kind.INTERVIEW ),
            "source": row[ "source" ],
            "order": order,
            "status": self.status,
        } )

    def press( self, row, order ):
        self.record( PressArticle.objects, "press " + row[ "url" ], { "url": row[ "url" ] }, {
            "title": row[ "title" ],
            "topic": row[ "topic" ],
            "source": row[ "source" ],
            "blurb": row[ "blurb" ],
            "photo": row[ "photo" ],
            "order": order,
            "status": self.status,
        } )

    def publication( self, row, order ):
        heading = ( row[ "tag" ] or "" ).strip().lower()
        self.record( Publication.objects, "publication " + row[ "title" ], { "title": row[ "title" ], "year": row[ "year" ] }, {
            "authors": row[ "authors" ],
            "venue": row[ "venue" ],
            "link": row[ "link" ],
            "tag": row[ "tag" ],
            "kind": PUBLICATION_KIND_BY_HEADING.get( heading, Publication.Kind.RESEARCH ),
            "order": order,
            "status": self.status,
        } )

    def faq( self, row, order ):
        self.record( Faq.objects, "faq " + row[ "question" ], { "question": row[ "question" ], "group": row[ "group" ] }, {
            "answer": row[ "answer" ],
            "order": order,
            "status": self.status,
        } )
