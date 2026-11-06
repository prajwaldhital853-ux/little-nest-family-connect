import hashlib
import secrets

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


def fingerprint( parts ):
    """A stable hash of what was typed, so the same enquiry cannot be filed twice in a day."""

    joined = "\u2022".join( " ".join( str( value or "" ).split() ).lower() for value in parts )
    return hashlib.sha256( joined.encode( "utf-8" ) ).hexdigest()


class Appointment( models.Model ):
    """One consultation request, from the public form through to its outcome."""

    class Status( models.TextChoices ):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "Did not attend"

    class Kind( models.TextChoices ):
        IN_PERSON = "in_person", "In person"
        VIDEO = "video", "Video call"
        FOLLOW_UP = "follow_up", "Follow up"

    # an outcome is final, so these sets are checked on every status write
    TRANSITIONS = {
        Status.PENDING: { Status.CONFIRMED, Status.CANCELLED, Status.NO_SHOW },
        Status.CONFIRMED: { Status.COMPLETED, Status.CANCELLED, Status.NO_SHOW },
        Status.COMPLETED: set(),
        Status.CANCELLED: set(),
        Status.NO_SHOW: set(),
    }

    reference = models.CharField( max_length = 14, unique = True, blank = True )
    status = models.CharField( max_length = 12, choices = Status.choices, default = Status.PENDING )
    kind = models.CharField( max_length = 12, choices = Kind.choices, default = Kind.IN_PERSON )
    scheduled_at = models.DateTimeField(
        null = True,
        blank = True,
        help_text = "Empty until the clinic agrees a time with the patient.",
    )

    patient_name = models.CharField( max_length = 120 )
    patient_email = models.EmailField( blank = True )
    phone = models.CharField( max_length = 20 )

    concerns = models.TextField( help_text = "The top three health concerns or goals the patient listed." )
    aim = models.TextField( help_text = "What the patient hopes to achieve from the consultation." )
    message = models.TextField( blank = True )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete = models.SET_NULL,
        null = True,
        blank = True,
        related_name = "appointments",
    )
    admin_note = models.TextField( blank = True )

    created_at = models.DateTimeField( auto_now_add = True )
    updated_at = models.DateTimeField( auto_now = True )

    class Meta:
        # an unscheduled request has no time to sort by, so the inbox leads with recency
        ordering = [ "-created_at" ]
        indexes = [
            models.Index( fields = [ "status", "scheduled_at" ], name = "appointment_status_slot_idx" ),
            # The inbox opens newest first, and every tab is a state plus that same newest order.
            models.Index( fields = [ "-created_at", "-id" ], name = "appointment_inbox_idx" ),
            models.Index( fields = [ "status", "-created_at" ], name = "appointment_status_recent_idx" ),
        ]

    def __str__( self ):
        return f"{ self.reference or 'draft' } { self.patient_name } { self.get_status_display() }"

    def save( self, *args, **kwargs ):
        if not self.reference:
            self.reference = "RK-" + secrets.token_hex( 3 ).upper()
        super().save( *args, **kwargs )

    def next_statuses( self ):
        return sorted( self.TRANSITIONS.get( self.status, set() ) )

    def clean( self ):
        errors = []
        if self.scheduled_at and self.scheduled_at < timezone.now():
            errors.append( "The appointment time cannot be in the past." )
        if self.pk:
            previous = Appointment.objects.filter( pk = self.pk ).values_list( "status", flat = True ).first()
            if previous and previous != self.status and self.status not in self.TRANSITIONS.get( previous, set() ):
                errors.append( f"A { previous } appointment cannot move to { self.status }." )
        if errors:
            raise ValidationError( errors )


class SubmissionTrace( models.Model ):
    """One row per public enquiry, holding only hashes, so a repeat is recognisable without new personal data."""

    appointment = models.OneToOneField( Appointment, on_delete = models.CASCADE, related_name = "trace" )
    ip_hash = models.CharField( max_length = 64, blank = True, db_index = True )
    device_hash = models.CharField( max_length = 64, blank = True, db_index = True )
    content_hash = models.CharField( max_length = 64, db_index = True )
    created_at = models.DateTimeField( auto_now_add = True, db_index = True )

    class Meta:
        ordering = [ "-created_at" ]
        indexes = [ models.Index( fields = [ "content_hash", "created_at" ], name = "enquiry_repeat_idx" ) ]

    def __str__( self ):
        return f"trace { self.appointment_id }"
