/* The panel is a second single-page app, mounted at /admin on the same origin as the site so its
   sign-in cookies stay first-party. A static host serves one folder, so the panel's build is
   copied into the site's dist before it goes up. */

import { cp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const SITE = path.resolve( import.meta.dirname, ".." );
const PANEL_DIST = path.resolve( SITE, "..", "admin", "dist" );
const target = path.join( SITE, "dist", "admin" );

if ( !existsSync( PANEL_DIST ) ) {
  console.warn( `Nothing to copy: build the panel first (npm run build in admin/).` );
  console.warn( "The site builds without it; /admin stays unanswered until the panel is copied in." );
  process.exit( 0 );
}

/* A panel built without base /admin/ would ask for its files at the wrong address once copied. */
const index = await readFile( path.join( PANEL_DIST, "index.html" ), "utf8" );
if ( !index.includes( "/admin/" ) ) {
  console.error( "The panel in admin/dist was not built with base /admin/, so it cannot be mounted here." );
  process.exit( 1 );
}

await rm( target, { recursive: true, force: true } );
await cp( PANEL_DIST, target, { recursive: true } );
console.log( `Copied the panel into ${ target }` );
