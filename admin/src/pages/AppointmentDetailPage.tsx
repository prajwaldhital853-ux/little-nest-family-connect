import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Appointment, PageCopy, StaffUser } from "../api/types";
import { SHIPPED_FORM, labelsOf } from "../cms/bookingForm";
import { Button, Field, Notice, Pill, Select, TextArea, TextInput, formatDate, toLocalInput } from "../components/ui";
import { useToast } from "../components/Toast";
import { Icon } from "../components/icons";
import SectionHead from "../components/SectionHead";

const STATUS_LABELS: Record<string, string> = {
  pending: "New",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Did not attend",
};

/* The words the form shipped with, for a database that holds no wording row of its own. */
const SHIPPED_LABELS: Record<string, string> = Object.fromEntries( SHIPPED_FORM.questions.map( question => [ question.id, question.label ] ) );

/* An outcome other than Confirmed is final, so the question says so before he answers it. */
function askWords( next: string, hasEmail: boolean ): string {
  if ( next === "confirmed" ) {
    return hasEmail
      ? "Confirm this appointment and email the patient their details?"
      : "Confirm this appointment? This request has no email address, so nothing can be sent to the patient.";
  }
  if ( next === "completed" ) return "Mark this appointment as attended? Nothing can be changed after it.";
  if ( next === "cancelled" ) return "Cancel this appointment? The patient keeps the reference they were given, and nothing can be changed after it.";
  if ( next === "no_show" ) return "Mark this patient as not having attended? Nothing can be changed after it.";
  return `Mark this appointment as ${ STATUS_LABELS[ next ] ?? next }?`;
}

