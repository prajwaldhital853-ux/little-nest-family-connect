/* The lists on a page arrive as columns of blocks, because that is how the site lays them out side
   by side. Editing them as columns is what makes the panel twist itself into knots, so the panel
   reads them flat and writes them back with the columns worked out for you. */

type Box = Record<string, unknown>;

export interface BlockGroup {
  column: number;
  raw: Box;
  title: string;
  entries: Box[];
}

export function flattenColumns( value: unknown ): BlockGroup[] {
  const out: BlockGroup[] = [];
  asList( value ).forEach( ( column, c ) => {
    asList( column ).forEach( block => {
      const raw = ( block ?? {} ) as Box;
      out.push( { column: c, raw, title: String( raw.title ?? "" ), entries: asList( raw.entries ) as Box[] } );
    } );
  } );
  return out;
}

/** Rebuild the columns, keeping each block's other keys and dropping a column that has been emptied. */
export function stackColumns( groups: BlockGroup[] ): Box[][] {
  const columns: Box[][] = [];
  for ( const one of groups ) {
    const at = Math.min( one.column, columns.length );
    while ( columns.length <= at ) columns.push( [] );
    columns[ at ].push( { ...one.raw, title: one.title, entries: one.entries } );
  }
  return columns;
}

/** A list of papers is known by its name, so the panel offers the publication list only where it belongs. */
export function isPaperList( title: string ) {
  return /publication|paper|article/i.test( title );
}

/** A new list joins the last column, so the page never gains a column holding one item. */
export function lastColumnOf( groups: BlockGroup[] ): number {
  return groups.length ? groups[ groups.length - 1 ].column : 0;
}

function asList( value: unknown ): unknown[] {
  return Array.isArray( value ) ? value : [];
}
