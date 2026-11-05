"""The pieces of the sign-in flow that are worth naming."""

import hashlib
import secrets
import string
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.utils import timezone

from config.hashing import client_ip, hash_identity

from .models import DeviceRequest, OtpChallenge, PasswordResetRequest, TrustedDevice
from .security import describe_device


def mask_email( email ):
    """Something to show on screen without confirming a second address exists."""

    name, _, domain = email.partition( "@" )
    if len( name ) < 2:
        return f"{ name }@{ domain }"
    return f"{ name[ 0 ] }{'*' * ( len( name ) - 2 )}{ name[ -1 ] }@{ domain }"


def new_code():
    """Six random digits. On a development machine, where no mail is delivered, a known one."""

    fixed = settings.OTP_FIXED_CODE
    if settings.DEBUG and len( fixed ) == 6 and fixed.isdigit():
        return fixed
    return "".join( secrets.choice( string.digits ) for _ in range( 6 ) )


def create_otp( user, *, device ):
    """Six digits, stored hashed, valid for a few minutes and a handful of tries."""

    code = new_code()
    challenge = OtpChallenge.objects.create(
        user = user,
        ref = secrets.token_hex( 20 ),
        code_hash = make_password( code ),
        device_hash = device,
        expires_at = timezone.now() + timedelta( minutes = settings.OTP_TTL_MINUTES ),
    )
    OtpChallenge.objects.filter( user = user ).exclude( pk = challenge.pk ).exclude( verified_at__isnull = False ).delete()
    return challenge, code


def find_device( user, device_hash ):
    return TrustedDevice.objects.filter( user = user, device_hash = device_hash ).first()


def touch_device( device ):
    device.last_seen_at = timezone.now()
    device.save( update_fields = [ "last_seen_at" ] )


def trust_device( user, device_hash, *, label, ip_hash ):
    return TrustedDevice.objects.update_or_create(
        user = user,
        device_hash = device_hash,
        defaults = { "label": label, "ip_hash": ip_hash, "last_seen_at": timezone.now() },
    )[ 0 ]


def clamp( value, length ) -> str:
    """A word the browser was asked for, trimmed to the column it lands in."""

    return str( value or "" ).strip()[: length ]


def announce_device( request, device_hash, details = None ):
    """One row per browser. An allowed device stays allowed when it comes back and asks again."""

    details = details or {}
    # A browser that has already typed an emailed code is not a stranger, so it joins the list as
    # allowed. Without this the doctor's own laptop would be asked for approval the first time.
    known = TrustedDevice.objects.filter( device_hash = device_hash ).exists()
    row, created = DeviceRequest.objects.get_or_create(
        device_hash = device_hash,
        defaults = {
            "status": DeviceRequest.Status.ALLOWED if known else DeviceRequest.Status.PENDING,
            "decided_at": timezone.now() if known else None,
            "browser": describe_device( request ),
            "platform": clamp( details.get( "platform" ), 80 ),
            "screen": clamp( details.get( "screen" ), 40 ),
            "language": clamp( details.get( "language" ), 40 ),
            "timezone_name": clamp( details.get( "timezone" ), 64 ),
            "touch": bool( details.get( "touch" ) ),
            "ip_hash": hash_identity( client_ip( request ) ),
        },
    )
    if created:
        return row, True
    row.last_seen_at = timezone.now()
    row.ip_hash = hash_identity( client_ip( request ) )
    fields = [ "last_seen_at", "ip_hash" ]
    # A browser that signed in with a code since it first knocked has proved itself, so it stops
    # counting as a request waiting to be decided.
    if row.status == DeviceRequest.Status.PENDING and known:
        row.status = DeviceRequest.Status.ALLOWED
        row.decided_at = timezone.now()
        fields += [ "status", "decided_at" ]
    row.save( update_fields = fields )
    return row, False


def decide_device( row, actor, action ):
    """Allowing also writes the trusted device the sign-in looks for, so an approved browser is not emailed a code.

    Blocking forgets the browser everywhere and cuts the remembered session, so a device that was
    allowed by mistake stops refreshing its token.
    """

    if action == DeviceRequest.Status.ALLOWED:
        trust_device( actor, row.device_hash, label = clamp( row.note or row.name, 160 ), ip_hash = row.ip_hash )
    elif action == DeviceRequest.Status.BLOCKED:
        TrustedDevice.objects.filter( device_hash = row.device_hash ).delete()
    row.status = action
    row.decided_at = timezone.now()
    row.decided_by = actor
    row.save( update_fields = [ "status", "decided_at", "decided_by" ] )
    return row


def create_reset_request( email ):
    token = secrets.token_urlsafe( 32 )
    request = PasswordResetRequest.objects.create(
        email = email,
        token_hash = hashlib.sha256( token.encode( "utf-8" ) ).hexdigest(),
        expires_at = timezone.now() + timedelta( minutes = settings.PASSWORD_RESET_MINUTES ),
    )
    PasswordResetRequest.objects.filter( email = email ).exclude( pk = request.pk ).delete()
    return request, token
