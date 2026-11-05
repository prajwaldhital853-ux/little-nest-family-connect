"""Rate limits for the endpoints the public site calls without signing in."""

from rest_framework.throttling import ScopedRateThrottle


class PublicFeedThrottle( ScopedRateThrottle ):
    """One address may ask for a great many pages, but not an unlimited number.

    The ceiling is deliberately loose, so a family browsing on a shared mobile address
    never sees it, while a script that walks the whole corpus does. An editor with a
    token is not a scraper, so their reads are not counted at all.
    """

    scope = "public_feed"

    def get_ident( self, request ):
        if getattr( request.user, "is_staff", False ):
            return None
        return super().get_ident( request )
