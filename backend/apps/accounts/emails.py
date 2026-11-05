"""Outbound mail for sign-in. The code itself never appears in a log or a stored row."""

from smtplib import SMTPException
from urllib.parse import urlencode

from django.conf import settings
from django.core.mail import send_mail

from .models import OtpChallenge, PasswordResetRequest

NO_MAIL_ACCOUNT = "The server has no mail account, so it cannot send a code or a reset link. Set EMAIL_HOST, EMAIL_HOST_USER and EMAIL_HOST_PASSWORD where the API runs."
MAIL_REFUSED = "The mail account refused the message. Check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD where the API runs."


class MailNotSent( Exception ):
    """A letter the mail server would not take, reported as something the panel can show."""


def can_send_mail():
    """Whether there is anywhere for a code to go.

    With no SMTP account configured Django writes the letters into outbox/ instead. That is what
    makes the flow testable on a laptop, and on a server that gives no shell it is a code nobody
    will ever read, so the sign-in page says so rather than waiting for mail that never comes.
    """

    if settings.DEBUG:
        return True
    return not settings.EMAIL_BACKEND.endswith( "filebased.EmailBackend" )


def _send( *, subject, message, recipient ):
    try:
        send_mail(
            subject = subject,
            message = message,
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [ recipient ],
        )
    except ( SMTPException, OSError ) as exc:
        raise MailNotSent( str( exc ) ) from exc


def send_otp( user, challenge: OtpChallenge, code: str, *, new_device: bool = True ):
    where = "from a device we have not seen before" if new_device else "again"
    _send(
        subject = "Your clinic panel sign-in code",
        message = (
            f"Someone is signing in to the clinic panel as { user.email } { where }.\n\n"
            f"Your code is { code }. It works for { settings.OTP_TTL_MINUTES } minutes.\n\n"
            f"If this was not you, change your password right away from the sign-in page.\n"
        ),
        recipient = user.email,
    )


def send_password_reset( email: str, request: PasswordResetRequest, token: str ):
    link = f"{ settings.PANEL_ORIGIN.rstrip('/') }{ settings.PANEL_PATH }/reset-password?{ urlencode( { 'email': email, 'token': token } ) }"
    _send(
        subject = "Reset your clinic panel password",
        message = (
            f"You asked to reset the password for { email }.\n\n"
            f"Open this link to choose a new one. It works once and expires in { settings.PASSWORD_RESET_MINUTES } minutes:\n"
            f"{ link }\n\n"
            f"If you did not ask for this, ignore the email. Nothing has changed.\n"
        ),
        recipient = email,
    )
