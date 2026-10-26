import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DaySchedule } from './day-schedule';

const slots = [
  { id: 'arrival', start: '07:30', end: '09:00', name: 'Arrival', text: 'Hello.' },
  { id: 'circle', start: '09:00', end: '10:15', name: 'Circle', text: 'Songs.' },
  { id: 'play', start: '10:15', end: '11:15', name: 'Play', text: 'Paint.' },
  { id: 'home', start: '11:15', end: '18:00', name: 'Home', text: 'Bye.' }
];

const ui = <DaySchedule title="A day" slots={ slots } timeZone="America/Los_Angeles" />;
const marked = ( container: HTMLElement ) => container.querySelectorAll( 'li[data-now]' );

describe( 'DaySchedule', () => {
  beforeEach( () => {
    vi.useFakeTimers();
    vi.stubGlobal( 'IntersectionObserver', class { observe() {} disconnect() {} } );
  } );

  afterEach( () => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  } );

  it( 'marks the row that is happening now, after mount (day-8)', () => {
    vi.setSystemTime( new Date( '2026-10-07T17:20:00Z' ) );
    const { container } = render( ui );
    const rows = marked( container );
    expect( rows ).toHaveLength( 1 );
    expect( rows[ 0 ] ).toHaveAttribute( 'aria-current', 'time' );
    expect( rows[ 0 ] ).toHaveTextContent( 'Right now' );
    expect( rows[ 0 ] ).toHaveTextContent( '10:15 to 11:15' );
  } );

  it( 'moves the mark within a minute when the clock moves', () => {
    vi.setSystemTime( new Date( '2026-10-07T17:14:30Z' ) );
    const { container } = render( ui );
    expect( marked( container )[ 0 ] ).toHaveTextContent( 'Circle' );
    act( () => {
      vi.advanceTimersByTime( 60_000 );
    } );
    expect( marked( container )[ 0 ] ).toHaveTextContent( 'Play' );
  } );

  it( 'shows the closed line and no mark at Wednesday 19:00 (day-9, day-13)', () => {
    vi.setSystemTime( new Date( '2026-10-08T02:00:00Z' ) );
    const { container } = render( ui );
    expect( marked( container ) ).toHaveLength( 0 );
    expect( screen.getByText( 'The rooms are quiet now. We open tomorrow at 7:30 am.' ) ).toBeInTheDocument();
  } );

  it( 'says a bare time early on a weekday (day-13)', () => {
    vi.setSystemTime( new Date( '2026-10-07T13:00:00Z' ) );
    render( ui );
    expect( screen.getByText( 'The rooms are quiet now. We open at 7:30 am.' ) ).toBeInTheDocument();
  } );

  it( 'names Monday on Saturday (day-10)', () => {
    vi.setSystemTime( new Date( '2026-10-10T17:20:00Z' ) );
    const { container } = render( ui );
    expect( marked( container ) ).toHaveLength( 0 );
    expect( screen.getByText( 'The rooms are quiet now. We open Monday at 7:30 am.' ) ).toBeInTheDocument();
  } );

  it( 'leaves the first-render markup unmarked (day-11)', () => {
    vi.setSystemTime( new Date( '2026-10-07T17:20:00Z' ) );
    const html = renderToString( ui );
    expect( html ).toContain( '10:15 to 11:15' );
    expect( html ).not.toContain( 'data-now' );
    const box = document.createElement( 'div' );
    box.innerHTML = html;
    const layers = box.querySelectorAll( '[data-closed-line] > p' );
    expect( layers ).toHaveLength( 2 );
    expect( layers[ 0 ].getAttribute( 'aria-hidden' ) ).toBe( 'true' );
    expect( layers[ 0 ].className ).toContain( 'invisible' );
    expect( layers[ 1 ].textContent ).toBe( '' );
    expect( layers[ 1 ].getAttribute( 'aria-hidden' ) ).toBe( 'true' );
  } );

  it( 'clears its timer on unmount', () => {
    vi.setSystemTime( new Date( '2026-10-07T17:20:00Z' ) );
    const { unmount } = render( ui );
    unmount();
    expect( vi.getTimerCount() ).toBe( 0 );
  } );
} );
