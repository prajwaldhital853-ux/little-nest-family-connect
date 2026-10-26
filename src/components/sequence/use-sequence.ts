import { useCallback, useEffect, useRef, useState } from 'react';

import type { SequenceState } from './sequence';
import { createSequence } from './sequence';

export interface UseSequenceOptions {
  count: number;
  hold: number;
  fadeMs: number;
  loop: boolean;
}

export function useSequence( { count, hold, fadeMs, loop }: UseSequenceOptions ) {
  const [ state, setState ] = useState<SequenceState>( { index: 0, running: false, ended: false } );
  const [ leaving, setLeaving ] = useState<number | null>( null );
  const [ paused, setPaused ] = useState( false );

  const sequenceRef = useRef<ReturnType<typeof createSequence> | null>( null );
  const indexRef = useRef( 0 );

  useEffect( () => {
    const sequence = createSequence(
      { count, holdMs: hold * 1000, fadeMs, loop },
      next => {
        const previousIndex = indexRef.current;
        if ( next.index !== previousIndex ) {
          indexRef.current = next.index;
          setLeaving( previousIndex );
        }
        setState( next );
      }
    );
    sequenceRef.current = sequence;
    return () => {
      sequence.destroy();
      sequenceRef.current = null;
    };
  }, [ count, hold, fadeMs, loop ] );

  const start = useCallback( () => {
    sequenceRef.current?.start();
  }, [] );

  const stepShown = useCallback( () => {
    sequenceRef.current?.frameShown();
  }, [] );

  const clearLeaving = useCallback( () => {
    setLeaving( null );
  }, [] );

  const goTo = useCallback( ( next: number ) => {
    sequenceRef.current?.goTo( next );
  }, [] );

  const pause = useCallback( () => {
    setPaused( true );
    sequenceRef.current?.pause();
  }, [] );

  const toggle = useCallback( () => {
    const sequence = sequenceRef.current;
    if ( !sequence ) {
      return;
    }
    if ( sequence.state().ended ) {
      setPaused( false );
      sequence.replay();
    } else if ( paused ) {
      setPaused( false );
      sequence.resume();
    } else {
      setPaused( true );
      sequence.pause();
    }
  }, [ paused ] );

  return { state, leaving, paused, setPaused, start, stepShown, clearLeaving, goTo, pause, toggle };
}

export function playStateOf( state: SequenceState, paused: boolean ): string {
  if ( state.ended ) {
    return 'ended';
  }
  return paused ? 'paused' : 'playing';
}

export function stepStateOf( current: boolean, leaving: boolean ): string {
  if ( current ) {
    return 'current';
  }
  return leaving ? 'leaving' : 'hidden';
}
