import type { ReactNode, TransitionEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { PlayPauseButton } from '@/components/base/play-pause-button';
import { playStateOf, useSequence } from '@/components/sequence/use-sequence';
import { cn } from '@/lib/utils';

export interface SiteFooterProps {
  contact: { label: ReactNode; text: ReactNode; action?: ReactNode };
  address: { label: ReactNode; lines: ReactNode[]; action?: ReactNode };
  photos: ReactNode[];
  legal?: ReactNode;
  social?: ReactNode;
  copyright: ReactNode;
  columns?: Array<{ label: ReactNode; links: ReactNode[] }>;
  className?: string;
}

const HOLD_S = 2;
const SWAP_MS = 500;

function prefersLessMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
}

export function SiteFooter( { contact, address, photos, legal, social, copyright, columns = [], className = '' }: SiteFooterProps ) {
  const [ still, setStill ] = useState( true );
  const swaps = photos.length > 1 && !still;
  const { state, leaving, paused, start, stepShown, clearLeaving, toggle } = useSequence( { count: photos.length, hold: HOLD_S, fadeMs: SWAP_MS, loop: true } );

  useEffect( () => {
    const quiet = prefersLessMotion();
    setStill( quiet );
    if ( !quiet && photos.length > 1 ) {
      start();
    }
  }, [ photos.length, start ] );

  const onLayerTransitionEnd = useCallback( ( event: TransitionEvent<HTMLDivElement> ) => {
    if ( event.target !== event.currentTarget || event.propertyName !== 'opacity' ) {
      return;
    }
    if ( event.currentTarget.dataset.state === 'leaving' ) {
      clearLeaving();
      return;
    }
    stepShown();
  }, [ clearLeaving, stepShown ] );

  return (
    <footer className={ cn( 'bg-background px-[var(--grid-margin)] pb-[30px] pt-[120px] text-foreground', className ) }>
      <div className="flex flex-col gap-[50px] lg:grid lg:grid-cols-12 lg:items-start lg:gap-[var(--grid-gutter)]">
        <div className="flex flex-col lg:col-span-8">
          <p className="m-0 opacity-50">{ contact.label }</p>
          <p className="type-heading m-0 mt-5 text-h3">{ contact.text }</p>
          { contact.action && <div className="mt-[30px]">{ contact.action }</div> }
        </div>
        <div
          className="relative aspect-[3/4] w-1/2 overflow-hidden lg:col-span-3 lg:col-start-10 lg:w-auto"
          data-state={ playStateOf( state, paused ) }
        >
          { photos.map( ( photo, i ) => {
            const current = i === state.index;
            return (
              <div
                key={ i }
                data-state={ current ? 'current' : i === leaving ? 'leaving' : 'hidden' }
                aria-hidden={ current ? undefined : 'true' }
                onTransitionEnd={ onLayerTransitionEnd }
                className={ cn(
                  'absolute inset-0 transition-opacity duration-500 [transition-timing-function:var(--site-ease)]',
                  '[&>img]:h-full [&>img]:w-full [&>img]:object-cover',
                  current ? 'opacity-100' : 'opacity-0'
                ) }
              >
                { photo }
              </div>
            );
          } ) }
          { swaps && (
            <PlayPauseButton paused={ paused } onToggle={ toggle } label="footer photos" className="absolute bottom-4 right-4" />
          ) }
        </div>
      </div>
      { columns.length > 0 && (
        <nav aria-label="Footer" className="mt-20 grid grid-cols-2 text-center lg:text-left gap-x-[var(--grid-gutter)] gap-y-10 lg:grid-cols-12">
          { columns.map( ( column, i ) => (
            <div key={ i } className="lg:col-span-2">
              <p className="text-meta m-0 text-small opacity-50">{ column.label }</p>
              <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
                { column.links.map( ( link, j ) => <li key={ j }>{ link }</li> ) }
              </ul>
            </div>
          ) ) }
        </nav>
      ) }
      <div className="mt-20 flex flex-col gap-5 pt-5 text-small [border-top:1px_solid_color-mix(in_srgb,currentColor_20%,transparent)] lg:grid lg:grid-cols-12 lg:gap-[var(--grid-gutter)]">
        <p className="m-0 lg:col-span-6">
          <span className="opacity-50">{ address.label }</span>
          { address.lines.map( ( line, i ) => <span key={ i }> · { line }</span> ) }
          { address.action && <span> · { address.action }</span> }
        </p>
        <div className="flex flex-wrap gap-x-[30px] gap-y-5 lg:col-span-6">
          { legal }
          { social }
          <p className="m-0 basis-full lg:ml-auto lg:basis-auto">{ copyright }</p>
        </div>
      </div>
    </footer>
  );
}
