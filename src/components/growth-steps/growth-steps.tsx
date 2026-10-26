import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import type { StickerShape } from '@/components/sticker/sticker';
import { Sticker } from '@/components/sticker/sticker';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface GrowthStep {
  id: string;
  name: ReactNode;
  dotLabel?: string;
  detail: ReactNode;
  note: ReactNode;
  href: string;
  media: ReactNode;
  sticker: { shape: StickerShape; color: string; rotate: number };
}

export interface GrowthStepsProps {
  title: ReactNode;
  lede?: ReactNode;
  steps: GrowthStep[];
  ground?: string;
  cloud?: string;
  className?: string;
}

const STICKER_SIZE = 320;
const REST_SCALE = 75 / STICKER_SIZE;
const PHONE_SCALE = 0.8;

const SLIDE = [ { x: 20, y: -170 }, { x: 40, y: -150 }, { x: -40, y: -190 } ];
const PHONE_SLIDE = [ { x: -42, y: -108 }, { x: 43, y: -108 }, { x: 43, y: -99 } ];
const NOTE_PLACE = [ 'right', 'left', 'above' ] as const;

const timing = '[transition-timing-function:ease] duration-500 motion-reduce:transition-none motion-reduce:!duration-0';

const stickerClass = cn(
  'pointer-events-none absolute left-1/2 top-1/2 z-0 block opacity-100',
  '[transform:translate(calc(-50%_+_var(--px)),calc(-50%_+_var(--py)))_scale(var(--phone-scale))_rotate(var(--rot))]',
  'lg:opacity-0 lg:[transform:translate(-50%,-50%)_scale(var(--rest-scale))_rotate(0deg)]',
  'lg:group-hover/step:opacity-100 lg:group-focus-visible/step:opacity-100',
  'lg:group-hover/step:[transform:translate(calc(-50%_+_var(--dx)),calc(-50%_+_var(--dy)))_scale(1)_rotate(var(--rot))]',
  'lg:group-focus-visible/step:[transform:translate(calc(-50%_+_var(--dx)),calc(-50%_+_var(--dy)))_scale(1)_rotate(var(--rot))]',
  'transition-[transform,opacity]',
  timing
);

const ringClass = cn(
  'relative z-[2] flex size-8 items-center justify-center rounded-full border border-current text-small transition-colors',
  'lg:group-hover/step:border-primary lg:group-hover/step:bg-primary lg:group-hover/step:text-primary-foreground',
  'lg:group-focus-visible/step:border-primary lg:group-focus-visible/step:bg-primary lg:group-focus-visible/step:text-primary-foreground',
  timing
);

const detailClass = cn( 'm-0 text-small opacity-100 transition-opacity lg:opacity-0 lg:group-hover/step:opacity-100 lg:group-focus-visible/step:opacity-100', timing );

const noteClass = {
  right: 'left-[calc(50%_+_2.25rem)] top-[-0.5rem] items-start text-left',
  left: 'right-[calc(50%_+_2.25rem)] top-[-0.5rem] items-end text-right',
  above: 'right-[calc(50%_+_0.5rem)] top-[-5.5rem] items-end text-right'
};

const arrowClass = {
  right: 'h-12 w-14 -scale-x-100',
  left: 'h-12 w-14',
  above: '-mr-3 h-32 w-12'
};

