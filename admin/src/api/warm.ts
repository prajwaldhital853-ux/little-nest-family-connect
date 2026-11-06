import { api } from "./client";
import type { Query } from "./client";
import { resources } from "../cms/resources";

/* The panel opens on Today, but he spends his day in the screens beside it, and every one of them
   used to pay a round trip to the API only when he arrived. Two habits save that trip:

   warming, after Today has drawn, asks for the lists he moves between most; and
   prefetching, the moment the pointer touches a name in the rail or a filter tab, asks the same
   question that click was about to ask.

   Each spelling below has to match the screen's own, because the memory keys on the address: the
   screens send blank filters too, and a blank drops out of the address, so first page of a list
   reads the same either way round. */

const FIRST_PAGE: Query = { page: 1, page_size: 20 };
const MANY: Query = { page_size: 100 };

/** The single question a screen asks as it opens. */
const READS: Record<string, ( () => Promise<unknown> )[]> = {
  "/appointments": [ () => api.page( "/api/appointments/", FIRST_PAGE ) ],
  "/booking-form": [ () => api.get( "/api/cms/pages/contact/" ) ],
  "/home": [ () => api.get( "/api/cms/pages/home/" ) ],
  "/pages": [ () => api.page( "/api/cms/pages/", FIRST_PAGE ) ],
  "/gallery": [ () => api.page( "/api/cms/images/", MANY ) ],
  "/seo": [ () => api.get( "/api/cms/pages/global/" ) ],
  "/analytics": [ () => api.get( "/api/analytics/summary/?days=30" ) ],
  "/audit": [ () => api.page( "/api/audit/entries/", { page: 1, page_size: 25 } ), () => api.get( "/api/audit/entries/facets/" ) ],
  "/staff": [ () => api.page( "/api/auth/users/", { ...MANY, ordering: "email" } ) ],
};

/* The five written kinds share one list component, so each gets its own address in the rail. */
for ( const resource of resources ) {
  READS[ `/content/${ resource.slug }` ] = [ () => api.page( resource.endpoint, FIRST_PAGE ) ];
}

/** The screens worth loading before he asks: the lists, and the gallery every picture slot reads. */
const WARM = [ "/content", "/pages", "/appointments", "/gallery" ];

let started = false;

/** Ask once a visit, on the way back from the first screen, and never while it is being drawn. */
export function warmWhenIdle() {
  if ( started ) return;
  started = true;
  const idle = ( window as Window & { requestIdleCallback?: ( work: () => void, options?: { timeout: number } ) => void } ).requestIdleCallback;
  const go = () => {
    for ( const route of Object.keys( READS ) ) {
      if ( !WARM.some( start => route.startsWith( start ) ) ) continue;
      prefetch( route );
    }
  };
  if ( idle ) idle( go, { timeout: 4000 } );
  else window.setTimeout( go, 1500 );
}

/** Spend the trip a hovering pointer has already promised. A repeat read costs nothing: identical
 *  questions in flight share one answer, and a warm answer is not asked for twice. */
export function prefetch( route: string ) {
  for ( const read of READS[ route ] ?? [] ) read().catch( () => undefined );
}

/** The same trick for a filter tab: resting the pointer on Confirmed is the click about to
 *  happen, and spelling the view the way the screen spells it means the click finds the rows. */
export function prefetchPage( path: string, params: Query ) {
  api.page( path, params ).catch( () => undefined );
}
