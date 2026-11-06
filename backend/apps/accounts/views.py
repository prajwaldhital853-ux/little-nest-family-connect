from django.conf import settings
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.audit.services import record
from config.hashing import client_ip, hash_identity

from .emails import (
    MAIL_REFUSED,
    NO_MAIL_ACCOUNT,
    MailNotSent,
    can_send_mail,
    send_otp,
    send_password_reset,
)
from .models import Lockout, OtpChallenge, PasswordResetRequest, TrustedDevice, User
from .security import (
    blacklist,
    clear_otp_cookie,
    describe_device,
    device_token,
    end_session_cookies,
    issue_tokens,
    otp_ref_from_request,
    presented_device,
    refresh_token_from_request,
    require_trusted_origin,
    revoke_every_session,
    set_otp_cookie,
    set_refresh_cookie,
)
from .serializers import (
    ForgotPasswordSerializer,
    LoginInputSerializer,
    OtpInputSerializer,
    PasswordChangeSerializer,
    ResetPasswordSerializer,
    StaffUserSerializer,
    UserSerializer,
)
from .services import (
    create_otp,
    create_reset_request,
    find_device,
    mask_email,
    touch_device,
    trust_device,
)

BAD_CREDENTIALS = { "detail": "Email or password is not correct." }
RESET_EXPIRED = { "detail": "That reset link is not valid, or it has expired." }


def undeliverable( detail ):
    """A mail problem answered as 503, so the panel shows the reason instead of a server crash."""

    return Response( { "detail": detail }, status = status.HTTP_503_SERVICE_UNAVAILABLE )


def session_keys( request, response ):
    """The two identities a block is measured against, and the keyed hash stored instead of the browser token."""

    raw = device_token( request, response )
    return [ client_ip( request ), raw ], hash_identity( raw )


def apply_lock( response, retry_after ):
    """The browser token has to survive the block message, so the same response carries both."""

    minutes = max( 1, round( retry_after / 60 ) )
    response.data = {
        "detail": f"Too many attempts. For safety this device and address are blocked for about { minutes } minute(s).",
        "retry_after": retry_after,
    }
    response.status_code = status.HTTP_429_TOO_MANY_REQUESTS
    response[ "Retry-After" ] = str( retry_after )
    return response


def signed_in_body( user, access ):
    return {
        "otp_required": False,
        "access": access,
        "expires_in": int( settings.SIMPLE_JWT[ "ACCESS_TOKEN_LIFETIME" ].total_seconds() ),
        "user": UserSerializer( user ).data,
    }


class DeviceSerializer( serializers.ModelSerializer ):
    class Meta:
        model = TrustedDevice
        fields = [ "id", "label", "created_at", "last_seen_at" ]
        read_only_fields = fields


class LoginView( APIView ):
    """Password check first, then an emailed code the first time a device is seen."""

    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "login"

    def post( self, request ):
        serializer = LoginInputSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )
        email = serializer.validated_data[ "email" ]
        password = serializer.validated_data[ "password" ]

        response = Response()
        identities, device = session_keys( request, response )

        blocked = Lockout.blocked_on( Lockout.LOGIN, identities )
        if blocked:
            record( "login.locked", request = request, detail = { "email": email } )
            return apply_lock( response, blocked )

        user = authenticate( request = request, username = email, password = password )
        # The staff accounts the panel lists are the door to the panel, so an account added there
        # can sign in with its own password and its own emailed code. ADMIN_LOGIN_EMAILS names only
        # the first account to create; it has never been a list of everyone allowed in.
        if user is None or not user.is_staff or not user.is_active:
            retry = Lockout.register_failure( Lockout.LOGIN, identities, email )
            record( "login.failed", request = request, detail = { "email": email } )
            if retry:
                return apply_lock( response, retry )
            response.data = BAD_CREDENTIALS
            response.status_code = status.HTTP_400_BAD_REQUEST
            return response

        Lockout.clear( Lockout.LOGIN, identities )
        known = find_device( user, device )
        if known is None and settings.OTP_REQUIRED:
            if not can_send_mail():
                record( "login.mail_unavailable", actor = user )
                return undeliverable( NO_MAIL_ACCOUNT )
            challenge, code = create_otp( user, device = device )
            try:
                send_otp( user, challenge, code )
            except MailNotSent:
                record( "login.mail_refused", actor = user )
                return undeliverable( MAIL_REFUSED )
            set_otp_cookie( response, challenge.ref )
            record( "login.otp_sent", actor = user, detail = { "device": describe_device( request ) } )
            response.data = {
                "otp_required": True,
                "email": mask_email( user.email ),
                "expires_in": settings.OTP_TTL_MINUTES * 60,
            }
            return response

        if known is None:
            # The code step switched off on purpose: the password carried this browser in, so it is
            # remembered as trusted and a later switch back to codes does not lock him out.
            known = trust_device( user, device, label = describe_device( request ), ip_hash = hash_identity( client_ip( request ) ) )
            record( "login.device_trusted_without_a_code", actor = user, target = known, target_label = known.label )

        touch_device( known )
        refresh, access = issue_tokens( user )
        set_refresh_cookie( response, refresh )
        clear_otp_cookie( response )
        record( "login.success", actor = user, target = known, target_label = known.label )
        response.data = signed_in_body( user, access )
        return response


