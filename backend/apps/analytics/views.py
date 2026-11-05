from collections import Counter, defaultdict
from datetime import timedelta

from django.db.models import Count, Min
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.appointments.models import Appointment

from .models import PageView, Performance
from .services import classify_browser, classify_device, clean_path, hash_for_today, referrer_host, tracking_is_refused

KINDS = { "pageview", "leave", "vitals" }
VITAL_KEYS = { "lcp", "cls", "inp", "ttfb", "fcp" }
VITAL_LIMITS = { "lcp": ( 0, 60000 ), "fcp": ( 0, 60000 ), "inp": ( 0, 60000 ), "ttfb": ( 0, 60000 ), "cls": ( 0, 20 ) }


class CollectSerializer( serializers.Serializer ):
    kind = serializers.CharField()
    session = serializers.CharField( max_length = 64, allow_blank = True )
    visitor = serializers.CharField( max_length = 64, allow_blank = True )
    path = serializers.CharField( max_length = 500 )
    referrer = serializers.CharField( max_length = 500, required = False, allow_blank = True )
    duration_ms = serializers.IntegerField( min_value = 0, max_value = 3_600_000, required = False, allow_null = True )
    utm = serializers.DictField( required = False, child = serializers.CharField( max_length = 120 ) )
    metrics = serializers.DictField( required = False, child = serializers.FloatField() )

    def validate_kind( self, value ):
        kind = value.strip().lower()
        if kind not in KINDS:
            raise serializers.ValidationError( "Unknown measurement." )
        return kind


class CollectView( APIView ):
    """One small endpoint the site posts to. It never sees an address, a name or a cookie."""

    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "collect"

    def post( self, request ):
        serializer = CollectSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )
        if tracking_is_refused( request ):
            return Response( { "recorded": False }, status = status.HTTP_202_ACCEPTED )

        data = serializer.validated_data
        kind = data[ "kind" ]
        path = clean_path( data[ "path" ] )
        visitor = hash_for_today( data[ "visitor" ] or "anonymous" )
        session = hash_for_today( f"{ data[ 'session' ] or 'nosession' }" )

        if kind == "vitals":
            self._record_vitals( path, data.get( "metrics" ) or {} )
        elif kind == "leave":
            row = PageView.objects.filter( session_hash = session, path = path ).order_by( "-created_at" ).first()
            if row:
                row.duration_ms = data.get( "duration_ms" )
                row.save( update_fields = [ "duration_ms" ] )
        else:
            utm = data.get( "utm" ) or {}
            PageView.objects.create(
                day = timezone.localdate(),
                visitor_hash = visitor,
                session_hash = session,
                path = path,
                referrer_host = referrer_host( data.get( "referrer" ) ),
                utm_source = str( utm.get( "source", "" ) )[: 120 ],
                utm_medium = str( utm.get( "medium", "" ) )[: 120 ],
                utm_campaign = str( utm.get( "campaign", "" ) )[: 120 ],
                device = classify_device( request.META.get( "HTTP_USER_AGENT" ) ),
                browser = classify_browser( request.META.get( "HTTP_USER_AGENT" ) ),
            )
        return Response( { "recorded": True }, status = status.HTTP_202_ACCEPTED )

    @staticmethod
    def _record_vitals( path, metrics ):
        day = timezone.localdate()
        rows = []
        for name, value in metrics.items():
            key = name.strip().lower()
            if key not in VITAL_KEYS or value is None:
                continue
            low, high = VITAL_LIMITS[ key ]
            if not ( low <= float( value ) <= high ):
                continue
            rows.append( Performance( day = day, path = path, metric = key, value = round( float( value ), 4 ) ) )
        if rows:
            Performance.objects.bulk_create( rows )


