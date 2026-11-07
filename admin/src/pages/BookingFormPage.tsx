import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { PageCopy } from "../api/types";
import type { BookingForm, Question, QuestionKind } from "../cms/bookingForm";
import { COLUMN_HINT, KINDS, LOCKED, blankQuestion, bookingOf, isColumn, problems, writeBooking } from "../cms/bookingForm";
import { siteOrigin } from "../cms/pageSchemas";
import SectionHead from "../components/SectionHead";
import { Icon } from "../components/icons";
import { useToast } from "../components/Toast";
import { Button, Checkbox, Field, Notice, Select, TextArea, TextInput } from "../components/ui";

/* The booking form is a block of the contact page's wording, so this screen edits that one row and
   leaves every other sentence of the page as it found it. */
const PAGE_KEY = "contact";

type Bag = Record<string, unknown>;

export default function BookingFormPage() {
  const toast = useToast();
  const [ page, setPage ] = useState<PageCopy | null>( null );
  const [ data, setData ] = useState<Bag | null>( null );
  const [ loaded, setLoaded ] = useState(false);
  const [ error, setError ] = useState("");
  const [ dirty, setDirty ] = useState(false);
  const [ busy, setBusy ] = useState("");
  const [ refused, setRefused ] = useState<string[]>( [] );

  useEffect(() => {
    api
      .get<PageCopy>( `/api/cms/pages/${ PAGE_KEY }/` )
      .then( row => {
        setPage( row );
        setData( row.data );
      } )
      /* A page nobody has rewritten yet has no wording row, and the site is showing the form that
         ships with it. This screen starts from those same questions, and saving creates the row. */
      .catch( ( reason: ApiError ) => {
        if ( reason.status !== 404 ) setError( reason.message );
      } )
      .finally( () => setLoaded( true ) );
  }, [] );

  const found = useMemo( () => bookingOf( data ), [ data ] );
  const form = found.form;

  function write( next: BookingForm ) {
    setData( current => writeBooking( current ?? {}, found.at, next ) );
    setDirty( true );
    setRefused( [] );
  }

  const each = ( change: ( question: Question, index: number ) => Question ) => write( { ...form, questions: form.questions.map( change ) } );

  const patchQuestion = ( at: number, part: Partial<Question> ) =>
    each( ( question, index ) => ( index === at ? { ...question, ...part } : question ) );

  function move( at: number, by: number ) {
    const to = at + by;
    if ( to < 0 || to >= form.questions.length ) return;
    const next = [ ...form.questions ];
    [ next[ at ], next[ to ] ] = [ next[ to ], next[ at ] ];
    write( { ...form, questions: next } );
  }

  async function remove( at: number ) {
    const question = form.questions[ at ];
    const said = question.label || `Question ${ at + 1 }`;
    if ( !( await toast.confirm( `Remove “${ said }” from the booking form? Anyone who has already answered it keeps their answer.`, { confirm: "Remove", cancel: "Keep it" } ) ) ) return;
    write( { ...form, questions: form.questions.filter( ( _, index ) => index !== at ) } );
  }

  async function save( next: BookingForm = form, said = "" ) {
    const blocked = problems( next );
    setRefused( blocked );
    if ( blocked.length ) {
      toast.error( blocked[ 0 ] );
      return;
    }
    setBusy( "save" );
    setError( "" );
    try {
      const row = await api.put<PageCopy>( `/api/cms/pages/${ PAGE_KEY }/`, {
        label: page?.label || "Contact page",
        data: writeBooking( data ?? {}, found.at, next ),
        published: page?.published ?? true,
      } );
      setPage( row );
      setData( row.data );
      setDirty( false );
      toast.success( said || "Saved. The booking form on the site asks these questions from the next visit." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "The server would not take those questions.";
      setError( message );
      toast.error( message );
    } finally {
      setBusy( "" );
    }
  }

  /* The switch is part of the form block itself, so the rest of the contact page keeps its words.
     Flipping the page's own published flag would only drop the whole row and let the site fall back
     to the questions it ships with, which still show a form. */
  async function showOnSite( on: boolean ) {
    const next = { ...form, shown: on };
    write( next );
    await save( next, on
      ? "The form is back on the contact page."
      : "The form is off the contact page. The rest of the page keeps its words." );
  }

  if ( !loaded ) return <p className="text-small loading">Loading</p>;

  return (
    <section className="tone-page t4 booking">
      <SectionHead
        icon="appointments"
        crumb={ (
          <>
            <Link to="/appointments">Appointments</Link>
            <Icon name="chevron" size={ 14 } />
            Booking form
          </>
        ) }
        title="Booking form"
        note="The questions on the contact page that a patient answers to ask for a consultation."
        actions={ (
          <>
            <a className="btn btn-quiet" href={ `${ siteOrigin() }/contact` } target="_blank" rel="noreferrer">
              See the page
            </a>
            <span className={ `pill pill-${ form.shown ? "good" : "neutral" }` }>{ form.shown ? "Live" : "Hidden" }</span>
          </>
        ) }
      />

      { error ? <Notice>{ error }</Notice> : null }
      { refused.map( ( line, at ) => <Notice key={ at }>{ line }</Notice> ) }

      <div className="card">
        <div className="booking-head">
          <p className="field-label">The questions, in the order the visitor meets them</p>
          <div className="booking-switch">
            <Checkbox
              label="Show this form on the site"
              checked={ form.shown }
              onChange={ showOnSite }
            />
            <p className="text-small quiet">Takes effect at once. Switched off, the contact page keeps everything else and simply leaves out this form.</p>
          </div>
        </div>

        <div className="booking-list">
          { form.questions.map( ( question, at ) => (
            <QuestionRow
              key={ question.id }
              question={ question }
              at={ at }
              last={ form.questions.length }
              busy={ busy }
              onPatch={ part => patchQuestion( at, part ) }
              onMove={ by => move( at, by ) }
              onRemove={ () => remove( at ) }
            />
          ) ) }
        </div>

        <Button
          tone="quiet"
          onClick={ () => {
            write( { ...form, questions: [ ...form.questions, blankQuestion( form.questions ) ] } );
          } }
        >
          <Icon name="plus" size={ 15 } />
          Add a question
        </Button>
      </div>

      <div className="card form-grid">
        <p className="field-label span-2">The words around the questions</p>
        <div className="span-2">
          <Field label="Name of the block on the page" help="The heading the questions sit under.">
            <TextInput value={ form.heading } onChange={ event => write( { ...form, heading: event.target.value } ) } />
          </Field>
        </div>
        <div className="span-2">
          <Field label="Line above the questions" help="What you tell a visitor before they start typing. Marks like **bold** work here.">
            <TextArea rows={ 3 } value={ form.note } onChange={ event => write( { ...form, note: event.target.value } ) } />
          </Field>
        </div>
        <Field label="Words on the button" help="What the visitor presses to send the form.">
          <TextInput value={ form.submitLabel } onChange={ event => write( { ...form, submitLabel: event.target.value } ) } />
        </Field>
      </div>

      <div className="card form-grid">
        <p className="field-label span-2">What the visitor is told afterwards</p>
        <div className="span-2">
          <Field label="Receipt, with their reference" help="{reference} is replaced by the reference the form is filed under.">
            <TextArea rows={ 2 } value={ form.thanks } onChange={ event => write( { ...form, thanks: event.target.value } ) } />
          </Field>
        </div>
        <div className="span-2">
          <Field label="The line when no reference comes back">
            <TextArea rows={ 2 } value={ form.received } onChange={ event => write( { ...form, received: event.target.value } ) } />
          </Field>
        </div>
        <div className="span-2">
          <Field label="The line when the site cannot reach the inbox">
            <TextArea rows={ 2 } value={ form.offline } onChange={ event => write( { ...form, offline: event.target.value } ) } />
          </Field>
        </div>
        <div className="span-2">
          <Field label="The line when an answer does not fit">
            <TextArea rows={ 2 } value={ form.invalid } onChange={ event => write( { ...form, invalid: event.target.value } ) } />
          </Field>
        </div>
      </div>

      <footer className="form-actions">
        <Button busy={ busy === "save" } disabled={ busy !== "" || !dirty } onClick={ () => save() }>
          { busy === "save" ? "Saving" : dirty ? "Save the form" : "Saved" }
        </Button>
        <Link className="btn btn-quiet" to="/appointments">
          Back to appointments
        </Link>
      </footer>
    </section>
  );
}

function QuestionRow( { question, at, last, busy, onPatch, onMove, onRemove }: {
  question: Question;
  at: number;
  last: number;
  busy: string;
  onPatch: ( part: Partial<Question> ) => void;
  onMove: ( by: number ) => void;
  onRemove: () => void;
} ) {
  const said = question.label || `Question ${ at + 1 }`;
  const locked = LOCKED.includes( question.id );
  const paired = question.kind !== "choice" && question.kind !== "textarea";
  const options = ( question.options ?? [] ).join( "\n" );

  return (
    <div className="copy-entry booking-question">
      <header className="copy-entry-head">
        <span className="copy-entry-index">{ at + 1 }</span>
        <span className="copy-entry-name">{ said }</span>
        { isColumn( question.id ) ? <span className="booking-tag">Filed in its own column</span> : null }
        <span className="booking-tools">
          <button type="button" className="icon-btn" onClick={ () => onMove( -1 ) } disabled={ at === 0 || busy !== "" } aria-label={ `Move ${ said } up` }>
            <Icon name="up" size={ 15 } />
          </button>
          <button type="button" className="icon-btn" onClick={ () => onMove( 1 ) } disabled={ at === last - 1 || busy !== "" } aria-label={ `Move ${ said } down` }>
            <Icon name="down" size={ 15 } />
          </button>
          <button type="button" className="icon-btn" onClick={ onRemove } disabled={ busy !== "" } aria-label={ `Remove ${ said }` }>
            <Icon name="trash" size={ 15 } />
          </button>
        </span>
      </header>

      <div className="copy-entry-body">
        <Field label="The question as the visitor reads it">
          <TextInput value={ question.label } onChange={ event => onPatch( { label: event.target.value } ) } />
        </Field>

        <div className="booking-line">
          <Field label="The answer they type">
            <Select
              value={ question.kind }
              options={ KINDS.map( ( [ value, label ] ) => [ value, label ] as [ QuestionKind, string ] ) }
              onChange={ event => {
                const kind = event.target.value as QuestionKind;
                onPatch( kind === "choice"
                  ? { kind, options: question.options?.length ? question.options : [ "", "" ] }
                  : { kind, options: undefined, half: kind === "textarea" ? undefined : question.half ?? true } );
              } }
            />
          </Field>
          <Checkbox label="Must be answered" checked={ locked || Boolean( question.required ) } onChange={ next => onPatch( { required: next } ) } />
          { paired ? <Checkbox label="Beside another question" checked={ Boolean( question.half ) } onChange={ next => onPatch( { half: next } ) } /> : null }
        </div>

        { question.kind === "choice" ? (
          <Field label="The answers to choose from" help="One per line. The visitor ticks one.">
            <TextArea rows={ Math.max( 2, ( question.options ?? [] ).length ) } value={ options } onChange={ event => onPatch( { options: event.target.value.split( "\n" ).map( line => line.trim() ).filter( Boolean ) } ) } />
          </Field>
        ) : null }

        <p className="booking-hint">{ COLUMN_HINT[ question.id ] ?? "Answers to this arrive in the inbox as a line of the message, and go out in the confirmation." }</p>
      </div>
    </div>
  );
}
