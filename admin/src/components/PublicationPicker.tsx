import { useEffect, useRef, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Page, PublicationRow } from "../api/types";
import { PUBLICATION_KIND_OPTIONS } from "../cms/resources";
import { Icon } from "./icons";
import { Notice, TextInput } from "./ui";

/**
 * The publication list, opened from a block of papers on the research page. One click drops the
 * title, the journal and the year into the line, so adding a paper here never means typing it out.
 */
export default function PublicationPicker( { onClose, onPick }: {
  onClose: () => void;
  onPick: ( row: PublicationRow ) => void;
} ) {
  const close = useRef<HTMLButtonElement>( null );
  const [ term, setTerm ] = useState("");
  const [ kind, setKind ] = useState("");
  const [ rows, setRows ] = useState<PublicationRow[] | null>( null );
  const [ total, setTotal ] = useState(0);
  const [ error, setError ] = useState("");

  useEffect(() => {
    close.current?.focus();
    function onKey( event: KeyboardEvent ) {
      if ( event.key === "Escape" ) onClose();
    }
    document.addEventListener( "keydown", onKey );
    return () => document.removeEventListener( "keydown", onKey );
  }, [ onClose ] );

  /* Every word typed costs a request, so the box is given a quarter of a second before it asks. */
  useEffect(() => {
    const hold = setTimeout(() => {
      api
        .page<PublicationRow>( "/api/cms/publications/", {
          page_size: 100,
          ordering: "-year",
          search: term.trim() || undefined,
          kind: kind || undefined,
        } )
        .then( ( page: Page<PublicationRow> ) => {
          setRows( page.results );
          setTotal( page.count );
        } )
        .catch( ( reason: ApiError ) => {
          setRows( [] );
          setError( reason.message );
        } );
    }, term ? 250 : 0 );
    return () => clearTimeout( hold );
  }, [ term, kind ] );

  return (
    <div className="pick-scrim" onClick={ onClose }>
      <div
        className="pick-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add from Publications"
        onClick={ event => event.stopPropagation() }
      >
        <header className="pick-head">
          <p className="pick-title">Add from Publications</p>
          <button type="button" className="pick-close" onClick={ onClose } aria-label="Close">
            <Icon name="close" size={ 18 } />
          </button>
        </header>

        <div className="pick-body">
          { error ? <Notice>{ error }</Notice> : null }

          <div className="pub-search">
            <span className="pub-search-mark">
              <Icon name="search" size={ 16 } />
            </span>
            <TextInput
              value={ term }
              placeholder="Search by title, author, journal or theme"
              aria-label="Search publications"
              onChange={ event => setTerm( event.target.value ) }
            />
          </div>

          <div className="pick-list">
            <button type="button" className={ kind === "" ? "pick on" : "pick" } onClick={ () => setKind( "" ) }>
              Every type
            </button>
            { PUBLICATION_KIND_OPTIONS.map( ( [ value, name ] ) => (
              <button type="button" key={ value } className={ kind === value ? "pick on" : "pick" } onClick={ () => setKind( value ) }>
                { name }
              </button>
            ) ) }
          </div>

          { rows === null ? (
            <p className="text-small quiet">Loading the publication list.</p>
          ) : rows.length === 0 ? (
            <p className="text-small quiet">
              Nothing matches that. Add the paper under Publications and it appears here.
            </p>
          ) : (
            <div className="pub-stack">
              { rows.map( row => (
                <button type="button" className="pub-row" key={ row.id } onClick={ () => onPick( row ) }>
                  <span className="pub-row-title">{ row.title }</span>
                  <span className="pub-row-meta">
                    { [ row.venue, row.year ? String( row.year ) : "" ].filter( Boolean ).join( ", " ) || "No journal or year yet" }
                  </span>
                  <span className="pub-row-kind">{ row.kind_display }</span>
                </button>
              ) ) }
            </div>
          ) }

          { total > ( rows?.length ?? 0 ) ? (
            <p className="text-small quiet">Showing the first { rows?.length } of { total }. Search to narrow it.</p>
          ) : null }
        </div>
      </div>
    </div>
  );
}
