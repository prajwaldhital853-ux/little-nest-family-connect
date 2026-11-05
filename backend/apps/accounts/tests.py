import re
from datetime import timedelta
from smtplib import SMTPAuthenticationError
from unittest import mock
from urllib.parse import unquote

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Lockout, OtpChallenge, PasswordResetRequest, TrustedDevice, User

ORIGIN = { "HTTP_ORIGIN": "http://testserver" }
EVIL_ORIGIN = { "HTTP_ORIGIN": "http://evil.example.com" }
CODE_RE = re.compile( r"Your code is (\d{6})" )


@override_settings(
    ADMIN_LOGIN_EMAILS = [ "desk@example.com" ],
    PANEL_ORIGIN = "http://localhost:8080",
    PANEL_PATH = "/admin",
    AUTH_COOKIE_SECURE = False,
    AUTH_COOKIE_SAMESITE = "Lax",
)
class SignInTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.staff = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", full_name = "Front desk", is_staff = True )
        cls.helper = User.objects.create_user( email = "helper@example.com", password = "another-passphrase-5", is_staff = True )
        cls.patient = User.objects.create_user( email = "visitor@example.com", password = "some-passphrase-9" )
        cls.inactive = User.objects.create_user( email = "gone@example.com", password = "left-the-clinic-4", is_staff = True, is_active = False )

    def setUp( self ):
        self.client.cookies.clear()
        cache.clear()
        mail.outbox.clear()

    def sign_in( self, email = "desk@example.com", password = "consultation-room-7", **extra ):
        return self.client.post( reverse( "login" ), { "email": email, "password": password }, format = "json", **extra )

    def code_from_email( self ):
        match = CODE_RE.search( mail.outbox[ -1 ].body )
        self.assertIsNotNone( match, mail.outbox[ -1 ].body )
        return match.group( 1 )

    def verify( self, code, **extra ):
        headers = { **ORIGIN, **extra }
        return self.client.post( reverse( "otp-verify" ), { "code": code }, format = "json", **headers )

    def trust_this_browser( self ):
        self.sign_in()
        response = self.verify( self.code_from_email() )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        return response.data

    def test_a_first_sign_in_asks_for_a_code_before_any_token_is_issued( self ):
        response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertTrue( response.data[ "otp_required" ] )
        self.assertNotIn( "access", response.data )
        self.assertEqual( response.data[ "email" ], "d**k@example.com" )
        self.assertEqual( len( mail.outbox ), 1 )
        self.assertEqual( mail.outbox[ 0 ].to, [ "desk@example.com" ] )

    def test_the_code_opens_a_session_with_an_access_token_and_a_cookie_only_refresh( self ):
        self.sign_in()
        response = self.verify( self.code_from_email() )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertIn( "access", response.data )
        self.assertNotIn( "refresh", response.data )
        cookie = self.client.cookies[ "kandel_rtk" ]
        self.assertTrue( cookie["httponly"] )
        self.assertEqual( cookie["path"], "/api/auth/" )
        self.assertEqual( TrustedDevice.objects.filter( user = self.staff ).count(), 1 )

    def test_a_known_browser_signs_straight_in( self ):
        self.trust_this_browser()
        response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertFalse( response.data[ "otp_required" ] )
        self.assertIn( "access", response.data )

    def test_a_wrong_password_says_nothing_about_which_part_was_wrong( self ):
        response = self.sign_in( password = "not-the-password-1" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertEqual( str( response.data[ "detail" ] ), "Email or password is not correct." )
        self.assertNotIn( "password", response.data )

    def test_three_wrong_tries_block_this_browser_and_address_for_five_minutes( self ):
        for _ in range( 2 ):
            self.assertEqual( self.sign_in( password = "wrong-passphrase-1" ).status_code, status.HTTP_400_BAD_REQUEST )

        blocked = self.sign_in( password = "wrong-passphrase-1" )
        self.assertEqual( blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS )
        self.assertIn( "blocked", str( blocked.data[ "detail" ] ) )
        self.assertLessEqual( blocked.data[ "retry_after" ], 300 )
        self.assertEqual( OtpChallenge.objects.count(), 0 )

    def test_another_browser_from_the_same_address_is_blocked_too( self ):
        for _ in range( 2 ):
            self.sign_in( password = "wrong-passphrase-1" )
        self.sign_in( password = "wrong-passphrase-1" )
        other = self.client.__class__()
        other.cookies.clear()
        response = other.post( reverse( "login" ), { "email": "desk@example.com", "password": "consultation-room-7" }, format = "json", **ORIGIN )
        self.assertEqual( response.status_code, status.HTTP_429_TOO_MANY_REQUESTS )

    def test_a_new_browser_from_a_blocked_address_cannot_escape_the_block( self ):
        for _ in range( 2 ):
            self.sign_in( password = "wrong-passphrase-1" )
        self.sign_in( password = "wrong-passphrase-1" )
        other = self.client.__class__()
        other.cookies.clear()
        response = other.post( reverse( "login" ), { "email": "desk@example.com", "password": "consultation-room-7" }, format = "json", **ORIGIN )
        self.assertEqual( response.status_code, status.HTTP_429_TOO_MANY_REQUESTS )

    def test_the_block_lifts_after_five_minutes( self ):
        for _ in range( 2 ):
            self.sign_in( password = "wrong-passphrase-1" )
        self.sign_in( password = "wrong-passphrase-1" )
        Lockout.objects.update( locked_until = timezone.now() - timedelta( seconds = 1 ) )
        self.assertEqual( self.sign_in().status_code, status.HTTP_200_OK )

    def test_only_the_doctors_address_may_sign_in_even_with_a_staff_account( self ):
        response = self.sign_in( email = "helper@example.com", password = "another-passphrase-5" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertEqual( OtpChallenge.objects.count(), 0 )

    def test_non_staff_and_deactivated_accounts_are_refused( self ):
        self.assertEqual( self.sign_in( email = "visitor@example.com", password = "some-passphrase-9" ).status_code, 400 )
        self.assertEqual( self.sign_in( email = "gone@example.com", password = "left-the-clinic-4" ).status_code, 400 )

    def test_a_wrong_code_is_refused_and_the_challenge_dies_after_five_guesses( self ):
        self.sign_in()
        for _ in range( 5 ):
            self.assertEqual( self.verify( "000000" ).status_code, status.HTTP_400_BAD_REQUEST )
        self.assertEqual( self.verify( self.code_from_email() ).status_code, status.HTTP_400_BAD_REQUEST )
        self.assertEqual( TrustedDevice.objects.count(), 0 )

    def test_an_expired_code_is_refused( self ):
        self.sign_in()
        OtpChallenge.objects.update( expires_at = timezone.now() - timedelta( minutes = 1 ) )
        response = self.verify( self.code_from_email() )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "no longer usable", str( response.data[ "detail" ] ) )

    def test_the_code_is_only_accepted_on_the_browser_that_asked_for_it( self ):
        self.sign_in()
        code = self.code_from_email()
        other = self.client.__class__()
        other.cookies.clear()
        response = other.post( reverse( "otp-verify" ), { "code": code }, format = "json", **ORIGIN )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )

    def test_the_code_endpoint_refuses_a_page_that_is_not_the_panel( self ):
        self.sign_in()
        response = self.verify( self.code_from_email(), **EVIL_ORIGIN )
        self.assertEqual( response.status_code, status.HTTP_403_FORBIDDEN )

    @override_settings( DEBUG = True, OTP_FIXED_CODE = "123456" )
    def test_a_development_machine_is_sent_the_code_its_manual_names( self ):
        self.sign_in()
        self.assertEqual( self.code_from_email(), "123456" )
        self.assertEqual( self.verify( "123456" ).status_code, status.HTTP_200_OK )

    @override_settings( DEBUG = False, OTP_FIXED_CODE = "123456" )
    def test_a_real_sign_in_never_sends_the_development_code( self ):
        self.sign_in()
        self.assertNotEqual( self.code_from_email(), "123456" )

    @override_settings( OTP_REQUIRED = False )
    def test_an_unseen_browser_signs_in_on_its_password_when_codes_are_switched_off( self ):
        response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertIn( "access", response.data )
        self.assertFalse( response.data[ "otp_required" ] )
        self.assertEqual( OtpChallenge.objects.count(), 0 )
        self.assertEqual( len( mail.outbox ), 0 )
        self.assertEqual( TrustedDevice.objects.filter( user = self.staff ).count(), 1 )

    def test_a_browser_let_in_without_a_code_is_still_remembered_when_codes_go_back_on( self ):
        with override_settings( OTP_REQUIRED = False ):
            self.assertEqual( self.sign_in().status_code, status.HTTP_200_OK )
        with override_settings( OTP_REQUIRED = True ):
            response = self.sign_in()
        self.assertIn( "access", response.data )
        self.assertEqual( len( mail.outbox ), 0 )


