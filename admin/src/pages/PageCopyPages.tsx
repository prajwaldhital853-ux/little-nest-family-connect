import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Page, PageCopy } from "../api/types";
import { PAGE_SCHEMAS, siteOrigin, sitePath } from "../cms/pageSchemas";
import { holdsBookingForm } from "../cms/bookingForm";
import PageEditor from "./PageEditor";
import PhotoPick from "../components/PhotoPick";
import SectionHead from "../components/SectionHead";
import { useGallery, type Gallery } from "../components/gallery";
import { useToast } from "../components/Toast";
import { Icon } from "../components/icons";
import { Button, Checkbox, Field, Notice, Pager, Pill, TextArea, TextInput, formatDate } from "../components/ui";

const PAGE_SIZE = 20;

/* The words that ship with the site are never deleted, only covered over. */
const MARK_HELP =
  "Marks the site understands: **bold**, *emphasis*, [label](https://link) and a blank line for a paragraph break. " +
  "Leave a line empty and the site keeps the wording it ships with.";

type Path = ( string | number )[];
type Bag = Record<string, unknown>;

/* Top level scalars are the page's own name and title, so they get a tab of their own. */
const PAGE_TAB = "__page";

const TONES = [ "t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8" ];

/* A page keeps the same colour wherever the panel shows it, so the dot beside its name in the
   list is the colour of the screen it opens. */
function toneFor( key: string ): string {
  const total = [ ...key ].reduce( ( sum, char ) => sum + char.charCodeAt( 0 ), 0 );
  return TONES[ total % TONES.length ];
}

const PHOTO_WORDS = new Set( [ "photo", "avatar", "poster", "image", "logo", "portrait", "picture", "cover" ] );
const LINK_KEYS = new Set( [ "url", "href", "link", "src", "posterurl" ] );
const NAME_KEYS = [ "title", "label", "name", "heading", "question", "id" ];

function humanise( key: string ): string {
  return key.replace( /[_-]+/g, " " ).replace( /^./, letter => letter.toUpperCase() );
}

function isPhotoKey( name: string ) {
  return PHOTO_WORDS.has( name.toLowerCase() );
}

