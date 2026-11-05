"""The pieces of the sign-in flow that are worth naming."""

import hashlib
import secrets
import string
from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.utils import timezone

from .models import OtpChallenge, PasswordResetRequest, TrustedDevice


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


def create_reset_request( email ):
    token = secrets.token_urlsafe( 32 )
    request = PasswordResetRequest.objects.create(
        email = email,
        token_hash = hashlib.sha256( token.encode( "utf-8" ) ).hexdigest(),
        expires_at = timezone.now() + timedelta( minutes = settings.PASSWORD_RESET_MINUTES ),
    )
    PasswordResetRequest.objects.filter( email = email ).exclude( pk = request.pk ).delete()
    return request, token
