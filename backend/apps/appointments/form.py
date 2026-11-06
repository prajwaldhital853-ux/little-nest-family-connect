"""The questions the public booking form asks, in the words the doctor has given them.

The form is page wording, so the panel edits it where every other sentence of the contact page
lives. This module reads that same wording back, which keeps three things in step: what a visitor
has to answer before the API takes the request, what the confirmation email calls each answer, and
what the site puts a box for.
"""

PAGE = "contact"

# The ids the appointment has its own column for. A question with any other id is filed as a line
# of the message, so adding a question to the form never needs a migration.
COLUMNS = {
    "name": "patient_name",
    "email": "patient_email",
    "phone": "phone",
    "concerns": "concerns",
    "aim": "aim",
    "message": "message",
}

# A request with no name has nothing to file it under and nobody to greet in the confirmation,
# so this one is asked whatever the form says.
ALWAYS = { "name" }

# The answers a clinician reads before deciding anything, and how little of them is a non-answer.
LONG_ASK = { "concerns": 10, "aim": 10 }

# The form that ships with the site, used until the contact page's wording is on file.
SHIPPED = [
    { "id": "name", "label": "Your name", "required": True },
    { "id": "email", "label": "Your email", "required": True },
    { "id": "phone", "label": "Your phone number", "required": True },
    { "id": "organisation", "label": "Organisation", "required": False },
    { "id": "topic", "label": "Nature of enquiry", "required": True },
    { "id": "timeline", "label": "Timeline, if any", "required": False },
    { "id": "concerns", "label": "Please briefly list your top 3 most important health concerns or goals", "required": True },
    { "id": "aim", "label": "What are you hoping to achieve from a consultation with me?", "required": True },
    { "id": "message", "label": "Your message", "required": True },
]


def questions():
    """Every question the booking form asks, in the order the visitor meets them."""

    return _from_page() or [ dict( question ) for question in SHIPPED ]


def asked( field_id ):
    """The question with this id, or None when the form no longer asks it."""

    return next( ( one for one in questions() if one[ "id" ] == field_id ), None )


def label( field_id, fallback ):
    question = asked( field_id )
    return question[ "label" ] if question and question[ "label" ] else fallback


def answers():
    """What the columns of an appointment may not be left empty of, keyed by column."""

    wanted = {}
    for question in questions():
        column = COLUMNS.get( question[ "id" ] )
        if not column:
            continue
        wanted[ column ] = {
            "label": question[ "label" ] or question[ "id" ],
            "required": question[ "required" ] or question[ "id" ] in ALWAYS,
            "min": LONG_ASK.get( question[ "id" ], 0 ),
        }
    return wanted


def _from_page():
    from apps.cms.models import PageCopy

    data = PageCopy.objects.filter( key = PAGE ).values_list( "data", flat = True ).first() or {}
    for row in data.get( "rows" ) or []:
        if not isinstance( row, dict ):
            continue
        fields = ( row.get( "form" ) or {} ).get( "fields" )
        if isinstance( fields, list ):
            cleaned = [ one for one in ( _clean( field ) for field in fields ) if one ]
            if cleaned:
                return cleaned
    return []


def _clean( field ):
    if not isinstance( field, dict ):
        return None
    field_id = str( field.get( "id" ) or "" ).strip()
    if not field_id:
        return None
    return {
        "id": field_id,
        "label": str( field.get( "label" ) or "" ).strip(),
        "required": bool( field.get( "required" ) ) or field_id in ALWAYS,
    }
