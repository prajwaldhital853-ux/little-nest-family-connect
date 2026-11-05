from django.db import models

DEVICE_KINDS = [ ( "mobile", "Mobile" ), ( "tablet", "Tablet" ), ( "desktop", "Desktop" ) ]

VITALS = [ ( "lcp", "Largest contentful paint" ), ( "cls", "Cumulative layout shift" ),
           ( "inp", "Interaction next paint" ), ( "ttfb", "Time to first byte" ), ( "fcp", "First contentful paint" ) ]


class PageView( models.Model ):
    """One look at one page. Nothing here identifies a person: the keys are hashed with a salt that changes daily."""

    day = models.DateField( db_index = True )
    visitor_hash = models.CharField( max_length = 64, db_index = True )
    session_hash = models.CharField( max_length = 64, db_index = True )
    path = models.CharField( max_length = 240 )
    referrer_host = models.CharField( max_length = 120, blank = True )
    utm_source = models.CharField( max_length = 120, blank = True )
    utm_medium = models.CharField( max_length = 120, blank = True )
    utm_campaign = models.CharField( max_length = 120, blank = True )
    device = models.CharField( max_length = 8, choices = DEVICE_KINDS, blank = True )
    browser = models.CharField( max_length = 32, blank = True )
    duration_ms = models.PositiveIntegerField( null = True, blank = True )
    created_at = models.DateTimeField( auto_now_add = True, db_index = True )

    class Meta:
        ordering = [ "-created_at" ]
        verbose_name_plural = "Page views"
        indexes = [ models.Index( fields = [ "day", "path" ] ) ]

    def __str__( self ):
        return f"{ self.day } { self.path }"


class Performance( models.Model ):
    """Field values from the site itself, which is the only honest way to see how fast it feels."""

    day = models.DateField( db_index = True )
    path = models.CharField( max_length = 240 )
    metric = models.CharField( max_length = 6, choices = VITALS )
    value = models.FloatField()
    created_at = models.DateTimeField( auto_now_add = True )

    class Meta:
        ordering = [ "-created_at" ]
        indexes = [ models.Index( fields = [ "day", "metric" ] ) ]

    def __str__( self ):
        return f"{ self.metric } { self.value }"
