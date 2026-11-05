import { useCallback, useEffect, useState } from "react";
import { ApiError, api } from "../api/client";
import type { Page, StaffUser } from "../api/types";
import { useAuth } from "../auth/AuthProvider";
import SectionHead from "../components/SectionHead";
import { useToast } from "../components/Toast";
import { Button, Checkbox, Field, Notice, TextInput, formatDate } from "../components/ui";

const BLANK = { email: "", full_name: "", job_title: "", password: "", is_staff: true, is_active: true };

export default function StaffPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [ rows, setRows ] = useState<Page<StaffUser> | null>( null );
  const [ editing, setEditing ] = useState<number | null>( null );
  const [ form, setForm ] = useState<Record<string, unknown>>( BLANK );
  const [ errors, setErrors ] = useState<Record<string, string[]>>( {} );
  const [ error, setError ] = useState("");

  const load = useCallback(() => {
    api.page<StaffUser>( "/api/auth/users/", { page_size: 100, ordering: "email" } ).then( setRows ).catch( ( reason: ApiError ) => setError( reason.message ) );
  }, [] );

  useEffect( load, [ load ] );

  function start( person?: StaffUser ) {
    setErrors( {} );
    setError( "" );
    if ( person ) {
      setEditing( person.id );
      setForm( { email: person.email, full_name: person.full_name, job_title: person.job_title, is_staff: person.is_staff, is_active: person.is_active } );
    } else {
      setEditing( 0 );
      setForm( { ...BLANK } );
    }
  }

  async function save( event: React.FormEvent ) {
    event.preventDefault();
    setErrors( {} );
    setError( "" );
    const body: Record<string, unknown> = { ...form };
    if ( !body.password ) delete body.password;
    try {
      const updating = editing !== null && editing !== 0;
      if ( updating ) {
        await api.patch( `/api/auth/users/${ editing }/`, body );
      } else {
        await api.post( "/api/auth/users/", body );
      }
      toast.success( updating ? "Account updated." : "Account added." );
      setEditing( null );
      setForm( { ...BLANK } );
      load();
    } catch ( reason ) {
      if ( reason instanceof ApiError ) {
        const message = reason.fields.fields?.[ 0 ] ?? reason.message;
        setErrors( reason.fields );
        setError( message );
        toast.error( message );
      }
    }
  }

  async function remove( person: StaffUser ) {
    if ( !( await toast.confirm( `Remove access for ${ person.email }?`, { confirm: "Remove access", cancel: "Keep it" } ) ) ) return;
    try {
      await api.del( `/api/auth/users/${ person.id }/` );
      toast.success( `Access removed for ${ person.email }.` );
      load();
    } catch ( reason ) {
      const message = reason instanceof ApiError ? reason.message : "Could not remove that account.";
      setError( message );
      toast.error( message );
    }
  }

  return (
    <section className="tone-page t6">
      <SectionHead
        icon="staff"
        title="Staff accounts"
        note="Only staff accounts can sign in here or see patient requests."
        actions={ <Button onClick={ () => start() }>Add account</Button> }
      />

      { error ? <Notice>{ error }</Notice> : null }

      { editing !== null ? (
        <form className="inline-form" onSubmit={ save }>
          <Field label="Email" error={ errors.email }>
            <TextInput type="email" value={ String( form.email ?? "" ) } onChange={ event => setForm( { ...form, email: event.target.value } ) } required />
          </Field>
          <Field label="Name" error={ errors.full_name }>
            <TextInput value={ String( form.full_name ?? "" ) } onChange={ event => setForm( { ...form, full_name: event.target.value } ) } />
          </Field>
          <Field label="Role" error={ errors.job_title }>
            <TextInput value={ String( form.job_title ?? "" ) } placeholder="Coordinator, student, doctor" onChange={ event => setForm( { ...form, job_title: event.target.value } ) } />
          </Field>
          <Field label={ editing && editing !== 0 ? "New password (optional)" : "Password" } error={ errors.password } help="At least 10 characters and not a common phrase.">
            <TextInput type="password" value={ String( form.password ?? "" ) } onChange={ event => setForm( { ...form, password: event.target.value } ) } required={ !editing || editing === 0 } />
          </Field>
          <div className="inline-checks">
            <Checkbox label="Can use the panel" checked={ Boolean( form.is_staff ) } onChange={ next => setForm( { ...form, is_staff: next } ) } />
            <Checkbox label="Account active" checked={ Boolean( form.is_active ) } onChange={ next => setForm( { ...form, is_active: next } ) } />
          </div>
          <div className="form-actions">
            <Button type="submit">Save</Button>
            <Button tone="quiet" type="button" onClick={ () => { setEditing( null ); setForm( { ...BLANK } ); } }>
              Cancel
            </Button>
          </div>
        </form>
      ) : null }

      <table className="grid">
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Role</th>
            <th>Panel access</th>
            <th>Last seen</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          { rows?.results.map( person => (
            <tr key={ person.id }>
              <td>{ person.email }{ person.id === user?.id ? <span className="text-small quiet"> you</span> : null }</td>
              <td>{ person.full_name }</td>
              <td>{ person.job_title }</td>
              <td>
                <PillText ok={ person.is_staff } yes="Staff" no="No access" />
                { !person.is_active ? <span className="text-small quiet"> disabled</span> : null }
              </td>
              <td className="text-small">{ formatDate( person.last_login ) || "Never" }</td>
              <td className="row-actions">
                <Button tone="quiet" onClick={ () => start( person ) }>
                  Edit
                </Button>
                { person.id !== user?.id ? (
                  <Button tone="quiet" onClick={ () => remove( person ) }>
                    Remove
                  </Button>
                ) : null }
              </td>
            </tr>
          ) ) }
        </tbody>
      </table>
    </section>
  );
}

function PillText( { ok, yes, no }: { ok: boolean; yes: string; no: string } ) {
  return <span className={ `pill pill-${ ok ? "good" : "neutral" }` }>{ ok ? yes : no }</span>;
}
