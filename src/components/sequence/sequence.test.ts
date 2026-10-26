import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { SequenceState } from './sequence.js';
import { createSequence } from './sequence.js';

const HOLD = 6000;
const FADE = 750;

function machine( over: Partial<Parameters<typeof createSequence>[0]> = {} ) {
  const seen: SequenceState[] = [];
  const seq = createSequence(
    { count: 3, holdMs: HOLD, fadeMs: FADE, loop: false, ...over },
    s => seen.push( s )
  );
  return { seq, seen };
}

beforeEach( () => {
  vi.useFakeTimers();
} );
afterEach( () => {
  vi.useRealTimers();
} );

describe( 'holding a frame then moving on', () => {
  it( 'stays put until the hold is up', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( HOLD - 1 );
    expect( seq.state().index ).toBe( 0 );
    vi.advanceTimersByTime( 1 );
    expect( seq.state().index ).toBe( 1 );
  } );

  it( 'does not start the next hold on its own, it waits for the view', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().running ).toBe( false );
    seq.frameShown();
    expect( seq.state().running ).toBe( true );
  } );

  it( 'stops at the last frame when looping is off', () => {
    const { seq } = machine();
    seq.start();
    for ( let i = 0; i < 2; i++ ) {
      vi.advanceTimersByTime( HOLD );
      seq.frameShown();
    }
    expect( seq.state().index ).toBe( 2 );
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().ended ).toBe( true );
    expect( seq.state().index ).toBe( 2 );
  } );

  it( 'wraps to the first frame when looping is on', () => {
    const { seq } = machine( { loop: true } );
    seq.start();
    for ( let i = 0; i < 3; i++ ) {
      vi.advanceTimersByTime( HOLD );
      seq.frameShown();
    }
    expect( seq.state().index ).toBe( 0 );
    expect( seq.state().ended ).toBe( false );
  } );
} );

describe( 'the watchdog, which is the whole reason this is safe', () => {
  it( 'starts the hold anyway when the view never reports the arrival', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().running ).toBe( false );

    vi.advanceTimersByTime( FADE + 400 );
    expect( seq.state().running ).toBe( true );
  } );

  it( 'plays the whole way through with the view permanently silent', () => {
    const { seq } = machine();
    seq.start();
    for ( let i = 0; i < 3; i++ ) {
      vi.advanceTimersByTime( HOLD + FADE + 400 );
    }
    expect( seq.state().ended ).toBe( true );
  } );

  it( 'lets the view win when it does speak, so the hold is not shortened', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( HOLD );
    seq.frameShown();
    vi.advanceTimersByTime( FADE + 400 );
    expect( seq.state().index ).toBe( 1 );
    vi.advanceTimersByTime( HOLD - FADE - 400 );
    expect( seq.state().index ).toBe( 2 );
  } );
} );

describe( 'pausing keeps the part of the hold already served', () => {
  it( 'resumes with the remainder, not a fresh hold', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( 4000 );
    seq.pause();
    expect( seq.state().running ).toBe( false );

    seq.resume();
    vi.advanceTimersByTime( 1999 );
    expect( seq.state().index ).toBe( 0 );
    vi.advanceTimersByTime( 1 );
    expect( seq.state().index ).toBe( 1 );
  } );

  it( 'gives a fresh hold to the next frame, not the leftover', () => {
    const { seq } = machine();
    seq.start();
    vi.advanceTimersByTime( 5000 );
    seq.pause();
    seq.resume();
    vi.advanceTimersByTime( 1000 );
    seq.frameShown();

    vi.advanceTimersByTime( HOLD - 1 );
    expect( seq.state().index ).toBe( 1 );
    vi.advanceTimersByTime( 1 );
    expect( seq.state().index ).toBe( 2 );
  } );

  it( 'ignores a pause when nothing is counting', () => {
    const { seq } = machine();
    expect( () => {
      seq.pause();
    } ).not.toThrow();
    expect( seq.state().running ).toBe( false );
  } );

  it( 'does not resume a sequence that has ended', () => {
    const { seq } = machine( { count: 1 } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().ended ).toBe( true );
    seq.resume();
    expect( seq.state().running ).toBe( false );
  } );
} );

describe( 'replay', () => {
  it( 'goes back to the first frame and runs again', () => {
    const { seq } = machine( { count: 1 } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().ended ).toBe( true );

    seq.replay();
    expect( seq.state() ).toMatchObject( { index: 0, ended: false, running: true } );
  } );
} );

describe( 'cleanup', () => {
  it( 'fires nothing after destroy', () => {
    const { seq, seen } = machine();
    seq.start();
    seq.destroy();
    const count = seen.length;
    vi.advanceTimersByTime( HOLD * 4 );
    expect( seen.length ).toBe( count );
  } );
} );

describe( 'nonsense input', () => {
  it( 'never lets a hold go to zero and spin', () => {
    const { seq } = machine( { holdMs: 0 } );
    seq.start();
    vi.advanceTimersByTime( 199 );
    expect( seq.state().index ).toBe( 0 );
  } );

  it( 'survives a single frame', () => {
    const { seq } = machine( { count: 0 } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().ended ).toBe( true );
  } );
} );

describe( 'pausing during a swap', () => {
  it( 'stays paused when the view reports the arrival after the pause', () => {
    const { seq } = machine( { loop: true } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    seq.pause();
    seq.frameShown();
    vi.advanceTimersByTime( HOLD * 3 );
    expect( seq.state().index ).toBe( 1 );
  } );

  it( 'stays paused when the watchdog fires instead of the view', () => {
    const { seq } = machine( { loop: true } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    seq.pause();
    vi.advanceTimersByTime( HOLD * 3 );
    expect( seq.state().index ).toBe( 1 );
  } );

  it( 'carries on after resume', () => {
    const { seq } = machine( { loop: true } );
    seq.start();
    vi.advanceTimersByTime( HOLD );
    seq.pause();
    seq.frameShown();
    seq.resume();
    vi.advanceTimersByTime( HOLD );
    expect( seq.state().index ).toBe( 2 );
  } );
} );
