import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from config.hashing import hash_identity


class UserManager( BaseUserManager ):
    use_in_migrations = True

    def create_user( self, email = None, password = None, **extra_fields ):
        if not email:
            raise ValueError( "An email address is required to create an account." )
        extra_fields.setdefault( "is_staff", False )
        extra_fields.setdefault( "is_superuser", False )
        email = self.normalize_email( email )
        user = self.model( email = email, **extra_fields )
        user.set_password( password )
        user.save( using = self._db )
        return user

    def create_superuser( self, email = None, password = None, **extra_fields ):
        extra_fields.setdefault( "is_staff", True )
        extra_fields.setdefault( "is_superuser", True )
        if extra_fields.get( "is_staff" ) is not True:
            raise ValueError( "A superuser must have is_staff=True." )
        if extra_fields.get( "is_superuser" ) is not True:
            raise ValueError( "A superuser must have is_superuser=True." )
        return self.create_user( email, password, **extra_fields )


class User( AbstractUser ):
    """Staff accounts only. The public site never creates or signs in through these."""

    email = models.EmailField( unique = True )
    full_name = models.CharField( max_length = 160, blank = True )
    job_title = models.CharField( max_length = 120, blank = True )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    def save( self, *args, **kwargs ):
        # username stays as the internal Django key so admin and management commands keep working
        if not self.username:
            self.username = self.email
        super().save( *args, **kwargs )

    def __str__( self ):
        return self.email


class Lockout( models.Model ):
    """The counter behind three tries then a five minute block, one row per address and one per browser."""

    LOGIN = "login"
    RESET = "reset"
    KINDS = [ ( LOGIN, "Login" ), ( RESET, "Password reset" ) ]

    key = models.CharField( max_length = 80, unique = True )
    kind = models.CharField( max_length = 12, choices = KINDS, default = LOGIN )
    email = models.CharField( max_length = 254, blank = True )
    failures = models.PositiveSmallIntegerField( default = 0 )
    locked_until = models.DateTimeField( null = True, blank = True )
    updated_at = models.DateTimeField( auto_now = True )

    class Meta:
        ordering = [ "-updated_at" ]

    def __str__( self ):
        return f"{ self.kind } { self.key[: 12 ] } { self.failures } failed"

    @staticmethod
    def keys_for( kind, identities ):
        return [ f"{ kind }:val:{ hash_identity( value ) }" for value in identities if value ]

    @classmethod
    def blocked_on( cls, kind, identities ):
        """Seconds left on the block for any of these identities, or zero when free to try."""

        now = timezone.now()
        keys = cls.keys_for( kind, identities )
        if not keys:
            return 0
        rows = list( cls.objects.filter( key__in = keys, locked_until__gt = now ) )
        for row in cls.objects.filter( key__in = keys, locked_until__isnull = False ).exclude( locked_until__gt = now ):
            row.failures = 0
            row.locked_until = None
            row.save( update_fields = [ "failures", "locked_until", "updated_at" ] )
        if not rows:
            return 0
        later = max( row.locked_until for row in rows )
        return max( 1, int( ( later - now ).total_seconds() ) )

    @classmethod
    def register_failure( cls, kind, identities, email ):
        now = timezone.now()
        blocked = None
        for key in cls.keys_for( kind, identities ):
            row, _ = cls.objects.get_or_create( key = key, defaults = { "kind": kind, "email": email } )
            if row.locked_until and row.locked_until > now:
                if blocked is None or row.locked_until > blocked:
                    blocked = row.locked_until
                continue
            row.kind = kind
            row.email = email
            row.failures += 1
            if row.failures >= settings.LOGIN_MAX_ATTEMPTS:
                row.locked_until = now + timedelta( minutes = settings.LOGIN_LOCK_MINUTES )
            row.save()
            if row.locked_until and row.locked_until > now:
                blocked = row.locked_until
        if blocked:
            return max( 1, int( ( blocked - now ).total_seconds() ) )
        return 0

    @classmethod
    def clear( cls, kind, identities ):
        cls.objects.filter( key__in = cls.keys_for( kind, identities ) ).delete()


class TrustedDevice( models.Model ):
    """A browser the doctor has already proved possession of with an emailed code."""

    user = models.ForeignKey( settings.AUTH_USER_MODEL, on_delete = models.CASCADE, related_name = "trusted_devices" )
    device_hash = models.CharField( max_length = 64, db_index = True )
    label = models.CharField( max_length = 160, blank = True )
    ip_hash = models.CharField( max_length = 64, blank = True )
    created_at = models.DateTimeField( auto_now_add = True )
    last_seen_at = models.DateTimeField( default = timezone.now )

    class Meta:
        ordering = [ "-last_seen_at" ]
        constraints = [ models.UniqueConstraint( fields = [ "user", "device_hash" ], name = "unique_trusted_device_per_user" ) ]

    def __str__( self ):
        return self.label or self.device_hash[: 12 ]


class OtpChallenge( models.Model ):
    """The six digits sent to the doctor's email when a new device signs in."""

    user = models.ForeignKey( settings.AUTH_USER_MODEL, on_delete = models.CASCADE, related_name = "otp_challenges" )
    ref = models.CharField( max_length = 64, unique = True )
    code_hash = models.CharField( max_length = 255 )
    device_hash = models.CharField( max_length = 64, blank = True )
    attempts = models.PositiveSmallIntegerField( default = 0 )
    created_at = models.DateTimeField( auto_now_add = True )
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField( null = True, blank = True )

    class Meta:
        ordering = [ "-created_at" ]

    @property
    def is_open( self ):
        return self.verified_at is None and self.expires_at > timezone.now() and self.attempts < settings.OTP_MAX_ATTEMPTS

    def check_code( self, value ):
        return check_password( value, self.code_hash )


class PasswordResetRequest( models.Model ):
    """A single use link, stored only as a hash of the token it carries."""

    email = models.CharField( max_length = 254, db_index = True )
    token_hash = models.CharField( max_length = 64, unique = True )
    created_at = models.DateTimeField( auto_now_add = True )
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField( null = True, blank = True )

    class Meta:
        ordering = [ "-created_at" ]

    @property
    def is_open( self ):
        return self.used_at is None and self.expires_at > timezone.now()

    def check_token( self, value ):
        import hashlib
        import secrets

        candidate = hashlib.sha256( value.encode( "utf-8" ) ).hexdigest()
        return secrets.compare_digest( candidate, self.token_hash )
