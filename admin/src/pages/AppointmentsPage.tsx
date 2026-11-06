import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { prefetchPage } from "../api/warm";
import type { Appointment, AppointmentStatus, Page } from "../api/types";
import SectionHead from "../components/SectionHead";
import { Notice, Pager, Pill, TextInput, formatDate } from "../components/ui";

const PAGE_SIZE = 20;

const TABS: [ AppointmentStatus | "", string ][] = [
  [ "", "All" ],
  [ "pending", "New" ],
  [ "confirmed", "Confirmed" ],
  [ "completed", "Completed" ],
  [ "cancelled", "Cancelled" ],
  [ "no_show", "Did not attend" ],
];

/* Nothing is chosen until he chooses it. An empty selection is not a filter, so the inbox opens on
   every request rather than on a view that says something about them that is not yet true. */
type Filter = AppointmentStatus | "" | null;

export default function AppointmentsPage() {
  const [ rows, setRows ] = useState<Page<Appointment> | null>( null );
  const [ status, setStatus ] = useState<Filter>( null );
  const [ draft, setDraft ] = useState("");
  const [ search, setSearch ] = useState("");
  const [ unassigned, setUnassigned ] = useState(false);
  const [ page, setPage ] = useState(1);
  const [ error, setError ] = useState("");

  const load = useCallback(() => {
    api
      .page<Appointment>( "/api/appointments/", { page, page_size: PAGE_SIZE, status: status ?? "", search, unassigned: unassigned ? "1" : "" } )
      .then( setRows )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ page, status, search, unassigned ] );

  useEffect( load, [ load ] );

  useEffect(() => {
    const timer = setTimeout( () => {
      setSearch( draft );
      setPage( 1 );
    }, 400 );
    return () => clearTimeout( timer );
  }, [ draft ] );

  return (
    <section className="tone-page t3">
      <SectionHead
        icon="appointments"
        title="Appointments"
        note={
          rows
            ? `${ rows.count } request${ rows.count === 1 ? "" : "s" }${ status === null ? " in the inbox, unfiltered" : " in this view" }`
            : "Loading"
        }
        actions={ <Link className="btn btn-quiet" to="/booking-form">Booking form</Link> }
      />

      <div className="toolbar">
        <TextInput placeholder="Name, phone or reference" value={ draft } onChange={ event => setDraft( event.target.value ) } />
        <div className="tabs" role="group" aria-label="Which requests to show">
          { TABS.map( ( [ value, label ] ) => (
            <button
              key={ value || "all" }
              className={ status === value ? "on" : "" }
              aria-pressed={ status === value }
              onMouseEnter={ () => prefetchPage( "/api/appointments/", { page: 1, page_size: PAGE_SIZE, status: value } ) }
              onClick={ () => {
                setStatus( value );
                setPage( 1 );
              } }
            >
              { label }
            </button>
          ) ) }
          <button
            className={ unassigned ? "on" : "" }
            onClick={ () => {
              setUnassigned( current => !current );
              setPage( 1 );
            } }
          >
            Unassigned
          </button>
        </div>
      </div>

      { error ? <Notice>{ error }</Notice> : null }

      <table className="grid">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Patient</th>
            <th>When</th>
            <th>Type</th>
            <th>Status</th>
            <th>Assigned</th>
          </tr>
        </thead>
        <tbody>
          { rows?.results.map( row => (
            <tr key={ row.id }>
              <td>
                <Link to={ String( row.id ) }>{ row.reference }</Link>
              </td>
              <td>
                { row.patient_name }
                <span className="text-small quiet">{ row.phone }</span>
              </td>
              <td>{ formatDate( row.scheduled_at ) || "Not scheduled" }</td>
              <td>{ row.kind_display }</td>
              <td>
                <Pill value={ row.status } label={ row.status_display } />
              </td>
              <td className="text-small">{ row.assigned_to_name || "Not assigned" }</td>
            </tr>
          ) ) }
          { rows && rows.results.length === 0 ? (
            <tr>
              <td className="empty" colSpan={ 6 }>
                No requests match this view.
              </td>
            </tr>
          ) : null }
        </tbody>
      </table>

      { rows ? <Pager count={ rows.count } page={ page } pageSize={ PAGE_SIZE } onPage={ setPage } /> : null }
    </section>
  );
}