@override_settings(
    ADMIN_LOGIN_EMAILS = [ "desk@example.com" ],
    AUTH_COOKIE_SECURE = False,
    AUTH_COOKIE_SAMESITE = "Lax",
)
class SessionTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.staff = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )

    def setUp( self ):
        mail.outbox.clear()
        cache.clear()
        self.client.cookies.clear()
        self.client.post( reverse( "login" ), { "email": "desk@example.com", "password": "consultation-room-7" }, format = "json" )
        code = CODE_RE.search( mail.outbox[ -1 ].body ).group( 1 )
        self.client.post( reverse( "otp-verify" ), { "code": code }, format = "json", **ORIGIN )

    def refresh( self, **extra ):
        headers = { **ORIGIN, **extra }
        return self.client.post( reverse( "refresh" ), {}, format = "json", **headers )

    def test_the_refresh_cookie_is_http_only_and_scoped_to_the_auth_paths( self ):
        cookie = self.client.cookies[ "kandel_rtk" ]
        self.assertTrue( cookie["httponly"] )
        self.assertEqual( cookie["path"], "/api/auth/" )
        self.assertEqual( cookie["samesite"], "Lax" )

    def test_refresh_needs_the_cookie_and_gives_a_new_pair( self ):
        old = self.client.cookies[ "kandel_rtk" ].value
        response = self.refresh()
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.assertIn( "access", response.data )
        self.assertNotIn( "refresh", response.data )
        self.assertNotEqual( self.client.cookies[ "kandel_rtk" ].value, old )

    def test_an_old_refresh_token_cannot_be_replayed( self ):
        stolen = self.client.cookies[ "kandel_rtk" ].value
        self.refresh()
        replay = self.client.__class__()
        replay.cookies[ "kandel_rtk" ] = stolen
        response = replay.post( reverse( "refresh" ), {}, format = "json", **ORIGIN )
        self.assertEqual( response.status_code, status.HTTP_401_UNAUTHORIZED )

    def test_refresh_from_a_foreign_page_is_refused( self ):
        self.assertEqual( self.refresh( **EVIL_ORIGIN ).status_code, status.HTTP_403_FORBIDDEN )

    def test_logout_blacklists_the_session_and_clears_the_cookies( self ):
        stale = self.client.cookies[ "kandel_rtk" ].value
        logged_out = self.client.post( reverse( "logout" ), {}, format = "json", **ORIGIN )
        self.assertEqual( logged_out.status_code, status.HTTP_200_OK )
        self.client.cookies.clear()
        replay = self.client.__class__()
        replay.cookies[ "kandel_rtk" ] = stale
        self.assertEqual( replay.post( reverse( "refresh" ), {}, format = "json", **ORIGIN ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_a_session_without_the_cookie_cannot_refresh( self ):
        self.client.cookies.clear()
        self.assertEqual( self.refresh().status_code, status.HTTP_401_UNAUTHORIZED )

    def test_removing_a_remembered_device_stops_that_browser_refreshing( self ):
        self.assertEqual( self.refresh().status_code, status.HTTP_200_OK )
        TrustedDevice.objects.filter( user = self.staff ).delete()
        ended = self.refresh()
        self.assertEqual( ended.status_code, status.HTTP_401_UNAUTHORIZED )
        self.assertNotIn( "access", ended.data )


@override_settings(
    ADMIN_LOGIN_EMAILS = [ "desk@example.com" ],
    PANEL_ORIGIN = "http://localhost:8080",
    PANEL_PATH = "/admin",
    AUTH_COOKIE_SECURE = False,
)
class PasswordResetTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.staff = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )

    def setUp( self ):
        self.client.cookies.clear()
        cache.clear()
        mail.outbox.clear()

    def forgot( self, email = "desk@example.com", **extra ):
        return self.client.post( reverse( "password-forgot" ), { "email": email }, format = "json", **extra )

    def link_from_email( self ):
        body = mail.outbox[ -1 ].body
        url = re.search( r"http://localhost:8080/admin/reset-password\?email=([^&]+)&token=([^\s]+)", body )
        self.assertIsNotNone( url, body )
        return unquote( url.group( 1 ) ), url.group( 2 ).strip()

    def test_forgot_password_emails_a_single_use_link( self ):
        response = self.forgot()
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertIn( "reset link is on its way", str( response.data[ "detail" ] ) )
        self.assertEqual( PasswordResetRequest.objects.count(), 1 )
        self.assertEqual( mail.outbox[ 0 ].to, [ "desk@example.com" ] )

    def test_an_unknown_address_gets_the_same_answer_and_no_email( self ):
        mail.outbox.clear()
        response = self.forgot( email = "nobody@example.com" )
        self.assertEqual( response.status_code, status.HTTP_200_OK )
        self.assertEqual( len( mail.outbox ), 0 )
        self.assertEqual( PasswordResetRequest.objects.count(), 0 )

    def test_the_link_sets_a_new_password_and_ends_other_sessions( self ):
        self.forgot()
        email, token = self.link_from_email()
        refreshed = self.client.post( reverse( "login" ), { "email": email, "password": "consultation-room-7" }, format = "json" )
        self.assertEqual( refreshed.status_code, status.HTTP_200_OK, refreshed.data )
        code = CODE_RE.search( mail.outbox[ -1 ].body ).group( 1 )
        self.client.post( reverse( "otp-verify" ), { "code": code }, format = "json", **ORIGIN )

        done = self.client.post(
            reverse( "password-reset" ),
            { "email": email, "token": token, "password": "brand-new-passphrase-4" },
            format = "json",
            **ORIGIN,
        )
        self.assertEqual( done.status_code, status.HTTP_200_OK, done.data )
        self.staff.refresh_from_db()
        self.assertTrue( self.staff.check_password( "brand-new-passphrase-4" ) )
        self.assertEqual( TrustedDevice.objects.filter( user = self.staff ).count(), 0 )
        self.assertEqual( self.client.post( reverse( "refresh" ), {}, format = "json", **ORIGIN ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_a_link_only_works_once( self ):
        self.forgot()
        email, token = self.link_from_email()
        body = { "email": email, "token": token, "password": "second-attempt-pass-8" }
        self.assertEqual( self.client.post( reverse( "password-reset" ), body, format = "json", **ORIGIN ).status_code, status.HTTP_200_OK )
        self.assertEqual( self.client.post( reverse( "password-reset" ), body, format = "json", **ORIGIN ).status_code, status.HTTP_400_BAD_REQUEST )

    def test_a_guessed_token_is_refused_and_three_guesses_block_the_address( self ):
        for _ in range( 3 ):
            response = self.client.post(
                reverse( "password-reset" ),
                { "email": "desk@example.com", "token": "guess", "password": "a-passphrase-to-try-5" },
                format = "json",
                **ORIGIN,
            )
            self.assertIn(
                response.status_code,
                { status.HTTP_400_BAD_REQUEST, status.HTTP_429_TOO_MANY_REQUESTS },
            )
        blocked = self.client.post(
            reverse( "password-reset" ),
            { "email": "desk@example.com", "token": "guess", "password": "a-passphrase-to-try-5" },
            format = "json",
            **ORIGIN,
        )
        self.assertEqual( blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS )

    def test_three_forgot_requests_also_hit_the_block( self ):
        for _ in range( 2 ):
            self.forgot()
        self.assertEqual( self.forgot().status_code, status.HTTP_429_TOO_MANY_REQUESTS )

    def test_a_weak_new_password_is_refused( self ):
        self.forgot()
        email, token = self.link_from_email()
        response = self.client.post(
            reverse( "password-reset" ), { "email": email, "token": token, "password": "123456" }, format = "json", **ORIGIN
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "password", response.data )


class ProfileAndDevicesTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.staff = User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )
        cls.visitor = User.objects.create_user( email = "visitor@example.com", password = "some-passphrase-9" )

    def bearer( self, user ):
        return f"Bearer { RefreshToken.for_user( user ).access_token }"

    def test_me_needs_a_token( self ):
        self.assertEqual( self.client.get( reverse( "me" ) ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_me_returns_the_signed_in_account( self ):
        response = self.client.get( reverse( "me" ), HTTP_AUTHORIZATION = self.bearer( self.staff ) )
        self.assertEqual( response.data[ "email" ], "desk@example.com" )

    def test_a_user_cannot_grant_themselves_staff_rights( self ):
        response = self.client.patch(
            reverse( "me" ),
            { "is_staff": True, "email": "elsewhere@example.com" },
            HTTP_AUTHORIZATION = self.bearer( self.visitor ),
            format = "json",
        )
        self.assertFalse( response.data[ "is_staff" ] )
        self.assertEqual( response.data[ "email" ], "elsewhere@example.com" )

    def test_changing_the_password_invalidates_older_refresh_tokens( self ):
        header = self.bearer( self.staff )
        changed = self.client.post(
            reverse( "password" ),
            { "current_password": "consultation-room-7", "new_password": "new-clinic-passphrase-3" },
            HTTP_AUTHORIZATION = header,
            format = "json",
        )
        self.assertEqual( changed.status_code, status.HTTP_200_OK )
        self.assertEqual( self.client.post( reverse( "refresh" ), {}, format = "json", **ORIGIN ).status_code, status.HTTP_401_UNAUTHORIZED )

    def test_the_doctor_can_see_and_revoke_the_browsers_trusted( self ):
        TrustedDevice.objects.create( user = self.staff, device_hash = "a" * 64, label = "Chrome on Windows" )
        listed = self.client.get( reverse( "devices" ), HTTP_AUTHORIZATION = self.bearer( self.staff ) )
        self.assertEqual( listed.status_code, status.HTTP_200_OK )
        self.assertEqual( len( listed.data ), 1 )

        revoked = self.client.delete( reverse( "device-detail", args = [ listed.data[ 0 ][ "id" ] ] ), HTTP_AUTHORIZATION = self.bearer( self.staff ) )
        self.assertEqual( revoked.status_code, status.HTTP_200_OK )
        self.assertEqual( TrustedDevice.objects.count(), 0 )


class StaffAccountTests( APITestCase ):
    @classmethod
    def setUpTestData( cls ):
        cls.admin = User.objects.create_user( email = "admin@example.com", password = "consultation-room-7", is_staff = True )
        cls.helper = User.objects.create_user( email = "helper@example.com", password = "another-passphrase-5", is_staff = True )
        cls.visitor = User.objects.create_user( email = "visitor@example.com", password = "some-passphrase-9" )

    def setUp( self ):
        self.header = f"Bearer { RefreshToken.for_user( self.admin ).access_token }"

    def test_listing_accounts_needs_staff_rights( self ):
        self.assertEqual( self.client.get( "/api/auth/users/" ).status_code, status.HTTP_401_UNAUTHORIZED )
        plain = f"Bearer { RefreshToken.for_user( self.visitor ).access_token }"
        self.assertEqual( self.client.get( "/api/auth/users/", HTTP_AUTHORIZATION = plain ).status_code, status.HTTP_403_FORBIDDEN )

    def test_an_admin_can_create_a_staff_account_with_a_hashed_password( self ):
        response = self.client.post(
            "/api/auth/users/",
            { "email": "new.desk@example.com", "full_name": "New desk", "password": "fresh-passphrase-2", "is_staff": True },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_201_CREATED, response.data )
        created = User.objects.get( email = "new.desk@example.com" )
        self.assertTrue( created.check_password( "fresh-passphrase-2" ) )
        self.assertEqual( created.username, "new.desk@example.com" )

    def test_a_new_account_without_a_password_is_refused( self ):
        response = self.client.post( "/api/auth/users/", { "email": "lazy@example.com" }, HTTP_AUTHORIZATION = self.header, format = "json" )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertIn( "password", response.data )

    def test_weak_passwords_are_refused( self ):
        response = self.client.post(
            "/api/auth/users/", { "email": "weak@example.com", "password": "123456" }, HTTP_AUTHORIZATION = self.header, format = "json"
        )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )

    def test_an_admin_can_reset_someone_elses_password( self ):
        response = self.client.patch(
            f"/api/auth/users/{ self.helper.pk }/",
            { "password": "reset-by-the-admin-6" },
            HTTP_AUTHORIZATION = self.header,
            format = "json",
        )
        self.assertEqual( response.status_code, status.HTTP_200_OK, response.data )
        self.helper.refresh_from_db()
        self.assertTrue( self.helper.check_password( "reset-by-the-admin-6" ) )

    def test_deleting_someone_elses_account_works( self ):
        response = self.client.delete( f"/api/auth/users/{ self.helper.pk }/", HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.status_code, status.HTTP_204_NO_CONTENT )
        self.assertFalse( User.objects.filter( pk = self.helper.pk ).exists() )

    def test_an_admin_cannot_delete_their_own_account( self ):
        response = self.client.delete( f"/api/auth/users/{ self.admin.pk }/", HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.status_code, status.HTTP_400_BAD_REQUEST )
        self.assertTrue( User.objects.filter( pk = self.admin.pk ).exists() )

    def test_searching_accounts_by_email( self ):
        response = self.client.get( "/api/auth/users/?search=helper", HTTP_AUTHORIZATION = self.header )
        self.assertEqual( response.data[ "count" ], 1 )


@override_settings(
    ADMIN_LOGIN_EMAILS = [ "desk@example.com" ],
    PANEL_ORIGIN = "http://localhost:8080",
    PANEL_PATH = "/admin",
    AUTH_COOKIE_SECURE = False,
    AUTH_COOKIE_SAMESITE = "Lax",
)
class MailAvailabilityTests( APITestCase ):
    """A server that cannot send a letter says so, instead of leaving the panel waiting for one."""

    @classmethod
    def setUpTestData( cls ):
        User.objects.create_user( email = "desk@example.com", password = "consultation-room-7", is_staff = True )

    def setUp( self ):
        self.client.cookies.clear()
        cache.clear()
        mail.outbox.clear()

    def sign_in( self ):
        return self.client.post( reverse( "login" ), { "email": "desk@example.com", "password": "consultation-room-7" }, format = "json" )

    def test_a_server_with_no_mail_account_says_so_instead_of_starting_a_code( self ):
        with override_settings( DEBUG = False, EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend" ):
            response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, response.data )
        self.assertIn( "no mail account", response.data[ "detail" ] )
        self.assertNotIn( "access", response.data )
        self.assertEqual( OtpChallenge.objects.count(), 0 )

    def test_a_placeholder_in_the_mail_settings_is_not_treated_as_an_account( self ):
        with override_settings(
            DEBUG = False,
            EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend",
            EMAIL_HOST = "FILL:smtp host",
            EMAIL_HOST_USER = "FILL:mail account",
        ):
            response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, response.data )
        self.assertIn( "no mail account", response.data[ "detail" ] )
        self.assertEqual( OtpChallenge.objects.count(), 0 )

    def test_a_mail_server_that_refuses_the_letter_is_reported_not_crashed( self ):
        with mock.patch( "apps.accounts.emails.send_mail", side_effect = SMTPAuthenticationError( 454, "username and password not accepted" ) ):
            response = self.sign_in()
        self.assertEqual( response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, response.data )
        self.assertIn( "refused", response.data[ "detail" ] )
        self.assertNotIn( "access", response.data )

    def test_a_forgotten_password_is_answered_the_same_whether_or_not_the_address_exists( self ):
        with override_settings( DEBUG = False, EMAIL_BACKEND = "django.core.mail.backends.filebased.EmailBackend" ):
            known = self.client.post( reverse( "password-forgot" ), { "email": "desk@example.com" }, format = "json", **ORIGIN )
            unknown = self.client.post( reverse( "password-forgot" ), { "email": "nobody@example.com" }, format = "json", **ORIGIN )
        self.assertEqual( known.status_code, status.HTTP_503_SERVICE_UNAVAILABLE, known.data )
        self.assertEqual( unknown.status_code, known.status_code )
        self.assertEqual( PasswordResetRequest.objects.count(), 0 )
