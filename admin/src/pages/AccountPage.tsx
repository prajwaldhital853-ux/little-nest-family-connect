import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { StaffUser, TrustedDevice } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import SectionHead from "../components/SectionHead";
import { useToast } from "../components/Toast";
import { Button, Field, Notice, TextInput, formatDate } from "../components/ui";

export default function AccountPage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [ full_name, setFullName ] = useState( user?.full_name ?? "" );
  const [ job_title, setJobTitle ] = useState( user?.job_title ?? "" );
  const [ error, setError ] = useState("");
  const [ current, setCurrent ] = useState("");
  const [ next, setNext ] = useState("");
  const [ passwordError, setPasswordError ] = useState("");
  const [ devices, setDevices ] = useState<TrustedDevice[]>( [] );
  const [ deviceError, setDeviceError ] = useState("");
  /* Which of the two buttons is waiting on the server, so neither looks idle mid-request. */
  const [ busy, setBusy ] = useState<"profile" | "password" | "">("");

  const load = useCallback(() => {
    api.get<TrustedDevice[]>( "/api/auth/devices/" ).then( setDevices ).catch( () => undefined );
  }, [] );

  useEffect( load, [ load ] );

  async function revoke( device: TrustedDevice ) {
    if ( !( await toast.confirm( `Make ${ device.label } type the emailed code again?`, { confirm: "Sign it out", cancel: "Keep it" } ) ) ) return;
    setDeviceError( "" );
    try {
      await api.del( `/api/auth/devices/${ device.id }/` );
      setDevices( rows => rows.filter( row => row.id !== device.id ) );
      toast.success( "That device will be asked for a code the next time it signs in." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not remove that device.";
      setDeviceError( message );
      toast.error( message );
    }
  }

  const sync = useCallback( ( person: StaffUser ) => {
    setFullName( person.full_name );
    setJobTitle( person.job_title );
  }, [] );

  useEffect(() => {
    if ( user ) sync( user );
  }, [ user, sync ] );

  async function saveProfile( event: React.FormEvent ) {
    event.preventDefault();
    setError( "" );
    setBusy( "profile" );
    try {
      const updated = await api.patch<StaffUser>( "/api/auth/me/", { full_name, job_title } );
      setUser( updated );
      toast.success( "Your details are saved." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not save.";
      setError( message );
      toast.error( message );
    } finally {
      setBusy( "" );
    }
  }

  async function savePassword( event: React.FormEvent ) {
    event.preventDefault();
    setPasswordError( "" );
    setBusy( "password" );
    try {
      const result = await api.post<{ detail: string }>( "/api/auth/password/", { current_password: current, new_password: next } );
      toast.success( result.detail );
      setCurrent( "" );
      setNext( "" );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not change the password.";
      setPasswordError( message );
      toast.error( message );
    } finally {
      setBusy( "" );
    }
  }

  return (
    <section className="tone-page t7">
      <SectionHead icon="account" title="My account" note={ user?.email } />

      <form className="inline-form" onSubmit={ saveProfile }>
        <Field label="Name shown in the panel">
          <TextInput value={ full_name } onChange={ event => setFullName( event.target.value ) } />
        </Field>
        <Field label="Role">
          <TextInput value={ job_title } onChange={ event => setJobTitle( event.target.value ) } />
        </Field>
        { error ? <Notice>{ error }</Notice> : null }
        <div className="form-actions">
          <Button type="submit" busy={ busy === "profile" }>{ busy === "profile" ? "Saving" : "Save" }</Button>
        </div>
      </form>

      <form className="inline-form" onSubmit={ savePassword }>
        <h2>Change password</h2>
        <p className="text-small quiet">Changing it signs every other device out of this account.</p>
        <Field label="Current password">
          <TextInput type="password" autoComplete="current-password" value={ current } onChange={ event => setCurrent( event.target.value ) } required />
        </Field>
        <Field label="New password" help="At least 10 characters and not a common phrase.">
          <TextInput type="password" autoComplete="new-password" value={ next } onChange={ event => setNext( event.target.value ) } required />
        </Field>
        { passwordError ? <Notice>{ passwordError }</Notice> : null }
        <div className="form-actions">
          <Button type="submit" busy={ busy === "password" } disabled={ !current || !next }>
            { busy === "password" ? "Changing" : "Change password" }
          </Button>
        </div>
      </form>

      <div className="block">
        <h2>Devices that remember you</h2>
        <p className="text-small quiet">
          A new browser or machine has to type the emailed code before the panel opens. Remove one here and it needs a code again.
        </p>
        { deviceError ? <Notice>{ deviceError }</Notice> : null }
        { devices.length === 0 ? (
          <p className="text-small quiet">Nothing is remembered yet, so the next sign in anywhere will ask for a code.</p>
        ) : (
          <table className="grid device-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Added</th>
                <th>Last used</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              { devices.map( device => (
                <tr key={ device.id }>
                  <td>{ device.label }</td>
                  <td data-label="Added">{ formatDate( device.created_at ) }</td>
                  <td data-label="Last used">{ formatDate( device.last_seen_at ) || "Not used since" }</td>
                  <td className="row-actions">
                    <Button tone="quiet" onClick={ () => revoke( device ) }>
                      Remove
                    </Button>
                  </td>
                </tr>
              ) ) }
            </tbody>
          </table>
        ) }
      </div>
    </section>
  );
}
