/* Turning CMS rows into what the page sections read, and walking a feed a page at a time. */

import { useEffect, useRef, useState } from "react";

import type { DrMediaItem, DrPost, PressItem } from "./doctor-sections";
import { home } from "./media";
import type { PhotoKey, SitePhoto } from "./media";
import type { PublicationGroup } from "./publications";
import type { SiteFaq } from "./content";
import { API_BASE } from "./api";

/* A CMS row that names an image: either a key from the site bundle or a link of its own. */
export interface PhotoFields {
  photo?: string;
  photo_url?: string;
  photo_alt?: string;
}

export interface ApiPost extends PhotoFields {
  slug: string;
  title: string;
  topic: string;
  excerpt: string;
  date?: string;
  minutes?: number;
  body: string[];
}

export interface ApiVideo {
  url: string;
  kind: string;
  title: string;
  source?: string;
  poster_url?: string;
}

export interface ApiPress extends PhotoFields {
  href: string;
  topic: string;
  title: string;
  source: string;
  blurb: string;
}

export interface ApiFaq {
  group: SiteFaq[ "group" ];
  q: string;
  a: string;
}

export interface ApiPublication {
  year: number;
  title: string;
  authors: string;
  venue: string;
  link: string;
  tag: string;
}

export interface ApiSitePayload {
  posts?: ApiPost[];
  videos?: ApiVideo[];
  press?: ApiPress[];
  faqs?: ApiFaq[];
  publications?: ApiPublication[];
  copy?: Record<string, unknown>;
}

export function photoFor( row: PhotoFields, alt: string ): SitePhoto {
  const bundled = row.photo ? home[ row.photo as PhotoKey ] : undefined;
  if ( bundled ) return bundled;
  if ( row.photo_url ) return { src: row.photo_url, alt: row.photo_alt || alt };
  return home.ageingCouple;
}

export function postRow( row: ApiPost ): DrPost {
  return {
    slug: row.slug,
    title: row.title,
    topic: row.topic,
    excerpt: row.excerpt,
    date: row.date || undefined,
    minutes: row.minutes,
    photo: photoFor( row, row.title ),
    body: row.body,
  };
}

export function videoRow( row: ApiVideo ): DrMediaItem {
  return {
    url: row.url,
    kind: row.kind,
    title: row.title,
    source: row.source,
    poster: row.poster_url ? { src: row.poster_url, alt: row.title } : undefined,
  };
}

export function pressRow( row: ApiPress ): PressItem {
  return {
    href: row.href,
    topic: row.topic,
    title: row.title,
    source: row.source,
    blurb: row.blurb,
    photo: photoFor( row, row.title ),
  };
}

export function groupPublications( rows: ApiPublication[] ): PublicationGroup[] {
  const groups: PublicationGroup[] = [];
  for ( const row of rows ) {
    const entry = { year: row.year, title: row.title, authors: row.authors, venue: row.venue, href: row.link };
    const found = groups.find( group => group.label === row.tag );
    if ( found ) found.items.push( entry );
    else groups.push( { label: row.tag, items: [ entry ] } );
  }
  return groups;
}

/* ------------------------------------------------------------------ */
/* Cursor paging                                                       */
/* ------------------------------------------------------------------ */

interface FeedResponse {
  results: unknown[];
  next?: string | null;
}

/**
 * The API answers with an absolute link built for its own host, so only the cursor
 * is worth keeping. The next request always goes to the origin the page was served from.
 */
function cursorIn( link?: string | null ): string | null {
  if ( !link ) return null;
  try {
    return new URL( link ).searchParams.get( "cursor" );
  } catch {
    return null;
  }
}

function feedUrl( path: string, size: number, cursor?: string | null ): string {
  const params = new URLSearchParams( { page_size: String( size ) } );
  if ( cursor ) params.set( "cursor", cursor );
  return `${ API_BASE }${ path }/?${ params.toString() }`;
}

async function getFeed( url: string, signal: AbortSignal ): Promise<FeedResponse> {
  const response = await fetch( url, { signal, headers: { accept: "application/json" } } );
  if ( !response.ok ) {
    throw new Error( `Feed request failed with ${ response.status }` );
  }
  const page = await response.json() as Partial<FeedResponse>;
  return { results: Array.isArray( page.results ) ? page.results : [], next: page.next };
}

export interface PagedFeed<T> {
  rows: T[];
  hasMore: boolean;
  loading: boolean;
  more: () => void;
}

/**
 * One page at a time from the CMS, with the list the site already carries as the floor.
 * If the feed cannot be reached the button keeps working, it just reveals the bundled rows.
 */
export function usePagedFeed<T>( { path, size, seed, map }: {
  path: string;
  size: number;
  seed: T[];
  map: ( row: Record<string, unknown> ) => T;
} ): PagedFeed<T> {
  const read = useRef( map );
  read.current = map;

  const [ pages, setPages ] = useState<T[][]>( [] );
  const [ live, setLive ] = useState( false );
  const [ cursor, setCursor ] = useState<string | null>( null );
  const [ loading, setLoading ] = useState( false );
  const [ shown, setShown ] = useState( size );

  useEffect( () => {
    const controller = new AbortController();
    getFeed( feedUrl( path, size ), controller.signal )
      .then( page => {
        if ( controller.signal.aborted ) return;
        setPages( [ page.results.map( row => read.current( row as Record<string, unknown> ) ) ] );
        setCursor( cursorIn( page.next ) );
        setLive( true );
      } )
      .catch( () => {
        if ( !controller.signal.aborted ) setLive( false );
      } );
    return () => controller.abort();
  }, [ path, size ] );

  const more = () => {
    if ( !live || cursor === null || loading ) return;
    setLoading( true );
    getFeed( feedUrl( path, size, cursor ), new AbortController().signal )
      .then( page => {
        setPages( rows => [ ...rows, page.results.map( row => read.current( row as Record<string, unknown> ) ) ] );
        setCursor( cursorIn( page.next ) );
      } )
      .catch( () => undefined )
      .finally( () => setLoading( false ) );
  };

  return {
    rows: live ? pages.flat() : seed.slice( 0, shown ),
    hasMore: live ? cursor !== null : seed.length > shown,
    loading,
    more,
  };
}
