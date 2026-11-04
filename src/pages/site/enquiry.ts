/* Sending an enquiry to the consultation inbox. */
import { API_BASE } from "./api";
import { fill } from "./copy";
import { deviceHeaders } from "./device";

/* Fields the appointment model has its own column for. Anything else travels as note lines. */
const COLUMNS = new Set( [ "name", "email", "phone", "concerns", "aim", "message" ] );

/* Every line the form can end up showing, so the page copy owns them all. */
export interface EnquiryWord {
  thanks?: string;
  received?: string;
  offline?: string;
  invalid?: string;
}

const DEFAULT_WORD: Required<EnquiryWord> = {
  thanks: "Thank you. Your enquiry is filed as {reference}. I reply to every one with availability and what to bring.",
  received: "Thank you. Your enquiry has been received.",
  offline: "The enquiry could not be sent right now. Please email or call and we will arrange it from there.",
  invalid: "Something in that enquiry did not fit. Please check the marked answers and send it again.",
};

export class Rejected extends Error {
  readonly fields: Record<string, string>;

  constructor( message: string, fields: Record<string, string> = {} ) {
    super( message );
    this.fields = fields;
  }
}

/* The API names its columns patient_name and patient_email; the form calls them name and email. */
function formId( field: string ) {
  return field.replace( /^patient_/, "" );
}

function errorsFrom( body: unknown ): Record<string, string> {
  if ( !body || typeof body !== "object" ) return {};
  const found: Record<string, string> = {};
  for ( const [ key, value ] of Object.entries( body ) ) {
    if ( key === "detail" || key === "non_field_errors" || !Array.isArray( value ) ) continue;
    const first = value.find( item => typeof item === "string" );
    if ( first ) found[ formId( key ) ] = first;
  }
  return found;
}

/* The answer a form should show, whether the API named one field or spoke as a whole. */
function headlineFrom( body: unknown ): string | null {
  if ( !body || typeof body !== "object" ) return null;
  for ( const key of [ "detail", "non_field_errors" ] ) {
    const value = ( body as Record<string, unknown> )[ key ];
    if ( typeof value === "string" ) return value;
    if ( Array.isArray( value ) ) {
      const first = value.find( item => typeof item === "string" );
      if ( first ) return first as string;
    }
  }
  return null;
}

function noteLines( values: Record<string, string>, fields: { id: string; label: string }[] ) {
  const lines = fields
    .filter( field => !COLUMNS.has( field.id ) && ( values[field.id] ?? "" ).trim() )
    .map( field => `${ field.label }: ${ ( values[field.id] ?? "" ).trim() }` );
  const message = ( values.message ?? "" ).trim();
  return message ? [ ...lines, message ] : lines;
}

/** Posts the enquiry and returns the line the form should show in its place. */
export async function sendConsultationRequest(
  values: Record<string, string>,
  fields: { id: string; label: string }[],
  word: EnquiryWord = {},
): Promise<string> {
  const said: Required<EnquiryWord> = {
    thanks: word.thanks || DEFAULT_WORD.thanks,
    received: word.received || DEFAULT_WORD.received,
    offline: word.offline || DEFAULT_WORD.offline,
    invalid: word.invalid || DEFAULT_WORD.invalid,
  };
  const response = await fetch( `${ API_BASE }/api/appointments/`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", ...deviceHeaders() },
    body: JSON.stringify( {
      patient_name: ( values.name ?? "" ).trim(),
      patient_email: ( values.email ?? "" ).trim(),
      phone: ( values.phone ?? "" ).trim(),
      concerns: ( values.concerns ?? "" ).trim(),
      aim: ( values.aim ?? "" ).trim(),
      message: noteLines( values, fields ).join( "\n" ),
    } ),
  } ).catch( () => {
    throw new Rejected( said.offline );
  } );

  if ( !response.ok ) {
    const body = await response.json().catch( () => null );
    throw new Rejected( headlineFrom( body ) ?? said.invalid, errorsFrom( body ) );
  }

  const receipt = await response.json().catch( () => null );
  const reference = typeof receipt?.reference === "string" ? receipt.reference : "";
  return reference ? fill( said.thanks, { reference } ) : said.received;
}
