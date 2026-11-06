from django.conf import settings
from django.db import models
from django.db.models.functions import Lower


class AuditEntry( models.Model ):
    """Append only record of who did what on the panel, including failed sign-in attempts."""

    created_at = models.DateTimeField( auto_now_add = True, db_index = True )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null = True,
        blank = True,
        on_delete = models.SET_NULL,
        related_name = "audit_entries",
    )
    actor_label = models.CharField( max_length = 255, blank = True )
    action = models.CharField( max_length = 64, db_index = True )
    target_type = models.CharField( max_length = 64, blank = True )
    target_id = models.CharField( max_length = 64, blank = True )
    target_label = models.CharField( max_length = 255, blank = True )
    detail = models.JSONField( default = dict, blank = True )
    ip_hash = models.CharField( max_length = 64, blank = True )
    user_agent = models.CharField( max_length = 255, blank = True )

    class Meta:
        ordering = [ "-created_at", "-id" ]
        indexes = [
            models.Index( fields = [ "actor", "created_at" ], name = "audit_actor_recent_idx" ),
            models.Index( fields = [ "action", "created_at" ], name = "audit_action_recent_idx" ),
            models.Index( fields = [ "-created_at", "-id" ], name = "audit_recent_idx" ),
            # The history page filters by who and by what kind of thing, both by name rather
            # than by id, because an account or a row can be gone while its line stays readable.
            models.Index( Lower( "actor_label" ), name = "audit_actor_label_idx" ),
            models.Index( fields = [ "target_type", "created_at" ], name = "audit_target_recent_idx" ),
        ]

    def __str__( self ):
        return f"{ self.created_at:%Y-%m-%d %H:%M } { self.actor_label or 'anonymous' } { self.action }"
