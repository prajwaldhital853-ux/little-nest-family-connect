"""Outbound mail for sign-in. The code itself never appears in a log or a stored row."""

import logging
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone

from .models import DeviceRequest, OtpChallenge, PasswordResetRequest

logger = logging.getLogger( __name__ )


def send_otp( user, challenge: OtpChallenge, code: str, *, new_device: bool = True ):
    where = "from a device we have not seen before" if new_device else "again"
    send_mail(
        subject = "Your clinic panel sign-in code",
        message = (
            f"Someone is signing in to the clinic panel as { user.email } { where }.\n\n"
            f"Your code is { code }. It works for { settings.OTP_TTL_MINUTES } minutes.\n\n"
            f"If this was not you, change your password right away from the sign-in page.\n"
        ),
        from_email = settings.DEFAULT_FROM_EMAIL,
        recipient_list = [ user.email ],
    )


def send_password_reset( email: str, request: PasswordResetRequest, token: str ):
    link = f"{ settings.PANEL_ORIGIN.rstrip('/') }{ settings.PANEL_PATH }/reset-password?{ urlencode( { 'email': email, 'token': token } ) }"
    send_mail(
        subject = "Reset your clinic panel password",
        message = (
            f"You asked to reset the password for { email }.\n\n"
            f"Open this link to choose a new one. It works once and expires in { settings.PASSWORD_RESET_MINUTES } minutes:\n"
            f"{ link }\n\n"
            f"If you did not ask for this, ignore the email. Nothing has changed.\n"
        ),
        from_email = settings.DEFAULT_FROM_EMAIL,
        recipient_list = [ email ],
    )


def send_device_request_mail( row: DeviceRequest ):
    """Tells the doctor a browser is waiting. A failed mail must not spoil the page he just opened."""

    link = f"{ settings.PANEL_ORIGIN.rstrip('/') }{ settings.PANEL_PATH }/account"
    seen = timezone.localtime( row.created_at ).strftime( "%d %b %Y, %H:%M" )
    try:
        send_mail(
            subject = "A device is waiting for the clinic panel",
            message = (
                f"{ row.name } opened the panel and is waiting for you to allow it.\n\n"
                f"Screen: { row.screen or 'not told' }\n"
                f"Language: { row.language or 'not told' }\n"
                f"Timezone: { row.timezone_name or 'not told' }\n"
                f"Touch screen: { 'yes' if row.touch else 'no' }\n"
                f"First seen: { seen }\n\n"
                f"Allow or block it on your account page: { link }\n\n"
                f"If this was not you, block the device and change your password.\n"
            ),
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list = settings.ADMIN_LOGIN_EMAILS,
        )
    except Exception:
        logger.warning( "The device request %s was recorded but no mail went out.", row.pk, exc_info = True )
