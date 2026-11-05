"""Turning a request into anonymous numbers."""

import hashlib
from urllib.parse import urlsplit

from django.conf import settings
from django.utils import timezone

from apps.cms.validate import strip_markup

MAX_PATH = 240


def hash_for_today( value ):
    """A salt that changes every day, so rows cannot be stitched into a lasting profile of one person."""

    day = timezone.localdate().isoformat()
    return hashlib.sha256( f"{ settings.SECRET_KEY }:analytics:{ day }:{ value }".encode( "utf-8" ) ).hexdigest()


def classify_device( user_agent ):
    agent = ( user_agent or "" ).lower()
    if "ipad" in agent or ( "tablet" in agent ):
        return "tablet"
    if "android" in agent and "mobile" not in agent:
        return "tablet"
    if any( marker in agent for marker in [ "mobi", "iphone", "ipod", "android" ] ):
        return "mobile"
    return "desktop"


def classify_browser( user_agent ):
    agent = ( user_agent or "" ).lower()
    if "edg/" in agent:
        return "Edge"
    if "opr/" in agent or "opera" in agent:
        return "Opera"
    if "chrome" in agent or "chromium" in agent:
        return "Chrome"
    if "firefox" in agent:
        return "Firefox"
    if "safari" in agent:
        return "Safari"
    return "Other"


def referrer_host( value ):
    if not value:
        return ""
    parts = urlsplit( value )
    host = parts.netloc.lower()
    if host.startswith( "www." ):
        host = host[ 4: ]
    return host[: 120 ]


def clean_path( value ):
    path = ( value or "" ).split( "?" )[ 0 ].split( "#" )[ 0 ].strip()
    path = strip_markup( path )
    if not path.startswith( "/" ):
        path = "/" + path
    return path[: MAX_PATH ]


def tracking_is_refused( request ):
    """Respect a browser that has told the visitor tracking is off."""

    meta = request.META
    return meta.get( "HTTP_DNT" ) == "1" or meta.get( "HTTP_SEC_GPC" ) == "1"