function isLink( key: string, value: string ) {
  return LINK_KEYS.has( key.toLowerCase().replace( /[^a-z]/g, "" ) ) || ( /^https?:\/\//.test( value ) && value.length < 300 && !value.includes( " " ) );
}

/* Most addresses are site relative, like /contact, which a url field would refuse to accept. */
function isWide( name: string, value: string ) {
  return isLink( name, value ) || /https?:/.test( value ) || value.length > 90 || value.includes( "\n" );
}

function setIn( source: unknown, path: Path, value: unknown ): unknown {
  if ( path.length === 0 ) return value;
  const [ head, ...rest ] = path;
  if ( typeof head === "number" ) {
    /* Refusing a list that is not there keeps a half-built path from punching holes into an array. */
    if ( !Array.isArray( source ) ) return source;
    const next = [ ...source ];
    next[ head ] = setIn( next[ head ], rest, value );
    return next;
  }
  const object: Bag = { ...( ( source ?? {} ) as Bag ) };
  object[ head ] = setIn( object[ head ], rest, value );
  return object;
}

function readAt( source: unknown, path: Path ): unknown {
  return path.reduce<unknown>( ( value, step ) => {
    if ( value === null || value === undefined ) return undefined;
    return ( value as Record<string | number, unknown> )[ step ];
  }, source );
}

/**
 * The empty twin of a value, keeping the shape the site renders from. A list keeps one item rather
 * than arriving empty, because an empty list where the site expects columns blanks the section.
 */
function blankLike( value: unknown ): unknown {
  if ( typeof value === "number" ) return 0;
  if ( typeof value === "boolean" ) return false;
  if ( typeof value === "string" ) return "";
  if ( Array.isArray( value ) ) return value.length ? [ blankLike( value[ 0 ] ) ] : [];
  if ( value && typeof value === "object" ) {
    const clone: Bag = {};
    for ( const [ key, item ] of Object.entries( value as Bag ) ) clone[ key ] = blankLike( item );
    return clone;
  }
  return "";
}

function entryName( item: unknown, index: number, fallback: string ): string {
  if ( Array.isArray( item ) ) return `${ fallback } ${ index + 1 }`;
  if ( item && typeof item === "object" ) {
    for ( const key of NAME_KEYS ) {
      const value = ( item as Bag )[ key ];
      if ( typeof value === "string" && value.trim() ) return value.trim().slice( 0, 70 );
    }
  }
  if ( typeof item === "string" && item.trim() ) return item.trim().slice( 0, 70 );
  return `${ fallback } ${ index + 1 }`;
}

interface Ctx {
  edit: ( path: Path, value: unknown ) => void;
  add: ( path: Path ) => void;
  remove: ( path: Path ) => void;
  gallery: Gallery;
}

export function PagesListPage() {
  const navigate = useNavigate();
  const [ rows, setRows ] = useState<Page<PageCopy> | null>( null );
  const [ page, setPage ] = useState(1);
  const [ error, setError ] = useState("");

  useEffect(() => {
    api
      .page<PageCopy>( "/api/cms/pages/", { page, page_size: PAGE_SIZE } )
      .then( setRows )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ page ] );

  return (
    <section className="tone-page t5">
      <SectionHead
        icon="pages"
        title="Page wording"
        note={ `${ rows ? `${ rows.count } page${ rows.count === 1 ? "" : "s" } the panel can rewrite.` : "Loading the list." } These are the standing words of a page, not an article.` }
      />

      { error ? <Notice>{ error }</Notice> : null }
      { rows ? (
        <>
          <table className="grid">
            <thead>
              <tr>
                <th>Page</th>
                <th>Address</th>
                <th>On the site</th>
                <th>Last edited</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              { rows.results.map( ( row ) => (
                <tr key={ row.key }>
                  <td>
                    <span className={ `page-dot ${ toneFor( row.key ) }` } aria-hidden="true" />
                    <Link to={ `/pages/${ row.key }` }>{ row.label }</Link>
                  </td>
                  <td className="text-small">{ sitePath( row.key ) ?? "Every page" }</td>
                  <td>
                    <Pill value={ row.published ? "published" : "draft" } label={ row.published ? "Live" : "Held back" } />
                  </td>
                  <td>{ formatDate( row.updated_at ) }</td>
                  <td className="row-actions">
                    <Button tone="quiet" onClick={ () => window.open( `${ siteOrigin() }${ sitePath( row.key ) ?? "/" }`, "_blank", "noreferrer" ) }>
                      View
                    </Button>
                    <Button tone="quiet" onClick={ () => navigate( `/pages/${ row.key }` ) }>
                      Edit words
                    </Button>
                  </td>
                </tr>
              ) ) }
            </tbody>
          </table>
          <Pager count={ rows.count } page={ page } pageSize={ PAGE_SIZE } onPage={ setPage } />
        </>
      ) : (
        <p className="text-small loading">Loading</p>
      ) }
    </section>
  );
}

/**
 * A page listed in the schema is edited from that list, so its blocks arrive named and in order
 * instead of in whatever shape the JSON happens to hold. The rest keep the general editor.
 */
export function PageCopyEditPage() {
  const { key = "" } = useParams();
  const schema = PAGE_SCHEMAS[ key ];
  if ( !schema ) return <PageCopyWords key={ key } />;
  return (
    <PageEditor
      pageKey={ key }
      title={ schema.title }
      icon={ schema.icon }
      note={ schema.note }
      fallback={ schema.fallback }
      sections={ schema.sections }
      sitePath={ sitePath( key ) ?? "/" }
    />
  );
}

function PageCopyWords() {
  const { key = "" } = useParams();
  const navigate = useNavigate();
  const gallery = useGallery();
  const toast = useToast();
  const [ label, setLabel ] = useState("");
  const [ data, setData ] = useState<Bag | null>( null );
  const [ published, setPublished ] = useState( true );
  const [ meta, setMeta ] = useState<{ updated_at: string; updated_by_email: string } | null>( null );
  const [ failed, setFailed ] = useState("");
  const [ dirty, setDirty ] = useState(false);
  const [ saving, setSaving ] = useState(false);
  const [ tab, setTab ] = useState("");

  useEffect(() => {
    setDirty( false );
    setTab( "" );
    api
      .get<PageCopy>( `/api/cms/pages/${ key }/` )
      .then( row => {
        setLabel( row.label );
        setData( row.data );
        setPublished( row.published );
        setMeta( { updated_at: row.updated_at, updated_by_email: row.updated_by_email } );
      } )
      .catch( ( reason: ApiError ) => setFailed( reason.message ) );
  }, [ key ] );

  const tabs = useMemo( () => splitTabs( data ), [ data ] );
  const active = tabs.find( one => one.key === tab ) ?? tabs[ 0 ];

  function edit( path: Path, value: unknown ) {
    setData( current => ( current ? ( setIn( current, path, value ) as Bag ) : current ) );
    setDirty( true );
  }

  function add( path: Path ) {
    setData( current => {
      if ( !current ) return current;
      const list = readAt( current, path );
      if ( !Array.isArray( list ) || list.length === 0 ) return current;
      /* A new row copies the last ordinary one, never the booking form, whose shape only its own
         screen knows how to write. */
      const template = [ ...list ].reverse().find( one => !holdsBookingForm( one ) ) ?? list[ list.length - 1 ];
      return setIn( current, path, [ ...list, blankLike( template ) ] ) as Bag;
    } );
    setDirty( true );
  }

  async function remove( path: Path ) {
    if ( !( await toast.confirm( "Remove this from the page wording?", { confirm: "Remove", cancel: "Keep it" } ) ) ) return;
    setData( current => {
      if ( !current ) return current;
      const parent = path.slice( 0, -1 );
      const index = path[ path.length - 1 ] as number;
      const list = ( readAt( current, parent ) ?? [] ) as unknown[];
      return setIn( current, parent, list.filter( ( _, at ) => at !== index ) ) as Bag;
    } );
    setDirty( true );
  }

  async function submit( event: React.FormEvent ) {
    event.preventDefault();
    setSaving( true );
    setFailed( "" );
    try {
      const row = await api.put<PageCopy>( `/api/cms/pages/${ key }/`, { label, data: data ?? {}, published } );
      setData( row.data );
      setLabel( row.label );
      setPublished( row.published );
      setMeta( { updated_at: row.updated_at, updated_by_email: row.updated_by_email } );
      setDirty( false );
      toast.success( "Saved. The site shows these words on the next visit." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not save. Check that the backend is running.";
      setFailed( message );
      toast.error( message );
    } finally {
      setSaving( false );
    }
  }

  if ( !data ) return failed ? <Notice>{ failed }</Notice> : <p className="text-small loading">Loading</p>;

  const ctx: Ctx = { edit, add, remove, gallery };

  return (
    <section className={ `edit tone-page ${ toneFor( key ) }` }>
      <SectionHead
        icon="pages"
        crumb={ (
          <>
            <Link to="/pages">Page wording</Link>
            <Icon name="chevron" size={ 14 } />
            { key }
          </>
        ) }
        title={ label || humanise( key ) }
        note={ sitePath( key ) ? (
          <a href={ `${ siteOrigin() }${ sitePath( key ) }` } target="_blank" rel="noreferrer">
            View this page on the site
          </a>
        ) : (
          "This wording is used on every page of the site."
        ) }
        actions={ (
          <>
            <span className={ `pill pill-${ published ? "good" : "neutral" }` }>{ published ? "Live" : "Held back" }</span>
            { meta ? <span className="text-small">Saved { formatDate( meta.updated_at ) }</span> : null }
          </>
        ) }
      />

      { failed ? <Notice>{ failed }</Notice> : null }

      <form onSubmit={ submit } className="copy-form">
        { tabs.length > 1 ? (
          <nav className="copy-tabs" aria-label="Sections of this page">
            { tabs.map( ( one, index ) => (
              <button
                type="button"
                key={ one.key }
                className={ active?.key === one.key ? `on ${ TONES[ index % TONES.length ] }` : TONES[ index % TONES.length ] }
                onClick={ () => setTab( one.key ) }
              >
                { one.name }
              </button>
            ) ) }
          </nav>
        ) : null }

        <div className="copy-meta card">
          <Field label="Name in the panel">
            <TextInput value={ label } onChange={ event => { setLabel( event.target.value ); setDirty( true ); } } />
          </Field>
          <Checkbox label="Show this wording on the site" checked={ published } onChange={ setPublished } />
          <p className="text-small quiet">{ MARK_HELP }</p>
        </div>

        { active ? (
          <div className="copy-panel card">
            <p className="copy-panel-name">{ active.name }</p>
            { active.key === PAGE_TAB ? (
              <div className="copy-grid">
                { active.keys.map( name => (
                  <NodeView key={ name } name={ name } value={ data[ name ] } path={ [ name ] } depth={ 0 } ctx={ ctx } />
                ) ) }
              </div>
            ) : (
              active.keys.map( name => (
                <NodeView key={ name } name={ name } value={ data[ name ] } path={ [ name ] } depth={ 0 } ctx={ ctx } bare />
              ) )
            ) }
          </div>
        ) : null }

        <footer className="form-actions">
          <Button type="submit" busy={ saving } disabled={ saving || !dirty }>
            { saving ? "Saving" : dirty ? "Save words" : "Saved" }
          </Button>
          <Button tone="quiet" type="button" onClick={ () => navigate( "/pages" ) }>
            Back to pages
          </Button>
        </footer>
      </form>
    </section>
  );
}

function splitTabs( data: Bag | null ): { key: string; name: string; keys: string[] }[] {
  if ( !data ) return [];
  const scalars: string[] = [];
  const blocks: string[] = [];
  for ( const [ name, value ] of Object.entries( data ) ) {
    if ( value === null || value === undefined ) continue;
    ( value && typeof value === "object" ? blocks : scalars ).push( name );
  }
  const tabs = blocks.map( name => ( { key: name, name: humanise( name ), keys: [ name ] } ) );
  if ( scalars.length ) tabs.unshift( { key: PAGE_TAB, name: "Page", keys: scalars } );
  return tabs;
}

/**
 * One value, whichever shape it arrived in. Groups and lists take the full width and only the
 * words inside them share columns, so a deeply nested field never shrinks to a sliver.
 */
function NodeView( { name, value, path, depth, ctx, bare }: {
  name: string;
  value: unknown;
  path: Path;
  depth: number;
  ctx: Ctx;
  bare?: boolean;
} ) {
  if ( value === null || value === undefined ) return null;
  const shown = humanise( name );

  if ( typeof value === "boolean" ) {
    return (
      <div className="copy-leaf copy-wide">
        <Checkbox label={ shown } checked={ value } onChange={ next => ctx.edit( path, next ) } />
      </div>
    );
  }

  if ( typeof value === "number" ) {
    return (
      <div className="copy-leaf">
        <Field label={ shown }>
          <TextInput type="number" value={ String( value ) } onChange={ event => ctx.edit( path, Number( event.target.value || 0 ) ) } />
        </Field>
      </div>
    );
  }

  if ( typeof value === "string" ) {
    if ( isPhotoKey( name ) ) {
      return <PhotoPick label={ shown } value={ value } gallery={ ctx.gallery } onChange={ next => ctx.edit( path, next ) } />;
    }
    const control = isWide( name, value ) ? (
      <TextArea
        value={ value }
        rows={ Math.min( 12, Math.max( 2, value.split( "\n" ).length + 1 ) ) }
        onChange={ event => ctx.edit( path, event.target.value ) }
      />
    ) : (
      <TextInput value={ value } onChange={ event => ctx.edit( path, event.target.value ) } />
    );
    return (
      <div className={ isWide( name, value ) ? "copy-leaf copy-wide" : "copy-leaf" }>
        <Field label={ shown }>{ control }</Field>
      </div>
    );
  }

  if ( Array.isArray( value ) ) {
    return <ListView name={ shown } items={ value } path={ path } depth={ depth } ctx={ ctx } />;
  }

  return <GroupView name={ shown } box={ value as Bag } path={ path } depth={ depth } ctx={ ctx } bare={ bare } />;
}

function GroupView( { name, box, path, depth, ctx, bare }: {
  name: string;
  box: Bag;
  path: Path;
  depth: number;
  ctx: Ctx;
  bare?: boolean;
} ) {
  const words: [ string, unknown ][] = [];
  const blocks: [ string, unknown ][] = [];
  for ( const [ child, value ] of Object.entries( box ) ) {
    if ( value === null || value === undefined ) continue;
    ( value && typeof value === "object" ? blocks : words ).push( [ child, value ] );
  }

  const body = (
    <>
      { words.length ? (
        <div className="copy-grid">
          { words.map( ( [ child, value ] ) => (
            <NodeView key={ child } name={ child } value={ value } path={ [ ...path, child ] } depth={ depth } ctx={ ctx } />
          ) ) }
        </div>
      ) : null }
      { blocks.map( ( [ child, value ] ) => (
        <NodeView key={ child } name={ child } value={ value } path={ [ ...path, child ] } depth={ depth + 1 } ctx={ ctx } />
      ) ) }
    </>
  );

  if ( bare ) return body;

  return (
    <div className="copy-box">
      <p className="field-label">{ name }</p>
      { body }
    </div>
  );
}

function ListView( { name, items, path, depth, ctx }: {
  name: string;
  items: unknown[];
  path: Path;
  depth: number;
  ctx: Ctx;
} ) {
  const plain = items.every( item => item === null || typeof item !== "object" );

  return (
    <div className="copy-list">
      <div className="copy-list-head">
        <p className="field-label">{ name }</p>
        { items.length ? <span className="copy-count">{ items.length }</span> : null }
      </div>

      { items.length === 0 ? (
        <p className="text-small quiet">
          Nothing here, so the site shows the wording it ships with for this part.
        </p>
      ) : plain ? (
        items.map( ( item, index ) => (
          <div className="line" key={ index }>
            { typeof item === "string" && ( item.length > 90 || item.includes( "\n" ) ) ? (
              <TextArea
                rows={ Math.min( 10, Math.max( 2, item.split( "\n" ).length + 1 ) ) }
                value={ item }
                onChange={ event => ctx.edit( path, items.map( ( one, at ) => ( at === index ? event.target.value : one ) ) ) }
              />
            ) : (
              <TextInput
                value={ item === null || item === undefined ? "" : String( item ) }
                onChange={ event => ctx.edit( path, items.map( ( one, at ) => ( at === index ? event.target.value : one ) ) ) }
              />
            ) }
            <button
              type="button"
              className="icon-btn"
              onClick={ () => ctx.remove( [ ...path, index ] ) }
              aria-label={ `Remove ${ name } ${ index + 1 }` }
            >
              <Icon name="trash" size={ 16 } />
            </button>
          </div>
        ) )
      ) : (
        <div className="copy-stack">
          { items.map( ( item, index ) => (
            <div className="copy-entry" key={ index }>
              <header className="copy-entry-head">
                <span className="copy-entry-index">{ index + 1 }</span>
                <span className="copy-entry-name">{ entryName( item, index, name ) }</span>
                { /* The booking row is the form's own home, so this screen cannot delete it by accident. */ }
                { holdsBookingForm( item ) ? null : (
                  <button type="button" className="icon-btn" onClick={ () => ctx.remove( [ ...path, index ] ) } aria-label={ `Remove ${ name } ${ index + 1 }` }>
                    <Icon name="trash" size={ 16 } />
                  </button>
                ) }
              </header>
              <div className="copy-entry-body">
                { holdsBookingForm( item ) ? (
                  <p className="text-small quiet">
                    These are the questions of the booking form, so they are not edited here.{" "}
                    <Link to="/booking-form">Change them on the booking form screen</Link>, which saves
                    the same words in the same place without showing their plumbing.
                  </p>
                ) : (
                  <NodeView name={ entryName( item, index, name ) } value={ item } path={ [ ...path, index ] } depth={ depth + 1 } ctx={ ctx } bare />
                ) }
              </div>
            </div>
          ) ) }
        </div>
      ) }

      { items.length ? (
        <Button tone="quiet" onClick={ () => ctx.add( path ) }>
          Add to { name.toLowerCase() }
        </Button>
      ) : null }
    </div>
  );
}
