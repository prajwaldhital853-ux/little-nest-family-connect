import { describe, expect, it } from 'vitest';

import { currentSlot, nextOpening, openingTexts, schoolClock, slotTime } from './school-time';

const zone = 'America/Los_Angeles';
const weekdays = [ 1, 2, 3, 4, 5 ];
const slots = [
  { id: 'arrival', start: '07:30', end: '09:00' },
  { id: 'circle', start: '09:00', end: '10:15' },
  { id: 'play', start: '10:15', end: '11:15' },
  { id: 'home', start: '11:15', end: '18:00' }
];

const portland = ( iso: string ) => schoolClock( new Date( `${ iso }-07:00` ), zone );

describe( 'schoolClock', () => {
  it( 'reads the school zone, not the machine zone', () => {
    expect( schoolClock( new Date( '2026-10-07T17:20:00Z' ), zone ) ).toEqual( { day: 3, minutes: 620 } );
    expect( schoolClock( new Date( '2026-10-08T02:00:00Z' ), zone ) ).toEqual( { day: 3, minutes: 1140 } );
  } );
} );

describe( 'currentSlot', () => {
  it( 'marks 10:15 to 11:15 at Wednesday 10:20 (day-8)', () => {
    expect( currentSlot( slots, portland( '2026-10-07T10:20:00' ), weekdays )?.id ).toBe( 'play' );
  } );

  it( 'starts a slot on its start minute and ends it before its end minute', () => {
    expect( currentSlot( slots, portland( '2026-10-07T10:15:00' ), weekdays )?.id ).toBe( 'play' );
    expect( currentSlot( slots, portland( '2026-10-07T18:00:00' ), weekdays ) ).toBeUndefined();
  } );

  it( 'marks nothing at Wednesday 19:00 (day-9)', () => {
    expect( currentSlot( slots, portland( '2026-10-07T19:00:00' ), weekdays ) ).toBeUndefined();
  } );

  it( 'marks nothing on Saturday at 10:20 (day-10)', () => {
    expect( currentSlot( slots, portland( '2026-10-10T10:20:00' ), weekdays ) ).toBeUndefined();
  } );
} );

describe( 'nextOpening', () => {
  it( 'says a bare time later the same day (day-13)', () => {
    expect( nextOpening( slots, portland( '2026-10-07T06:00:00' ), weekdays ) ).toBe( '7:30\u00a0am' );
  } );

  it( 'says tomorrow after closing on a weekday (day-9, day-13)', () => {
    expect( nextOpening( slots, portland( '2026-10-07T19:00:00' ), weekdays ) ).toBe( 'tomorrow at 7:30\u00a0am' );
  } );

  it( 'names Monday at the weekend (day-10)', () => {
    expect( nextOpening( slots, portland( '2026-10-10T10:20:00' ), weekdays ) ).toBe( 'Monday at 7:30\u00a0am' );
    expect( nextOpening( slots, portland( '2026-10-09T19:00:00' ), weekdays ) ).toBe( 'Monday at 7:30\u00a0am' );
  } );

  it( 'says tomorrow on Sunday', () => {
    expect( nextOpening( slots, portland( '2026-10-11T12:00:00' ), weekdays ) ).toBe( 'tomorrow at 7:30\u00a0am' );
  } );
} );

describe( 'slotTime', () => {
  it( 'writes the period once when both ends share it', () => {
    expect( slotTime( '10:15', '11:15' ) ).toBe( '10:15 to 11:15\u00a0am' );
    expect( slotTime( '11:45', '14:30' ) ).toBe( '11:45\u00a0am to 2:30\u00a0pm' );
    expect( slotTime( '12:00', '14:00' ) ).toBe( '12:00 to 2:00\u00a0pm' );
  } );
} );

describe( 'openingTexts', () => {
  it( 'lists every phrase nextOpening can give, so the closed line can reserve its space', () => {
    const texts = openingTexts( slots, weekdays );
    for ( let day = 0; day < 7; day++ ) {
      for ( let minutes = 0; minutes < 1440; minutes += 15 ) {
        const next = nextOpening( slots, { day, minutes }, weekdays );
        if ( next ) {
          expect( texts ).toContain( next );
        }
      }
    }
  } );
} );

describe( 'time text', () => {
  it( 'joins every time to its am or pm with a non-breaking space', () => {
    const texts = [ ...openingTexts( slots, weekdays ), ...slots.map( slot => slotTime( slot.start, slot.end ) ) ];
    for ( const text of texts ) {
      expect( text ).not.toMatch( /\d (am|pm)/ );
    }
    expect( slotTime( '11:45', '14:30' ) ).toMatch( /11:45\u00a0am to 2:30\u00a0pm/ );
  } );
} );
