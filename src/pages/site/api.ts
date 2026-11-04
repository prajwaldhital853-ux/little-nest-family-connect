/* The site's own backend: the API's origin once it is deployed somewhere public,
   empty otherwise so requests go to this same host and the Vite dev proxy forwards them.
   An unreachable API is what makes the bundled fallback reachable. */
export const API_BASE = ( import.meta.env.VITE_API_URL as string | undefined || "" ).replace( /\/+$/, "" );

/* An uploaded picture is a path on the same host as the API, so it travels the route /api already
   uses: the dev servers forward it, and a deployed host serves it beside the site. */
export function mediaUrl( path?: string ): string {
  if ( !path ) return "";
  if ( /^([a-z][a-z0-9+.-]*:)?\/\//i.test( path ) ) return path;
  return `${ API_BASE }${ path.startsWith( "/" ) ? "" : "/" }${ path }`;
}
