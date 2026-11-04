/* A standing id for this browser, so the backend can tell one device from another
   even when the enquiry carries the same name and number as the last one. */

const KEY = "kandel_device_id";

export function makeId(): string {
  if ( typeof crypto !== "undefined" && crypto.randomUUID ) return crypto.randomUUID().replace( /-/g, "" );
  return `${ Math.random().toString( 36 ).slice( 2 ) }${ Date.now().toString( 36 ) }`;
}

export function deviceId(): string {
  try {
    const stored = localStorage.getItem( KEY );
    if ( stored ) return stored.slice( 0, 64 );
    const fresh = makeId();
    localStorage.setItem( KEY, fresh );
    return fresh;
  } catch {
    /* Private mode or a full store: the request simply arrives without a device id. */
    return "";
  }
}

export function deviceHeaders(): Record<string, string> {
  const id = deviceId();
  return id ? { "X-Device-Id": id } : {};
}
