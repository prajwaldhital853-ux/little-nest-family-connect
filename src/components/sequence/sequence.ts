export interface SequenceOptions {
  count: number;
  holdMs: number;
  fadeMs: number;
  loop: boolean;
}

export interface SequenceState {
  index: number;
  running: boolean;
  ended: boolean;
}

type Listener = ( state: SequenceState ) => void;

const MIN_HOLD_MS = 200;
const WATCHDOG_SLACK_MS = 400;

export function createSequence( options: SequenceOptions, notify: Listener ) {
  const count = Math.max( 1, Math.floor( options.count ) );
  const holdMs = Math.max( MIN_HOLD_MS, options.holdMs );
  const watchdogMs = Math.max( 0, options.fadeMs ) + WATCHDOG_SLACK_MS;

  let index = 0;
  let ended = false;
  let hold: ReturnType<typeof setTimeout> | null = null;
  let watchdog: ReturnType<typeof setTimeout> | null = null;
  let startedAt = 0;
  let remaining = holdMs;
  let halted = false;

  const state = (): SequenceState => ( { index, running: hold !== null, ended } );
  const announce = (): void => {
    notify( state() );
  };

  function clearHold(): void {
    if ( hold !== null ) {
      clearTimeout( hold );
      hold = null;
    }
  }

  function clearWatchdog(): void {
    if ( watchdog !== null ) {
      clearTimeout( watchdog );
      watchdog = null;
    }
  }

  function run( step: 'hold' | 'advance' ): void {
    if ( step === 'advance' ) {
      hold = null;
      const last = index === count - 1;
      if ( last && !options.loop ) {
        ended = true;
        announce();
        return;
      }
      index = last ? 0 : index + 1;
      remaining = holdMs;
      clearWatchdog();
      watchdog = setTimeout( () => {
        if ( !halted ) {
          run( 'hold' );
        }
      }, watchdogMs );
      announce();
      return;
    }

    clearHold();
    clearWatchdog();
    if ( ended ) {
      return;
    }
    startedAt = Date.now();
    hold = setTimeout( () => {
      run( 'advance' );
    }, remaining );
    announce();
  }

  const beginHold = (): void => {
    run( 'hold' );
  };

  return {
    state,

    start(): void {
      halted = false;
      ended = false;
      remaining = holdMs;
      beginHold();
    },

    pause(): void {
      halted = true;
      clearWatchdog();
      if ( hold === null ) {
        return;
      }
      const served = Date.now() - startedAt;
      remaining = Math.max( MIN_HOLD_MS, remaining - served );
      clearHold();
      announce();
    },

    resume(): void {
      halted = false;
      if ( hold === null && !ended ) {
        beginHold();
      }
    },

    replay(): void {
      halted = false;
      clearHold();
      clearWatchdog();
      index = 0;
      ended = false;
      remaining = holdMs;
      beginHold();
    },

    goTo( next: number ): void {
      const asked = Math.floor( next );
      const target = options.loop ?
        ( ( asked % count ) + count ) % count :
        Math.max( 0, Math.min( asked, count - 1 ) );
      if ( target === index ) {
        return;
      }
      clearHold();
      clearWatchdog();
      index = target;
      ended = false;
      remaining = holdMs;
      announce();
    },

    frameShown(): void {
      if ( !ended && !halted ) {
        beginHold();
      }
    },

    destroy(): void {
      clearHold();
      clearWatchdog();
    }
  };
}

export type Sequence = ReturnType<typeof createSequence>;