class SummaryView( APIView ):
    """Everything the analytics page draws, in one call."""

    permission_classes = [ IsAdminUser ]

    def get( self, request ):
        days = min( 90, max( 1, int( request.query_params.get( "days", "30" ) or 30 ) ) )
        since = timezone.localdate() - timedelta( days = days - 1 )
        views = PageView.objects.filter( day__gte = since )
        enquiry_rows = (
            Appointment.objects.filter( created_at__date__gte = since )
            .values_list( "created_at__date", "pk" )
        )

        per_day_views = { row[ "day" ]: row for row in views.values( "day" ).annotate( total = Count( "id" ) ) }
        per_day_people = defaultdict( set )
        for day, visitor in views.values_list( "day", "visitor_hash" ):
            per_day_people[ day ].add( visitor )
        per_day_enquiries = Counter( day for day, _ in enquiry_rows )

        series = []
        cursor = since
        today = timezone.localdate()
        while cursor <= today:
            row = per_day_views.get( cursor, { "total": 0 } )
            series.append(
                {
                    "day": cursor.isoformat(),
                    "pageviews": row[ "total" ],
                    "visitors": len( per_day_people.get( cursor, () ) ),
                    "enquiries": per_day_enquiries.get( cursor, 0 ),
                }
            )
            cursor += timedelta( days = 1 )

        top_pages = [
            { "path": row[ "path" ], "views": row[ "total" ] }
            for row in views.values( "path" ).annotate( total = Count( "id" ) ).order_by( "-total" )[: 12 ]
        ]
        devices = list( views.exclude( device = "" ).values( "device" ).annotate( total = Count( "id" ) ).order_by( "-total" ) )
        browsers = list( views.exclude( browser = "" ).values( "browser" ).annotate( total = Count( "id" ) ).order_by( "-total" )[: 6 ] )
        referrers = list(
            views.exclude( referrer_host = "" ).values( "referrer_host" ).annotate( total = Count( "id" ) ).order_by( "-total" )[: 8 ]
        )
        campaigns = list(
            views.exclude( utm_source = "" ).values( "utm_source", "utm_medium" ).annotate( total = Count( "id" ) ).order_by( "-total" )[: 8 ]
        )

        first_seen = views.aggregate( oldest = Min( "created_at" ) )

        return Response(
            {
                "range": { "days": days, "from": since.isoformat(), "to": today.isoformat() },
                "totals": {
                    "pageviews": sum( row[ "pageviews" ] for row in series ),
                    "visitors": len( set().union( *per_day_people.values() ) ) if per_day_people else 0,
                    "sessions": views.values( "session_hash" ).distinct().count(),
                    "enquiries": sum( row[ "enquiries" ] for row in series ),
                    "average_seconds": round( self._average_seconds( views ), 1 ),
                    "since": first_seen[ "oldest" ].isoformat() if first_seen[ "oldest" ] else None,
                },
                "series": series,
                "top_pages": top_pages,
                "devices": [ { "kind": row[ "device" ], "views": row[ "total" ] } for row in devices ],
                "browsers": browsers,
                "referrers": referrers,
                "campaigns": campaigns,
                "vitals": self._vitals( since ),
            }
        )

    @staticmethod
    def _average_seconds( views ):
        durations = [ value for value in views.exclude( duration_ms__isnull = True ).values_list( "duration_ms", flat = True ) ]
        if not durations:
            return 0
        return sum( durations ) / len( durations ) / 1000

    @staticmethod
    def _vitals( since ):
        out = {}
        rows = list( Performance.objects.filter( day__gte = since ).values_list( "metric", "value" ) )
        buckets = defaultdict( list )
        for metric, value in rows:
            buckets[ metric ].append( value )
        thresholds = { "lcp": [ 2500, 4000 ], "fcp": [ 1800, 3000 ], "inp": [ 200, 500 ], "ttfb": [ 800, 1800 ], "cls": [ 0.1, 0.25 ] }
        for metric, values in buckets.items():
            values.sort()
            good, poor = thresholds.get( metric, [ 0, 0 ] )
            p75 = _percentile( values, 0.75 )
            out[ metric ] = {
                "samples": len( values ),
                "p75": round( p75, 3 ),
                "rating": "good" if p75 <= good else ( "needs work" if p75 <= poor else "poor" ),
            }
        return out


def _percentile( values, share ):
    if not values:
        return 0
    index = min( len( values ) - 1, int( share * ( len( values ) - 1 ) ) )
    return values[ index ]
