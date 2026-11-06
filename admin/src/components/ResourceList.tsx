import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { prefetchPage } from "../api/warm";
import type { CmsRow, Page } from "../api/types";
import type { ResourceDef } from "../cms/resources";
import { keyFor } from "../cms/resources";
import { Button, Notice, Pager, Pill, Select, TextInput, formatDate } from "./ui";
import { useToast } from "./Toast";
import SectionHead from "./SectionHead";

const PAGE_SIZE = 20;

export default function ResourceList( { resource }: { resource: ResourceDef } ) {
  const { resource: slug } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [ params, setParams ] = useSearchParams();
  const status = params.get( "status" ) ?? "";
  const chosen = resource.filter ? params.get( resource.filter.param ) ?? "" : "";
  const [ rows, setRows ] = useState<Page<CmsRow> | null>( null );
  const [ draft, setDraft ] = useState("");
  const [ search, setSearch ] = useState("");
  const [ page, setPage ] = useState(1);
  const [ error, setError ] = useState("");

  const showStatus = ( next: string ) => {
    setParams( current => {
      const updated = new URLSearchParams( current );
      if ( next ) updated.set( "status", next );
      else updated.delete( "status" );
      return updated;
    } );
    setPage( 1 );
  };

  /* Narrowing the list is a page address, not a button state, so a back step returns here. */
  const showFilter = ( next: string ) => {
    if ( !resource.filter ) return;
    setParams( current => {
      const updated = new URLSearchParams( current );
      if ( next ) updated.set( resource.filter!.param, next );
      else updated.delete( resource.filter!.param );
      return updated;
    } );
    setPage( 1 );
  };

  const load = useCallback(() => {
    api
      .page<CmsRow>( resource.endpoint, {
        page,
        page_size: PAGE_SIZE,
        search,
        status,
        ...( resource.filter && chosen ? { [ resource.filter.param ]: chosen } : {} ),
      } )
      .then( setRows )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ resource, page, search, status, chosen ] );

  useEffect( load, [ load ] );

  useEffect(() => {
    const timer = setTimeout( () => {
      setSearch( draft );
      setPage( 1 );
    }, 400 );
    return () => clearTimeout( timer );
  }, [ draft ] );

  async function mutate( row: CmsRow, body: Record<string, unknown> ) {
    setError( "" );
    try {
      await api.patch( `${ resource.endpoint }${ keyFor( resource, row ) }/`, body );
      toast.success( row.status === "published" ? "Taken off the site." : "Live on the site." );
      load();
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not update that item.";
      setError( message );
      toast.error( message );
    }
  }

  async function remove( row: CmsRow ) {
    if ( !( await toast.confirm( "Delete this item from the site?", { confirm: "Delete", cancel: "Keep it" } ) ) ) return;
    setError( "" );
    try {
      await api.del( `${ resource.endpoint }${ keyFor( resource, row ) }/` );
      toast.success( "Deleted from the site." );
      load();
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not delete that item.";
      setError( message );
      toast.error( message );
    }
  }

  return (
    <section className={ `tone-page t${ resource.tone }` }>
      <SectionHead
        icon={ resource.icon }
        title={ resource.plural }
        note={ `${ resource.note } ${ rows ? `${ rows.count } ${ rows.count === 1 ? "entry" : "entries" } in this view.` : "Loading the list." }` }
        actions={ <Button onClick={ () => navigate( `/content/${ slug }/new` ) }>Add { resource.name.toLowerCase() }</Button> }
      />

      <div className="toolbar">
        <TextInput placeholder="Search" value={ draft } onChange={ event => setDraft( event.target.value ) } />
        <div className="tabs">
          { [ [ "", "All" ], [ "published", "Published" ], [ "draft", "Drafts" ] ].map( ( [ value, label ] ) => (
            <button
              key={ value || "all" }
              className={ status === value ? "on" : "" }
              onMouseEnter={ () => prefetchPage( resource.endpoint, { page: 1, page_size: PAGE_SIZE, status: value } ) }
              onClick={ () => showStatus( value ) }
            >
              { label }
            </button>
          ) ) }
        </div>
        { resource.filter ? (
          <Select
            aria-label={ resource.filter.label }
            value={ chosen }
            options={ [ [ "", resource.filter.label ], ...resource.filter.options ] }
            onChange={ event => showFilter( event.target.value ) }
          />
        ) : null }
      </div>

      { error ? <Notice>{ error }</Notice> : null }

      <table className="grid">
        <thead>
          <tr>
            { resource.columns.map( column => (
              <th key={ column.key }>{ column.label }</th>
            ) ) }
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          { rows?.results.map( row => {
            const key = String( keyFor( resource, row ) );
            return (
              <tr key={ row.id }>
                { resource.columns.map( column => {
                  const value = row[ column.key ];
                  const text = value === null || value === undefined ? "" : String( value );
                  return (
                    <td key={ column.key }>
                      { column.type === "status" ? (
                        <Pill value={ text } label={ row.status_display } />
                      ) : column.type === "date" ? (
                        formatDate( text )
                      ) : column.key === resource.titleKey ? (
                        <Link to={ `/content/${ slug }/${ key }/edit` }>{ text }</Link>
                      ) : (
                        truncate( text )
                      ) }
                    </td>
                  );
                } ) }
                <td className="row-actions">
                  <Button tone="quiet" onClick={ () => mutate( row, { status: row.status === "published" ? "draft" : "published" } ) }>
                    { row.status === "published" ? "Unpublish" : "Publish" }
                  </Button>
                  <Button tone="quiet" onClick={ () => navigate( `/content/${ slug }/${ key }/edit` ) }>
                    Edit
                  </Button>
                  <Button tone="quiet" onClick={ () => remove( row ) }>
                    Delete
                  </Button>
                </td>
              </tr>
            );
          } ) }
          { rows && rows.results.length === 0 ? (
            <tr>
              <td className="empty" colSpan={ resource.columns.length + 1 }>
                Nothing here yet.
              </td>
            </tr>
          ) : null }
        </tbody>
      </table>

      { rows ? <Pager count={ rows.count } page={ page } pageSize={ PAGE_SIZE } onPage={ setPage } /> : null }
    </section>
  );
}

function truncate( value: string, max = 70 ): string {
  return value.length > max ? `${ value.slice( 0, max ) }...` : value;
}
