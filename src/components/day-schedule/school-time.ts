export interface TimeSlot {
  id: string;
  start: string;
  end: string;
}

export interface SchoolClock {
  day: number;
  minutes: number;
}

const WEEKDAYS = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];

export function toMinutes( time: string ): number {
  const [ hours, minutes ] = time.split( ':' ).map( Number );
  return ( hours * 60 ) + minutes;
}

export function schoolClock( date: Date, timeZone: string ): SchoolClock {
  const parts = new Intl.DateTimeFormat( 'en-US', { timeZone, weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } ).formatToParts( date );
  const part = ( type: string ) => parts.find( p => p.type === type )?.value ?? '';
  return {
    day: WEEKDAYS.indexOf( part( 'weekday' ) ),
    minutes: ( Number( part( 'hour' ) ) * 60 ) + Number( part( 'minute' ) )
  };
}

export function currentSlot<T extends TimeSlot>( slots: T[], clock: SchoolClock, days: number[] ): T | undefined {
  if ( !days.includes( clock.day ) ) {
    return undefined;
  }
  return slots.find( slot => toMinutes( slot.start ) <= clock.minutes && clock.minutes < toMinutes( slot.end ) );
}

function clockTime( minutes: number, withPeriod = true ): string {
  const hours = Math.floor( minutes / 60 ) % 24;
  const shown = hours % 12 === 0 ? 12 : hours % 12;
  const time = `${ shown }:${ String( minutes % 60 ).padStart( 2, '0' ) }`;
  return withPeriod ? `${ time }\u00a0${ hours < 12 ? 'am' : 'pm' }` : time;
}

export function slotTime( start: string, end: string ): string {
  const from = toMinutes( start );
  const to = toMinutes( end );
  const samePeriod = ( from < 720 ) === ( to < 720 );
  return `${ clockTime( from, !samePeriod ) } to ${ clockTime( to ) }`;
}

export function openingTexts( slots: TimeSlot[], days: number[] ): string[] {
  if ( slots.length === 0 || days.length === 0 ) {
    return [];
  }
  const first = clockTime( toMinutes( slots[ 0 ].start ) );
  return [
    ...slots.map( slot => clockTime( toMinutes( slot.start ) ) ),
    `tomorrow at ${ first }`,
    ...days.map( day => `${ WEEKDAYS[ day ] } at ${ first }` )
  ];
}

export function nextOpening( slots: TimeSlot[], clock: SchoolClock, days: number[] ): string | undefined {
  if ( slots.length === 0 || days.length === 0 ) {
    return undefined;
  }
  if ( days.includes( clock.day ) ) {
    const later = slots.find( slot => toMinutes( slot.start ) > clock.minutes );
    if ( later ) {
      return clockTime( toMinutes( later.start ) );
    }
  }
  const first = clockTime( toMinutes( slots[ 0 ].start ) );
  for ( let ahead = 1; ahead <= 7; ahead++ ) {
    const day = ( clock.day + ahead ) % 7;
    if ( days.includes( day ) ) {
      return ahead === 1 ? `tomorrow at ${ first }` : `${ WEEKDAYS[ day ] } at ${ first }`;
    }
  }
  return undefined;
}
