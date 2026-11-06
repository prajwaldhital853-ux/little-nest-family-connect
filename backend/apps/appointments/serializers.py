from datetime import timedelta

from django.core.validators import RegexValidator
from django.utils import timezone
from rest_framework import serializers

from . import form as enquiry
from .models import Appointment

phone_validator = RegexValidator( regex = r"^[0-9+\-\s()]{7,20}$", message = "Enter a phone number that can be dialled." )


class AppointmentCreateSerializer( serializers.ModelSerializer ):
    """What the public form sends.

    Nothing here decides for itself which answer is compulsory: the booking form does, and the
    doctor edits that in the panel. Every column question is taken as optional by the field and
    demanded or excused by ``validate``, so unchecking a question in the panel is enough to let an
    answer stay empty.
    """

    patient_name = serializers.CharField( max_length = 120, required = False, allow_blank = True )
    patient_email = serializers.EmailField( required = False, allow_blank = True )
    phone = serializers.CharField( max_length = 20, required = False, allow_blank = True )
    concerns = serializers.CharField( required = False, allow_blank = True )
    aim = serializers.CharField( required = False, allow_blank = True )
    message = serializers.CharField( required = False, allow_blank = True, max_length = 4000 )
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

    def validate_phone( self, value ):
        if value.strip():
            phone_validator( value.strip() )
        return value.strip()

    def validate( self, attrs ):
        missing = {}
        for column, asked in enquiry.answers().items():
            answer = str( attrs.get( column ) or "" ).strip()
            if not answer:
                if asked[ "required" ]:
                    missing[ column ] = [ f"Please answer this question: { asked[ 'label' ] }" ]
                continue
            if asked[ "min" ] and len( answer ) < asked[ "min" ]:
                missing[ column ] = [ f"Please say a little more: { asked[ 'label' ] }" ]
        if missing:
            raise serializers.ValidationError( missing )
        return attrs


class AppointmentSerializer( serializers.ModelSerializer ):
    status_display = serializers.CharField( source = "get_status_display", read_only = True )
    kind_display = serializers.CharField( source = "get_kind_display", read_only = True )
    assigned_to_name = serializers.CharField( source = "assigned_to.email", read_only = True, default = "" )
    next_statuses = serializers.SerializerMethodField()
    # a question the form no longer asks leaves its answer empty, and an empty answer is still a
    # row the panel has to be able to save
    phone = serializers.CharField( validators = [ phone_validator ], max_length = 20, allow_blank = True )
    concerns = serializers.CharField( allow_blank = True, required = False )
    aim = serializers.CharField( allow_blank = True, required = False )

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