function NoteArrow( { place }: { place: typeof NOTE_PLACE[number] } ) {
  const d = place === 'above' ?
    'M6 3C12 30 3 58 10 84C14 100 22 114 33 124M24 121L33 124L33.5 114' :
    'M3 4C9 17 19 27 31 32C38 35 44 38 52 44M43 44.5L52 44L48.5 35.5';
  return (
    <svg viewBox={ place === 'above' ? '0 0 40 128' : '0 0 56 48' } aria-hidden="true" focusable="false" className={ cn( 'block overflow-visible', arrowClass[ place ] ) }>
      <path d={ d } fill="none" stroke="var(--shape)" strokeWidth={ 2 } strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GrowthSteps( { title, lede, steps, ground, cloud, className = '' }: GrowthStepsProps ) {
  const id = useId();
  const rowRef = useRef<HTMLOListElement>( null );
  const frameRef = useRef<number | null>( null );
  const [ current, setCurrent ] = useState( 0 );

  const onScroll = useCallback( () => {
    if ( frameRef.current !== null ) {
      return;
    }
    frameRef.current = requestAnimationFrame( () => {
      frameRef.current = null;
      const row = rowRef.current;
      if ( row && row.clientWidth > 0 ) {
        setCurrent( Math.round( row.scrollLeft / row.clientWidth ) );
      }
    } );
  }, [] );

  useEffect( () => () => {
    if ( frameRef.current !== null ) {
      cancelAnimationFrame( frameRef.current );
    }
  }, [] );

  const show = useCallback( ( index: number ) => {
    const row = rowRef.current;
    if ( !row ) {
      return;
    }
    const reduce = window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
    row.scrollTo( { left: index * row.clientWidth, behavior: reduce ? 'auto' : 'smooth' } );
    setCurrent( index );
  }, [] );

  return (
    <section
      data-header="solid"
      className={ cn( 'growth-steps relative overflow-hidden bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-28', className ) }
      style={ ground ? { backgroundColor: ground } : undefined }
    >
      { cloud && (
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-28 z-0 block [&>svg]:h-auto [&>svg]:w-[420px] lg:-bottom-40 lg:-left-40 lg:[&>svg]:w-[900px]">
          <Sticker shape="cloud" color={ cloud } size={ 900 } />
        </span>
      ) }
      <div className="relative z-[1]">
        <Reveal className="mx-auto flex flex-col items-center gap-5 text-center">
          <h2 className="m-0 text-h2">{ title }</h2>
          { lede && <p className="m-0 max-w-[46ch] text-large">{ lede }</p> }
        </Reveal>
        <ol
          ref={ rowRef }
          onScroll={ onScroll }
          className={ cn(
            'm-0 mt-16 flex list-none snap-x snap-mandatory overflow-x-auto p-0 py-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            'lg:mt-[100px] lg:grid lg:snap-none lg:grid-cols-3 lg:gap-[var(--grid-gutter)] lg:overflow-visible lg:py-0'
          ) }
        >
          { steps.map( ( step, i ) => {
            const place = NOTE_PLACE[ i % NOTE_PLACE.length ];
            const slide = SLIDE[ i % SLIDE.length ];
            const phoneSlide = PHONE_SLIDE[ i % PHONE_SLIDE.length ];
            const nameId = `${ id }-name-${ step.id }`;
            const noteId = `${ id }-note-${ step.id }`;
            const vars = {
              '--rot': `${ step.sticker.rotate }deg`,
              '--dx': `${ slide.x }px`,
              '--dy': `${ slide.y }px`,
              '--px': `${ phoneSlide.x }px`,
              '--py': `${ phoneSlide.y }px`,
              '--rest-scale': REST_SCALE,
              '--phone-scale': PHONE_SCALE
            } as CSSProperties;
            return (
              <li key={ step.id } className="relative w-full shrink-0 snap-center max-lg:overflow-hidden lg:w-auto">
                <Link
                  to={ step.href }
                  aria-labelledby={ nameId }
                  aria-describedby={ noteId }
                  className="peer/step group/step flex flex-col items-center gap-6 text-center text-inherit no-underline outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
                  style={ vars }
                >
                  <span className={ ringClass } aria-hidden="true">{ i + 1 }</span>
                  <span className="relative isolate block aspect-[4/5] w-full max-w-[320px]">
                    <span className={ stickerClass } data-gs-sticker="">
                      <Sticker shape={ step.sticker.shape } color={ step.sticker.color } size={ STICKER_SIZE } />
                    </span>
                    <span className="absolute inset-0 z-[1] block [&>img]:h-full [&>img]:w-full [&>img]:object-cover">{ step.media }</span>
                  </span>
                  <span className="flex flex-col items-center gap-1">
                    <span id={ nameId } className="text-h4 [font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)]">{ step.name }</span>
                    <span className={ detailClass } data-gs-detail="">{ step.detail }</span>
                  </span>
                </Link>
                <div
                  id={ noteId }
                  role="tooltip"
                  data-gs-note=""
                  className={ cn(
                    'pointer-events-none absolute z-[2] hidden w-[8rem] flex-col gap-1 opacity-0 transition-opacity [text-wrap:balance] lg:flex',
                    noteClass[ place ],
                    'lg:peer-hover/step:opacity-100 lg:peer-focus-visible/step:opacity-100',
                    timing
                  ) }
                >
                  <p className="m-0 text-small">{ step.note }</p>
                  <NoteArrow place={ place } />
                </div>
              </li>
            );
          } ) }
        </ol>
        <div className="mt-2 flex justify-center gap-2 lg:hidden">
          { steps.map( ( step, i ) => (
            <DotButton key={ step.id } index={ i } label={ step.dotLabel ?? ( typeof step.name === 'string' ? `Show ${ step.name }` : `Show step ${ i + 1 }` ) } current={ i === current } onShow={ show } />
          ) ) }
        </div>
      </div>
    </section>
  );
}

function DotButton( { index, label, current, onShow }: { index: number; label: string; current: boolean; onShow: ( index: number ) => void } ) {
  const onClick = useCallback( () => {
    onShow( index );
  }, [ index, onShow ] );

  return (
    <Button
      type="button"
      variant="ghost"
      aria-label={ label }
      aria-current={ current ? 'true' : undefined }
      onClick={ onClick }
      className="size-6 rounded-full p-0 hover:bg-transparent"
    >
      <span className={ cn( 'block size-3 rounded-full border border-current', current && 'bg-foreground' ) } />
    </Button>
  );
}
