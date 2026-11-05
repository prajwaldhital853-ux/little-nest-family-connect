/* Every word the site shows, with the CMS able to replace any of it. */

import bundledJson from "./copy.json";

export type CopyJson = string | number | boolean | null | CopyJson[] | { [key: string]: CopyJson };

/* The bundle is the shape of the truth: the site renders from it and the panel edits a copy of it. */
export const bundledCopy = bundledJson as unknown as CopyBundle;

export interface CopyBundle {
  global: typeof bundledJson.global;
  home: typeof bundledJson.home;
  about: typeof bundledJson.about;
  research: typeof bundledJson.research;
  "healthy-ageing": typeof bundledJson["healthy-ageing"];
  "how-it-works": typeof bundledJson["how-it-works"];
  teaching: typeof bundledJson.teaching;
  media: typeof bundledJson.media;
  blog: typeof bundledJson.blog;
  article: typeof bundledJson.article;
  contact: typeof bundledJson.contact;
}

function kindOf( value: unknown ): string {
  if ( Array.isArray( value ) ) return "array";
  if ( value && typeof value === "object" ) return "object";
  if ( typeof value === "string" ) return "string";
  if ( typeof value === "number" || typeof value === "boolean" ) return "scalar";
  return "";
}

/**
 * Live wording wins, but only where it is the same kind of thing the site was built to render.
 * A CMS row that arrives half-written, emptied or reshaped cannot leave a page blanker than the bundle.
 */
export function mergeValue( base: unknown, live: unknown ): unknown {
  const wanted = kindOf( live );
  if ( !wanted || wanted !== kindOf( base ) ) return base;
  if ( wanted === "array" ) {
    const liveList = live as unknown[];
    if ( liveList.length === 0 ) return base;
    const baseList = base as unknown[];
    /* Elements keep the bundle's shape: a row the panel half-saved, like a column that arrived as
       an empty list, is dropped instead of reaching a renderer that would fall over on it. */
    const merged = liveList.map( ( item, index ) =>
      index < baseList.length ? mergeValue( baseList[ index ], item ) : item
    );
    const kept = merged.filter( ( item, index ) => index < baseList.length || kindOf( item ) === kindOf( baseList[ 0 ] ) );
    return kept.length > 0 ? kept : base;
  }
  if ( wanted === "object" ) {
    const merged: Record<string, unknown> = { ...( base as Record<string, unknown> ) };
    for ( const [ key, value ] of Object.entries( live as Record<string, unknown> ) ) {
      merged[ key ] = key in merged ? mergeValue( merged[ key ], value ) : value;
    }
    return merged;
  }
  return live;
}

export function mergeCopy( live?: Record<string, unknown> | null ): CopyBundle {
  const merged: Record<string, unknown> = { ...( bundledCopy as unknown as Record<string, unknown> ) };
  for ( const [ page, blob ] of Object.entries( bundledCopy as unknown as Record<string, unknown> ) ) {
    merged[ page ] = mergeValue( blob, live?.[ page ] );
  }
  return merged as unknown as CopyBundle;
}

/** "Thank you. Your enquiry is filed as {reference}." with the blanks filled in. */
export function fill( template: string | undefined, vars: Record<string, string | number > ): string {
  return ( template || "" ).replace( /\{(\w+)\}/g, ( whole, key: string ) => ( key in vars ? String( vars[ key ] ) : whole ) );
}
