"""Shared helpers for talking about a visitor without storing raw personal data."""

import hashlib

from django.conf import settings


def hash_identity( value ) -> str:
    """A keyed hash, so a stored value cannot be read back or matched against a list of known addresses."""

    if value is None:
        return ""
    return hashlib.sha256( f"{ settings.SECRET_KEY }:{ value }".encode( "utf-8" ) ).hexdigest()


def client_ip( request ) -> str:
    """The address to rate limit against, honouring the proxy header only when it is trusted."""

    if getattr( settings, "USE_X_FORWARDED_FOR", False ):
        forwarded = request.META.get( "HTTP_X_FORWARDED_FOR", "" )
        if forwarded:
            return forwarded.split( "," )[ 0 ].strip()
    return request.META.get( "REMOTE_ADDR", "" ) or ""
