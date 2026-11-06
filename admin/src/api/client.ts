import type { Page, StaffUser } from "./types";

const BASE = ( import.meta.env.VITE_API_URL ?? "" ).replace( /\/$/, "" );

export const SIGNED_OUT = "Your session has ended. Please sign in again.";

/* One round trip to the deployed API is about half a second, and the panel used to pay it again
   for every screen the doctor had already looked at once. A read is answered from memory the
   second time round; if the memory has aged, the copy on screen stays while the new one arrives
   behind it. Any save clears the reads of the part of the site it touched, so what he sees after
   pressing Save is the answer about the row he just changed, never the one from before. */
const FRESH_SECONDS = 15;
const KEEP_SECONDS = 300;

const readCache = new Map<string, { value: unknown; at: number }>();
const readPending = new Map<string, Promise<unknown>>();

/* An uploaded picture is a path on the API's host. Both dev servers forward /media to the
   backend, so the plain path works here; a deployed host serves it beside the site. */
export function mediaUrl( path?: string ): string {
  if ( !path ) return "";
  if ( /^([a-z][a-z0-9+.-]*:)?\/\//i.test( path ) ) return path;
  return `${ BASE }${ path.startsWith( "/" ) ? "" : "/" }${ path }`;
}

export class ApiError extends Error {
  status: number;
  fields: Record<string, string[]>;
  /** How long the server says to wait, when it answered with a block. */
  retryAfter: number | null;

  constructor( status: number, message: string, fields: Record<string, string[]> = {}, retryAfter: number | null = null ) {
    super( message );
    this.status = status;
    this.fields = fields;
    this.retryAfter = retryAfter;
  }

  get( key: string ): string[] | undefined {
    return this.fields[ key ];
  }
}

/* The access token lives in memory only, never in localStorage. The long lived token stays in
   an httpOnly cookie the browser carries by itself, so a script injected into this page has
   nothing worth stealing. Reloading trades that cookie for a fresh access token, which is also
   how the panel finds out whether somebody is still signed in. */
let access: string | null = null;
let inflight: Promise<Renewed | null> | null = null;

/** What a live session hands back: the token to make calls with, and whose calls they are. */
export type Renewed = { access: string; user: StaffUser | null };

export async function renew(): Promise<Renewed | null> {
  inflight =
    inflight ??
    fetch( `${ BASE }/api/auth/refresh/`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } } )
      .then( response => ( response.ok ? response.json() : null ) )
      .then( ( data: ( { access?: unknown; user?: unknown; expires_in?: unknown } | null ) ) => {
        if ( typeof data?.access !== "string" ) {
          access = null;
          return null;
        }
        access = data.access;
        expiresAt = Date.now() + Number( data.expires_in ?? 15 * 60 ) * 1000;
        return { access: data.access, user: ( data.user as StaffUser ) ?? null };
      } )
      .catch( () => {
        access = null;
        return null;
      } )
      .finally( () => {
        inflight = null;
      } );
  return inflight;
}

/** When the current token stops working, in seconds, so the panel can trade it before it dies. */
let expiresAt = 0;

export const session = {
  /** The account this browser is already allowed to be, or null when it has to sign in again. */
  async resume(): Promise<StaffUser | null> {
    const renewed = await renew();
    if ( !renewed ) return null;
    if ( renewed.user ) return renewed.user;
    /* An API that predates the user travelling with the token still knows who it belongs to. */
    return request<StaffUser>( "/api/auth/me/" ).catch( () => {
      session.end();
      return null;
    } );
  },
  /** After a password check, and after a code, the body carries the token in person. */
  open( token: string, lifetimeSeconds = 0 ) {
    access = token;
    expiresAt = Date.now() + lifetimeSeconds * 1000;
    readCache.clear();
  },
  end() {
    access = null;
    expiresAt = 0;
    readCache.clear();
  },
  /** How long before the token dies, in seconds, or null when nothing is signed in. */
  timeLeft(): number | null {
    if ( !access ) return null;
    return Math.max( 0, Math.round( ( expiresAt - Date.now() ) / 1000 ) );
  },
};

