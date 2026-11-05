from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.cms.models import Post

from .models import AuditEntry
from .services import record


class RecordTests( APITestCase ):
    def test_a_row_remembers_who_and_what_without_the_raw_address( self ):
        staff = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )
        post = Post.objects.create( title = "Falling at home", topic = "Safety", excerpt = "What to change first.", body = "x" * 60 )
        entry = record( "cms.created", actor = staff, target = post, detail = { "ip": "1.2.3.4" } )
        self.assertEqual( entry.actor_label, "desk@example.com" )
        self.assertEqual( entry.target_type, "cms.Post" )
        self.assertEqual( entry.target_label, "Falling at home" )
        self.assertNotIn( "1.2.3.4", str( entry.detail ) )

    def test_secrets_are_never_written_into_history( self ):
        entry = record(
            "login.failed",
            detail = { "email": "desk@example.com", "password": "hunter-two", "token": "abc", "reason": "credentials" },
        )
        self.assertEqual( entry.detail, { "email": "desk@example.com", "reason": "credentials" } )
        self.assertEqual( entry.actor_label, "anonymous" )


class AuditReadTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.helper = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )
        AuditEntry.objects.create( actor = cls.admin, actor_label = cls.admin.email, action = "login.success" )
        AuditEntry.objects.create( actor = cls.helper, actor_label = cls.helper.email, action = "cms.updated", target_label = "Falling at home" )

    def setUp( self ):
        self.header = { "HTTP_AUTHORIZATION": f"Bearer { RefreshToken.for_user( self.admin ).access_token }" }

    def test_history_needs_a_staff_token( self ):
        self.assertEqual( self.client.get( "/api/audit/entries/" ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_the_newest_entries_come_first( self ):
        data = self.client.get( "/api/audit/entries/", **self.header ).data
        self.assertEqual( data[ "count" ], 2 )
        self.assertEqual( data[ "results" ][ 0 ][ "action" ], "cms.updated" )

    def test_filtering_by_action_and_who( self ):
        by_action = self.client.get( "/api/audit/entries/", { "action": "login.success" }, **self.header ).data
        self.assertEqual( [ row[ "action" ] for row in by_action[ "results" ] ], [ "login.success" ] )
        by_actor = self.client.get( "/api/audit/entries/", { "actor": "admin@example.com" }, **self.header ).data
        self.assertEqual( by_actor[ "count" ], 1 )

    def test_the_facets_offer_only_what_exists( self ):
        data = self.client.get( "/api/audit/entries/facets/", **self.header ).data
        self.assertEqual( { row[ "action" ] for row in data[ "actions" ] }, { "login.success", "cms.updated" } )

    def test_nothing_can_be_written_through_the_api( self ):
        for method in ( "post", "patch", "delete" ):
            response = getattr( self.client, method )( "/api/audit/entries/1/", {}, format = "json", **self.header )
            self.assertIn( response.status_code, { status.HTTP_405_METHOD_NOT_ALLOWED, status.HTTP_400_BAD_REQUEST } )