class OtpVerifyView( APIView ):
    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "otp"

    def post( self, request ):
        require_trusted_origin( request )
        serializer = OtpInputSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )

        response = Response()
        _, device = session_keys( request, response )
        challenge = OtpChallenge.objects.filter( ref = otp_ref_from_request( request ) ).select_related( "user" ).first()

        if challenge is None or challenge.device_hash != device or not challenge.is_open:
            clear_otp_cookie( response )
            response.data = { "detail": "That code is no longer usable. Please sign in again." }
            response.status_code = status.HTTP_400_BAD_REQUEST
            return response

        if not challenge.check_code( serializer.validated_data[ "code" ] ):
            challenge.attempts += 1
            challenge.save( update_fields = [ "attempts" ] )
            record( "otp.failed", actor = challenge.user, detail = { "attempts": challenge.attempts } )
            response.data = { "detail": "That code is not correct." }
            response.status_code = status.HTTP_400_BAD_REQUEST
            return response

        challenge.verified_at = timezone.now()
        challenge.save( update_fields = [ "verified_at" ] )
        trust_device( challenge.user, device, label = describe_device( request ), ip_hash = hash_identity( client_ip( request ) ) )
        refresh, access = issue_tokens( challenge.user )
        set_refresh_cookie( response, refresh )
        clear_otp_cookie( response )
        record( "otp.verified", actor = challenge.user, detail = { "device": describe_device( request ) } )
        response.data = signed_in_body( challenge.user, access )
        return response


class PanelTokenRefreshView( TokenRefreshView ):
    """Rotation lives here, so a copied cookie is dead once the real browser refreshes."""

    permission_classes = [ AllowAny ]
    authentication_classes = []
    serializer_class = TokenRefreshSerializer

    def post( self, request, *args, **kwargs ):
        require_trusted_origin( request )
        raw = refresh_token_from_request( request )
        if not raw:
            return Response( { "detail": "No signed in session on this browser." }, status = status.HTTP_401_UNAUTHORIZED )

        serializer = self.get_serializer( data = { "refresh": raw } )
        try:
            serializer.is_valid( raise_exception = True )
        except TokenError:
            response = Response( { "detail": "Your session has ended. Please sign in again." }, status = status.HTTP_401_UNAUTHORIZED )
            end_session_cookies( response )
            return response

        # Removing a device has to stop that browser for real, so an unremembered one cannot refresh.
        user_id = AccessToken( serializer.validated_data[ "access" ] ).get( "user_id" )
        if user_id is None or find_device( user_id, hash_identity( presented_device( request ) ) ) is None:
            ended = Response( { "detail": "This device is no longer remembered. Please sign in again." }, status = status.HTTP_401_UNAUTHORIZED )
            end_session_cookies( ended )
            return ended

        # The name, the email and whether this is a staff account travel with the new token, so
        # opening the panel is one round trip rather than a refresh and then a question about who
        # the refresh belongs to.
        account = User.objects.filter( pk = user_id ).first()
        if account is None:
            ended = Response( { "detail": "Your session has ended. Please sign in again." }, status = status.HTTP_401_UNAUTHORIZED )
            end_session_cookies( ended )
            return ended

        response = Response( {
            "access": serializer.validated_data[ "access" ],
            "expires_in": int( settings.SIMPLE_JWT[ "ACCESS_TOKEN_LIFETIME" ].total_seconds() ),
            "user": UserSerializer( account ).data,
        } )
        rotated = serializer.validated_data.get( "refresh" )
        if rotated:
            set_refresh_cookie( response, rotated )
        return response


class LogoutView( APIView ):
    permission_classes = [ AllowAny ]
    authentication_classes = []

    def post( self, request ):
        require_trusted_origin( request )
        raw = refresh_token_from_request( request )
        if raw:
            try:
                blacklist( raw )
            except TokenError:
                pass
        response = Response( { "detail": "Signed out." } )
        end_session_cookies( response )
        return response


class CurrentUserView( RetrieveUpdateAPIView ):
    permission_classes = [ IsAuthenticated ]
    serializer_class = UserSerializer

    def get_object( self ):
        return self.request.user


class TrustedDeviceListView( APIView ):
    permission_classes = [ IsAuthenticated ]

    def get( self, request ):
        return Response( DeviceSerializer( TrustedDevice.objects.filter( user = request.user ), many = True ).data )


