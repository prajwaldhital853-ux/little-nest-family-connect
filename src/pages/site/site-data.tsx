import { createContext, useContext, useMemo, type ReactNode } from "react";
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

export function SiteDataProvider( { children }: { children: ReactNode } ) {
  const { data } = useQuery( {
    queryKey: [ "site-content" ],
    queryFn: ( { signal } ) => fetchSiteContent( signal ),
    staleTime: 5 * 60 * 1000,
    retry: 0,
  } );

  const value = useMemo( () => ( data ? fromApi( data ) : bundledData ), [ data ] );

  return <SiteDataContext.Provider value={ value }>{ children }</SiteDataContext.Provider>;
}

export function useSiteData(): SiteData {
  return useContext( SiteDataContext );
}
