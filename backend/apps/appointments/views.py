from datetime import timedelta

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.exceptions import Throttled, ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import SimpleRateThrottle

from apps.audit.services import pair, record
from config.hashing import client_ip, hash_identity

from .emails import send_approval_email
from .models import Appointment, SubmissionTrace, fingerprint
from .serializers import AppointmentCreateSerializer, AppointmentSerializer

DUPLICATE_ENQUIRY = "This enquiry has already been received. Please use the reference you were given."


class AppointmentSubmitThrottle( SimpleRateThrottle ):
    """Stop one address from flooding the public request form."""

    scope = "appointment"

    def get_cache_key( self, request, view ):
        return self.cache_format % { "scope": self.scope, "ident": self.get_ident( request ) }


class AppointmentViewSet( viewsets.ModelViewSet ):
    """Public submissions in, staff-only inbox out. Patient details never leave the panel."""

    queryset = Appointment.objects.select_related( "assigned_to" ).all()
    serializer_class = AppointmentSerializer
    search_fields = [ "patient_name", "patient_email", "phone", "reference" ]
    ordering_fields = [ "scheduled_at", "created_at", "status", "patient_name" ]
    ordering = [ "-created_at", "-id" ]

    def get_permissions( self ):
        if self.action == "create":
            return [ AllowAny() ]
        return [ IsAdminUser() ]

    def get_throttles( self ):
        if self.action == "create":
            return [ AppointmentSubmitThrottle() ]
        return []

    def throttled( self, request, wait ):
        minutes = round( ( wait or 3600 ) / 60 ) or 1
        raise Throttled( detail = f"Too many requests from this address. Try again in about { minutes } minutes." )

    def get_queryset( self ):
        queryset = super().get_queryset()
        params = self.request.query_params

        states = params.get( "status" )
        if states:
            wanted = [ part.strip() for part in states.split( "," ) if part.strip() ]
            queryset = queryset.filter( status__in = wanted )

        date_from = parse_date( params.get( "date_from", "" ) )
        if date_from:
            queryset = queryset.filter( scheduled_at__date__gte = date_from )

        date_to = parse_date( params.get( "date_to", "" ) )
        if date_to:
            queryset = queryset.filter( scheduled_at__date__lte = date_to )

        if params.get( "unassigned" ) == "1":
            queryset = queryset.filter( assigned_to__isnull = True )

        assigned_to = params.get( "assigned_to" )
        if assigned_to:
            queryset = queryset.filter( assigned_to_id = assigned_to )

        return queryset

    def create( self, request, *args, **kwargs ):
        serializer = AppointmentCreateSerializer( data = request.data )
        serializer.is_valid( raise_exception = True )

        fields = serializer.validated_data
        content_hash = fingerprint(
            [ fields.get( "patient_name" ), fields.get( "patient_email" ), fields.get( "phone" ),
              fields.get( "concerns" ), fields.get( "aim" ), fields.get( "message" ) ]
        )
        ip_hash = hash_identity( client_ip( request ) )
        device_raw = ( request.headers.get( "X-Device-Id" ) or "" )[: 64 ]
        device_hash = hash_identity( device_raw ) if device_raw else ""
        window_start = timezone.now() - timedelta( hours = settings.SUBMISSION_DEDUPE_HOURS )
        match = Q( ip_hash = ip_hash )
        if device_hash:
            match |= Q( device_hash = device_hash )
        repeated = (
            SubmissionTrace.objects.filter( created_at__gte = window_start, content_hash = content_hash ).filter( match ).exists()
        )
        if repeated:
            record( "enquiry.duplicate", request = request, detail = { "ip": ip_hash[: 12 ] } )
            raise ValidationError( { "detail": [ DUPLICATE_ENQUIRY ] } )

        appointment = serializer.save()
        SubmissionTrace.objects.create(
            appointment = appointment, ip_hash = ip_hash, device_hash = device_hash, content_hash = content_hash
        )
        record( "enquiry.received", request = request, target = appointment, target_label = appointment.reference )
        return Response(
            {
                "reference": appointment.reference,
                "status": appointment.status,
                "scheduled_at": appointment.scheduled_at.isoformat() if appointment.scheduled_at else None,
                "detail": "Your request has been received. Keep this reference for your enquiry.",
            },
            status = status.HTTP_201_CREATED,
        )

    def perform_update( self, serializer ):
        before = {
            field: getattr( serializer.instance, field )
            for field in [ "status", "kind", "scheduled_at", "assigned_to_id", "admin_note", "patient_name", "patient_email", "phone" ]
        }
        appointment = serializer.save()
        after = { field: getattr( appointment, field ) for field in before }
        changed = { key: pair( before[ key ], after[ key ] ) for key in before if before[ key ] != after[ key ] }
        record( "enquiry.updated", request = self.request, target = appointment, target_label = appointment.reference, detail = changed )

        # the email belongs to the transition into confirmed, not to every save of a confirmed row
        if before[ "status" ] != Appointment.Status.CONFIRMED and appointment.status == Appointment.Status.CONFIRMED:
            send_approval_email( appointment )

    def perform_destroy( self, instance ):
        reference = instance.reference
        record( "enquiry.deleted", request = self.request, target_label = reference, detail = { "reference": reference } )
        instance.delete()
