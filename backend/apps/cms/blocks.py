"""The shape of an article: a list of blocks, each one thing the doctor typed.

A post used to be one long text box, so anything that was not a paragraph had to be typed as
plain words and read as one. A block says what it is, and the site lays it out that way.
"""

from .validate import strip_markup

BLOCK_TYPES = {
    "h2": "Heading",
    "h3": "Sub heading",
    "p": "Paragraph",
    "ul": "Bullet list",
    "ol": "Numbered list",
    "quote": "Pull quote",
}

# Which kinds carry one piece of writing and which carry a list of them.
TEXT_TYPES = { "h2", "h3", "p", "quote" }
LIST_TYPES = { "ul", "ol" }

MAX_BLOCKS = 120
MAX_ITEMS = 40
MAX_LENGTH = { "h2": 160, "h3": 200, "p": 4000, "quote": 600, "item": 1200 }


def clean_blocks( value ):
    """Return the blocks in the shape the site renders, or say what is wrong in editor words."""

    if value in ( None, "" ):
        return []
    if not isinstance( value, list ):
        raise ValueError( "An article is a list of blocks." )
    if len( value ) > MAX_BLOCKS:
        raise ValueError( f"An article can hold { MAX_BLOCKS } blocks. Split the rest into another post." )

    out = []
    for at, block in enumerate( value, start = 1 ):
        if not isinstance( block, dict ):
            raise ValueError( f"Block { at } is not a block." )
        kind = block.get( "type" )
        if kind not in BLOCK_TYPES:
            raise ValueError( f"Block { at } is a type the site does not know how to lay out." )
        name = BLOCK_TYPES[ kind ]
        if kind in TEXT_TYPES:
            text = strip_markup( block.get( "text", "" ) )[: MAX_LENGTH[ kind ] ]
            if not text:
                raise ValueError( f"The { name.lower() } in block { at } has no words in it." )
            out.append( { "type": kind, "text": text } )
            continue
        items = block.get( "items" )
        if not isinstance( items, list ):
            raise ValueError( f"The { name.lower() } in block { at } needs one line per item." )
        lines = [ strip_markup( item )[: MAX_LENGTH[ "item" ] ] for item in items[ : MAX_ITEMS ] ]
        lines = [ line for line in lines if line ]
        if not lines:
            raise ValueError( f"The { name.lower() } in block { at } has no items yet." )
        out.append( { "type": kind, "items": lines } )
    return out


def blocks_to_text( blocks ):
    """The same article as plain words, so search, reading time and the length check still work."""

    parts = []
    for block in blocks:
        if block.get( "type" ) in TEXT_TYPES:
            parts.append( block.get( "text", "" ) )
        else:
            parts.append( "\n".join( block.get( "items", [] ) ) )
    return "\n\n".join( part for part in parts if part )
