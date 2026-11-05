import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./icons";

type Kind = "good" | "bad" | "info";

interface Row {
  id: number;
  kind: Kind;
  message: string;
  leaving: boolean;
}

interface Ask {
  id: number;
  message: string;
  confirm: string;
  cancel: string;
}

export interface ToastApi {
  success( message: string ): void;
  error( message: string ): void;
  info( message: string ): void;
  /** The question in the same corner as every other message, so nothing has to say it in the browser's own voice. */
  confirm( message: string, choices?: { confirm?: string; cancel?: string } ): Promise<boolean>;
}

/* A refusal has to stay up long enough to be read and acted on; a confirmation can be quick. */
const DWELL: Record<Kind, number> = { good: 3200, info: 3600, bad: 7000 };
const AT_MOST = 4;
const FADE = 180;

let seq = 0;

const silence: ToastApi = {
  success: () => {},
  error: () => {},
  info: () => {},
  /* Nothing was asked, so nothing is thrown away. */
  confirm: () => Promise.resolve( false ),
};

const ToastContext = createContext<ToastApi>( silence );

export function useToast(): ToastApi {
  return useContext( ToastContext );
}

export function ToastProvider( { children }: { children: ReactNode } ) {
  const [ rows, setRows ] = useState<Row[]>( [] );
  const [ asks, setAsks ] = useState<Ask[]>( [] );
  /* Kept out of the state so answering a question is not a side effect of building it. */
  const pending = useRef( new Map<number, ( answer: boolean ) => void>() );

  const close = useCallback(( id: number ) => {
    setRows( current => current.map( row => ( row.id === id ? { ...row, leaving: true } : row ) ) );
    window.setTimeout( () => setRows( current => current.filter( row => row.id !== id ) ), FADE );
  }, []);

  const push = useCallback(( kind: Kind, message: string ) => {
    const words = message.trim();
    if ( !words ) return;
    setRows( current => [
      ...current.filter( row => !row.leaving ).slice( 1 - AT_MOST ),
      { id: ++seq, kind, message: words, leaving: false },
    ] );
  }, []);

  const answer = useCallback(( id: number, value: boolean ) => {
    const settle = pending.current.get( id );
    pending.current.delete( id );
    if ( settle ) settle( value );
    setAsks( current => current.filter( ask => ask.id !== id ) );
  }, []);

  const confirm = useCallback(( message: string, choices?: { confirm?: string; cancel?: string } ) => {
    const words = message.trim();
    if ( !words ) return Promise.resolve( false );
    const id = ++seq;
    return new Promise<boolean>( settle => {
      pending.current.set( id, answer => {
        pending.current.delete( id );
        settle( answer );
      } );
      setAsks( current => [
        ...current,
        { id, message: words, confirm: choices?.confirm ?? "Yes", cancel: choices?.cancel ?? "No" },
      ] );
    } );
  }, []);

  /* A page that goes away mid question leaves the answer nowhere to land, so the question is
     refused rather than left hanging. */
  useEffect( () => () => {
    pending.current.forEach( settle => settle( false ) );
    pending.current.clear();
  }, [] );

  const api = useMemo<ToastApi>(
    () => ( {
      success: message => push( "good", message ),
      error: message => push( "bad", message ),
      info: message => push( "info", message ),
      confirm,
    } ),
    [ push, confirm ],
  );

  return (
    <ToastContext.Provider value={ api }>
      { children }
      <div className="toasts">
        { asks.map( ask => <ToastAsk key={ ask.id } ask={ ask } onAnswer={ answer } /> ) }
        { rows.map( row => <ToastMessage key={ row.id } row={ row } onClose={ close } /> ) }
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage( { row, onClose }: { row: Row; onClose: ( id: number ) => void } ) {
  useEffect(() => {
    const timer = setTimeout( () => onClose( row.id ), DWELL[ row.kind ] );
    return () => clearTimeout( timer );
  }, [ onClose, row.id, row.kind ] );

  return (
    <div className={ `toast toast-${ row.kind }${ row.leaving ? " out" : "" }` } role={ row.kind === "bad" ? "alert" : "status" }>
      <Icon name={ row.kind === "bad" ? "alert" : row.kind === "good" ? "check" : "info" } size={ 17 } />
      <p>{ row.message }</p>
      <button type="button" className="toast-x" onClick={ () => onClose( row.id ) } aria-label="Dismiss this message">
        <Icon name="close" size={ 13 } />
      </button>
    </div>
  );
}

function ToastAsk( { ask, onAnswer }: { ask: Ask; onAnswer: ( id: number, value: boolean ) => void } ) {
  const cancelRef = useRef<HTMLButtonElement>( null );

  /* The safe answer is the one under the cursor, and Escape means the same as not answering. */
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  useEffect(() => {
    const key = ( event: KeyboardEvent ) => {
      if ( event.key === "Escape" ) onAnswer( ask.id, false );
    };
    window.addEventListener( "keydown", key );
    return () => window.removeEventListener( "keydown", key );
  }, [ ask.id, onAnswer ] );

  return (
    <div className="toast toast-ask" role="alertdialog" aria-label={ ask.message }>
      <Icon name="alert" size={ 17 } />
      <div>
        <p>{ ask.message }</p>
        <div className="toast-ask-actions">
          <button type="button" className="btn btn-danger" onClick={ () => onAnswer( ask.id, true ) }>{ ask.confirm }</button>
          <button type="button" className="btn btn-quiet" ref={ cancelRef } onClick={ () => onAnswer( ask.id, false ) }>{ ask.cancel }</button>
        </div>
      </div>
      <button type="button" className="toast-x" onClick={ () => onAnswer( ask.id, false ) } aria-label={ ask.cancel }>
        <Icon name="close" size={ 13 } />
      </button>
    </div>
  );
}
