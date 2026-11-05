"""Write-side helpers so every app records the same shape of history."""

from .models import AuditEntry

SECRET_KEYS = { "password", "new_password", "current_password", "token", "code", "access", "refresh", "authorization", "ip" }


def record(
    action,
    *,
    request = None,
    actor = None,
    target = None,
    target_type = "",
    target_id = "",
    target_label = "",
    detail = None,
):
    """Append one history row. Raw addresses are never stored, only their keyed hash."""

    from config.hashing import client_ip, hash_identity

    if target is not None:
        opts = target._meta
        target_type = target_type or f"{ opts.app_label }.{ opts.object_name }"
        target_id = target_id or str( target.pk )
        target_label = target_label or str( target )[: 255 ]

    if actor is None and request is not None and getattr( request, "user", None ) is not None:
        if request.user.is_authenticated:
            actor = request.user

    return AuditEntry.objects.create(
        actor = actor,
        actor_label = getattr( actor, "email", "" ) or "anonymous",
        action = action,
        target_type = target_type,
        target_id = target_id,
        target_label = target_label[: 255 ],
        detail = safe_detail( detail ),
        ip_hash = hash_identity( client_ip( request ) ) if request is not None else "",
        user_agent = ( request.META.get( "HTTP_USER_AGENT", "" ) if request is not None else "" )[: 255 ],
    )


def safe_detail( detail ):
    if not detail:
        return {}
    return { key: value for key, value in dict( detail ).items() if key.lower() not in SECRET_KEYS }


MAX_LEAVES = 40


def leaf_diff( before, after ):
    """For nested page copy: name the exact word that moved, not the whole section around it."""

    changed = _walk( before, after, "" )
    if len( changed ) <= MAX_LEAVES:
        return changed
    kept = { key: changed[ key ] for key in list( changed )[: MAX_LEAVES ] }
    kept[ "and more" ] = { "from": "", "to": f"{ len( changed ) - MAX_LEAVES } further change(s)" }
    return kept


def _walk( before, after, path ):
    if isinstance( before, dict ) and isinstance( after, dict ):
        out = {}
        for name in sorted( set( before ) | set( after ) ):
            out.update( _walk( before.get( name ), after.get( name ), f"{ path }.{ name }" if path else str( name ) ) )
        return out
    # Item numbers count from one, the same way the panel labels them.
    if isinstance( before, list ) and isinstance( after, list ):
        out = {}
        for at in range( max( len( before ), len( after ) ) ):
            old = before[ at ] if at < len( before ) else None
            new = after[ at ] if at < len( after ) else None
            out.update( _walk( old, new, f"{ path }.{ at + 1 }" if path else str( at + 1 ) ) )
        return out
    if before == after or ( before in ( None, "" ) and after in ( None, "" ) ):
        return {}
    return { path or "wording": pair( before, after ) }


def _short( value ):
    if value is None:
        return ""
    if hasattr( value, "isoformat" ):
        return value.isoformat()
    if isinstance( value, ( dict, list, tuple ) ):
        return f"{ len( value ) } item(s)"
    text = str( value )
    return text if len( text ) <= 200 else text[: 200 ] + "..."


def pair( before, after ):
    """The smallest readable account of one change, so two long texts do not look alike."""

    if isinstance( before, str ) and isinstance( after, str ) and len( before ) > 160 and len( after ) > 160:
        start = 0
        limit = min( len( before ), len( after ) )
        while start < limit and before[ start ] == after[ start ]:
            start += 1
        lead = max( 0, start - 40 )
        return { "from": _cut( before, lead ), "to": _cut( after, lead ) }
    return { "from": _short( before ), "to": _short( after ) }


def _cut( text, lead ):
    piece = text[ lead: lead + 160 ]
    return ( "..." if lead else "" ) + piece + ( "..." if len( text ) > lead + 160 else "" )
