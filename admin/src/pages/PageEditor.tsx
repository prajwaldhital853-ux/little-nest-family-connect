import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { PageCopy, PublicationRow } from "../api/types";
import type { BlockGroup } from "../cms/blocks";
import { flattenColumns, isPaperList, lastColumnOf, stackColumns } from "../cms/blocks";
import type { Leaf, PageSection, SimpleLeaf } from "../cms/homePage";
import { siteOrigin } from "../cms/pageSchemas";
import PublicationPicker from "../components/PublicationPicker";
import { Icon } from "../components/icons";
import PhotoField from "../components/PhotoField";
import PhotoPick from "../components/PhotoPick";
import SectionHead from "../components/SectionHead";
import { useGallery, type Gallery } from "../components/gallery";
import { useToast } from "../components/Toast";
import { Button, Checkbox, Field, Notice, TextArea, TextInput } from "../components/ui";

type Box = Record<string, unknown>;
type Path = ( string | number )[];

/* One colour per block, so the switcher and the card it opens read as the same thing. */
const TONES = [ "t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8" ];

/**
 * A page whose words are described by a schema instead of drawn from whatever shape they arrived
 * in, so every section reads the same way: a name, the boxes under it, and rows where rows belong.
 */
export default function PageEditor( {
  pageKey,
  title,
  icon,
  note,
  sections,
  sitePath,
  fallback,
}: {
  pageKey: string;
  title: string;
  icon: string;
  note: string;
  sections: PageSection[];
  sitePath: string;
  /** The sentence under the switch that decides whether the words go live. */
  fallback: string;
} ) {
  const gallery = useGallery();
  const toast = useToast();
  const [ page, setPage ] = useState<PageCopy | null>( null );
  const [ data, setData ] = useState<Box | null>( null );
  const [ error, setError ] = useState("");
  const [ dirty, setDirty ] = useState(false);
  const [ busy, setBusy ] = useState(false);
  const [ active, setActive ] = useState( sections[ 0 ].key );

  useEffect(() => {
    api
      .get<PageCopy>( `/api/cms/pages/${ pageKey }/` )
      .then( row => {
        setPage( row );
        setData( row.data );
      } )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ pageKey ] );

  const shown = useMemo(
    () =>
      sections.map( ( section, index ) => ( {
        ...section,
        tone: TONES[ index % TONES.length ],
        box: ( section.root ? data : ( data?.[ section.key ] as Box ) ?? {} ) as Box,
      } ) ),
    [ data, sections ]
  );
  const current = shown.find( section => section.key === active ) ?? shown[ 0 ];

  function edit( section: PageSection, next: Box ) {
    setDirty( true );
    if ( section.root ) {
      setData( next );
      return;
    }
    setData( ( current ) => ( { ...( current ?? {} ), [ section.key ]: next } ) );
  }

  async function save() {
    if ( !page || !data ) return;
    setBusy( true );
    setError( "" );
    try {
      const fresh = await api.put<PageCopy>( `/api/cms/pages/${ page.key }/`, { label: page.label, data, published: page.published } );
      setPage( fresh );
      setData( fresh.data );
      setDirty( false );
      toast.success( "Saved. The site shows it on the next load." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "The server would not take those words.";
      setError( message );
      toast.error( message );
    } finally {
      setBusy( false );
    }
  }

  async function publish( on: boolean ) {
    if ( !page ) return;
    const was = page.published;
    setPage( { ...page, published: on } );
    setError( "" );
    try {
      const fresh = await api.patch<PageCopy>( `/api/cms/pages/${ page.key }/`, { published: on } );
      setPage( fresh );
      toast.success( on ? "The page is live on the site." : "The page is hidden from the site." );
    } catch ( reason ) {
      setPage( { ...page, published: was } );
      const message = reason instanceof ApiError ? reason.message : "That change did not reach the server.";
      setError( message );
      toast.error( message );
    }
  }

  return (
    <section className="tone-page t0">
      <SectionHead
        icon={ icon }
        crumb={ (
          <>
            <Link to="/pages">Website wording</Link>
            <Icon name="chevron" size={ 14 } />
            { title }
          </>
        ) }
        title={ title }
        note={ `${ note } ${ page?.updated_at ? `Last saved ${ new Date( page.updated_at ).toLocaleString() }.` : "" }` }
        actions={ (
          <>
            <a className="btn btn-quiet" href={ `${ siteOrigin() }${ sitePath }` } target="_blank" rel="noreferrer">
              See the site
            </a>
            <Button disabled={ busy || !dirty } onClick={ save }>
              { busy ? "Saving" : dirty ? "Save changes" : "Saved" }
            </Button>
          </>
        ) }
      />

      { error ? <Notice>{ error }</Notice> : null }

      { !data ? (
        !error ? <p className="text-small loading">Loading the page.</p> : null
      ) : (
        <>
          <nav className="copy-tabs" aria-label={ `Blocks of the ${ title }` }>
            { shown.map( section => (
              <button
                type="button"
                key={ section.key }
                className={ [ section.tone, section.key === current.key ? "on" : "" ].filter( Boolean ).join( " " ) }
                onClick={ () => setActive( section.key ) }
                title={ section.note }
              >
                { section.name }
                { section.box.show === false ? <span className="tab-off">hidden</span> : null }
              </button>
            ) ) }
          </nav>

          <div className="block live-row">
            <Checkbox label="Show this wording on the site" checked={ page?.published ?? true } onChange={ publish } />
            <p className="text-small quiet">{ fallback }</p>
          </div>

          <SectionCard
            key={ current.key }
            section={ current }
            tone={ current.tone }
            box={ current.box }
            gallery={ gallery }
            onEdit={ next => edit( current, next ) }
          />
        </>
      ) }
    </section>
  );
}

function SectionCard( { section, tone, box, gallery, onEdit }: {
  section: PageSection;
  tone: string;
  box: Box;
  gallery: Gallery;
  onEdit: ( next: Box ) => void;
} ) {
  const shown = box.show !== false;
  return (
    <div className={ `sec card ${ tone }` }>
      <header className="sec-head">
        <span className="sec-mark">
          <Icon name={ section.icon } size={ 18 } />
        </span>
        <div className="sec-titles">
          <p className="sec-name">{ section.name }</p>
          <p className="sec-note">{ section.note }</p>
        </div>
        { typeof box.show === "boolean" ? (
          <span className={ shown ? "pill pill-good" : "pill pill-neutral" }>{ shown ? "On the page" : "Hidden" }</span>
        ) : null }
      </header>

      <div className="sec-body">
        { section.fields.map( field => (
          <LeafRow key={ `${ section.key }-${ leafKey( field ) }` } field={ field } box={ box } gallery={ gallery } onEdit={ onEdit } />
        ) ) }
      </div>
    </div>
  );
}

function leafKey( field: Leaf ): string {
  return field.kind === "photo" ? field.base : field.path;
}

/** One box in the schema, read out of the section and written back whole. */
function LeafRow( { field, box, gallery, onEdit }: {
  field: Leaf;
  box: Box;
  gallery: Gallery;
  onEdit: ( next: Box ) => void;
} ) {
  const write = ( path: Path, value: unknown ) => onEdit( setIn( box, path, value ) );

  if ( field.kind === "toggle" ) {
    return (
      <div className="span-2">
        <Checkbox label={ field.label } checked={ box[ field.path ] !== false } onChange={ next => write( pathOf( field.path ), next ) } />
      </div>
    );
  }

  if ( field.kind === "photo" ) {
    return (
      <PhotoField
        label={ field.label }
        help={ field.help }
        value={ {
          photo: String( box[ field.base ] ?? "" ),
          url: String( box[ `${ field.base }_url` ] ?? "" ),
          alt: String( box[ `${ field.base }_alt` ] ?? "" ),
        } }
        onChange={ next =>
          onEdit( {
            ...box,
            [ field.base ]: next.photo,
            [ `${ field.base }_url` ]: next.url,
            [ `${ field.base }_alt` ]: next.alt,
          } )
        }
      />
    );
  }

  if ( field.kind === "picture" ) {
    return (
      <PhotoPick
        label={ field.label }
        help={ field.help }
        value={ String( readAt( box, pathOf( field.path ) ) ?? "" ) }
        gallery={ gallery }
        onChange={ next => write( pathOf( field.path ), next ) }
      />
    );
  }

  if ( field.kind === "pictures" ) {
    const path = pathOf( field.path );
    const items = asArray( readAt( box, path ) );
    const put = ( next: unknown[] ) => write( path, next );
    return (
      <div className="span-2">
        <p className="field-label">{ field.label }</p>
        { field.help ? <p className="field-help">{ field.help }</p> : null }
        { items.map( ( item, index ) => (
          <div className="picture-line" key={ index }>
            <PhotoPick
              label={ `Picture ${ index + 1 }` }
              value={ String( item ?? "" ) }
              gallery={ gallery }
              onChange={ next => put( items.map( ( one, at ) => ( at === index ? next : one ) ) ) }
            />
            <button type="button" className="icon-btn" onClick={ () => put( items.filter( ( _, at ) => at !== index ) ) } aria-label={ `Remove picture ${ index + 1 }` }>
              <Icon name="trash" size={ 16 } />
            </button>
          </div>
        ) ) }
        <Button tone="quiet" onClick={ () => put( [ ...items, "" ] ) }>
          { field.add }
        </Button>
      </div>
    );
  }

  if ( field.kind === "link" ) {
    const link = ( readAt( box, pathOf( field.path ) ) as Box ) ?? {};
    return (
      <div className="pair">
        <p className="field-label">{ field.label }</p>
        <div className="pair-row">
          <Field label="Words on it">
            <TextInput value={ String( link.label ?? "" ) } onChange={ event => write( [ ...pathOf( field.path ), "label" ], event.target.value ) } />
          </Field>
          <Field label="Where it goes" help={ field.help }>
            <TextInput
              value={ String( link.href ?? "" ) }
              placeholder="/contact"
              onChange={ event => write( [ ...pathOf( field.path ), "href" ], event.target.value ) }
            />
          </Field>
        </div>
      </div>
    );
  }

  if ( field.kind === "list" ) {
    const path = pathOf( field.path );
    const items = asArray( readAt( box, path ) );
    return (
      <div className="span-2">
        <p className="field-label">{ field.label }</p>
        { field.help ? <p className="field-help">{ field.help }</p> : null }
        { items.map( ( item, index ) => (
          <div className="line" key={ index }>
            { field.multiline ? (
              <TextArea
                rows={ 3 }
                value={ String( item ?? "" ) }
                onChange={ event => write( path, items.map( ( one, at ) => ( at === index ? event.target.value : one ) ) ) }
              />
            ) : (
              <TextInput
                value={ String( item ?? "" ) }
                onChange={ event => write( path, items.map( ( one, at ) => ( at === index ? event.target.value : one ) ) ) }
              />
            ) }
            <button
              type="button"
              className="icon-btn"
              onClick={ () => write( path, items.filter( ( _, at ) => at !== index ) ) }
              aria-label={ `Remove this ${ field.itemLabel.toLowerCase() }` }
            >
              <Icon name="trash" size={ 16 } />
            </button>
          </div>
        ) ) }
        <Button tone="quiet" onClick={ () => write( path, [ ...items, "" ] ) }>
          { field.add }
        </Button>
      </div>
    );
  }

  if ( field.kind === "rows" ) {
    const path = pathOf( field.path );
    const rows = asArray( readAt( box, path ) ) as Box[];
    return (
      <div className="span-2">
        <p className="field-label">{ field.label }</p>
        { field.help ? <p className="field-help">{ field.help }</p> : null }
        { rows.map( ( row, index ) => (
          <div className="row" key={ index }>
            <div className="row-body">{ rowFields( field.item, row, next => write( path, rows.map( ( one, at ) => ( at === index ? next : one ) ) ) ) }</div>
            <button type="button" className="icon-btn" onClick={ () => write( path, rows.filter( ( _, at ) => at !== index ) ) } aria-label="Remove this one">
              <Icon name="trash" size={ 16 } />
            </button>
          </div>
        ) ) }
        <Button tone="quiet" onClick={ () => write( path, [ ...rows, { ...emptyFrom( rows[ rows.length - 1 ] ), ...blankFields( field.item ) } ] ) }>
          { field.add }
        </Button>
      </div>
    );
  }

  if ( field.kind === "blocks" ) {
    return <BlocksRow field={ field } box={ box } write={ write } />;
  }

  const path = pathOf( field.path );
  const value = readAt( box, path );

  if ( field.kind === "number" ) {
    return (
      <Field label={ field.label } help={ field.help }>
        <TextInput
          type="number"
          value={ String( value ?? "" ) }
          onChange={ event => write( path, event.target.value === "" ? 0 : Number( event.target.value ) ) }
        />
      </Field>
    );
  }

  return (
    <Field label={ field.label } help={ field.help }>
      { field.kind === "textarea" ? (
        <TextArea rows={ field.rows ?? 4 } value={ String( value ?? "" ) } onChange={ event => write( path, event.target.value ) } />
      ) : (
        <TextInput value={ String( value ?? "" ) } onChange={ event => write( path, event.target.value ) } />
      ) }
    </Field>
  );
}

/**
 * The columns under a section, flattened: a block is a name and a list of lines, and the column it
 * sits in is the site's business rather than something the doctor has to think about.
 */
function BlocksRow( { field, box, write }: {
  field: Extract<Leaf, { kind: "blocks" }>;
  box: Box;
  write: ( path: Path, value: unknown ) => void;
} ) {
  const path = pathOf( field.path );
  const [ picking, setPicking ] = useState<number | null>( null );
  const groups = flattenColumns( readAt( box, path ) );

  const put = ( next: BlockGroup[] ) => write( path, stackColumns( next ) );
  const patch = ( index: number, change: Partial<BlockGroup> ) => put( groups.map( ( one, at ) => ( at === index ? { ...one, ...change } : one ) ) );

  return (
    <div className="span-2">
      <p className="field-label">{ field.label }</p>
      { field.help ? <p className="field-help">{ field.help }</p> : null }

      { groups.length === 0 ? <p className="text-small quiet">Nothing here yet, so the site shows the wording that ships with it.</p> : null }

      { groups.map( ( group, index ) => {
        const papers = isPaperList( group.title );
        return (
          <div className="blocks-group" key={ index }>
            <div className="blocks-head">
              <input
                className="blocks-name"
                value={ group.title }
                placeholder="Name of this list"
                aria-label="Name of this list"
                onChange={ event => patch( index, { title: event.target.value } ) }
              />
              <button type="button" className="icon-btn" onClick={ () => put( groups.filter( ( _, at ) => at !== index ) ) } aria-label={ `Remove ${ group.title || "this list" }` }>
                <Icon name="trash" size={ 16 } />
              </button>
            </div>

            { group.entries.map( ( entry, at ) => (
              <div className="row entry-row" key={ at }>
                <div className="row-body">
                  { rowFields( field.item, entry, next =>
                    patch( index, { entries: group.entries.map( ( one, i ) => ( i === at ? next : one ) ) } ),
                  ) }
                </div>
                <button type="button" className="icon-btn" onClick={ () => patch( index, { entries: group.entries.filter( ( _, i ) => i !== at ) } ) } aria-label="Remove this line">
                  <Icon name="trash" size={ 16 } />
                </button>
              </div>
            ) ) }

            { papers ? (
              <div className="blocks-add">
                <Button tone="quiet" onClick={ () => setPicking( index ) }>
                  <Icon name="publications" size={ 16 } />
                  Add a publication
                </Button>
                <button type="button" className="link-button" onClick={ () => patch( index, { entries: [ ...group.entries, newEntry( group ) ] } ) }>
                  or write one by hand
                </button>
              </div>
            ) : (
              <Button tone="quiet" onClick={ () => patch( index, { entries: [ ...group.entries, newEntry( group ) ] } ) }>
                { field.add }
              </Button>
            ) }
          </div>
        );
      } ) }

      <Button tone="quiet" onClick={ () => put( [ ...groups, { column: lastColumnOf( groups ), raw: {}, title: "", entries: [] } ] ) }>
        Add a list
      </Button>

      { picking === null ? null : (
        <PublicationPicker
          onClose={ () => setPicking( null ) }
          onPick={ row => {
            if ( picking !== null ) patch( picking, { entries: [ ...groups[ picking ].entries, entryFrom( row, groups[ picking ].entries ) ] } );
            setPicking( null );
          } }
        />
      ) }
    </div>
  );
}

function newEntry( group: BlockGroup ): Box {
  const last = group.entries[ group.entries.length - 1 ];
  const blank: Box = { ...emptyFrom( last ), text: "", meta: "", href: "" };
  blank.id = uniqueId( group.title || "line", group.entries );
  return blank;
}

/** One picked paper, written the way the site reads a line: words, a small line, and a link. */
function entryFrom( row: PublicationRow, entries: Box[] ): Box {
  const link = String( row.link ?? "" );
  const meta = [ String( row.venue ?? "" ), row.year ? String( row.year ) : "" ].filter( Boolean ).join( ", " );
  const entry: Box = { id: uniqueId( row.title, entries ), text: row.title, meta };
  if ( link ) {
    entry.href = link;
    entry.via = "anchor";
    entry.newTab = true;
  }
  return entry;
}

function uniqueId( text: string, entries: Box[] ): string {
  const taken = new Set( entries.map( one => String( one.id ?? "" ) ) );
  const base = text.toLowerCase().replace( /[^a-z0-9]+/g, "-" ).replace( /^-|-$/g, "" ).slice( 0, 40 ) || "line";
  let id = base;
  let n = 2;
  while ( taken.has( id ) ) id = `${ base }-${ n++ }`;
  return id;
}

/** The boxes inside a row, each writing the row back whole. */
function rowFields( item: SimpleLeaf[], row: Box, put: ( next: Box ) => void ) {
  return item.map( inner => (
    <Field key={ inner.path } label={ inner.label } help={ inner.help }>
      { inner.kind === "textarea" ? (
        <TextArea
          rows={ inner.rows ?? 2 }
          value={ String( row[ inner.path ] ?? "" ) }
          onChange={ event => put( { ...row, [ inner.path ]: event.target.value } ) }
        />
      ) : (
        <TextInput value={ String( row[ inner.path ] ?? "" ) } onChange={ event => put( { ...row, [ inner.path ]: event.target.value } ) } />
      ) }
    </Field>
  ) );
}

function blankFields( item: SimpleLeaf[] ): Box {
  return item.reduce( ( acc, one ) => ( { ...acc, [ one.path ]: "" } ), {} as Box );
}

/** A new row keeps whatever extra keys its siblings had, so nothing typed earlier is lost. */
function emptyFrom( row?: Box ): Box {
  if ( !row ) return {};
  return Object.fromEntries( Object.entries( row ).map( ( [ key, value ] ) => [ key, typeof value === "string" ? "" : value ] ) );
}

function asArray( value: unknown ): unknown[] {
  return Array.isArray( value ) ? value : [];
}

/* "story.photos" and "columns.0.title" both arrive as one string, and a run of digits is a place in a list. */
function pathOf( dotted: string ): Path {
  return dotted.split( "." ).map( step => ( /^\d+$/.test( step ) ? Number( step ) : step ) );
}

function readAt( source: unknown, path: Path ): unknown {
  return path.reduce<unknown>( ( value, step ) => {
    if ( value === null || value === undefined ) return undefined;
    return ( value as Record<string | number, unknown> )[ step ];
  }, source );
}

function setIn( source: unknown, path: Path, value: unknown ): Box {
  const step = ( current: unknown, rest: Path ): unknown => {
    if ( rest.length === 0 ) return value;
    const [ head, ...tail ] = rest;
    if ( typeof head === "number" ) {
      const list = asArray( current );
      const next = [ ...list ];
      next[ head ] = step( next[ head ], tail );
      return next;
    }
    return { ...asObject( current ), [ head ]: step( asObject( current )[ head ], tail ) };
  };
  return step( source, path ) as Box;
}

function asObject( value: unknown ): Box {
  return value && typeof value === "object" && !Array.isArray( value ) ? ( value as Box ) : {};
}
