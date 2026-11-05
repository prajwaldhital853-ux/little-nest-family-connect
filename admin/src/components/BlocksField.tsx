import { BLOCK_KINDS, emptyBlock, fromValue, isList, toValue } from "../cms/articleBlocks";
import type { Block, BlockType } from "../cms/articleBlocks";
import { Icon } from "./icons";
import { TextArea } from "./ui";

/* One row per block, in the order the article reads on the site. */
export default function BlocksField( { value, onChange }: { value: string; onChange: ( next: string ) => void } ) {
  const blocks = fromValue( value );

  const write = ( next: Block[] ) => onChange( toValue( next ) );

  const patch = ( at: number, part: Partial<Block> ) =>
    write( blocks.map( ( block, index ) => ( index === at ? { ...block, ...part } : block ) ) );

  const move = ( at: number, by: number ) => {
    const to = at + by;
    if ( to < 0 || to >= blocks.length ) return;
    const next = [ ...blocks ];
    [ next[ at ], next[ to ] ] = [ next[ to ], next[ at ] ];
    write( next );
  };

  return (
    <div className="article-blocks">
      { blocks.map( ( block, at ) => (
        <BlockRow
          key={ at }
          block={ block }
          at={ at }
          last={ blocks.length }
          onPatch={ part => patch( at, part ) }
          onMove={ by => move( at, by ) }
          onRemove={ () => write( blocks.filter( ( _, index ) => index !== at ) ) }
        />
      ) ) }

      { !blocks.length ? <p className="text-small quiet">Nothing written yet. Add the first heading or paragraph below.</p> : null }

      <div className="article-add">
        <span className="field-label">Add to the article</span>
        <div className="article-add-line">
          { BLOCK_KINDS.map( ( [ type, label ] ) => (
            <button type="button" key={ type } onClick={ () => write( [ ...blocks, emptyBlock( type ) ] ) }>
              <Icon name={ addIcon( type ) } size={ 14 } />
              { label }
            </button>
          ) ) }
        </div>
      </div>
    </div>
  );
}

function BlockRow( { block, at, last, onPatch, onMove, onRemove }: {
  block: Block;
  at: number;
  last: number;
  onPatch: ( part: Partial<Block> ) => void;
  onMove: ( by: number ) => void;
  onRemove: () => void;
} ) {
  const list = isList( block.type );
  const label = BLOCK_KINDS.find( ( [ type ] ) => type === block.type )?.[ 1 ] ?? "Block";

  return (
    <div className={ `article-block is-${ block.type }` }>
      <div className="article-block-head">
        <span className="article-block-num">{ at + 1 }</span>
        <select
          className="article-block-kind"
          aria-label={ `Type of ${ label.toLowerCase() } ${ at + 1 }` }
          value={ block.type }
          onChange={ event => {
            const type = event.target.value as BlockType;
            onPatch( { type, items: isList( type ) ? ( block.items.length ? block.items : [ "" ] ) : [] } );
          } }
        >
          { BLOCK_KINDS.map( ( [ type, kind ] ) => (
            <option key={ type } value={ type }>{ kind }</option>
          ) ) }
        </select>
        <div className="article-block-tools">
          <button type="button" className="icon-btn" onClick={ () => onMove( -1 ) } disabled={ at === 0 } aria-label={ `Move ${ label.toLowerCase() } ${ at + 1 } up` }>
            <Icon name="up" size={ 15 } />
          </button>
          <button type="button" className="icon-btn" onClick={ () => onMove( 1 ) } disabled={ at === last - 1 } aria-label={ `Move ${ label.toLowerCase() } ${ at + 1 } down` }>
            <Icon name="down" size={ 15 } />
          </button>
          <button type="button" className="icon-btn" onClick={ onRemove } aria-label={ `Remove ${ label.toLowerCase() } ${ at + 1 }` }>
            <Icon name="trash" size={ 15 } />
          </button>
        </div>
      </div>

      { list ? (
        <TextArea
          rows={ Math.max( 3, block.items.length ) }
          value={ block.items.join( "\n" ) }
          placeholder="One item per line."
          onChange={ event => onPatch( { items: event.target.value.split( "\n" ) } ) }
        />
      ) : (
        <TextArea
          rows={ block.type === "p" ? Math.min( 12, Math.max( 4, block.text.split( "\n" ).length + 1 ) ) : 2 }
          value={ block.text }
          placeholder={ place( block.type ) }
          onChange={ event => onPatch( { text: event.target.value } ) }
        />
      ) }
      { list ? <span className="field-help">One item per line. Empty lines are left out.</span> : null }
    </div>
  );
}

function place( type: BlockType ): string {
  if ( type === "quote" ) return "A line worth pulling out of the article.";
  if ( type === "p" ) return "The words of this paragraph.";
  if ( type === "h2" ) return "A section of the article.";
  return "A heading inside a section.";
}

function addIcon( type: BlockType ): string {
  if ( type === "ul" ) return "dots";
  if ( type === "ol" ) return "menu";
  if ( type === "quote" ) return "faqs";
  if ( type === "p" ) return "pages";
  return type === "h2" ? "press" : "posts";
}
