/* The site watches itself: which page was looked at, how long it held attention, and how
   fast it painted. What leaves the browser is a path, two random tokens and five numbers.
   The backend salts those tokens afresh every day, so nothing here follows a person. */
import { API_BASE } from "./api";
import { deviceId, makeId } from "./device";

const ENDPOINT = `${ API_BASE }/api/analytics/collect/`;
const SESSION_KEY = "kandel_visit_id";

/* A look shorter than this was a mis-tap, not a visit worth a duration. */
const MIN_HELD_MS = 500;
/* React mounts twice in development and a bounced click lands twice; neither is a second reader. */
const DEDUPE_MS = 1000;

type Metric = "lcp" | "fcp" | "inp" | "ttfb" | "cls";
type Metrics = Partial<Record<Metric, number>>;

interface Ping {
  kind: "pageview" | "leave" | "vitals";
  path: string;
  referrer?: string;
  duration_ms?: number;
  utm?: Record<string, string>;
  metrics?: Metrics;
}

/* The entry types the browser exposes only to observers, each with the one field we read. */
interface ShiftEntry { hadRecentInput?: boolean; value?: number }
interface EventEntry { interactionId?: number; duration?: number }
interface NavEntry { responseStart?: number; requestStart?: number }

function sessionId(): string {
  try {
    const stored = sessionStorage.getItem( SESSION_KEY );
    if ( stored ) return stored.slice( 0, 64 );
    const fresh = makeId();
    sessionStorage.setItem( SESSION_KEY, fresh );
    return fresh;
  } catch {
    /* Private mode: counts still work, they just cannot group tabs into one visit. */
    return "";
  }
}

function refused(): boolean {
  if ( typeof navigator === "undefined" ) return true;
  const browser = navigator as Navigator & { doNotTrack?: string; globalPrivacyControl?: boolean };
  return browser.doNotTrack === "1" || browser.globalPrivacyControl === true;
}

function send( ping: Ping ): void {
  if ( refused() ) return;
  const payload = JSON.stringify( { visitor: deviceId(), session: sessionId(), ...ping } );
  try {
    if ( navigator.sendBeacon ) {
      navigator.sendBeacon( ENDPOINT, new Blob( [ payload ], { type: "application/json" } ) );
      return;
    }
    void fetch( ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "omit",
    } ).catch( () => undefined );
  } catch {
    /* No network means no report. The page never hears about it. */
  }
}

function here(): string {
  return window.location.pathname;
}

function campaignTags(): Record<string, string> | undefined {
  const params = new URLSearchParams( window.location.search );
  const utm: Record<string, string> = {};
  for ( const key of [ "source", "medium", "campaign" ] ) {
    const value = params.get( `utm_${ key }` );
    if ( value ) utm[ key ] = value.slice( 0, 120 );
  }
  return Object.keys( utm ).length ? utm : undefined;
}

let viewing: { path: string; at: number } | null = null;
let lastOpened: { path: string; at: number } | null = null;
let pending: { path: string; metrics: Metrics } | null = null;
let watching = false;
let listenersAttached = false;

/* Metrics belong to the page they were measured on, so a bucket turns over when the route does. */
function capture( metric: Metric, value: number ): void {
  if ( !watching ) return;
  const path = here();
  if ( !pending || pending.path !== path ) {
    flushVitals();
    pending = { path, metrics: {} };
  }
  pending.metrics[ metric ] = Math.round( value * 1000 ) / 1000;
}

function flushVitals(): void {
  const shot = pending;
  pending = null;
  if ( shot && Object.keys( shot.metrics ).length ) send( { kind: "vitals", path: shot.path, metrics: shot.metrics } );
}

export function openView( path: string ): void {
  closeView();
  const at = Date.now();
  viewing = { path, at };
  if ( lastOpened && lastOpened.path === path && at - lastOpened.at < DEDUPE_MS ) return;
  lastOpened = { path, at };
  send( { kind: "pageview", path, referrer: document.referrer || undefined, utm: campaignTags() } );
}

export function closeView(): void {
  const look = viewing;
  viewing = null;
  flushVitals();
  if ( !look ) return;
  const held = Date.now() - look.at;
  if ( held >= MIN_HELD_MS ) send( { kind: "leave", path: look.path, duration_ms: Math.round( held ) } );
}

function attachListeners(): void {
  if ( listenersAttached || typeof document === "undefined" ) return;
  listenersAttached = true;
  const switchOnVisibility = () => {
    if ( document.visibilityState === "hidden" ) closeView();
    else openView( here() );
  };
  document.addEventListener( "visibilitychange", switchOnVisibility );
  window.addEventListener( "pagehide", closeView );
}

/** Watches the numbers Google calls the core web vitals, using only what the browser already knows.
   Once is enough: every entry the browser has already recorded arrives with buffered: true. */
export function watchVitals(): void {
  if ( watching || typeof PerformanceObserver === "undefined" ) return;
  watching = true;

  let shifts = 0;
  let worstInteraction = 0;

  const follow = ( type: string, read: ( entry: PerformanceEntry ) => void, options?: Record<string, unknown> ) => {
    try {
      const observer = new PerformanceObserver( list => {
        for ( const entry of list.getEntries() ) read( entry );
      } );
      observer.observe( { type, buffered: true, ...options } as PerformanceObserverInit );
    } catch {
      /* A browser without this entry type simply has no number for it. */
    }
  };

  follow( "paint", entry => {
    if ( entry.name === "first-contentful-paint" ) capture( "fcp", entry.startTime );
  } );
  follow( "largest-contentful-paint", entry => capture( "lcp", entry.startTime ) );
  follow( "layout-shift", entry => {
    const shift = entry as PerformanceEntry & ShiftEntry;
    if ( !shift.hadRecentInput ) {
      shifts += shift.value || 0;
      capture( "cls", shifts );
    }
  } );
  follow( "event", entry => {
    const event = entry as PerformanceEntry & EventEntry;
    if ( !event.interactionId ) return;
    worstInteraction = Math.max( worstInteraction, event.duration || 0 );
    capture( "inp", worstInteraction );
  }, { durationThreshold: 16 } );

  const navigation = performance.getEntriesByType( "navigation" )[ 0 ] as ( PerformanceEntry & NavEntry ) | undefined;
  if ( navigation && navigation.responseStart ) {
    capture( "ttfb", Math.max( 0, navigation.responseStart - ( navigation.requestStart || navigation.startTime ) ) );
  }
}

/** One look at one page: starts the watching and hands back the line that closes this look. */
export function startAnalytics( path: string ): () => void {
  attachListeners();
  watchVitals();
  openView( path );
  return closeView;
}
