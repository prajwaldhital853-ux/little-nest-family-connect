import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import type { DrMediaItem, DrPost, PressItem } from "./doctor-sections";
import type { SiteFaq } from "./content";
import { faqs as bundledFaqs, posts as bundledPosts, press as bundledPress, videos as bundledVideos } from "./content";
import { publicationGroups as bundledPublications } from "./publications";
import type { PublicationGroup } from "./publications";
import type { ApiSitePayload } from "./feed";
import { groupPublications, postRow, pressRow, videoRow } from "./feed";
import { API_BASE } from "./api";

/* What the page sections need, whichever source supplied it. */
export interface SiteData {
  posts: DrPost[];
  videos: DrMediaItem[];
  press: PressItem[];
  faqs: SiteFaq[];
  publications: PublicationGroup[];
  /* Page wording straight from the CMS, keyed by page. The bundle fills any gap. */
  copy?: Record<string, unknown>;
}

/* A CMS that is down, slow, or still being filled in must never leave a page emptier than the bundle. */
const REQUEST_TIMEOUT = 2500;

const bundledData: SiteData = {
  posts: bundledPosts.map( postRow ),
  videos: bundledVideos.map( videoRow ),
  press: bundledPress.map( pressRow ),
  faqs: bundledFaqs,
  publications: bundledPublications,
};

async function fetchSiteContent( signal: AbortSignal ): Promise<ApiSitePayload> {
  const controller = new AbortController();
  const passOn = () => controller.abort();
  signal.addEventListener( "abort", passOn );
  const timer = setTimeout( () => controller.abort(), REQUEST_TIMEOUT );
  try {
    const response = await fetch( `${ API_BASE }/api/cms/site/`, { signal: controller.signal, headers: { accept: "application/json" } } );
    if ( !response.ok ) {
      throw new Error( `Content request failed with ${ response.status }` );
    }
    return await response.json() as ApiSitePayload;
  } finally {
    clearTimeout( timer );
    signal.removeEventListener( "abort", passOn );
  }
}

function fromApi( payload: ApiSitePayload ): SiteData {
  const choose = < T, >( live: T[] | undefined, fallback: T[] ) => ( live && live.length > 0 ? live : fallback );
  return {
    posts: choose( payload.posts?.map( postRow ), bundledData.posts ),
    videos: choose( payload.videos?.map( videoRow ), bundledData.videos ),
    press: choose( payload.press?.map( pressRow ), bundledData.press ),
    faqs: choose( payload.faqs, bundledData.faqs ),
    copy: payload.copy,
    publications: choose(
      payload.publications && payload.publications.length > 0 ? groupPublications( payload.publications ) : undefined,
      bundledData.publications,
    ),
  };
}

const SiteDataContext = createContext<SiteData>( bundledData );

/* Whether the corpus is being asked for again, for a page written since the last copy arrived. */
export interface SiteStatus {
  busy: boolean;
  /* Nothing has come from the API yet in this visit, so every word on the screen is the bundle's. */
  waiting: boolean;
  chase: () => void;
}

const SiteStatusContext = createContext<SiteStatus>( { busy: false, waiting: false, chase: () => undefined } );

export function SiteDataProvider( { children }: { children: ReactNode } ) {
  const { data, isFetching, refetch } = useQuery( {
    queryKey: [ "site-content" ],
    queryFn: ( { signal } ) => fetchSiteContent( signal ),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  } );

  const value = useMemo( () => ( data ? fromApi( data ) : bundledData ), [ data ] );

  /* The panel writes straight to the API, so a new article exists a second after it is saved while
     the copy the pages are built from can still be minutes old. One fresh copy settles it. */
  const chased = useRef( 0 );
  const chase = useCallback(() => {
    const now = Date.now();
    if ( now - chased.current < 4000 ) return;
    chased.current = now;
    void refetch();
  }, [ refetch ] );

  const status = useMemo( () => ( { busy: isFetching, waiting: data === undefined, chase } ), [ isFetching, data, chase ] );

  return (
    <SiteStatusContext.Provider value={ status }>
      <SiteDataContext.Provider value={ value }>{ children }</SiteDataContext.Provider>
    </SiteStatusContext.Provider>
  );
}

export function useSiteData(): SiteData {
  return useContext( SiteDataContext );
}

export function useSiteStatus(): SiteStatus {
  return useContext( SiteStatusContext );
}
