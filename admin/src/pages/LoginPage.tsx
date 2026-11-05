import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button, Field, Notice, TextInput } from "../components/ui";
import { useToast } from "../components/Toast";
import { Brand } from "../components/icons";

type Step = "password" | "code" | "forgot";

export default function LoginPage() {
  const { signIn, verifyCode } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [ step, setStep ] = useState<Step>( "password" );
  const [ email, setEmail ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ code, setCode ] = useState("");
  const [ sentTo, setSentTo ] = useState("");
  const [ error, setError ] = useState("");
  const [ busy, setBusy ] = useState(false);
  /* Two clocks the visitor should see: how long the block lasts, and how long the code does. */
  const [ waiting, setWaiting ] = useState(0);
  const [ codeLeft, setCodeLeft ] = useState(0);

  useEffect(() => {
    if ( !waiting && !codeLeft ) return;
    const timer = setInterval(() => {
      setWaiting( left => Math.max( 0, left - 1 ) );
      setCodeLeft( left => Math.max( 0, left - 1 ) );
    }, 1000);
    return () => clearInterval( timer );
  }, [ waiting, codeLeft ] );

  async function submitPassword( event: React.FormEvent ) {
    event.preventDefault();
    setBusy( true );
    setError( "" );
    try {
      const reply = await signIn( email.trim(), password );
      if ( reply.kind === "code" ) {
        setSentTo( reply.email );
        setCodeLeft( reply.expiresIn );
        setStep( "code" );
        return;
      }
      navigate( "/", { replace: true } );
      toast.success( "Signed in." );
    } catch ( reason ) {
      report( reason );
    } finally {
      setBusy( false );
    }
  }

  async function submitCode( event: React.FormEvent ) {
    event.preventDefault();
    setBusy( true );
    setError( "" );
    try {
      await verifyCode( code );
      navigate( "/", { replace: true } );
      toast.success( "This device is confirmed and signed in." );
    } catch ( reason ) {
      report( reason );
    } finally {
      setBusy( false );
    }
  }

  async function submitForgot( event: React.FormEvent ) {
    event.preventDefault();
    setBusy( true );
    setError( "" );
    try {
      const reply = await api.unauthenticated<{ detail: string }>( "/api/auth/password/forgot/", { email: email.trim() } );
      setPassword( "" );
      toast.success( reply.detail );
    } catch ( reason ) {
      report( reason );
    } finally {
      setBusy( false );
    }
  }

  function report( reason: unknown ) {
    if ( !( reason instanceof ApiError ) ) {
      setError( "Could not reach the server." );
      toast.error( "Could not reach the server." );
      return;
    }
    setError( reason.message );
    toast.error( reason.message );
    if ( reason.status === 429 && reason.retryAfter ) setWaiting( reason.retryAfter );
  }

  const blocked = waiting > 0;

  return (
    <div className="login">
      { step === "password" ? (
        <form onSubmit={ submitPassword }>
          <Brand />
          <h1>Sign in</h1>
          <p className="text-small quiet">For the doctor and the people who manage the site with them.</p>
          { error ? <Notice>{ error }</Notice> : null }
          { blocked ? <Notice>Try again in { clock( waiting ) }.</Notice> : null }
          <Field label="Email">
            <TextInput type="email" value={ email } autoComplete="username" onChange={ event => setEmail( event.target.value ) } required />
          </Field>
          <Field label="Password">
            <TextInput
              type="password"
              value={ password }
              autoComplete="current-password"
              onChange={ event => setPassword( event.target.value ) }
              required
              disabled={ blocked }
            />
          </Field>
          <Button type="submit" disabled={ busy || blocked || !email || !password }>
            { busy ? "Checking" : "Sign in" }
          </Button>
          <p className="login-links">
            <button type="button" className="link-button" onClick={ () => { setStep( "forgot" ); setError( "" ); } }>
              Forgot password
            </button>
          </p>
        </form>
      ) : null }

      { step === "code" ? (
        <form onSubmit={ submitCode }>
          <Brand />
          <h1>Confirm it is you</h1>
          <p className="text-small quiet">
            This device has not signed in before, so a six digit code was sent to { sentTo }. It expires in { clock( codeLeft ) }.
          </p>
          { error ? <Notice>{ error }</Notice> : null }
          <Field label="Code from the email" help="Six digits. Spaces are ignored.">
            <TextInput
              value={ code }
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={ 12 }
              onChange={ event => setCode( event.target.value ) }
              disabled={ blocked }
              required
            />
          </Field>
          <Button type="submit" disabled={ busy || blocked || code.replace( /\D/g, "" ).length !== 6 }>
            { busy ? "Checking" : "Enter the panel" }
          </Button>
          <p className="login-links">
            <button type="button" className="link-button" onClick={ () => { setStep( "password" ); setError( "" ); setCode( "" ); } }>
              Sign in with a different address
            </button>
          </p>
        </form>
      ) : null }

      { step === "forgot" ? (
        <form onSubmit={ submitForgot }>
          <Brand />
          <h1>Reset your password</h1>
          <p className="text-small quiet">
            Enter the address the panel knows. A link arrives that works once, and every device is signed out when you use it.
          </p>
          { error ? <Notice>{ error }</Notice> : null }
          <Field label="Email">
            <TextInput type="email" value={ email } autoComplete="username" onChange={ event => setEmail( event.target.value ) } required />
          </Field>
          <Button type="submit" disabled={ busy || !email }>
            { busy ? "Sending" : "Send the link" }
          </Button>
          <p className="login-links">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      ) : null }
    </div>
  );
}

function clock( seconds: number ): string {
  const mins = Math.floor( seconds / 60 );
  const rest = seconds % 60;
  return mins ? `${ mins }:${ String( rest ).padStart( 2, "0" ) }` : `${ rest }s`;
}
