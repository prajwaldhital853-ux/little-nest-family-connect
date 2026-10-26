import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

import { currentSlot, nextOpening, openingTexts, schoolClock, slotTime } from './school-time';

export interface DaySlot {
  id: string;
  start: string;
  end: string;
  name: ReactNode;
  text: ReactNode;
}

export interface DayScheduleProps {
  title: ReactNode;
  intro?: ReactNode;
  slots: DaySlot[];
  timeZone: string;
  days?: number[];
  nowLabel?: ReactNode;
  closed?: ( next: string ) => ReactNode;
  now?: Date;
  className?: string;
}

const WEEKDAYS = [ 1, 2, 3, 4, 5 ];
const MINUTE = 60_000;
const line = '[border-bottom:1px_solid_color-mix(in_srgb,currentColor_20%,transparent)]';
const pill = 'text-small text-meta whitespace-nowrap rounded-full px-3 py-1';

function quiet( next: string ): ReactNode {
  return `The rooms are quiet now. We open ${ /^\d/.test( next ) ? `at ${ next }` : next }.`;
}

export function DaySchedule( { title, intro, slots, timeZone, days = WEEKDAYS, nowLabel = 'Right now', closed = quiet, now, className = '' }: DayScheduleProps ) {
  const [ state, setState ] = useState<{ current?: string; next?: string } | null>( null );
  const timer = useRef<number | undefined>( undefined );

  const update = useCallback( () => {
    const clock = schoolClock( now ?? new Date(), timeZone );
    const current = currentSlot( slots, clock, days )?.id;
    const next = current ? undefined : nextOpening( slots, clock, days );
    setState( prev => ( prev && prev.current === current && prev.next === next ? prev : { current, next } ) );
  }, [ now, timeZone, slots, days ] );

  useEffect( () => {
    update();
    timer.current = window.setInterval( update, MINUTE );
    return () => window.clearInterval( timer.current );
  }, [ update ] );

  const closedNow = state && !state.current && state.next ? closed( state.next ) : null;
  const longest = openingTexts( slots, days ).reduce( ( a, b ) => ( b.length > a.length ? b : a ), '' );

  return (
    <section data-header="solid" className={ cn( 'day-schedule bg-background py-10 text-foreground lg:py-[3.75rem]', className ) }>
      <div className="px-[var(--grid-margin)]">
        <hr className="m-0 mb-10 h-px border-0 bg-current opacity-20" />
        <div className="grid grid-cols-1 gap-x-[var(--grid-gutter)] gap-y-10 lg:grid-cols-12">
          <Reveal variant="rise" className="flex flex-col gap-6 lg:col-span-5">
            <h2 className="m-0 text-h2">{ title }</h2>
            { intro && <div className="flex max-w-[46ch] flex-col gap-4 [&_p]:m-0">{ intro }</div> }
          </Reveal>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="text-small mb-4 grid [&>*]:[grid-area:1/1]" data-closed-line="">
              { longest && <p aria-hidden="true" className="invisible m-0">{ closed( longest ) }</p> }
              <p aria-hidden={ closedNow ? undefined : true } className="m-0">{ closedNow }</p>
            </div>
            <ol className="m-0 list-none p-0 [container-type:inline-size]">
              { slots.map( ( slot, i ) => {
                const isNow = slot.id === state?.current;
                return (
                  <li
                    key={ slot.id }
                    aria-current={ isNow ? 'time' : undefined }
                    data-now={ isNow ? '' : undefined }
                    className={ cn( 'relative', line, isNow ? 'rounded-[16px] bg-[var(--band,var(--color-secondary))] px-4' : 'pr-8' ) }
                  >
                    <Reveal order={ i } variant="rise" className="grid grid-cols-1 gap-x-[var(--grid-gutter)] gap-y-2 py-6 md:grid-cols-[calc((100cqw_-_11*var(--grid-gutter))/3_+_3*var(--grid-gutter))_minmax(0,1fr)]">
                      <p className="text-small text-meta relative m-0 flex flex-col items-start gap-3 self-start">
                        <span>{ slotTime( slot.start, slot.end ) }</span>
                        { isNow ?
                          <span className={ cn( pill, 'bg-background text-foreground max-md:absolute max-md:-top-1 max-md:right-0' ) }>{ nowLabel }</span> :
                          typeof nowLabel === 'string' ?
                            <span aria-hidden="true" data-label={ nowLabel } className={ cn( pill, 'invisible after:content-[attr(data-label)] max-md:hidden' ) } /> :
                            <span aria-hidden="true" className={ cn( pill, 'invisible max-md:hidden' ) }>{ nowLabel }</span> }
                      </p>
                      <div className="flex flex-col gap-2">
                        <h3 className="m-0 text-h4">{ slot.name }</h3>
                        <p className="m-0">{ slot.text }</p>
                      </div>
                    </Reveal>
                  </li>
                );
              } ) }
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
