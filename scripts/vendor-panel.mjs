/* Carries the panel's build next to the site's own, so a host that only builds this folder can
   still answer /admin without running a second npm install. Run it after every panel change. */

import { cp, readFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const SITE = path.resolve( import.meta.dirname, ".." );
const PANEL_DIST = path.resolve( SITE, "admin", "dist" );
const target = path.join( SITE, "panel-dist" );

if ( !existsSync( PANEL_DIST ) ) {
  console.error( "The panel has not been built. Run npm run build in admin/ first." );
  process.exit( 1 );
}

const index = await readFile( path.join( PANEL_DIST, "index.html" ), "utf8" );
if ( !index.includes( "/admin/" ) ) {
  console.error( "The panel in admin/dist was not built with base /admin/, so it cannot be mounted at /admin." );
  process.exit( 1 );
}

await rm( target, { recursive: true, force: true } );
await cp( PANEL_DIST, target, { recursive: true } );
console.log( `Stored the panel build in ${ target }` );
