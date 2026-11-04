/* What the enquiry form shows when the API answers with a refusal. */

import { afterEach, describe, expect, it, vi } from "vitest";

import { Rejected, sendConsultationRequest } from "./enquiry";

const VALUES = { name: "Anjana", email: "anjana@example.com", phone: "9800000000", concerns: "Falls", aim: "A review", message: "Mum keeps dizzying." };
const FIELDS = [ { id: "name", label: "Your name" }, { id: "email", label: "Email" }, { id: "message", label: "Anything else" } ];

function answer( status: number, body: unknown ) {
  return vi.fn( async () => ( { ok: status < 400, status, json: async () => body } ) );
}

afterEach( () => vi.unstubAllGlobals() );

describe( "sendConsultationRequest", () => {
  it( "shows the sentence the API wrote, when it wrapped it in a list", async () => {
    vi.stubGlobal( "fetch", answer( 400, { detail: [ "This enquiry has already been received." ] } ) );

    const failure = await sendConsultationRequest( VALUES, FIELDS ).then( () => null, reason => reason as Rejected );
    expect( failure?.message ).toBe( "This enquiry has already been received." );
  } );

  it( "names the field the API marked, under the id the form uses", async () => {
    vi.stubGlobal( "fetch", answer( 400, { patient_email: [ "Enter a valid email address." ] } ) );

    const failure = await sendConsultationRequest( VALUES, FIELDS ).then( () => null, reason => reason as Rejected );
    expect( failure?.fields ).toEqual( { email: "Enter a valid email address." } );
  } );

  it( "fills the reference into the thank-you line", async () => {
    vi.stubGlobal( "fetch", answer( 201, { reference: "KND-42" } ) );

    await expect( sendConsultationRequest( VALUES, FIELDS, { thanks: "Filed as {reference}." } ) ).resolves.toBe( "Filed as KND-42." );
  } );
} );
