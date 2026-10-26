import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOTS = [ 'src/components', 'src/pages/site' ];
const SKIP = [ 'src/components/ui/', 'src/components/base/badge.tsx', 'src/components/base/sidebar.tsx', 'src/components/admin-page.tsx' ];

const FORBIDDEN: Array<[ string, RegExp ]> = [
  [ 'arbitrary text size', /text-\[(?:\d|length:(?!inherit\])|clamp|calc|var\(--type)/ ],
  [ 'fixed Tailwind size', /(?<![\w-])text-(?:xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/ ],
  [ 'CSS font-size not from the pack', /font-size:(?!\s*(?:var\(\s*--text-|inherit;|max\(\s*var\(\s*--base-font-size|var\(\s*--base-font-size\s*\);))/ ],
  [ '--type-* token', /--type-[a-z]/ ],
  [ 'heading size override', /\[--text-h[1-4]:/ ],
  [ 'capitals outside the meta style', /(?<![\w-])uppercase(?![\w-])|text-transform:\s*uppercase/ ]
];

function files( dir: string ): string[] {
  return readdirSync( dir ).flatMap( name => {
    const path = join( dir, name );
    return statSync( path ).isDirectory() ? files( path ) : [ path ];
  } );
}

describe( 'type comes only from the pack', () => {
  const sources = ROOTS.flatMap( files )
    .filter( f => /\.(tsx|ts|css)$/.test( f ) && !f.endsWith( '.test.ts' ) )
    .filter( f => !SKIP.some( s => relative( process.cwd(), f ).startsWith( s ) ) );

  it( 'finds the component files', () => {
    expect( sources.length ).toBeGreaterThan( 3 );
  } );

  it( 'no file sets a size of its own', () => {
    const hits: string[] = [];
    for ( const file of sources ) {
      readFileSync( file, 'utf8' ).split( '\n' ).forEach( ( line, i ) => {
        for ( const [ name, pattern ] of FORBIDDEN ) {
          if ( pattern.test( line ) ) {
            hits.push( `${ relative( process.cwd(), file ) }:${ i + 1 } ${ name }` );
          }
        }
      } );
    }
    expect( hits ).toEqual( [] );
  } );
} );
