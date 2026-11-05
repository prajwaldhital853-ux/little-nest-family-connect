"""The first panel account, made from the environment so a fresh database can be signed in to."""

import os

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.accounts.models import User


class Command( BaseCommand ):
    help = "Create the doctor's panel account when the database does not have one yet."

    def handle( self, *args, **options ):
        email = os.environ.get( "DJANGO_SUPERUSER_EMAIL", "" ).strip().lower()
        if not email:
            email = next( iter( settings.ADMIN_LOGIN_EMAILS ), "" )
        password = os.environ.get( "DJANGO_SUPERUSER_PASSWORD", "" )

        if not email:
            raise CommandError( "Neither DJANGO_SUPERUSER_EMAIL nor ADMIN_LOGIN_EMAILS names an address to create." )

        # Never reset a password that is already in use, because the panel's own Account screen is
        # where the doctor changes it and an environment value must not overwrite his choice.
        if User.objects.filter( email__iexact = email ).exists():
            self.stdout.write( f"{ email } already has an account, nothing was changed." )
            return

        if not password:
            raise CommandError( f"{ email } has no account yet, so DJANGO_SUPERUSER_PASSWORD has to be set to make one." )

        User.objects.create_superuser(
            email = email,
            password = password,
            full_name = os.environ.get( "DJANGO_SUPERUSER_NAME", "" ).strip(),
            job_title = os.environ.get( "DJANGO_SUPERUSER_TITLE", "" ).strip(),
        )
        self.stdout.write( f"Created the panel account for { email }." )
