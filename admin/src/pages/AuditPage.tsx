import { Fragment, useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { AuditEntry, AuditFacets, Page } from "../api/types";
import SectionHead from "../components/SectionHead";
import { Button, Notice, Pager, Pill, TextInput, formatDate } from "../components/ui";

const PAGE_SIZE = 25;
const RANGES = [ [ "", "Whole log" ], [ "7", "Last 7 days" ], [ "30", "Last 30 days" ], [ "90", "Last 90 days" ] ] as const;

export default function AuditPage() {
  const [ rows, setRows ] = useState<Page<AuditEntry> | null>( null );
  const [ facets, setFacets ] = useState<AuditFacets | null>( null );
  const [ action, setAction ] = useState("");
  const [ actor, setActor ] = useState("");
  const [ days, setDays ] = useState("");
  const [ draft, setDraft ] = useState("");
  const [ search, setSearch ] = useState("");
  const [ page, setPage ] = useState(1);
  const [ open, setOpen ] = useState<number | null>( null );
  const [ error, setError ] = useState("");

  const load = useCallback(() => {
    api
      .page<AuditEntry>( "/api/audit/entries/", { action, actor, days, search, page, page_size: PAGE_SIZE } )
      .then( setRows )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ action, actor, days, search, page ] );

  useEffect( load, [ load ] );

  useEffect(() => {
    api.get<AuditFacets>( "/api/audit/entries/facets/" ).then( setFacets ).catch( () => undefined );
  }, [] );

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch( draft );
      setPage( 1 );
    }, 400);
    return () => clearTimeout( timer );
  }, [ draft ] );

  return (
    <section className="tone-page t2">
      <SectionHead
        icon="audit"
        title="What changed"
        note={ rows ? `${ rows.count } entr${ rows.count === 1 ? "y" : "ies" } in this view` : "Loading" }
        actions={ (
          <div className="tabs">
            { RANGES.map( ( [ value, label ] ) => (
              <button key={ value || "all" } className={ days === value ? "on" : "" } onClick={ () => { setDays( value ); setPage( 1 ); } }>
                { label }
              </button>
            ) ) }
          </div>
        ) }
      />

      <div className="toolbar">
        <TextInput placeholder="Search what was touched" value={ draft } onChange={ event => setDraft( event.target.value ) } />
        <div className="filters">
          <select value={ action } onChange={ event => { setAction( event.target.value ); setPage( 1 ); } }>
            <option value="">Any action</option>
            { facets?.actions.map( row => (
              <option key={ row.action } value={ row.action }>
                { row.action } ({ row.total })
              </option>
            ) ) }
          </select>
          <select value={ actor } onChange={ event => { setActor( event.target.value ); setPage( 1 ); } }>
            <option value="">Anyone</option>
            { facets?.actors.map( row => (
              <option key={ row.actor_label } value={ row.actor_label }>
                { row.actor_label || "Nobody in particular" } ({ row.total })
              </option>
            ) ) }
          </select>
        </div>
      </div>

      { error ? <Notice>{ error }</Notice> : null }

      <table className="grid">
        <thead>
          <tr>
            <th>When</th>
            <th>Who</th>
            <th>Action</th>
            <th>What</th>
            <th aria-label="Detail" />
          </tr>
        </thead>
        <tbody>
          { rows?.results.map( row => (
            <Fragment key={ row.id }>
              <tr className={ open === row.id ? "row-open" : "" }>
                <td>{ formatDate( row.created_at ) }</td>
                <td>{ row.actor_label || "The site" }</td>
                <td>
                  <Pill value={ tone( row.action ) } label={ row.action } />
                </td>
                <td>{ row.target_label || row.target_type || "" }</td>
                <td className="row-actions">
                  <Button tone="quiet" onClick={ () => setOpen( open === row.id ? null : row.id ) }>
                    { open === row.id ? "Hide" : "Detail" }
                  </Button>
                </td>
              </tr>
              { open === row.id ? (
                <tr className="detail-row">
                  <td colSpan={ 5 }>
                    { row.target_type ? <p className="text-small quiet">{ row.target_type }{ row.target_id ? ` #${ row.target_id }` : "" }</p> : null }
                    <dl className="detail-list">
                      { Object.entries( row.detail ?? {} ).map( ( [ name, value ] ) => (
                        <div key={ name }>
                          <dt>{ where( name ) }</dt>
                          <dd>{ describe( value ) }</dd>
                        </div>
                      ) ) }
                    </dl>
                    { !row.detail || Object.keys( row.detail ).length === 0 ? <p className="text-small quiet">No extra detail on this entry.</p> : null }
                  </td>
                </tr>
              ) : null }
            </Fragment>
          ) ) }
          { rows && rows.results.length === 0 ? (
            <tr>
              <td className="empty" colSpan={ 5 }>
                Nothing logged for this view.
              </td>
            </tr>
          ) : null }
        </tbody>
      </table>

      { rows ? <Pager count={ rows.count } page={ page } pageSize={ PAGE_SIZE } onPage={ setPage } /> : null }
      <p className="text-small quiet">The log is read only. Nothing in the panel can rewrite or remove an entry.</p>
    </section>
  );
}

/** A stored path like hero.ticks.1 reads better as Hero ticks › item 1. */
function where( path: string ): string {
  const shown = path
    .split( "." )
    .map( part => ( /^\d+$/.test( part ) ? `item ${ part }` : part.replace( /[_-]+/g, " " ) ) )
    .join( " › " );
  return shown.replace( /^./, letter => letter.toUpperCase() );
}

function tone( action: string ): string {
  if ( action.startsWith( "login" ) || action.startsWith( "otp" ) || action.startsWith( "password" ) || action.startsWith( "device" ) ) return "pending";
  if ( action.includes( "deleted" ) || action.includes( "failed" ) || action.includes( "locked" ) ) return "cancelled";
  if ( action.includes( "created" ) || action.includes( "published" ) || action.includes( "verified" ) ) return "published";
  return "draft";
}

/** A change is stored as from and to; anything else is shown as it arrived. */
function describe( value: unknown ): string {
  if ( value && typeof value === "object" && !Array.isArray( value ) ) {
    const entry = value as Record<string, unknown>;
    if ( "from" in entry || "to" in entry ) return `${ show( entry.from ) } to ${ show( entry.to ) }`;
    return Object.entries( entry )
      .map( ( [ key, item ] ) => `${ key}: ${ show( item ) }` )
      .join( ", " );
  }
  return show( value );
}

function show( value: unknown ): string {
  if ( value === null || value === undefined || value === "" ) return "nothing";
  if ( Array.isArray( value ) ) return value.map( show ).join( ", " );
  if ( typeof value === "object" ) return JSON.stringify( value );
  return String( value );
}
