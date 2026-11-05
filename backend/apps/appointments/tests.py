from datetime import timedelta
from unittest import mock

from django.core import mail
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.audit.models import AuditEntry

from .models import Appointment, SubmissionTrace
from .views import AppointmentSubmitThrottle


def payload( **overrides ):
    data = {
        "patient_name": "Sita Gurung",
        "patient_email": "sita@example.com",
        "phone": "+977 9857042717",
        "scheduled_at": ( timezone.now() + timedelta( days = 3 ) ).isoformat(),
        "kind": Appointment.Kind.VIDEO,
        "concerns": "Falling twice in a month, forgetting names, no interest in eating",
        "aim": "Find out why mum keeps falling and what we can change at home",
        "message": "She lives with us, so a video consultation may be easier.",
    }
    data.update( overrides )
    return data


class PublicSubmissionTests( APITestCase ):
    def submit( self, **overrides ):
        return self.client.post( reverse( "appointment-list" ), payload( **overrides ), format = "json" )

    def test_anyone_can_submit_an_appointment_request( self ):
        response = self.submit()
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertTrue( response.data[ "reference" ].startswith( "RK-" ) )
        self.assertEqual( response.data[ "status" ], Appointment.Status.PENDING )
        appointment = Appointment.objects.get()
        self.assertEqual( appointment.patient_name, "Sita Gurung" )
        self.assertEqual( appointment.assigned_to, None )

    def test_a_request_without_a_time_lands_in_the_inbox_unscheduled( self ):
        response = self.submit( scheduled_at = None )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertIsNone( response.data[ "scheduled_at" ] )
        appointment = Appointment.objects.get()
        self.assertIsNone( appointment.scheduled_at )
        self.assertEqual( appointment.status, Appointment.Status.PENDING )

    def test_a_time_in_the_past_is_refused( self ):
        response = self.submit( scheduled_at = ( timezone.now() - timedelta( days = 1 ) ).isoformat() )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "scheduled_at", response.data )

    def test_the_two_consultation_questions_are_required( self ):
        response = self.submit( concerns = "", aim = "" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "concerns", response.data )
        self.assertIn( "aim", response.data )

    def test_a_thin_answer_to_the_health_questions_is_refused( self ):
        response = self.submit( concerns = "tired" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )

    def test_an_undialable_phone_is_refused( self ):
        response = self.submit( phone = "call me later" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "phone", response.data )

    def test_the_reference_is_unique_per_request( self ):
        first = self.submit( message = "Mum asked me to send this this morning." ).data[ "reference" ]
        second = self.submit( message = "A different note about the same family." ).data[ "reference" ]
        self.assertNotEqual( first, second )


class StaffInboxTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.helper = User.objects.create_user( email = "helper@example.com", password = "another-passphrase-5", is_staff = True )
        cls.appointment = Appointment.objects.create( **payload() )

    def setUp( self ):
        self.header = { "HTTP_AUTHORIZATION": f"Bearer { RefreshToken.for_user( self.admin ).access_token }" }

    def test_anonymous_reads_are_refused( self ):
        self.assertEqual( self.client.get( reverse( "appointment-list" ) ).status_code, status.HTTP_401_UNAUTHORIZED )
        self.assertEqual(
            self.client.get( reverse( "appointment-detail", args = [ self.appointment.pk ] ) ).status_code,
            status.HTTP_401_UNAUTHORIZED,
        )

    def test_staff_see_the_request_with_the_patient_answers( self ):
        response = self.client.get( reverse( "appointment-list" ), **self.header )
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        row = response.data[ "results" ][ 0 ]
        self.assertEqual( row[ "patient_name" ], "Sita Gurung" )
        self.assertIn( "why mum keeps falling", row[ "aim" ] )
        self.assertEqual( row[ "next_statuses" ], [ Appointment.Status.CANCELLED, Appointment.Status.CONFIRMED, Appointment.Status.NO_SHOW ] )

    def test_confirming_a_pending_request_works( self ):
        response = self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "status": Appointment.Status.CONFIRMED },
            format = "json",
            **self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.appointment.refresh_from_db()
        self.assertEqual( self.appointment.status, Appointment.Status.CONFIRMED )

    def test_the_clinic_can_set_the_time_after_the_request_arrives( self ):
        self.appointment.scheduled_at = None
        self.appointment.save()
        later = timezone.now() + timedelta( days = 9 )
        response = self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "scheduled_at": later.isoformat() },
            format = "json",
            **self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.appointment.refresh_from_db()
        self.assertEqual( self.appointment.scheduled_at.replace( microsecond = 0 ), later.replace( microsecond = 0 ) )

    def test_a_pending_request_cannot_jump_straight_to_completed( self ):
        response = self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "status": Appointment.Status.COMPLETED },
            format = "json",
            **self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "status", response.data )

    def test_an_outcome_is_final( self ):
        self.appointment.status = Appointment.Status.COMPLETED
        self.appointment.save()
        response = self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "status": Appointment.Status.PENDING },
            format = "json",
            **self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )

    def test_assigning_the_doctor( self ):
        response = self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "assigned_to": self.admin.pk, "admin_note": "Called to confirm the video link." },
            format = "json",
            **self.header,
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.appointment.refresh_from_db()
        self.assertEqual( self.appointment.assigned_to, self.admin )
        self.assertEqual( response.data[ "assigned_to_name" ], "admin@example.com" )

    def test_filtering_by_status_and_date( self ):
        older = Appointment.objects.create( **payload( scheduled_at = timezone.now() + timedelta( days = 40 ) ) )
        by_status = self.client.get( reverse( "appointment-list" ), { "status": "pending" }, **self.header )
        self.assertEqual( by_status.data[ "count" ], 2 )

        window = self.client.get(
            reverse( "appointment-list" ),
            { "date_from": ( timezone.now() + timedelta( days = 30 ) ).date().isoformat() },
            **self.header,
        )
        self.assertEqual( [ row[ "id" ] for row in window.data[ "results" ] ], [ older.pk ] )

    def test_unassigned_filter( self ):
        self.appointment.assigned_to = self.helper
        self.appointment.save()
        response = self.client.get( reverse( "appointment-list" ), { "unassigned": "1" }, **self.header )
        self.assertEqual( response.data[ "count" ], 0 )

    def test_searching_by_phone_or_reference( self ):
        by_phone = self.client.get( reverse( "appointment-list" ), { "search": "9857042717" }, **self.header )
        self.assertEqual( by_phone.data[ "count" ], 1 )
        by_reference = self.client.get( reverse( "appointment-list" ), { "search": self.appointment.reference }, **self.header )
        self.assertEqual( by_reference.data[ "count" ], 1 )

    def test_staff_can_delete_a_request_for_good( self ):
        response = self.client.delete( reverse( "appointment-detail", args = [ self.appointment.pk ] ), **self.header )
        self.assertEqual( response.status_code, status.HTTP_204_NO_CONTENT )
        self.assertEqual( Appointment.objects.count(), 0 )


