import type { Page } from "./types";

const BASE = ( import.meta.env.VITE_API_URL ?? "" ).replace( /\/$/, "" );

export const SIGNED_OUT = "Your session has ended. Please sign in again.";

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
let inflight: Promise<string | null> | null = null;

async function renew(): Promise<string | null> {
  inflight =
    inflight ??
    fetch( `${ BASE }/api/auth/refresh/`, { method: "POST", credentials: "include", headers: { Accept: "application/json" } } )
      .then( response => ( response.ok ? response.json() : null ) )
      .then( ( data: { access?: unknown } | null ) => {
        access = typeof data?.access === "string" ? data.access : null;
        return access;
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

export const session = {
  /** True when this browser still holds a live session. */
  resume: () => renew().then( token => token !== null ),
  /** After a password check, and after a code, the body carries the token in person. */
  open( token: string ) {
    access = token;
  },
  end() {
    access = null;
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
    response = await send( path, init, fresh );
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

export const api = {
  get: <T, >( path: string ) => request<T>( path ),
  post: <T, >( path: string, body?: unknown ) =>
    request<T>( path, { method: "POST", body: body === undefined ? undefined : JSON.stringify( body ) } ),
  patch: <T, >( path: string, body: unknown ) => request<T>( path, { method: "PATCH", body: JSON.stringify( body ) } ),
  put: <T, >( path: string, body: unknown ) => request<T>( path, { method: "PUT", body: JSON.stringify( body ) } ),
  /** A file, sent as multipart so the browser can set the boundary itself. */
  upload: <T, >( path: string, form: FormData ) => request<T>( path, { method: "POST", body: form } ),
  del: ( path: string ) => request<void>( path, { method: "DELETE" } ),
  page: <T, >( path: string, params: Query = {} ) => request<Page<T>>( `${ path }${ qs( params ) }` ),
  /** Sign in, codes and resets: cookies travel, no bearer token is attached. */
  unauthenticated: <T, >( path: string, body?: unknown ) =>
    request<T>( path, { method: "POST", body: body === undefined ? undefined : JSON.stringify( body ) }, false ),
};
