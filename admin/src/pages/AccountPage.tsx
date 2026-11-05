import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { DeviceAccess, StaffUser, TrustedDevice } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import SectionHead from "../components/SectionHead";
import { useToast } from "../components/Toast";
import { Button, Field, Notice, Pill, TextInput, formatDate } from "../components/ui";

const TABS: [string, string][] = [ [ "pending", "Waiting" ], [ "allowed", "Allowed" ], [ "blocked", "Blocked" ] ];
const STATUS_LABELS: Record<string, string> = { pending: "Waiting", allowed: "Allowed", blocked: "Blocked" };

/** The one line that tells the doctor which browser this is. */
function about( row: DeviceAccess ): string {
  return [ row.screen, row.language, row.timezone_name, row.touch ? "touch screen" : "" ].filter( Boolean ).join( " · " );
}

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
  const [ requests, setRequests ] = useState<DeviceAccess[]>( [] );
  const [ tab, setTab ] = useState( "pending" );
  const [ notes, setNotes ] = useState<Record<number, string>>( {} );
  const [ deciding, setDeciding ] = useState( 0 );
  const [ deviceError, setDeviceError ] = useState("");

  const load = useCallback(() => {
    api.get<TrustedDevice[]>( "/api/auth/devices/" ).then( setDevices ).catch( () => undefined );
    api.get<DeviceAccess[]>( "/api/auth/access/requests/" ).then( setRequests ).catch( () => undefined );
  }, [] );

  useEffect( load, [ load ] );

  async function revoke( device: TrustedDevice ) {
    if ( !( await toast.confirm( `Make ${ device.label } ask for an emailed code again?`, { confirm: "Sign it out", cancel: "Keep it" } ) ) ) return;
    setDeviceError( "" );
    try {
      await api.del( `/api/auth/devices/${ device.id }/` );
      setDevices( rows => rows.filter( row => row.id !== device.id ) );
      toast.success( "That device has to be approved again before it can sign in." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not remove that device.";
      setDeviceError( message );
      toast.error( message );
    }
  }

  async function decide( row: DeviceAccess, action: "allowed" | "blocked" ) {
    setDeviceError( "" );
    setDeciding( row.id );
    try {
      const updated = await api.post<DeviceAccess>( `/api/auth/access/requests/${ row.id }/`, { action, note: notes[ row.id ] ?? row.note } );
      setRequests( rows => rows.map( one => ( one.id === updated.id ? updated : one ) ) );
      toast.success( action === "allowed" ? `${ row.name } is allowed to sign in.` : `${ row.name } is blocked.` );
      /* Allowing writes a remembered device, blocking takes the one that was there, and the rail
         counts what is still waiting, so both get a fresh look. */
      window.dispatchEvent( new Event( "panel:knocking" ) );
      api.get<TrustedDevice[]>( "/api/auth/devices/" ).then( setDevices ).catch( () => undefined );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not change that device.";
      setDeviceError( message );
      toast.error( message );
    } finally {
      setDeciding( 0 );
    }
  }

  async function forget( row: DeviceAccess ) {
    if ( !( await toast.confirm( `Take ${ row.name } off the list? If it opens the panel again it asks once more.`, { confirm: "Remove", cancel: "Keep it" } ) ) ) return;
    setDeviceError( "" );
    try {
      await api.del( `/api/auth/access/requests/${ row.id }/` );
      setRequests( rows => rows.filter( one => one.id !== row.id ) );
      toast.success( "Taken off the list." );
      window.dispatchEvent( new Event( "panel:knocking" ) );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not remove that entry.";
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
    try {
      const updated = await api.patch<StaffUser>( "/api/auth/me/", { full_name, job_title } );
      setUser( updated );
      toast.success( "Your details are saved." );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not save.";
      setError( message );
      toast.error( message );
    }
  }

  async function savePassword( event: React.FormEvent ) {
    event.preventDefault();
    setPasswordError( "" );
    try {
      const result = await api.post<{ detail: string }>( "/api/auth/password/", { current_password: current, new_password: next } );
      toast.success( result.detail );
      setCurrent( "" );
      setNext( "" );
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not change the password.";
      setPasswordError( message );
      toast.error( message );
    }
  }

  const waiting = requests.filter( row => row.status === "pending" ).length;
  const shown = requests.filter( row => row.status === tab );

  return (
    <section className="tone-page t7">
      <SectionHead
        icon="account"
        title="My account"
        note={ waiting ? `${ user?.email } · ${ waiting } device${ waiting === 1 ? "" : "s" } waiting to get in` : user?.email }
      />

      <form className="inline-form" onSubmit={ saveProfile }>
        <Field label="Name shown in the panel">
          <TextInput value={ full_name } onChange={ event => setFullName( event.target.value ) } />
        </Field>
        <Field label="Role">
          <TextInput value={ job_title } onChange={ event => setJobTitle( event.target.value ) } />
        </Field>
        { error ? <Notice>{ error }</Notice> : null }
        <div className="form-actions">
          <Button type="submit">Save</Button>
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
          <Button type="submit" disabled={ !current || !next }>
            Change password
          </Button>
        </div>
      </form>

      <div className="block">
        <h2>Devices asking to get in</h2>
        <p className="text-small quiet">
          Every browser that opens the panel is written down here with what it says about itself. Allow one and it reaches the sign in screen.
          Block it and the panel turns it away before a password is even typed.
        </p>
        { deviceError ? <Notice>{ deviceError }</Notice> : null }
        <div className="tabs">
          { TABS.map( ( [ value, label ] ) => (
            <button key={ value } className={ tab === value ? "on" : "" } onClick={ () => setTab( value ) }>
              { label } ({ requests.filter( row => row.status === value ).length })
            </button>
          ) ) }
        </div>
        { shown.length === 0 ? (
          <p className="text-small quiet">
            { tab === "pending"
              ? "Nothing is waiting. A browser that has never opened the panel appears here the moment it does."
              : `No device is marked ${ tab }.` }
          </p>
        ) : (
          <table className="grid device-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>First seen</th>
                <th>Last seen</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              { shown.map( row => (
                <tr key={ row.id }>
                  <td>
                    <strong>{ row.name }</strong> <Pill value={ row.status } label={ STATUS_LABELS[ row.status ] ?? row.status } />
                    <span className="device-sub">{ about( row ) || row.browser }</span>
                    { row.note ? <span className="device-sub">Called { row.note }</span> : null }
                    { row.status === "pending" ? (
                      <TextInput
                        className="device-note"
                        placeholder="Name it, for example Clinic phone"
                        aria-label={ `What to call ${ row.name }` }
                        value={ notes[ row.id ] ?? "" }
                        onChange={ event => setNotes( names => ( { ...names, [ row.id ]: event.target.value } ) ) }
                      />
                    ) : null }
                  </td>
                  <td data-label="First seen">
                    { formatDate( row.created_at ) }
                    <span className="device-sub">{ formatDate( row.decided_at ) ? `Decided ${ formatDate( row.decided_at )}` : "Not decided yet" }</span>
                  </td>
                  <td data-label="Last seen">{ formatDate( row.last_seen_at ) }</td>
                  <td className="row-actions">
                    { row.status !== "allowed" ? (
                      <Button disabled={ deciding === row.id } onClick={ () => decide( row, "allowed" ) }>
                        Allow
                      </Button>
                    ) : null }
                    { row.status !== "blocked" ? (
                      <Button tone="quiet" disabled={ deciding === row.id } onClick={ () => decide( row, "blocked" ) }>
                        Block
                      </Button>
                    ) : null }
                    <Button tone="quiet" disabled={ deciding === row.id } onClick={ () => forget( row ) }>
                      Remove
                    </Button>
                  </td>
                </tr>
              ) ) }
            </tbody>
          </table>
        ) }
      </div>

      <div className="block">
        <h2>Devices that remember you</h2>
        <p className="text-small quiet">
          A new browser or machine has to type the emailed code before the panel opens. Remove one here and it needs a code again.
        </p>
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