function flatten( payload: unknown ): Record<string, string[]> {
  if ( !payload || typeof payload !== "object" ) return {};
  const out: Record<string, string[]> = {};
  for ( const [ key, value ] of Object.entries( payload as Record<string, unknown> ) ) {
    if ( key === "detail" || key === "non_field_errors" ) {
      out.fields = out.fields ?? [];
      out.fields.push( ...asMessages( value ) );
    } else if ( Array.isArray( value ) || typeof value === "string" ) {
      out[ key ] = asMessages( value );
    }
  }
  return out;
}

function asMessages( value: unknown ): string[] {
  if ( typeof value === "string" ) return [ value ];
  if ( Array.isArray( value ) ) return value.flatMap( asMessages );
  return [ String( value ) ];
}

export type Query = Record<string, string | number | boolean | null | undefined>;

export function qs( params: Query ): string {
  const search = new URLSearchParams();
  for ( const [ key, value ] of Object.entries( params ) ) {
    if ( value === null || value === undefined || value === "" ) continue;
    search.set( key, String( value ) );
  }
  const encoded = search.toString();
  return encoded ? `?${ encoded }` : "";
}

async function send( path: string, init: RequestInit, token: string | null ) {
  const headers = new Headers( init.headers );
  headers.set( "Accept", "application/json" );
  if ( init.body && typeof init.body === "string" ) headers.set( "Content-Type", "application/json" );
  if ( token ) headers.set( "Authorization", `Bearer ${ token }` );
  return fetch( `${ BASE }${ path }`, { ...init, headers, credentials: "include" } );
}

export async function request<T>( path: string, init: RequestInit = {}, auth = true ): Promise<T> {
  let response = await send( path, init, auth ? access : null );

  if ( response.status === 401 && auth ) {
    const fresh = await renew();
    if ( !fresh ) throw new ApiError( 401, SIGNED_OUT );
    response = await send( path, init, fresh.access );
  }

  if ( response.status === 204 ) return undefined as T;

  const text = await response.text();
  const payload = text ? safeJson( text ) : null;

  if ( !response.ok ) {
    const fields = flatten( payload );
    const message = fields.fields?.[ 0 ] ?? firstMessage( fields ) ?? `Request failed (${ response.status }).`;
    throw new ApiError( response.status, message, fields, seconds( response.headers.get( "Retry-After" ) ) );
  }
  return ( payload ?? undefined ) as T;
}

function seconds( value: string | null ): number | null {
  const parsed = Number( value );
  return Number.isFinite( parsed ) && parsed > 0 ? parsed : null;
}

function firstMessage( fields: Record<string, string[]> ): string | undefined {
  for ( const messages of Object.values( fields ) ) if ( messages.length ) return messages[ 0 ];
  return undefined;
}

function safeJson( text: string ): unknown {
  try {
    return JSON.parse( text );
  } catch {
    return null;
  }
}

/** The part of the site a path belongs to: /api/cms/images/3/ and /api/cms/posts/ are both cms. */
function section( path: string ): string {
  const parts = path.split( "?" )[ 0 ].split( "/" ).slice( 0, 3 );
  return `${ parts.join( "/" ) }/`;
}

function forget( path: string ) {
  const prefix = section( path );
  for ( const key of readCache.keys() ) {
    if ( key.startsWith( prefix ) ) readCache.delete( key );
  }
}

function refresh( path: string ): Promise<unknown> {
  const running = readPending.get( path );
  if ( running ) return running;

  const work = request<unknown>( path ).then(
    value => {
      readCache.set( path, { value, at: Date.now() } );
      readPending.delete( path );
      return value;
    },
    error => {
      readPending.delete( path );
      throw error;
    }
  );
  readPending.set( path, work );
  return work;
}