class TrustedDeviceDeleteView( APIView ):
    permission_classes = [ IsAuthenticated ]

    def delete( self, request, pk ):
        device = TrustedDevice.objects.filter( user = request.user, pk = pk ).first()
        if device is None:
            raise ValidationError( { "detail": [ "That device is not on your account." ] } )
        label = device.label
        device.delete()
        record( "device.revoked", request = request, target_label = label, detail = { "device": pk } )
        return Response( { "detail": "Device removed. It will need a code again." } )


class PasswordChangeView( APIView ):
    permission_classes = [ IsAuthenticated ]

    def post( self, request ):
        serializer = PasswordChangeSerializer( data = request.data, context = { "request": request } )
        serializer.is_valid( raise_exception = True )
        serializer.save()
        record( "password.changed", request = request, target = request.user )
        return Response( { "detail": "Password changed. Other sessions are signed out." } )


class ForgotPasswordView( APIView ):
    """The same three tries and five minute block as the sign-in page, whichever address is asked about."""

    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "reset"

    def post( self, request ):
        serializer = ForgotPasswordSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )
        email = serializer.validated_data[ "email" ]

        response = Response( { "detail": "If that address has a panel account, a reset link is on its way." } )
        identities, _ = session_keys( request, response )

        blocked = Lockout.blocked_on( Lockout.RESET, identities )
        if blocked:
            return apply_lock( response, blocked )

        retry = Lockout.register_failure( Lockout.RESET, identities, email )
        if retry:
            return apply_lock( response, retry )

        # Asked before the account is looked up: answering only for addresses that exist would
        # tell a stranger which ones do.
        if not can_send_mail():
            record( "password.reset_mail_unavailable", request = request, detail = { "email": email } )
            return undeliverable( NO_MAIL_ACCOUNT )

        user = User.objects.filter( email = email, is_staff = True, is_active = True ).first()
        if user:
            reset, link_token = create_reset_request( email )
            try:
                send_password_reset( email, reset, link_token )
            except MailNotSent:
                record( "password.reset_mail_refused", actor = user, target = user )
                return undeliverable( MAIL_REFUSED )
            record( "password.reset_requested", actor = user, target = user )
        return response


class ResetPasswordView( APIView ):
    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "reset"

    def post( self, request ):
        serializer = ResetPasswordSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )
        email = serializer.validated_data[ "email" ]

        response = Response()
        identities, _ = session_keys( request, response )

        blocked = Lockout.blocked_on( Lockout.RESET, identities )
        if blocked:
            return apply_lock( response, blocked )

        candidate = PasswordResetRequest.objects.filter( email = email ).order_by( "-created_at" ).first()
        user = User.objects.filter( email = email, is_staff = True ).first()
        if candidate is None or user is None or not candidate.is_open or not candidate.check_token( serializer.validated_data[ "token" ] ):
            record( "password.reset_failed", request = request, detail = { "email": email } )
            retry = Lockout.register_failure( Lockout.RESET, identities, email )
            if retry:
                return apply_lock( response, retry )
            response.data = RESET_EXPIRED
            response.status_code = status.HTTP_400_BAD_REQUEST
            return response

        user.set_password( serializer.validated_data[ "password" ] )
        user.save( update_fields = [ "password" ] )
        candidate.used_at = timezone.now()
        candidate.save( update_fields = [ "used_at" ] )
        revoke_every_session( user )
        # A reset is the moment to forget every browser, so the next sign-in has to prove the email again.
        TrustedDevice.objects.filter( user = user ).delete()
        Lockout.clear( Lockout.RESET, identities )
        record( "password.reset_used", actor = user, target = user )
        response.data = { "detail": "Password changed. Sign in with the new password." }
        return response


class StaffUserViewSet( viewsets.ModelViewSet ):
    """Staff accounts are created, edited and revoked here, never on the public site."""

    permission_classes = [ IsAdminUser ]
    serializer_class = StaffUserSerializer
    queryset = User.objects.all().order_by( "email" )
    search_fields = [ "email", "full_name", "job_title" ]
    ordering_fields = [ "email", "date_joined", "last_login" ]

    def perform_create( self, serializer ):
        user = serializer.save()
        record( "staff.created", request = self.request, target = user )
        return user

    def perform_update( self, serializer ):
        before = { field: getattr( serializer.instance, field ) for field in [ "email", "full_name", "job_title", "is_staff", "is_active" ] }
        user = serializer.save()
        after = { field: getattr( user, field ) for field in before }
        changed = { key: { "from": before[ key ], "to": after[ key ] } for key in before if before[ key ] != after[ key ] }
        record( "staff.updated", request = self.request, target = user, detail = changed )
        return user

    def perform_destroy( self, instance ):
        if instance == self.request.user:
            raise ValidationError( { "detail": "You cannot remove your own account." } )
        record( "staff.deleted", request = self.request, target_label = instance.email, detail = { "email": instance.email } )
        instance.delete()
