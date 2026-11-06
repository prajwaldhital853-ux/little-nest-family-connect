"""Django settings for the Ramesh Kandel portfolio backend."""

import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import unquote, urlsplit

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env( name, default = "" ):
    return os.getenv( name, default )


def env_bool( name, default = False ):
    raw = os.getenv( name )
    if raw is None:
        return default
    return raw.strip().lower() in { "1", "true", "yes", "on" }


def env_list( name, default = "" ):
    return [ part.strip() for part in env( name, default ).split( "," ) if part.strip() ]


def timedelta_setting( name, default_minutes ):
    return timedelta( minutes = int( env( name, str( default_minutes ) ) ) )


def parse_database_url( value ):
    """One string from the hosting dashboard, taken apart into the parts Django wants.

    Render, Fly and Heroku all hand over DATABASE_URL with the password their machine was given,
    so a deploy needs no other database setting. The query string travels with it there
    (sslmode=require on an address from outside the region), and Django wants it as OPTIONS.
    """

    parts = urlsplit( value )
    if parts.scheme.lower().split( "+" )[ 0 ] not in { "postgres", "postgresql" }:
        raise ImproperlyConfigured( "DATABASE_URL has to point at a postgres database." )
    if not parts.hostname:
        raise ImproperlyConfigured( "DATABASE_URL has no address in it." )
    name = unquote( parts.path.lstrip( "/" ) )
    if not name:
        raise ImproperlyConfigured( "DATABASE_URL has no database name in it." )
    options = {}
    for pair in parts.query.split( "&" ):
        if pair:
            key, _, value = pair.partition( "=" )
            options[ unquote( key ) ] = unquote( value )
    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": name,
        "USER": unquote( parts.username or "" ),
        "PASSWORD": unquote( parts.password or "" ),
        "HOST": parts.hostname,
        "PORT": str( parts.port or 5432 ),
        "CONN_MAX_AGE": int( env( "POSTGRES_CONN_MAX_AGE", "60" ) ),
        "OPTIONS": options,
    }


SECRET_KEY = env( "DJANGO_SECRET_KEY" )
if not SECRET_KEY:
    raise ImproperlyConfigured( "DJANGO_SECRET_KEY is not set. Copy .env.example to .env and fill it in." )

DEBUG = env_bool( "DJANGO_DEBUG", False )
# A development machine is reached by name and by network address, because a phone on the same
# wifi opens the panel through the site's address and every call then carries that address.
ALLOWED_HOSTS = env_list( "DJANGO_ALLOWED_HOSTS", "*" if DEBUG else "localhost,127.0.0.1" )

# The address to make first on a database that has no accounts yet. Who may sign in is decided by
# the staff tick on the account, not by this list: the panel's Staff accounts page is the door.
ADMIN_LOGIN_EMAILS = [ email.strip().lower() for email in env_list( "ADMIN_LOGIN_EMAILS", "drameshkandel@gmail.com" ) ]

DJANGO_ADMIN_ENABLED = env_bool( "DJANGO_ADMIN_ENABLED", False )

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "apps.accounts",
    "apps.appointments",
    "apps.cms",
    "apps.audit",
    "apps.analytics",
]

if DJANGO_ADMIN_ENABLED:
    INSTALLED_APPS.insert( 0, "django.contrib.admin" )

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
TEST_RUNNER = "config.test_runner.EmailInlineRunner"

if env( "DB_ENGINE", "postgresql" ).strip().lower() == "sqlite":
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
elif env( "DATABASE_URL" ):
    DATABASES = { "default": parse_database_url( env( "DATABASE_URL" ) ) }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env( "POSTGRES_DB", "kandel_cms" ),
            "USER": env( "POSTGRES_USER", "kandel" ),
            "PASSWORD": env( "POSTGRES_PASSWORD" ),
            "HOST": env( "POSTGRES_HOST", "127.0.0.1" ),
            "PORT": env( "POSTGRES_PORT", "5432" ),
            "CONN_MAX_AGE": int( env( "POSTGRES_CONN_MAX_AGE", "60" ) ),
        }
    }

AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    { "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator" },
    { "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": { "min_length": 10 } },
    { "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator" },
    { "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator" },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = env( "DJANGO_TIME_ZONE", "Asia/Kathmandu" )
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# WhiteNoise serves what collectstatic gathers, so the API does not need a second host for its
# own files. The hashed name a collected file is given is what lets a browser keep it for a year,
# and development collects nothing, so it must not be asked for names that never exist.
STORAGES = {
    "default": { "BACKEND": "django.core.files.storage.FileSystemStorage" },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"
        if DEBUG
        else "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# Pictures the doctor uploads from the panel. Relative URLs, so each front end decides where
# they live: the dev servers forward /media here, and the deployed host has to as well.
MEDIA_URL = env( "MEDIA_URL", "/media/" )
MEDIA_ROOT = Path( env( "MEDIA_ROOT", str( BASE_DIR / "media" ) ) )
UPLOAD_MAX_BYTES = int( env( "UPLOAD_MAX_BYTES", str( 6 * 1024 * 1024 ) ) )

# A picture at the allowed size is kept whole in memory instead of being written to a temporary
# file and read back, which is the difference between one disk trip and two on every upload.
FILE_UPLOAD_MAX_MEMORY_SIZE = int( env( "FILE_UPLOAD_MAX_MEMORY_SIZE", str( 8 * 1024 * 1024 ) ) )

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.PanelPagination",
    "PAGE_SIZE": int( env( "API_PAGE_SIZE", "20" ) ),
    "DEFAULT_FILTER_BACKENDS": (
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    # Scopes are set per endpoint, so a busy visitor cannot be starved by a shared office address.
    "DEFAULT_THROTTLE_CLASSES": (),
    "DEFAULT_THROTTLE_RATES": {
        "appointment": env( "THROTTLE_APPOINTMENT", "20/day" ),
        "login": env( "THROTTLE_LOGIN", "10/min" ),
        "otp": env( "THROTTLE_OTP", "6/min" ),
        "reset": env( "THROTTLE_RESET", "6/min" ),
        "public_feed": env( "THROTTLE_PUBLIC_FEED", "2000/hour" ),
        "collect": env( "THROTTLE_COLLECT", "60/min" ),
    },
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
}

# The browsable API renders HTML with inline scripts, so it is only ever available while developing.
if not DEBUG:
    REST_FRAMEWORK[ "DEFAULT_RENDERER_CLASSES" ] = ( "rest_framework.renderers.JSONRenderer", )

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta( minutes = int( env( "JWT_ACCESS_MINUTES", "15" ) ) ),
    "REFRESH_TOKEN_LIFETIME": timedelta( days = int( env( "JWT_REFRESH_DAYS", "7" ) ) ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": env( "JWT_SIGNING_KEY" ) or SECRET_KEY,
    "AUTH_HEADER_TYPES": ( "Bearer", ),
    "AUTH_TOKEN_CLASSES": ( "rest_framework_simplejwt.tokens.AccessToken", ),
    "TOKEN_TYPE_CLAIM": "token_type",
    "USER_ID_CLAIM": "user_id",
    "JTI_CLAIM": "jti",
}

CORS_ALLOWED_ORIGINS = env_list( "CORS_ALLOWED_ORIGINS" )
CORS_ALLOW_ALL_ORIGINS = env_bool( "CORS_ALLOW_ALL_ORIGINS", False )
CORS_ALLOW_CREDENTIALS = False

# The panel now lives on the site's own address under /admin, so both parts make its full URL.
# Used to check the Origin header on cookie-backed auth calls and to build email links.
PANEL_ORIGIN = env( "PANEL_ORIGIN", "http://localhost:8080" )
PANEL_PATH = env( "PANEL_PATH", "/admin" ).rstrip( "/" )
TRUSTED_AUTH_ORIGINS = list( set( CORS_ALLOWED_ORIGINS + [ PANEL_ORIGIN ] ) )

REFRESH_COOKIE_NAME = env( "REFRESH_COOKIE_NAME", "kandel_rtk" )
DEVICE_COOKIE_NAME = env( "DEVICE_COOKIE_NAME", "kandel_did" )
OTP_COOKIE_NAME = env( "OTP_COOKIE_NAME", "kandel_otp" )
AUTH_COOKIE_PATH = "/api/auth/"
AUTH_COOKIE_DOMAIN = env( "AUTH_COOKIE_DOMAIN" ) or None
AUTH_COOKIE_SECURE = env_bool( "AUTH_COOKIE_SECURE", not DEBUG )
AUTH_COOKIE_SAMESITE = env( "AUTH_COOKIE_SAMESITE", "None" if AUTH_COOKIE_SECURE else "Lax" )

LOGIN_MAX_ATTEMPTS = int( env( "LOGIN_MAX_ATTEMPTS", "3" ) )
LOGIN_LOCK_MINUTES = int( env( "LOGIN_LOCK_MINUTES", "5" ) )
OTP_MAX_ATTEMPTS = int( env( "OTP_MAX_ATTEMPTS", "5" ) )
OTP_TTL_MINUTES = int( env( "OTP_TTL_MINUTES", "10" ) )
# On by default, because a code he cannot read is a door that stays shut. Set to false to let a
# staff account in on its password alone while the server has no mail account: the lockout,
# the staff check and the password check all still apply, and one browser that got in that way stays
# remembered, so switching the codes back on later does not lock the doctor out of his own panel.
OTP_REQUIRED = env_bool( "OTP_REQUIRED", True )
# A known code on a development machine, where the mail backend does not deliver anywhere.
# Production always sends a random six digits.
OTP_FIXED_CODE = env( "OTP_FIXED_CODE", "123456" if DEBUG else "" )
PASSWORD_RESET_MINUTES = int( env( "PASSWORD_RESET_MINUTES", "30" ) )

# appointment submissions reuse one request per IP, device and content for this many hours
SUBMISSION_DEDUPE_HOURS = int( env( "SUBMISSION_DEDUPE_HOURS", "24" ) )

# Only turn this on when running behind a proxy that sets a trusted client address.
USE_X_FORWARDED_FOR = env_bool( "USE_X_FORWARDED_FOR", False )

# A deployed host answers behind its own proxy, so the address the visitor used and the scheme they
# came in on arrive in forwarded headers. Without both the app believes every call is plain http on
# the container's internal name, which is enough to lose a sign in cookie.
USE_X_FORWARDED_HOST = env_bool( "USE_X_FORWARDED_HOST", False )
if env( "SECURE_PROXY_SSL_HEADER" ):
    SECURE_PROXY_SSL_HEADER = tuple( env( "SECURE_PROXY_SSL_HEADER" ).split( ",", 1 ) )

SECURE_SSL_REDIRECT = env_bool( "SECURE_SSL_REDIRECT", False )
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
X_FRAME_OPTIONS = "DENY"
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"

if not DEBUG:
    SECURE_HSTS_SECONDS = int( env( "SECURE_HSTS_SECONDS", "31536000" ) )
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

if DJANGO_ADMIN_ENABLED:
    CSRF_TRUSTED_ORIGINS = TRUSTED_AUTH_ORIGINS

# Emails. Without SMTP credentials the OTP and reset mails land in outbox/ so the flow is testable locally.
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend" if env( "EMAIL_HOST" ) else "django.core.mail.backends.filebased.EmailBackend",
)
EMAIL_FILE_PATH = BASE_DIR / env( "EMAIL_FILE_PATH", "outbox" )
EMAIL_HOST = env( "EMAIL_HOST" )
EMAIL_PORT = int( env( "EMAIL_PORT", "587" ) )
EMAIL_HOST_USER = env( "EMAIL_HOST_USER" )
EMAIL_HOST_PASSWORD = env( "EMAIL_HOST_PASSWORD" )
EMAIL_USE_TLS = env_bool( "EMAIL_USE_TLS", True )
DEFAULT_FROM_EMAIL = env( "DEFAULT_FROM_EMAIL", "Dr. Ramesh Kandel <replies@localhost>" )
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# A confirmation the patient gets a second later than the click is still on time, so the mail that
# follows a Confirm leaves after the panel has its answer rather than inside the request. Set
# EMAIL_INLINE=true only where a process has to finish what it started before it answers.
EMAIL_INLINE = env_bool( "EMAIL_INLINE", False )

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": { "simple": { "format": "{levelname} {asctime} {name} {message}", "style": "{" } },
    "handlers": { "console": { "class": "logging.StreamHandler", "formatter": "simple" } },
    "root": { "handlers": [ "console" ], "level": env( "DJANGO_LOG_LEVEL", "INFO" ) },
}

