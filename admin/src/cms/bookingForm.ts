/* The questions the public booking form asks, and the lines around them.

   They live in the contact page's wording, in the same blob every other sentence of that page
   lives in, so the site reads them the way it reads anything else and a new question needs no
   room in the database of its own. This file only says how the shape is read and written back. */

export type QuestionKind = "text" | "email" | "tel" | "date" | "choice" | "textarea";

export interface Question {
  id: string;
  kind: QuestionKind;
  label: string;
  required?: boolean;
  /** Two of these share a row on the site instead of taking a row each. */
  half?: boolean;
  options?: string[];
  /** The grey words inside the box, before anything is typed. */
  placeholder?: string;
}

export interface BookingForm {
  /** The name of the block on the page, above the questions. */
  heading: string;
  /** The line the visitor reads before the first question. */
  note: string;
  /** Whether the contact page shows this block at all. Missing means it does. */
  shown: boolean;
  submitLabel: string;
  thanks: string;
  received: string;
  offline: string;
  invalid: string;
  questions: Question[];
}

type Bag = Record<string, unknown>;

export const KINDS: [ QuestionKind, string ][] = [
  [ "text", "A line of text" ],
  [ "textarea", "A longer answer" ],
  [ "email", "An email address" ],
  [ "tel", "A phone number" ],
  [ "date", "A date" ],
  [ "choice", "A choice of answers" ],
];

/* The answers the clinic keeps in their own columns, and what that means for a question using one.
   A question with any other id is filed as a line of the message, which the panel and the
   confirmation both show, so adding a question never needs anything from a developer. */
export const COLUMN_HINT: Record<string, string> = {
  name: "Filed as the patient's name, and used to greet them in the confirmation.",
  email: "Filed as the address the confirmation is sent to.",
  phone: "Filed as the number the clinic calls.",
  concerns: "Filed as the health concerns, and read before the appointment is agreed.",
  aim: "Filed as what the patient hopes for, and read before the appointment is agreed.",
  message: "Anything the patient adds, and every question under this one, is filed as the message.",
};

/** The questions that must stay in the form, because a request without them cannot be filed. */
export const LOCKED = [ "name" ];

/* The form that ships with the site, for the case where a database has no contact wording at all.
   Only the shape matters here: the site keeps its own copy of these words, and anything this
   screen writes into the wording row covers the bundled version over. */
export const SHIPPED_FORM: BookingForm = {
  heading: "Professional enquiry",
  note: "I welcome professional enquiries about research collaboration, teaching, speaking and initiatives that improve care for older people. Please include a brief description of your enquiry, your organisation and any relevant timeline.",
  shown: true,
  submitLabel: "Send enquiry",
  thanks: "Thank you. Your enquiry is filed as {reference}. I reply to every one with availability and what to bring.",
  received: "Thank you. Your enquiry has been received.",
  offline: "The enquiry could not be sent right now. Please email or call and we will arrange it from there.",
  invalid: "Something in that enquiry did not fit. Please check the marked answers and send it again.",
  questions: [
    { id: "name", kind: "text", label: "Your name", required: true, half: true },
    { id: "email", kind: "email", label: "Your email", required: true, half: true },
    { id: "phone", kind: "tel", label: "Your phone number", required: true, half: true },
    { id: "organisation", kind: "text", label: "Organisation", required: false, half: true },
    { id: "topic", kind: "choice", label: "Nature of enquiry", required: true, options: [ "Research collaboration", "Teaching and speaking", "Programme and policy work", "Other" ] },
    { id: "timeline", kind: "text", label: "Timeline, if any", required: false },
    { id: "concerns", kind: "textarea", label: "Please briefly list your top 3 most important health concerns or goals", required: true },
    { id: "aim", kind: "textarea", label: "What are you hoping to achieve from a consultation with me?", required: true },
    { id: "message", kind: "textarea", label: "Your message", required: true },
  ],
};

/**
 * Whether a wording row is the booking form in disguise. The panel edits that form from its own
 * screen, so any other screen that meets one of these only points there rather than showing the
 * same questions twice with their plumbing visible.
 */
export function holdsBookingForm( value: unknown ): boolean {
  if ( !value || typeof value !== "object" ) return false;
  const box = ( value as Bag ).form;
  return Boolean( box && typeof box === "object" && Array.isArray( ( box as Bag ).fields ) );
}

/** The form to edit: whatever the wording holds, or the shipped one when it holds nothing. */
export function bookingOf( data: Bag | null ): { at: number; form: BookingForm } {
  return readBooking( data ) ?? { at: 0, form: SHIPPED_FORM };
}

export function kindLabel( kind: QuestionKind ): string {
  return KINDS.find( ( [ value ] ) => value === kind )?.[ 1 ] ?? kind;
}

export function isColumn( id: string ): boolean {
  return id in COLUMN_HINT;
}

