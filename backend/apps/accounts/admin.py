from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register( User )
class UserAdmin( DjangoUserAdmin ):
    fieldsets = (
        ( None, { "fields": ( "username", "password" ) } ),
        ( "Contact", { "fields": ( "email", "full_name", "job_title" ) } ),
        ( "Permissions", { "fields": ( "is_active", "is_staff", "is_superuser", "groups", "user_permissions" ) } ),
        ( "Important dates", { "fields": ( "last_login", "date_joined" ) } ),
    )
    add_fieldsets = (
        ( None, { "classes": ( "wide", ), "fields": ( "email", "password1", "password2", "is_staff" ) } ),
    )
    list_display = ( "email", "full_name", "job_title", "is_staff", "is_active", "last_login" )
    list_filter = ( "is_staff", "is_active" )
    search_fields = ( "email", "full_name", "job_title" )
    ordering = ( "email", )