class ApprovalEmailTests( APITestCase ):
    """The patient is emailed once, at the moment the clinic confirms their request."""

    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.appointment = Appointment.objects.create( **payload() )

    def setUp( self ):
        self.header = { "HTTP_AUTHORIZATION": f"Bearer { RefreshToken.for_user( self.admin ).access_token }" }

    def move( self, to_status ):
        return self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "status": to_status },
            format = "json",
            **self.header,
        )

    def test_confirming_emails_the_patient_the_details_and_the_doctor_contact( self ):
        response = self.move( Appointment.Status.CONFIRMED )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertEqual( len( mail.outbox ), 1 )
        message = mail.outbox[ 0 ]
        self.assertEqual( message.to, [ "sita@example.com" ] )
        self.assertEqual( message.subject, "Your appointment with Dr. Ramesh Kandel is confirmed" )
        self.assertIn( self.appointment.reference, message.body )
        self.assertIn( "Sita Gurung", message.body )
        self.assertIn( "Video call", message.body )
        self.assertIn( "drameshkandel@gmail.com", message.body )
        self.assertIn( "+977-9857042717", message.body )

    def test_a_request_without_an_email_address_is_still_confirmed( self ):
        self.appointment.patient_email = ""
        self.appointment.save()
        response = self.move( Appointment.Status.CONFIRMED )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertEqual( len( mail.outbox ), 0 )

    def test_a_transition_that_is_not_an_approval_sends_nothing( self ):
        response = self.move( Appointment.Status.CANCELLED )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertEqual( len( mail.outbox ), 0 )

    def test_a_second_save_of_a_confirmed_row_does_not_email_again( self ):
        self.move( Appointment.Status.CONFIRMED )
        self.client.patch(
            reverse( "appointment-detail", args = [ self.appointment.pk ] ),
            { "admin_note": "Called to talk through the video link." },
            format = "json",
            **self.header,
        )
        self.assertEqual( len( mail.outbox ), 1 )


@mock.patch.object( AppointmentSubmitThrottle, "THROTTLE_RATES", { "appointment": "2/day" } )
class SubmissionRateTests( APITestCase ):
    """The rate is read when the throttle is built, so patch the class rather than settings."""

    def setUp( self ):
        cache.clear()

    def test_the_public_form_is_rate_limited( self, *_ ):
        for note in ( "first", "second" ):
            self.assertEqual(
                self.client.post( reverse( "appointment-list" ), payload( message = note ), format = "json" ).status_code,
                status.HTTP_201_CREATED,
            )
        blocked = self.client.post( reverse( "appointment-list" ), payload( message = "third" ), format = "json" )
        self.assertEqual( blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS )
        self.assertIn( "Too many requests", blocked.data[ "detail" ] )


class DuplicateEnquiryTests( APITestCase ):
    """One enquiry per address, browser and wording, for a day."""

    def submit( self, note = "Falling at night", **extra ):
        environ = { key.upper(): value for key, value in extra.items() }
        return self.client.post(
            reverse( "appointment-list" ),
            payload( concerns = note, aim = "Stop the falls before winter" ),
            format = "json",
            **environ,
        )

    def setUp( self ):
        cache.clear()

    def test_the_same_wording_from_the_same_browser_is_refused_for_a_day( self ):
        first = self.submit( HTTP_X_DEVICE_ID = "device-one" )
        self.assertEqual( first.status_code, status.HTTP_201_CREATED, first.data )
        again = self.submit( HTTP_X_DEVICE_ID = "device-one" )
        self.assertEqual( again.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "already been received", str( again.data ) )
        self.assertEqual( Appointment.objects.count(), 1 )

    def test_the_same_wording_from_a_new_browser_and_address_is_accepted( self ):
        self.submit( HTTP_X_DEVICE_ID = "device-one", REMOTE_ADDR = "10.1.1.1" )
        response = self.submit( HTTP_X_DEVICE_ID = "device-two", REMOTE_ADDR = "10.2.2.2" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        self.assertEqual( Appointment.objects.count(), 2 )

    def test_a_second_different_enquiry_from_the_same_browser_is_accepted( self ):
        self.submit( HTTP_X_DEVICE_ID = "device-one" )
        response = self.submit( note = "Memory has slipped this year", HTTP_X_DEVICE_ID = "device-one" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )

    def test_the_block_expires_with_the_window( self ):
        self.submit( HTTP_X_DEVICE_ID = "device-one" )
        SubmissionTrace.objects.update( created_at = timezone.now() - timedelta( hours = 25 ) )
        response = self.submit( HTTP_X_DEVICE_ID = "device-one" )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )

    def test_an_enquiry_leaves_a_history_row( self ):
        self.submit( HTTP_X_DEVICE_ID = "device-one" )
        entry = AuditEntry.objects.get( action = "enquiry.received" )
        self.assertEqual( entry.target_type, "appointments.Appointment" )
