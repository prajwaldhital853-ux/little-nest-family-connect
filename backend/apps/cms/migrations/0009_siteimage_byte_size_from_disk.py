"""Record the size of every picture already in the gallery.

The list used to ask the disk for a size on every row of every request. Once the number lives on
the row, the rows that were uploaded before it did need one filled in, once, here.
"""

from django.db import migrations


def fill_sizes( apps, schema_editor ):
    SiteImage = apps.get_model( "cms", "SiteImage" )
    for image in SiteImage.objects.exclude( file = "" ):
        try:
            size = image.file.size
        except Exception:
            size = 0
        SiteImage.objects.filter( pk = image.pk ).update( byte_size = size or 0 )


class Migration( migrations.Migration ):

    dependencies = [
        ( "cms", "0008_siteimage_byte_size_faq_faq_group_idx_and_more" ),
    ]

    operations = [ migrations.RunPython( fill_sizes, migrations.RunPython.noop ) ]
