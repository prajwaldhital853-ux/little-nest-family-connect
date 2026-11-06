"""The confirmation a patient receives when the clinic approves their request."""

import logging
import threading

from django.conf import settings
from django.core.mail import send_mail
from django.db import connections
from django.utils import timezone
from django.utils.html import escape

from apps.audit.services import record

from . import form as enquiry
from .models import Appointment

logger = logging.getLogger( __name__ )

# Used when the global page-copy row is missing or the doctor has blanked a field.
DOCTOR_EMAIL = "drameshkandel@gmail.com"
DOCTOR_PHONE = "+977-9857042717"
DOCTOR_ROLE = "Professor of Geriatric Medicine"
DOCTOR_PLACE = "Rapti Academy of Health Sciences, Dang, Nepal"

SUBJECT = "Your appointment with Dr. Ramesh Kandel is confirmed"


def doctor_contact():
    """The doctor's own contact details, read from the global page copy where he edits them."""

    from apps.cms.models import PageCopy

    data = PageCopy.objects.filter( key = "global" ).values_list( "data", flat = True ).first() or {}
    contact = data.get( "contact" ) or {}
    brand = data.get( "brand" ) or {}
    return {
        "email": contact.get( "email" ) or DOCTOR_EMAIL,
        "phone": contact.get( "phone" ) or DOCTOR_PHONE,
        "role": brand.get( "role" ) or DOCTOR_ROLE,
    }


def _when( appointment ):
    if not appointment.scheduled_at:
        return "To be arranged. The clinic will contact you to agree a time."
    return timezone.localtime( appointment.scheduled_at ).strftime( "%A, %d %B %Y at %H:%M" )


def _details( appointment ):
    """Every answer the patient gave, under the question as the form words it, so a renamed or
    added question reads the same in the email as it did on the page they filled in."""

    rows = [
        ( "Reference", appointment.reference ),
        ( "Patient", appointment.patient_name ),
        ( "Consultation", appointment.get_kind_display() ),
        ( "Time", _when( appointment ) ),
    ]
    for question in enquiry.questions():
        column = enquiry.COLUMNS.get( question[ "id" ] )
        # their name greets them and their address carries the mail, so neither needs a line
        if not column or column == "patient_name" or question[ "id" ] == "email":
            continue
        answer = str( getattr( appointment, column ) or "" ).strip()
        if answer:
            rows.append( ( question[ "label" ] or question[ "id" ].replace( "_", " " ).capitalize(), answer ) )
    return rows


def _text_body( appointment, doctor ):
    lines = [
        f"Dear { appointment.patient_name },",
        "",
        "Your appointment with Dr. Ramesh Kandel has been confirmed. The details are below.",
        "",
    ]
    lines += [ f"{ label }: { value }" for label, value in _details( appointment ) ]
    lines += [
        "",
        "If you need to change the time or cancel, reply to this email or call the number below.",
        "",
        "Dr. Ramesh Kandel",
        doctor[ "role" ],
        DOCTOR_PLACE,
        f"Email: { doctor[ 'email' ] }",
        f"Phone: { doctor[ 'phone' ] }",
        "",
    ]
    return "\n".join( lines )


def _html_body( appointment, doctor ):
    rows = "".join(
        "<tr>"
        f'<td style="padding:5px 14px 5px 0;color:#666666;font-size:14px;vertical-align:top;white-space:nowrap;">{ escape( label ) }</td>'
        f'<td style="padding:5px 0;color:#333333;font-size:14px;vertical-align:top;">{ escape( value ).replace( chr( 10 ), "<br>" ) }</td>'
        "</tr>"
        for label, value in _details( appointment )
    )
    return (
        '<div style="background:#ffffff;padding:24px 0;">'
        '<div style="max-width:600px;margin:0 auto;padding:0 20px;'
        "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"
        'color:#333333;font-size:15px;line-height:1.6;">'
        '<h1 style="font-size:18px;font-weight:600;color:#222222;margin:0 0 16px;">Appointment confirmed</h1>'
        f'<p style="margin:0 0 16px;">Dear { escape( appointment.patient_name ) },</p>'
        '<p style="margin:0 0 16px;">Your appointment with Dr. Ramesh Kandel has been confirmed. The details are below.</p>'
        f'<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin:0 0 24px;">{ rows }</table>'
        '<p style="margin:0 0 24px;">If you need to change the time or cancel, reply to this email or call the number below.</p>'
        '<p style="margin:0;color:#555555;font-size:14px;">Dr. Ramesh Kandel<br>'
        f'{ escape( doctor[ "role" ] ) }<br>{ escape( DOCTOR_PLACE ) }<br>'
        f'<a href="mailto:{ escape( doctor[ "email" ] ) }" style="color:#333333;">{ escape( doctor[ "email" ] ) }</a><br>'
        f'{ escape( doctor[ "phone" ] ) }</p>'
        "</div></div>"
    )


def queue_approval_email( appointment, request = None ):
    """Send the confirmation after the panel has its answer.

    The round trip to the mail provider is the slowest thing pressing Confirm does, and the row is
    already saved by the time we get here, so the doctor should not sit waiting on it. The thread
    re-reads the appointment rather than carrying the object over, and closes the database
    connection it opened for itself. EMAIL_INLINE is for a process that must finish what it started
    before it answers, which is what the test suite does.
    """

    if settings.EMAIL_INLINE:
        send_approval_email( appointment, request = request )
        return None

    worker = threading.Thread( target = _deliver_later, args = ( appointment.pk, request ), daemon = True )
    worker.start()
    return worker


def _deliver_later( appointment_pk, request ):
    try:
        appointment = Appointment.objects.get( pk = appointment_pk )
    except Appointment.DoesNotExist:
        return
    try:
        send_approval_email( appointment, request = request )
    finally:
        connections.close_all()


def send_approval_email( appointment, request = None ):
    """Never raises: a failed email is logged and must not undo the approval itself.

    What happened to it goes into the history the panel reads, because the one question after a
    confirmation is whether the patient was told.
    """

    if not appointment.patient_email:
        logger.warning( "Appointment %s was confirmed but has no email address, so no confirmation was sent.", appointment.reference )
        record( "enquiry.email_skipped", request = request, target = appointment, target_label = appointment.reference,
                detail = { "reason": "the request has no email address" } )
        return
    try:
        doctor = doctor_contact()
        send_mail(
            subject = SUBJECT,
            message = _text_body( appointment, doctor ),
            from_email = settings.DEFAULT_FROM_EMAIL,
            recipient_list = [ appointment.patient_email ],
            html_message = _html_body( appointment, doctor ),
        )
        record( "enquiry.emailed", request = request, target = appointment, target_label = appointment.reference,
                detail = { "subject": SUBJECT } )
    except Exception:
        logger.warning( "Confirmation email for appointment %s failed to send.", appointment.reference, exc_info = True )
        record( "enquiry.email_failed", request = request, target = appointment, target_label = appointment.reference,
                detail = { "to": appointment.patient_email } )