function text( value: unknown, fallback = "" ): string {
  return typeof value === "string" ? value : fallback;
}

function readQuestion( value: unknown ): Question | null {
  if ( !value || typeof value !== "object" ) return null;
  const box = value as Bag;
  const id = text( box.id ).trim();
  if ( !id ) return null;
  const kind = KINDS.some( ( [ value ] ) => value === box.kind ) ? ( box.kind as QuestionKind ) : "text";
  const options = Array.isArray( box.options ) ? box.options.map( option => text( option ) ).filter( Boolean ) : undefined;
  const question: Question = { id, kind, label: text( box.label ), required: Boolean( box.required ) };
  if ( kind === "choice" ) question.options = options ?? [];
  else if ( typeof box.half === "boolean" ) question.half = box.half;
  const placeholder = text( box.placeholder );
  if ( placeholder ) question.placeholder = placeholder;
  return question;
}

/** The form as the wording holds it, or the one that ships with the site when nothing says otherwise. */
export function readBooking( data: Bag | null ): { at: number; form: BookingForm } | null {
  const rows = Array.isArray( data?.rows ) ? ( data!.rows as unknown[] ) : [];
  for ( let at = 0; at < rows.length; at++ ) {
    const row = rows[ at ] as Bag | undefined;
    const box = row?.form as Bag | undefined;
    if ( !row || !box || !Array.isArray( box.fields ) ) continue;
    const questions = box.fields.map( readQuestion ).filter( ( one): one is Question => one !== null );
    if ( !questions.length ) continue;
    return {
      at,
      form: {
        heading: text( row.label ),
        note: text( row.text ),
        shown: box.shown !== false,
        submitLabel: text( box.submitLabel, "Send enquiry" ),
        thanks: text( box.thanks ),
        received: text( box.received ),
        offline: text( box.offline ),
        invalid: text( box.invalid ),
        questions,
      },
    };
  }
  return null;
}

/** The same blob with the form written back into the row it came from, every other word kept. */
export function writeBooking( data: Bag, at: number, form: BookingForm ): Bag {
  const rows = ( data.rows as unknown[] ) ?? [];
  const row = ( rows[ at ] as Bag ) ?? {};
  const fields = form.questions.map( question => {
    const box: Bag = { id: question.id, kind: question.kind, label: question.label, required: question.required };
    if ( question.kind === "choice" ) box.options = question.options ?? [];
    else if ( question.half !== undefined ) box.half = question.half;
    const placeholder = question.placeholder;
    if ( placeholder ) box.placeholder = placeholder;
    return box;
  } );
  const next = [ ...rows ];
  next[ at ] = {
    ...row,
    label: form.heading,
    text: form.note,
    form: {
      ...( ( row.form as Bag ) ?? {} ),
      shown: form.shown,
      submitLabel: form.submitLabel,
      thanks: form.thanks,
      received: form.received,
      offline: form.offline,
      invalid: form.invalid,
      fields,
    },
  };
  return { ...data, rows: next };
}

/** An id nothing else in the form uses, so a new question cannot overwrite an answer's column. */
export function nextId( questions: Question[] ): string {
  const used = new Set( questions.map( question => question.id ) );
  for ( let n = 1; n < 100; n++ ) {
    const id = `q${ n }`;
    if ( !used.has( id ) ) return id;
  }
  return `q${ Date.now() }`;
}

export function blankQuestion( questions: Question[] ): Question {
  return { id: nextId( questions ), kind: "text", label: "", required: false, half: true };
}

/** Every question that has no shape yet: a blank one cannot be shown on the site. */
export function problems( form: BookingForm ): string[] {
  const said: string[] = [];
  const names = form.questions.map( question => question.label.trim() );
  if ( !form.questions.length ) said.push("The form needs at least one question.");
  if ( !LOCKED.every( id => form.questions.some( question => question.id === id ) ) ) {
    said.push("Keep the name question in the form: a request with no name has nothing to file it under.");
  }
  names.forEach( ( name, index ) => {
    if ( !name ) said.push(`Question ${ index + 1 } has no wording.`);
  } );
  const duplicated = names.filter( ( name, index ) => name && names.indexOf( name ) !== index );
  if ( duplicated.length ) said.push(`Two questions read the same: ${ duplicated.join( ", " ) }.`);
  form.questions.forEach( ( question, index ) => {
    if ( question.kind === "choice" && !( question.options ?? [] ).length ) {
      said.push(`Question ${ index + 1 } asks for a choice but has no answers to choose from.`);
    }
  } );
  if ( !form.submitLabel.trim() ) said.push("The button under the questions has no words.");
  return [ ...new Set( said ) ];
}

/** Question wording by id, so another screen can name an answer the way the form does. */
export function labelsOf( data: Bag | null ): Record<string, string> {
  const found = readBooking( data );
  if ( !found ) return {};
  return Object.fromEntries( found.form.questions.map( question => [ question.id, question.label ] ) );
}
