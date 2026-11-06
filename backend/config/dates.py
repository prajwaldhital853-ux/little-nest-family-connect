"""The one way this project turns a calendar day into a range of moments."""

from datetime import datetime, time

from django.utils import timezone


def day_start( date ):
    """The first instant of a day in the site's own timezone.

    Asking the database for `some_field__date` wraps the column in a function, so it reads every row
    to answer. Asked instead as a range of moments, the same question uses the index on the column.
    """

    return timezone.make_aware( datetime.combine( date, time.min ) )
