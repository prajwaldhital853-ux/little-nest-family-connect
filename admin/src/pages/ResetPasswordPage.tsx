import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { Button, Field, Notice, TextInput } from "../components/ui";
import { useToast } from "../components/Toast";
import { Brand } from "../components/icons";

/** Where the link in a reset email lands. It works once, then the panel asks for a password again. */
export default function ResetPasswordPage() {
  const [ params ] = useSearchParams();
  const toast = useToast();
  const email = params.get( "email" ) ?? "";
  const token = params.get( "token" ) ?? "";
  const [ password, setPassword ] = useState("");
  const [ again, setAgain ] = useState("");
  const [ error, setError ] = useState("");
  const [ fieldError, setFieldError ] = useState<string[]>( [] );
  const [ done, setDone ] = useState(false);
  const [ busy, setBusy ] = useState(false);

  async function submit( event: React.FormEvent ) {
    event.preventDefault();
    setError( "" );
    setFieldError( [] );
    if ( password !== again ) {
      const message = "Those two passwords are not the same.";
      setError( message );
      toast.error( message );
      return;
    }
    setBusy( true );
    try {
      const reply = await api.unauthenticated<{ detail: string }>( "/api/auth/password/reset/", { email, token, password } );
      setDone( true );
      toast.success( reply.detail );
    } catch ( reason ) {
      if ( reason instanceof ApiError ) {
        setError( reason.message );
        setFieldError( reason.fields.password ?? [] );
        toast.error( reason.message );
      } else {
        setError( "Could not reach the server." );
        toast.error( "Could not reach the server." );
      }
    } finally {
      setBusy( false );
    }
  }

  if ( !email || !token ) {
    return (
      <div className="login">
        <form>
          <Brand />
          <h1>That link is incomplete</h1>
          <p className="text-small quiet">A reset link comes from the email and carries both your address and its token.</p>
          <Link to="/login" className="btn btn-quiet">
            Back to sign in
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="login">
      <form onSubmit={ submit }>
        <Brand />
        <h1>Choose a new password</h1>
        <p className="text-small quiet">For { email }. Every device is signed out once this is used.</p>
        { error ? <Notice>{ error }</Notice> : null }
        { !done ? (
          <>
            <Field label="New password" help="At least 10 characters and not a common phrase." error={ fieldError }>
              <TextInput type="password" autoComplete="new-password" value={ password } onChange={ event => setPassword( event.target.value ) } required />
            </Field>
            <Field label="Type it again">
              <TextInput type="password" autoComplete="new-password" value={ again } onChange={ event => setAgain( event.target.value ) } required />
            </Field>
            <Button type="submit" disabled={ busy || !password || !again }>
              { busy ? "Saving" : "Set the password" }
            </Button>
          </>
        ) : (
          <Link to="/login" className="btn btn-quiet">
            Sign in
          </Link>
        ) }
      </form>
    </div>
  );
}
