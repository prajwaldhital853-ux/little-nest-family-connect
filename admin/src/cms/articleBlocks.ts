export type BlockType = "h2" | "h3" | "p" | "ul" | "ol" | "quote";

/** One thing the doctor typed. A list keeps its lines in items, everything else in text. */
export interface Block {
  type: BlockType;
  text: string;
  items: string[];
}

export const BLOCK_KINDS: [BlockType, string][] = [
  [ "p", "Paragraph" ],
  [ "h2", "Heading" ],
  [ "h3", "Sub heading" ],
  [ "ul", "Bullet list" ],
  [ "ol", "Numbered list" ],
  [ "quote", "Pull quote" ],
];

const LISTS = new Set<BlockType>( [ "ul", "ol" ] );

export function isList( type: BlockType ): boolean {
  return LISTS.has( type );
}

export function emptyBlock( type: BlockType ): Block {
  return { type, text: "", items: isList( type ) ? [ "" ] : [] };
}

function known( type: unknown ): type is BlockType {
  return BLOCK_KINDS.some( ( [ key ] ) => key === type );
}

function asBlock( value: unknown ): Block | null {
  if ( !value || typeof value !== "object" ) return null;
  const row = value as Record<string, unknown>;
  if ( !known( row.type ) ) return null;
  const lines = Array.isArray( row.items ) ? row.items.map( line => String( line ?? "" ) ) : [];
  return {
    type: row.type,
    text: typeof row.text === "string" ? row.text : "",
    items: isList( row.type ) ? ( lines.length ? lines : [ "" ] ) : [],
  };
}

/**
 * The blocks as the API sent them, and for an article written before there were blocks, the
 * plain body read one paragraph per blank line.
 */
export function readBlocks( raw: unknown, body?: unknown ): Block[] {
  if ( Array.isArray( raw ) ) return raw.map( asBlock ).filter( ( block ): block is Block => block !== null );
  const text = typeof body === "string" ? body.trim() : "";
  if ( !text ) return [];
  return text
    .split( /\n\s*\n/ )
    .map( line => line.trim() )
    .filter( line => line )
    .map( line => ( { type: "p" as const, text: line, items: [] } ) );
}

export function toValue( blocks: Block[] ): string {
  return JSON.stringify( blocks );
}

export function fromValue( value: string ): Block[] {
  try {
    return readBlocks( JSON.parse( value ) );
  } catch {
    return [];
  }
}

/** What leaves the panel: a blank block is a block he walked away from, not an empty article. */
export function sendBlocks( blocks: Block[] ): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for ( const block of blocks ) {
    if ( isList( block.type ) ) {
      const items = block.items.map( line => line.trim() ).filter( Boolean );
      if ( items.length ) out.push( { type: block.type, items } );
    } else {
      const text = block.text.trim();
      if ( text ) out.push( { type: block.type, text } );
    }
  }
  return out;
}
