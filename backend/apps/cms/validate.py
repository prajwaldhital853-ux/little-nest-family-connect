"""Everything typed into the CMS is treated as plain text, never as markup."""

import re
from urllib.parse import urlsplit

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