export default function AppointmentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [ row, setRow ] = useState<Appointment | null>( null );
  const [ staff, setStaff ] = useState<StaffUser[]>( [] );
  const [ note, setNote ] = useState("");
  const [ assigned, setAssigned ] = useState("");
  const [ when, setWhen ] = useState("");
  const [ error, setError ] = useState("");
  const [ labels, setLabels ] = useState<Record<string, string>>( {} );
  /** Which button is waiting on the server, so only that one shows the spinner. */
  const [ busy, setBusy ] = useState("");

  const load = useCallback(() => {
    api
      .get<Appointment>( `/api/appointments/${ id }/` )
      .then( found => {
        setRow( found );
        setNote( found.admin_note );
        setAssigned( found.assigned_to ? String( found.assigned_to ) : "" );
        setWhen( toLocalInput( found.scheduled_at ) );
      } )
      .catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [ id ] );

  useEffect( load, [ load ] );

  useEffect(() => {
    api
      .page<StaffUser>( "/api/auth/users/", { page_size: 100, ordering: "email" } )
      .then( page => setStaff( page.results.filter( person => person.is_staff ) ) )
      .catch( () => setStaff( [] ) );
  }, [] );

  /* An answer reads under the question as the booking form words it today, so renaming a question
     in the panel renames it here too instead of leaving the old wording beside the new answer. */
  useEffect(() => {
    api
      .get<PageCopy>( "/api/cms/pages/contact/" )
      .then( page => setLabels( labelsOf( page.data ) ) )
      .catch( () => setLabels( {} ) );
  }, [] );

  const said = ( id: string ) => ( labels[ id ] || SHIPPED_LABELS[ id ] || id ).replace( /_/g, " " ).trim();

  if ( error && !row ) return <Notice>{ error }</Notice>;
  if ( !row ) return <p className="text-small">Loading</p>;

  /* The wording is chosen before the write, because the row about to be replaced is what says
     whether this move into Confirmed is a new one and whether the patient has an address. */
  function doneWords( body: Record<string, unknown> ): string {
    const next = body.status;
    if ( typeof next !== "string" ) return "Saved.";
    const label = STATUS_LABELS[ next ] ?? next;
    const mailed = next === "confirmed" && row!.status !== "confirmed" && Boolean( row!.patient_email );
    return mailed ? `Marked as ${ label }, and a confirmation goes to the patient.` : `Marked as ${ label }.`;
  }

  async function patch( body: Record<string, unknown>, tag: string, then?: () => void ) {
    setError( "" );
    const words = doneWords( body );
    setBusy( tag );
    try {
      setRow( await api.patch<Appointment>( `/api/appointments/${ row!.id }/`, body ) );
      toast.success( words );
      if ( then ) then();
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not save this request.";
      setError( message );
      toast.error( message );
    } finally {
      setBusy( "" );
    }
  }

  /* Asked first, because three of the four outcomes cannot be taken back. */
  async function moveTo( next: string ) {
    const label = STATUS_LABELS[ next ] ?? next;
    if ( !( await toast.confirm( askWords( next, Boolean( row!.patient_email ) ), { confirm: label, cancel: "Leave it" } ) ) ) return;
    await patch( { status: next }, `status:${ next }` );
  }

  async function remove() {
    if ( !( await toast.confirm( "Delete this request for good? The patient keeps the reference they were given.", { confirm: "Delete", cancel: "Keep it" } ) ) ) return;
    setError( "" );
    setBusy( "delete" );
    try {
      await api.del( `/api/appointments/${ row!.id }/` );
      toast.success( "Request deleted." );
      navigate( "/appointments" );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not delete this request.";
      setError( message );
      toast.error( message );
    } finally {
      setBusy( "" );
    }
  }

  return (
    <section className="detail tone-page t3">
      <SectionHead
        icon="appointments"
        crumb={ (
          <>
            <Link to="/appointments">Appointments</Link>
            <Icon name="chevron" size={ 14 } />
            { row.reference }
          </>
        ) }
        title={ row.patient_name }
        note={ `${ formatDate( row.scheduled_at ) || "Not scheduled" } ${ "\u00B7" } ${ row.kind_display } ${ "\u00B7" } ${ row.phone }${ row.patient_email ? ` · ${ row.patient_email }` : "" }` }
        actions={ <Pill value={ row.status } label={ row.status_display } /> }
      />

      { error ? <Notice>{ error }</Notice> : null }

      <div className="answers">
        <p className="question">{ said( "concerns" ) }</p>
        <p>{ row.concerns || "Nothing was written." }</p>
        <p className="question">{ said( "aim" ) }</p>
        <p>{ row.aim || "Nothing was written." }</p>
        { row.message ? (
          <>
            <p className="question">{ said( "message" ) }</p>
            <p>{ row.message }</p>
          </>
        ) : null }
        <p className="text-small quiet">Received { formatDate( row.created_at ) }</p>
      </div>

      <div className="actions-row">
        <p className="field-label">Move to</p>
        { row.next_statuses.length === 0 ? (
          <p className="text-small quiet">This appointment has reached its final outcome.</p>
        ) : (
          row.next_statuses.map( next => (
            <Button
              key={ next }
              tone={ next === "cancelled" || next === "no_show" ? "quiet" : "primary" }
              busy={ busy === `status:${ next }` }
              disabled={ busy !== "" }
              onClick={ () => moveTo( next ) }
            >
              { STATUS_LABELS[ next ] ?? next }
            </Button>
          ) ) ) }
      </div>

      <div className="card form-grid">
        <Field label="Consultation time" help="Empty until the time is agreed with the patient.">
          <TextInput type="datetime-local" value={ when } onChange={ event => setWhen( event.target.value ) } />
        </Field>
        <Field label="Assigned to">
          <Select
            value={ assigned }
            options={ [ [ "", "Not assigned" ], ...staff.map( person => [ String( person.id ), person.full_name || person.email ] as [string, string] ) ] }
            onChange={ event => setAssigned( event.target.value ) }
          />
        </Field>
        <div className="span-2">
          <Field label="Private note" help="Only visible in this panel.">
            <TextArea value={ note } rows={ 4 } onChange={ event => setNote( event.target.value ) } />
          </Field>
        </div>

        <footer className="form-actions span-2">
          <Button
            busy={ busy === "save" }
            disabled={ busy !== "" || ( assigned === String( row.assigned_to ?? "" ) && note === row.admin_note && when === toLocalInput( row.scheduled_at ) ) }
            onClick={ () => patch(
              {
                admin_note: note,
                assigned_to: assigned ? Number( assigned ) : null,
                scheduled_at: when ? new Date( when ).toISOString() : null,
              },
              "save",
              () => navigate( "/appointments" ),
            ) }
          >
            { busy === "save" ? "Sending" : "Save time, note and assignment" }
          </Button>
          <Button tone="quiet" onClick={ () => navigate( "/appointments" ) }>
            Back
          </Button>
          <Button tone="danger" busy={ busy === "delete" } disabled={ busy !== "" } onClick={ remove }>
            Delete
          </Button>
        </footer>
      </div>
    </section>
  );
}