async function read<T>( path: string ): Promise<T> {
  const stored = readCache.get( path );
  if ( stored ) {
    const age = ( Date.now() - stored.at ) / 1000;
    if ( age < FRESH_SECONDS ) return stored.value as T;
    if ( age < KEEP_SECONDS ) {
      /* He is looking at real content from a second ago. Let it stay on screen and quietly
         replace it, rather than blanking the page while a number is fetched. */
      refresh( path ).catch( () => undefined );
      return stored.value as T;
    }
    readCache.delete( path );
  }
  return refresh( path ) as Promise<T>;
}

async function write<T>( path: string, init: RequestInit ): Promise<T> {
  const saved = await request<T>( path, init );
  forget( path );
  return saved;
}

/** Only means "this browser has to trade its cookie for a new token"; the caller never shows it. */
class Expired extends Error {}

/** A file travels over XHR because fetch cannot say how much of it has landed, and a picture that
 *  takes eight seconds with no word about it reads as a panel that has stopped answering. */
async function sendFile<T>( path: string, form: FormData, onProgress?: ( fraction: number ) => void ): Promise<T> {
  const attempt = ( token: string | null ) =>
    new Promise<T>( ( resolve, reject ) => {
      const file = new XMLHttpRequest();
      file.open( "POST", `${ BASE }${ path }` );
      file.withCredentials = true;
      if ( token ) file.setRequestHeader( "Authorization", `Bearer ${ token }` );
      file.upload.onprogress = ( event ) => {
        if ( onProgress && event.lengthComputable ) onProgress( event.loaded / event.total );
      };
      file.onload = () => {
        const payload = file.responseText ? safeJson( file.responseText ) : null;
        if ( file.status >= 200 && file.status < 300 ) {
          resolve( ( payload ?? undefined ) as T );
          return;
        }
        if ( file.status === 401 ) {
          reject( new Expired() );
          return;
        }
        const fields = flatten( payload );
        const message = fields.fields?.[ 0 ] ?? firstMessage( fields ) ?? `Request failed (${ file.status }).`;
        reject( new ApiError( file.status, message, fields, seconds( file.getResponseHeader( "Retry-After" ) ) ) );
      };
      file.onerror = () => reject( new ApiError( 0, "The upload did not reach the server." ) );
      file.send( form );
    } );

  let token = access ?? ( await renew() )?.access ?? null;
  let saved: T;
  try {
    saved = await attempt( token );
  } catch ( reason ) {
    if ( ! ( reason instanceof Expired ) ) throw reason;
    token = ( await renew() )?.access ?? null;
    if ( !token ) throw new ApiError( 401, SIGNED_OUT );
    saved = await attempt( token );
  }
  forget( path );
  return saved;
}

export const api = {
  get: <T, >( path: string ) => read<T>( path ),
  post: <T, >( path: string, body?: unknown ) =>
    write<T>( path, { method: "POST", body: body === undefined ? undefined : JSON.stringify( body ) } ),
  patch: <T, >( path: string, body: unknown ) => write<T>( path, { method: "PATCH", body: JSON.stringify( body ) } ),
  put: <T, >( path: string, body: unknown ) => write<T>( path, { method: "PUT", body: JSON.stringify( body ) } ),
  /** A file, sent as multipart so the browser can set the boundary itself. */
  upload: <T, >( path: string, form: FormData, onProgress?: ( fraction: number ) => void ) =>
    sendFile<T>( path, form, onProgress ),
  del: ( path: string ) => write<void>( path, { method: "DELETE" } ),
  page: <T, >( path: string, params: Query = {} ) => read<Page<T>>( `${ path }${ qs( params ) }` ),
  /** Sign in, codes and resets: cookies travel, no bearer token is attached. */
  unauthenticated: <T, >( path: string, body?: unknown ) =>
    request<T>( path, { method: "POST", body: body === undefined ? undefined : JSON.stringify( body ) }, false ),
};
