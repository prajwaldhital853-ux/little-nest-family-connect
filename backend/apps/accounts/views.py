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

from .emails import send_device_request_mail, send_otp, send_password_reset
from .models import DeviceRequest, Lockout, OtpChallenge, PasswordResetRequest, TrustedDevice, User
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
    announce_device,
    create_otp,
    create_reset_request,
    decide_device,
    find_device,
    mask_email,
    touch_device,
    trust_device,
)

BAD_CREDENTIALS = { "detail": "Email or password is not correct." }
RESET_EXPIRED = { "detail": "That reset link is not valid, or it has expired." }


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


class DeviceDetailsSerializer( serializers.Serializer ):
    """What a browser is asked to say about itself. Every part is optional and none is trusted."""

    platform = serializers.CharField( required = False, allow_blank = True, max_length = 80 )
    screen = serializers.CharField( required = False, allow_blank = True, max_length = 40 )
    language = serializers.CharField( required = False, allow_blank = True, max_length = 40 )
    timezone = serializers.CharField( required = False, allow_blank = True, max_length = 64 )
    touch = serializers.BooleanField( required = False, default = False )


class DeviceRequestSerializer( serializers.ModelSerializer ):
    name = serializers.CharField( read_only = True )

    class Meta:
        model = DeviceRequest
        fields = [
            "id", "status", "name", "browser", "platform", "screen", "language",
            "timezone_name", "touch", "note", "created_at", "last_seen_at", "decided_at",
        ]
        read_only_fields = fields


class DeviceAccessView( APIView ):
    """A browser opening the panel says so here, before anyone types a password."""

    permission_classes = [ AllowAny ]
    authentication_classes = []
    throttle_classes = [ ScopedRateThrottle ]
    throttle_scope = "device"

    def post( self, request ):
        require_trusted_origin( request )
        details = DeviceDetailsSerializer( data = request.data if isinstance( request.data, dict ) else {} )
        details.is_valid( raise_exception = True )

        response = Response()
        raw = device_token( request, response )
        row, created = announce_device( request, hash_identity( raw ), details.validated_data )
        if created:
            record( "device.announced", request = request, target = row, detail = { "status": row.status } )
            if row.status == DeviceRequest.Status.PENDING:
                send_device_request_mail( row )
        response.data = { "status": row.status, "name": row.name, "asked_at": row.created_at }
        return response

    def get( self, request ):
        """The wait screen asks this every so often, so an approval lands without a reload."""

        response = Response()
        raw = presented_device( request )
        if len( raw ) != 40:
            response.data = { "status": DeviceRequest.Status.PENDING, "known": False }
            return response
        row = DeviceRequest.objects.filter( device_hash = hash_identity( raw ) ).first()
        if row is None:
            response.data = { "status": DeviceRequest.Status.PENDING, "known": False }
            return response
        row.last_seen_at = timezone.now()
        row.save( update_fields = [ "last_seen_at" ] )
        response.data = { "status": row.status, "name": row.name, "asked_at": row.created_at, "known": True }
        return response


class DeviceRequestListView( APIView ):
    """Everything that has opened the panel, newest first, so a strange browser is easy to spot."""

    permission_classes = [ IsAuthenticated ]

    def get( self, request ):
        rows = DeviceRequest.objects.all()
        status_wanted = request.query_params.get( "status", "" )
        if status_wanted in DeviceRequest.Status.values:
            rows = rows.filter( status = status_wanted )
        return Response( DeviceRequestSerializer( rows[: 100 ], many = True ).data )


class DeviceRequestDecisionView( APIView ):
    """Allow, block or forget one browser from the list on the account page."""

    permission_classes = [ IsAuthenticated ]

    def post( self, request, pk ):
        row = DeviceRequest.objects.filter( pk = pk ).first()
        if row is None:
            raise ValidationError( { "detail": [ "That device request is no longer here." ] } )
        action = ( request.data.get( "action" ) or "" ).strip().lower()
        if action not in { DeviceRequest.Status.ALLOWED, DeviceRequest.Status.BLOCKED }:
            raise ValidationError( { "action": [ "Choose allow or block." ] } )
        note = str( request.data.get( "note" ) or "" ).strip()[: 200 ]
        if note:
            row.note = note
            row.save( update_fields = [ "note" ] )
        row = decide_device( row, request.user, action )
        record( f"device.{ action }", request = request, target_label = row.name, detail = { "device": row.pk } )
        return Response( DeviceRequestSerializer( row ).data )

    def delete( self, request, pk ):
        row = DeviceRequest.objects.filter( pk = pk ).first()
        if row is None:
            raise ValidationError( { "detail": [ "That device request is no longer here." ] } )
        name = row.name
        row.delete()
        record( "device.forgotten", request = request, target_label = name, detail = { "device": pk } )
        return Response( { "detail": "Removed from the list. If it opens the panel again it asks once more." } )


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

        # A device the doctor turned down is refused before the password is even looked at.
        asked = DeviceRequest.objects.filter( device_hash = device ).first()
        if asked is not None and asked.status == DeviceRequest.Status.BLOCKED:
            record( "login.blocked_device", request = request, detail = { "email": email } )
            response.data = { "detail": "This device is not allowed on the panel. Allow it from a device you already use." }
            response.status_code = status.HTTP_403_FORBIDDEN
            return response

        user = authenticate( request = request, username = email, password = password )
        if user is None or not user.is_staff or not user.is_active or email not in settings.ADMIN_LOGIN_EMAILS:
            retry = Lockout.register_failure( Lockout.LOGIN, identities, email )
            record( "login.failed", request = request, detail = { "email": email } )
            if retry:
                return apply_lock( response, retry )
            response.data = BAD_CREDENTIALS
            response.status_code = status.HTTP_400_BAD_REQUEST
            return response

        Lockout.clear( Lockout.LOGIN, identities )
        known = find_device( user, device )
        if known is None:
            challenge, code = create_otp( user, device = device )
            send_otp( user, challenge, code )
            set_otp_cookie( response, challenge.ref )
            record( "login.otp_sent", actor = user, detail = { "device": describe_device( request ) } )
            response.data = {
                "otp_required": True,
                "email": mask_email( user.email ),
                "expires_in": settings.OTP_TTL_MINUTES * 60,
            }
            return response

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

        if DeviceRequest.objects.filter( device_hash = device, status = DeviceRequest.Status.BLOCKED ).exists():
            clear_otp_cookie( response )
            response.data = { "detail": "This device is not allowed on the panel. Allow it from a device you already use." }
            response.status_code = status.HTTP_403_FORBIDDEN
            return response

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

        response = Response( { "access": serializer.validated_data[ "access" ] } )
        # Removing a device has to stop that browser for real, so an unremembered one cannot refresh.
        user_id = AccessToken( serializer.validated_data[ "access" ] ).get( "user_id" )
        if user_id is None or find_device( user_id, hash_identity( presented_device( request ) ) ) is None:
            ended = Response( { "detail": "This device is no longer remembered. Please sign in again." }, status = status.HTTP_401_UNAUTHORIZED )
            end_session_cookies( ended )
            return ended

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

        user = User.objects.filter( email = email, is_staff = True, is_active = True ).first()
        if user:
            reset, link_token = create_reset_request( email )
            send_password_reset( email, reset, link_token )
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
