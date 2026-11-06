import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ApiError, api, renew, session } from "../api/client";
import type { CodeReply, SignedInReply, StaffUser } from "../api/types";

export type SignInStep = { kind: "signed_in" } | { kind: "code"; email: string; expiresIn: number };

interface AuthValue {
  user: StaffUser | null;
  ready: boolean;
  /** Either the panel is open, or it has to ask for the code that was just emailed. */
  signIn: ( email: string, password: string ) => Promise<SignInStep>;
  verifyCode: ( code: string ) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: ( user: StaffUser ) => void;
}

const AuthContext = createContext<AuthValue | null>( null );

function accept( reply: SignedInReply, apply: ( user: StaffUser ) => void ) {
  session.open( reply.access, reply.expires_in );
  apply( reply.user );
}

export function AuthProvider( { children }: { children: ReactNode } ) {
  const [ user, setUser ] = useState<StaffUser | null>( null );
  const [ ready, setReady ] = useState( false );

  /* Nobody is asked for a password twice: a live session cookie is enough to come back in, and
     the account now travels with the token, so opening the panel is one round trip. */
  useEffect(() => {
    session
      .resume()
      .then( account => {
        if ( account ) setUser( account );
      } )
      .catch( () => undefined )
      .finally( () => setReady( true ) );
  }, [] );

  /* The token dies on a timer. Trading it a couple of minutes early, while he is reading something,
     means a save is never the call that discovers the session ended. */
  useEffect(() => {
    if ( !user ) return;
    const timer = window.setInterval(() => {
      const left = session.timeLeft();
      if ( left !== null && left < 120 ) void renew();
    }, 30_000 );
    return () => window.clearInterval( timer );
  }, [ user ] );

  const signIn = useCallback( async ( email: string, password: string ): Promise<SignInStep> => {
    const reply = await api.unauthenticated<SignedInReply | CodeReply>( "/api/auth/login/", { email, password } );
    if ( reply.otp_required ) {
      return { kind: "code", email: reply.email, expiresIn: reply.expires_in };
    }
    accept( reply, setUser );
    return { kind: "signed_in" };
  }, [] );

  const verifyCode = useCallback( async ( code: string ) => {
    const reply = await api.unauthenticated<SignedInReply>( "/api/auth/otp/verify/", { code } );
    accept( reply, setUser );
  }, [] );

  const signOut = useCallback( async () => {
    await api.unauthenticated( "/api/auth/logout/" ).catch( error => {
      if ( ! ( error instanceof ApiError ) || error.status !== 401 ) throw error;
    } );
    session.end();
    setUser( null );
  }, [] );

  const value = useMemo( () => ( { user, ready, signIn, verifyCode, signOut, setUser } ), [ user, ready, signIn, verifyCode, signOut ] );
  return <AuthContext.Provider value={ value }>{ children }</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext( AuthContext );
  if ( !value ) throw new Error( "useAuth must be used inside AuthProvider." );
  return value;
}
