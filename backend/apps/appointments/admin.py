from django.contrib import admin

from .models import Appointment


@admin.register( Appointment )
class AppointmentAdmin( admin.ModelAdmin ):
    list_display = ( "reference", "patient_name", "phone", "scheduled_at", "status", "assigned_to" )
    list_filter = ( "status", "kind" )
    search_fields = ( "reference", "patient_name", "patient_email", "phone" )
    readonly_fields = ( "reference", "created_at", "updated_at" )
    list_select_related = ( "assigned_to", )
    date_hierarchy = "scheduled_at"
    ordering = ( "-scheduled_at", )
