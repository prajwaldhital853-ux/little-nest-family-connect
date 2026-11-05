"""Load the page wording the public site ships with into the CMS, so the panel can edit it."""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.cms.models import PageCopy

# The bundle the site renders is the seed. Keeping one copy avoids two sources drifting apart.
BUNDLE = Path( settings.BASE_DIR ).parent / "src" / "pages" / "site" / "copy.json"


class Command( BaseCommand ):
    help = "Seed PageCopy rows from the public site's copy bundle."

    def add_arguments( self, parser ):
        parser.add_argument( "--file", default = str( BUNDLE ) )
        parser.add_argument( "--draft", action = "store_true", help = "Seed as drafts, so the site keeps its bundled wording." )
        parser.add_argument( "--prune", action = "store_true", help = "Delete page copy rows whose key is not in the file." )
        parser.add_argument(
            "--only",
            action = "append",
            default = [],
            metavar = "KEY",
            help = "Seed only these page keys and leave every other row, including the doctor's own edits, untouched.",
        )

    def handle( self, *args, **options ):
        path = Path( options[ "file" ] )
        if not path.exists():
            raise CommandError( f"No copy bundle at { path }" )
        bundle = json.loads( path.read_text( encoding = "utf-8" ) )
        if not isinstance( bundle, dict ):
            raise CommandError( "The copy bundle must be an object keyed by page." )

        only = list( options[ "only" ] or [] )
        if only and options[ "prune" ]:
            raise CommandError( "--prune would delete every row --only left alone. Run one or the other." )
        missing = [ key for key in only if key not in bundle ]
        if missing:
            raise CommandError( f"No such page in the bundle: { ', '.join( missing ) }. Available: { ', '.join( bundle ) }." )

        created = updated = 0
        kept = []
        for key, blob in bundle.items():
            if not isinstance( blob, dict ):
                raise CommandError( f"Page '{ key }' holds { type( blob ).__name__ }, not an object." )
            if only and key not in only:
                continue
            label = str( blob.get( "label" ) or key.replace( "-", " " ).capitalize() )
            kept.append( key )
            _, was_created = PageCopy.objects.update_or_create(
                key = key,
                defaults = { "label": label, "data": blob, "published": not options[ "draft" ] },
            )
            created += was_created
            updated += not was_created

        removed = 0
        if options[ "prune" ]:
            removed = PageCopy.objects.exclude( key__in = kept ).delete()[ 0 ]

        self.stdout.write( self.style.SUCCESS(
            f"{ created } created, { updated } updated"
            + ( f", { removed } removed" if removed else "" )
            + ( f" (only { ', '.join( only ) })" if only else "" )
            + f". Seeded as {'draft' if options[ 'draft' ] else 'published'}."
        ) )
