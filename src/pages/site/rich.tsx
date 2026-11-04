import type { ReactNode } from "react";

/*
 * A copy string is plain text with four marks the doctor can type:
 *   **strong**, *emphasis*, [label](https://link) and a line break.
 * Nothing else in a stored word is ever read as markup.
 */

const MARKS = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)|\n/g;

const SAFE = /^(https?:|mailto:|tel:|\/|#|\?)/i;

function link( label: string, href: string, key: string ): ReactNode {
  if ( !SAFE.test( href ) ) return label;
  const external = /^https?:/i.test( href );
  return (
    <a key={ key } href={ href } target={ external ? "_blank" : undefined } rel={ external ? "noreferrer" : undefined }>{ label }</a>
  );
}

export function Rich( { text }: { text?: string } ): ReactNode {
  if ( !text ) return null;
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  for ( const found of text.matchAll( MARKS ) ) {
    const [ whole, bold, italic, label, href ] = found;
    const index = found.index ?? 0;
    if ( index > last ) out.push( text.slice( last, index ) );
    const key = `m${ n++ }`;
    if ( bold ) out.push( <strong key={ key }>{ bold }</strong> );
    else if ( italic ) out.push( <em key={ key }>{ italic }</em> );
    else if ( label ) out.push( link( label, href || "", key ) );
    else out.push( <br key={ key } /> );
    last = index + whole.length;
  }
  if ( last < text.length ) out.push( text.slice( last ) );
  return out.length === 1 ? out[ 0 ] : out;
}

/* One paragraph per line, the shape most section bodies arrive in. */
export function Paras( { lines }: { lines?: string[] } ): ReactNode {
  return ( lines || [] ).map( ( line, i ) => <p key={ i }><Rich text={ line } /></p> );
}
