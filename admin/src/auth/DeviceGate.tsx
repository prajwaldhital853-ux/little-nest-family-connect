import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { DeviceStanding } from "../api/types";
import { Brand } from "../components/icons";
import { Button, Notice } from "../components/ui";
import { useAuth } from "./AuthProvider";

type Standing = "checking" | "waiting" | "allowed" | "blocked" | "unreachable";

/* A browser asks once when it opens the panel, then asks again on its own so an approval lands
   without anybody having to reload the page. */
const POLL_MS = 15000;

/** What this browser can say about itself. The server adds the address and the user agent. */
function describeSelf(): Record<string, string | boolean> {
  const nav = navigator as Navigator & { platform?: string; userAgentData?: { platform?: string }; maxTouchPoints?: number };
  const platform = nav.userAgentData?.platform || nav.platform || "";
  const touch = ( nav.maxTouchPoints ?? 0 ) > 0 || "ontouchstart" in window;
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    zone = "";
  }
  return {
    platform,
    screen: `${ window.screen.width } x ${ window.screen.height }`,
    language: nav.language || "",
    timezone: zone,
    touch,
  };
}

export function DeviceGate( { children }: { children: ReactNode } ) {
  const { user, ready } = useAuth();
  const path = useLocation().pathname;
  const [ standing, setStanding ] = useState<Standing>( "checking" );
  const [ problem, setProblem ] = useState( "" );
  const [ entered, setEntered ] = useState( false );

  const ask = useCallback( async ( first: boolean ) => {
    let next: Standing;
    try {
      const reply = first
        ? await api.unauthenticated<DeviceStanding>( "/api/auth/access/", describeSelf() )
        : await api.get<DeviceStanding>( "/api/auth/access/" );
      next = reply.status === "allowed" ? "allowed" : reply.status === "blocked" ? "blocked" : "waiting";
    } catch ( reason ) {
      next = "unreachable";
      setProblem( reason instanceof ApiError ? reason.message : "The panel could not be reached." );
    }
    setStanding( next );
    return next;
  }, [] );

  /* A signed in browser has already been through this, and a password reset link is meant to work
     from whichever device the mail was opened on. */
  const exempt = Boolean( user ) || path.startsWith( "/reset-password" );

  useEffect(() => {
    if ( exempt || ! ready ) return;
    let watching = true;
    let timer = 0;
    /* Announce once, then only keep looking while there is still something to wait for. */
    void ( async () => {
      let now = await ask( true );
      while ( watching && now === "waiting" ) {
        await new Promise( done => { timer = window.setTimeout( done, POLL_MS ); } );
        if ( ! watching ) break;
        now = await ask( false );
      }
    } )();
    return () => {
      watching = false;
      window.clearTimeout( timer );
    };
  }, [ ask, exempt, ready ] );

  if ( exempt || standing === "allowed" || entered ) return <>{ children }</>;

  return <WaitingPage standing={ standing } problem={ problem } onTry={ () => setEntered( true ) } onAgain={ () => ask( true ) } />;
}

function WaitingPage( { standing, problem, onTry, onAgain }: { standing: Standing; problem: string; onTry: () => void; onAgain: () => void } ) {
  const about = describeSelf();
  const lines = [
    [ "Screen", about.screen ],
    [ "Language", about.language || "not told" ],
    [ "Timezone", about.timezone || "not told" ],
    [ "Touch screen", about.touch ? "yes" : "no" ],
  ] as const;

  if ( standing === "blocked" ) {
    return (
      <div className="login">
        <div className="login-card">
          <Brand />
          <h1>This device is not allowed</h1>
          <p className="text-small quiet">
            The doctor blocked this browser from the panel. Ask them to allow it again from a device they already use.
          </p>
          <p className="login-links">
            <button type="button" className="link-button" onClick={ onAgain }>
              Check again
            </button>
          </p>
        </div>
      </div>
    );
  }

  if ( standing === "unreachable" ) {
    return (
      <div className="login">
        <div className="login-card">
          <Brand />
          <h1>The panel could not check this device</h1>
          <p className="text-small quiet">Nothing is wrong with the address you typed. The server did not answer.</p>
          { problem ? <Notice>{ problem }</Notice> : null }
          <Button onClick={ onAgain }>Try again</Button>
          {/* A device check that fails for a reason nobody predicted must not be the thing that keeps
              the doctor out of his own panel, so this screen opens the sign in form too. */}
          <p className="login-links">
            <button type="button" className="link-button" onClick={ onTry }>
              Sign in from here anyway
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login">
      <div className="login-card">
        <Brand />
        <h1>Waiting for approval</h1>
        <p className="text-small quiet">
          { standing === "checking" ? "This browser has told the panel about itself." : "This browser has told the panel about itself, and it is now on the list." }
        </p>
        <dl className="device-facts">
          { lines.map( ( [ label, value ] ) => (
            <div key={ label } className="device-fact">
              <dt>{ label }</dt>
              <dd>{ String( value ) }</dd>
            </div>
          ) ) }
        </dl>
        <p className="text-small quiet">
          Open the panel on a device you already use, go to <strong>My account</strong>, and allow this one. The page looks again by itself, so
          there is nothing to reload.
        </p>
        <p className="login-links">
          <button type="button" className="link-button" onClick={ onTry }>
            Sign in from here anyway
          </button>
        </p>
        <p className="text-small quiet">
          Signing in anyway still asks for the six digit code by email the first time, so an unapproved browser cannot get in on a password alone.
        </p>
      </div>
    </div>
  );
}
