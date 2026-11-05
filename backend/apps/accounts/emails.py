"""Outbound mail for sign-in. The code itself never appears in a log or a stored row."""

from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail

from .models import OtpChallenge, PasswordResetRequest


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
