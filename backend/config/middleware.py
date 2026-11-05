"""Response headers the API adds on top of Django's own security middleware."""

API_CSP = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"

# The Django admin needs its own static files and inline styles, so it gets a narrower but usable policy.
ADMIN_CSP = (
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; "
    "connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'"
)

PERMISSIONS_POLICY = "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()"


class SecurityHeadersMiddleware:
    def __init__( self, get_response ):
        self.get_response = get_response

    def __call__( self, request ):
        response = self.get_response( request )
        path = request.path

        response[ "X-Content-Type-Options" ] = "nosniff"
        response[ "X-Frame-Options" ] = "DENY"
        response[ "Referrer-Policy" ] = "same-origin"
        response[ "Permissions-Policy" ] = PERMISSIONS_POLICY
        response[ "Cross-Origin-Opener-Policy" ] = "same-origin"

        if path.startswith( "/admin/" ):
            response[ "Content-Security-Policy" ] = ADMIN_CSP
        else:
            response[ "Content-Security-Policy" ] = API_CSP

        if path.startswith( "/api/auth/" ):
            response[ "Cache-Control" ] = "no-store, private"
            response[ "Pragma" ] = "no-cache"

        return response
