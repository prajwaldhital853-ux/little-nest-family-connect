"""Request level session helpers: cookies, device identity, origin checks and token issuing."""

import secrets
from urllib.parse import urlsplit

from django.conf import settings
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken

from config.hashing import hash_identity


def _set_cookie( response, name, value, max_age ):
    response.set_cookie(
        name,
        value,
        max_age = max_age,
        path = settings.AUTH_COOKIE_PATH,
        domain = settings.AUTH_COOKIE_DOMAIN,
        secure = settings.AUTH_COOKIE_SECURE,
        httponly = True,
        samesite = settings.AUTH_COOKIE_SAMESITE,
    )


def _drop_cookie( response, name ):
    response.delete_cookie( name, path = settings.AUTH_COOKIE_PATH, domain = settings.AUTH_COOKIE_DOMAIN )


def device_token( request, response ) -> str:
    """A server issued id for this browser, so a lockout cannot be dodged by changing a header."""

    raw = request.COOKIES.get( settings.DEVICE_COOKIE_NAME, "" )
    if len( raw ) != 40:
        raw = secrets.token_hex( 20 )
    _set_cookie( response, settings.DEVICE_COOKIE_NAME, raw, 60 * 60 * 24 * 400 )
    return raw


def set_refresh_cookie( response, token ):
    _set_cookie( response, settings.REFRESH_COOKIE_NAME, token, settings.SIMPLE_JWT[ "REFRESH_TOKEN_LIFETIME" ].total_seconds() )


def set_otp_cookie( response, ref ):
    _set_cookie( response, settings.OTP_COOKIE_NAME, ref, settings.OTP_TTL_MINUTES * 60 )


def clear_otp_cookie( response ):
    _drop_cookie( response, settings.OTP_COOKIE_NAME )


def end_session_cookies( response ):
    _drop_cookie( response, settings.REFRESH_COOKIE_NAME )
    _drop_cookie( response, settings.OTP_COOKIE_NAME )


def refresh_token_from_request( request ) -> str:
    return request.COOKIES.get( settings.REFRESH_COOKIE_NAME, "" )


def presented_device( request ) -> str:
    """The browser token as it arrived, without issuing a fresh one."""

    return request.COOKIES.get( settings.DEVICE_COOKIE_NAME, "" )


def otp_ref_from_request( request ) -> str:
    return request.COOKIES.get( settings.OTP_COOKIE_NAME, "" )


def issue_tokens( user ):
    """A pair bound to this account, with the profile copied into the claims for the panel header."""

    refresh = RefreshToken.for_user( user )
    refresh[ "email" ] = user.email
    refresh[ "full_name" ] = user.full_name or user.email
    refresh[ "is_staff" ] = user.is_staff
    return str( refresh ), str( refresh.access_token )


def revoke_every_session( user ):
    for outstanding in OutstandingToken.objects.filter( user = user ):
        BlacklistedToken.objects.get_or_create( token = outstanding )


def blacklist( token_string ):
    RefreshToken( token_string ).blacklist()


def origin_of( request ) -> str:
    origin = request.META.get( "HTTP_ORIGIN", "" )
    if origin:
        return origin.rstrip( "/" )
    referer = request.META.get( "HTTP_REFERER", "" )
    if not referer:
        return ""
    parts = urlsplit( referer )
    if not parts.scheme or not parts.netloc:
        return ""
    return f"{ parts.scheme }://{ parts.netloc }"


def is_trusted_origin( request ) -> bool:
    origin = origin_of( request )
    if not origin:
        return False
    if origin in set( settings.TRUSTED_AUTH_ORIGINS ):
        return True
    return origin == f"{ request.scheme }://{ request.get_host() }"


def require_trusted_origin( request ):
    """Cookie backed calls must come from the panel, which is what stops another site borrowing the session."""

    if not is_trusted_origin( request ):
        raise PermissionDenied( "This request was not sent from the clinic panel." )


def describe_device( request ) -> str:
    return ( request.META.get( "HTTP_USER_AGENT", "" ) )[: 160 ] or "Unknown browser"
