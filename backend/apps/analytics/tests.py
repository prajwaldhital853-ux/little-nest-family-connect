from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.appointments.models import Appointment

from .models import PageView, Performance


class CollectTests( APITestCase ):
    def post( self, **body ):
        headers = { key: body.pop( key ) for key in list( body ) if key.startswith( "HTTP_" ) }
        return self.client.post( reverse( "analytics-collect" ), body, format = "json", **headers )

    def test_a_page_view_is_stored_without_any_raw_identity( self ):
        response = self.post(
            kind = "pageview",
            session = "session-abc",
            visitor = "visitor-123",
            path = "/about",
            referrer = "https://google.com/search?q=ramesh+kandel",
            HTTP_USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile Safari",
        )
        self.assertEqual( response.status_code, status.HTTP_202_ACCEPTED, response.data )
        row = PageView.objects.get()
        self.assertEqual( row.path, "/about" )
        self.assertEqual( row.device, "mobile" )
        self.assertEqual( row.browser, "Safari" )
        self.assertEqual( row.referrer_host, "google.com" )
        self.assertNotIn( "visitor-123", str( [ row.visitor_hash, row.session_hash ] ) )
        self.assertEqual( len( row.visitor_hash ), 64 )

    def test_the_stored_path_cannot_carry_a_query_or_markup( self ):
        self.post( kind = "pageview", path = "/blog/<script>alert(1)</script>?utm=x", visitor = "v", session = "s" )
        self.assertEqual( PageView.objects.get().path, "/blog/alert(1)" )

    def test_a_visitor_who_refuses_tracking_is_not_stored( self ):
        response = self.post( kind = "pageview", path = "/media", visitor = "v", session = "s", HTTP_DNT = "1" )
        self.assertEqual( response.status_code, status.HTTP_202_ACCEPTED )
        self.assertFalse( response.data[ "recorded" ] )
        self.assertEqual( PageView.objects.count(), 0 )

    def test_only_known_vitals_are_kept_and_sane_bounds_apply( self ):
        self.post( kind = "vitals", path = "/", visitor = "v", session = "s", metrics = { "lcp": 1800, "cls": 0.04, "bogus": 12, "inp": 999999 } )
        stored = { row.metric: row.value for row in Performance.objects.all() }
        self.assertEqual( stored, { "lcp": 1800.0, "cls": 0.04 } )

    def test_a_leave_beacon_fills_in_the_time_on_page( self ):
        self.post( kind = "pageview", path = "/contact", visitor = "v", session = "s" )
        self.post( kind = "leave", path = "/contact", visitor = "v", session = "s", duration_ms = 42_000 )
        self.assertEqual( PageView.objects.get().duration_ms, 42000 )

    def test_an_unknown_kind_is_refused( self ):
        self.assertEqual( self.post( kind = "cookies", path = "/" ).status_code, status.HTTP_400_BAD_REQUEST )


class SummaryTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )

    def setUp( self ):
        self.header = { "HTTP_AUTHORIZATION": f"Bearer { RefreshToken.for_user( self.admin ).access_token }" }
        today = timezone.localdate()
        for day in ( 0, 1, 1 ):
            PageView.objects.create(
                day = today - timedelta( days = day ),
                visitor_hash = f"visitor-{ day }",
                session_hash = f"session-{ day }",
                path = "/about" if day else "/",
                device = "mobile",
                browser = "Safari",
                duration_ms = 30_000,
            )
        Performance.objects.create( day = today, path = "/", metric = "lcp", value = 1200 )
        Appointment.objects.create(
            patient_name = "Sita Gurung", patient_email = "sita@example.com", phone = "+977 9857042717",
            concerns = "Falling twice a month", aim = "Keep mum safe at home", message = "",
        )

    def test_the_summary_needs_a_staff_token( self ):
        self.assertEqual( self.client.get( reverse( "analytics-summary" ) ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_the_summary_counts_visits_pages_and_enquiries( self ):
        data = self.client.get( reverse( "analytics-summary" ), { "days": 7 }, **self.header ).data
        self.assertEqual( data[ "range" ][ "days" ], 7 )
        self.assertEqual( data[ "totals" ][ "pageviews" ], 3 )
        self.assertEqual( data[ "totals" ][ "visitors" ], 2 )
        self.assertEqual( data[ "totals" ][ "enquiries" ], 1 )
        self.assertEqual( data[ "top_pages" ][ 0 ][ "path" ], "/about" )
        self.assertEqual( len( data[ "series" ] ), 7 )
        self.assertEqual( sum( row[ "pageviews" ] for row in data[ "series" ] ), 3 )

    def test_vitals_are_reported_with_a_traffic_light_rating( self ):
        data = self.client.get( reverse( "analytics-summary" ), { "days": 7 }, **self.header ).data
        self.assertEqual( data[ "vitals" ][ "lcp" ][ "rating" ], "good" )
        self.assertEqual( data[ "vitals" ][ "lcp" ][ "p75" ], 1200 )
