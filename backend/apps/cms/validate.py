"""Everything typed into the CMS is treated as plain text, never as markup."""

import os
import re
from urllib.parse import urlsplit

from django.conf import settings
from django.core.exceptions import SuspiciousFileOperation
from django.utils._os import safe_join

TAG_RE = re.compile( r"</?[a-zA-Z0-9:_-]+(?:\s[^<>]{0,300})?>|<!--.*?-->", re.DOTALL )
CONTROL_RE = re.compile( r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]" )
SCHEME_RE = re.compile( r"^([a-zA-Z][a-zA-Z0-9+.\-]*):" )
ALLOWED_SCHEMES = { "http", "https", "mailto", "tel" }
DANGEROUS_SCHEMES = { "javascript", "data", "vbscript", "file", "blob", "about" }
LINK_KEYS = { "href", "url", "link", "photo_url", "poster_url" }


def strip_markup( value ):
    """No stored word ever becomes a script tag."""

    text = TAG_RE.sub( "", str( value ) )
    text = CONTROL_RE.sub( "", text )
    return text.replace( "‮", "" ).strip()


def scheme_of( text ):
    match = SCHEME_RE.match( text )
    return match.group( 1 ).lower() if match else ""


def safe_link( value ):
    """A link is a path inside the site or an address on one of four allowed schemes."""

    link = strip_markup( value )
    if not link:
        return ""
    if link.startswith( ( "/", "#", "?" ) ):
        return link
    parts = urlsplit( link )
    if parts.scheme.lower() not in ALLOWED_SCHEMES:
        raise ValueError( f"Links must start with https, mailto or tel. { link[: 40 ] }" )
    address = parts.netloc if parts.scheme.lower() in { "http", "https" } else parts.path
    if not address:
        raise ValueError( f"That link has no address: { link[: 40 ] }" )
    return link


def photo_link( value ):
    """A row's picture is either a file this API serves from its own disk or a web address.

    An upload from the panel arrives as a path, which is why this cannot be a plain URL check:
    a field that only accepts addresses refuses every picture added from a computer.
    """

    link = strip_markup( value )
    if not link:
        return ""
    if link.startswith( "/" ):
        return link
    parts = urlsplit( link )
    if parts.scheme.lower() not in { "http", "https" } or not parts.netloc:
        raise ValueError( "Use a picture uploaded from the panel or a full https link to one." )
    return link


def clean_payload( data, key = "" ):
    """Walk an editable page blob and sanitise every string in it."""

    if isinstance( data, dict ):
        return { str( name ): clean_payload( value, str( name ) ) for name, value in data.items() }
    if isinstance( data, ( list, tuple ) ):
        return [ clean_payload( item, key ) for item in data ]
    if isinstance( data, str ):
        text = data.strip()
        scheme = scheme_of( text )
        if scheme in ALLOWED_SCHEMES or ( not scheme and text.startswith( ( "/", "#", "?" ) ) ):
            return safe_link( text )
        if scheme in DANGEROUS_SCHEMES or ( key in LINK_KEYS and scheme ):
            raise ValueError( f"Links must start with https, mailto or tel. { text[: 40 ] }" )
        return strip_markup( data )
    return data


def upload_on_disk( link ):
    """Whether a picture the panel uploaded is still in the uploads folder on this machine."""

    name = urlsplit( link ).path[ len( settings.MEDIA_URL ): ]
    try:
        full = safe_join( str( settings.MEDIA_ROOT ), name )
    except SuspiciousFileOperation:
        return False
    return bool( full ) and os.path.isfile( full )


def drop_missing_uploads( data ):
    """Blank any uploaded picture a page names that is no longer on this server's disk.

    A folder moved between machines, or a redeploy onto a host with its own empty uploads folder,
    leaves a page naming a file that is gone. Sent as it is, the browser draws a broken box. Sent
    as an empty slot, the site shows the photo it shipped with and the panel shows the picture as
    not chosen, so the doctor can pick it again instead of guessing what went wrong.
    """

    if isinstance( data, dict ):
        return { name: drop_missing_uploads( value ) for name, value in data.items() }
    if isinstance( data, ( list, tuple ) ):
        return [ drop_missing_uploads( item ) for item in data ]
    if isinstance( data, str ) and data.startswith( settings.MEDIA_URL ):
        return data if upload_on_disk( data ) else ""
    return data


def uploaded_links( data ):
    """Every string in a page's copy that names a picture this API's own disk holds."""

    if isinstance( data, dict ):
        for value in data.values():
            yield from uploaded_links( value )
    elif isinstance( data, ( list, tuple ) ):
        for value in data:
            yield from uploaded_links( value )
    elif isinstance( data, str ) and data.startswith( settings.MEDIA_URL ):
        yield data


def missing_uploads( data ):
    """The pictures a page names that this machine no longer has."""

    return [ link for link in uploaded_links( data ) if not upload_on_disk( link ) ]
