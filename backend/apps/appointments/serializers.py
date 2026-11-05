from datetime import timedelta

from django.core.validators import RegexValidator
from django.utils import timezone
from rest_framework import serializers

from .models import Appointment

phone_validator = RegexValidator( regex = r"^[0-9+\-\s()]{7,20}$", message = "Enter a phone number that can be dialled." )


class AppointmentCreateSerializer( serializers.ModelSerializer ):
    patient_email = serializers.EmailField( required = False, allow_blank = True )
    message = serializers.CharField( required = False, allow_blank = True, max_length = 4000 )
    phone = serializers.CharField( max_length = 20, validators = [ phone_validator ] )
    scheduled_at = serializers.DateTimeField( required = False, allow_null = True )

    class Meta:
        model = Appointment
        fields = [ "patient_name", "patient_email", "phone", "scheduled_at", "kind", "concerns", "aim", "message" ]

    def validate_scheduled_at( self, value ):
        if value is None:
            return value
        now = timezone.now()
        if value <= now:
            raise serializers.ValidationError( "Choose a time in the future." )
        if value > now + timedelta( days = 365 ):
            raise serializers.ValidationError( "Choose a time within the next year." )
        return value

    def validate_concerns( self, value ):
        if len( value.strip() ) < 10:
            raise serializers.ValidationError( "Say a little more about the health concerns or goals." )
        return value.strip()

    def validate_aim( self, value ):
        if len( value.strip() ) < 10:
            raise serializers.ValidationError( "Say what you are hoping to achieve from the consultation." )
        return value.strip()


class AppointmentSerializer( serializers.ModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    kind_display = serializers.CharField( source = "get_kind_display", read_only = True )
    assigned_to_name = serializers.CharField( source = "assigned_to.email", read_only = True, default = "" )
    next_statuses = serializers.SerializerMethodField()
    phone = serializers.CharField( validators = [ phone_validator ], max_length = 20 )

    class Meta:
        model = Appointment
        fields = [
            "id", "reference", "status", "status_display", "next_statuses",
            "kind", "kind_display", "scheduled_at",
            "patient_name", "patient_email", "phone",
            "concerns", "aim", "message",
            "assigned_to", "assigned_to_name", "admin_note",
            "created_at", "updated_at",
        ]
        read_only_fields = [ "id", "reference", "created_at", "updated_at" ]

    def get_next_statuses( self, obj ):
        return obj.next_statuses()

    def validate_status( self, value ):
        instance = self.instance
        if instance and instance.status != value:
            if value not in Appointment.TRANSITIONS.get( instance.status, set() ):
                raise serializers.ValidationError(
                    f"A { instance.get_status_display().lower() } appointment cannot move to { value }."
                )
        return value
