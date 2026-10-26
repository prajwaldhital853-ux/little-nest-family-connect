import '@/styles/site-grid.css';

import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { SegmentedText } from '@/lib/animations/segmented-text';
import { cn } from '@/lib/utils';

export interface PosterHeroProps {
  media: ReactNode;
  title: ReactNode;
  eyebrow?: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  place?: 'bottom' | 'top';
  panel?: boolean;
  className?: string;
}

const titleClass = [
  'm-0 [font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)]',
  '[text-wrap:balance]'
].join( ' ' );

export function PosterHero( { media, title, eyebrow, lede, action, place = 'bottom', panel = false, className = '' }: PosterHeroProps ) {
  const top = place === 'top';

  const words = (
    <>
    { eyebrow && (
      <Reveal as="p" order={ 0 } variant="rise"
        className={ top ?
          'text-meta mb-[clamp(1rem,2vw,2rem)] text-small' :
          cn(
            'mb-[clamp(1rem,2vw,2rem)] text-large',
            '[font-family:var(--font-body)]'
          ) }>
        { eyebrow }
      </Reveal>
    ) }
    { typeof title === 'string' ?
      <SegmentedText as="h1" baseDelayMs={ 90 } className={ cn( 'text-h1', titleClass ) }>{ title }</SegmentedText> :
      <h1 className={ cn( 'text-h1', titleClass ) }>{ title }</h1> }
    { ( lede || action ) && (
      <div className={ top ?
        'mt-[clamp(1rem,2vw,1.5rem)] flex flex-col items-start gap-6' :
        'mt-[clamp(1.5rem,3vw,3rem)] flex flex-wrap items-end justify-between gap-x-8 gap-y-4 [&>*]:-mt-[10svh] [&>*]:pt-[10svh]' }>
        { lede && (
          <Reveal as="p" order={ 2 } variant="rise"
            className={ cn(
              'm-0 max-w-[34ch] text-large',
              '[font-family:var(--font-body)]'
            ) }>
            { lede }
          </Reveal>
        ) }
        { action && (
          <Reveal order={ 3 } variant="rise" className="text-large [font-family:var(--font-body)]">
            { action }
          </Reveal>
        ) }
      </div>
    ) }
    </>
  );

  if ( panel ) {
    return (
      <section className={ cn( 'relative grid h-svh min-h-[36rem] overflow-hidden bg-background', className ) } data-place={ top ? 'top' : undefined } data-panel="">
        <Reveal order={ 4 } className="absolute inset-0 [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
          { media }
        </Reveal>
        <div className={ top ? 'relative self-start px-[var(--grid-margin)] pt-[calc(var(--site-header-height)+clamp(2rem,16svh,10rem))]' : 'relative self-end px-[var(--grid-margin)] pb-[clamp(2rem,3vw,3rem)] pt-[var(--site-header-height)]' }>
          <div className="w-fit bg-background p-6 text-foreground lg:max-w-[calc(var(--col)*6-var(--grid-gutter))] lg:p-10 min-[1440px]:max-w-[calc(var(--col)*5-var(--grid-gutter))]" data-hero-panel="">
            { words }
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={ cn( 'relative grid h-svh min-h-[36rem] overflow-hidden bg-black text-white', className ) } data-header="over-media" data-place={ top ? 'top' : undefined }>
      <Reveal order={ 4 } className="absolute inset-0 [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
        { media }
      </Reveal>
      <div className={ cn( 'pointer-events-none absolute inset-0', top ? 'bg-gradient-to-b from-black/50 via-black/30 via-55% to-black/10' : 'bg-gradient-to-t from-black/55 via-black/30 via-60% to-black/25' ) } aria-hidden="true" />
      <div className={ top ?
        'relative self-start px-[var(--grid-margin)] pt-[calc(var(--site-header-height)+clamp(2rem,16svh,10rem))] lg:max-w-[calc(var(--col)*7-var(--grid-gutter)+2*var(--grid-margin))]' :
        'relative self-end px-[var(--grid-margin)] pb-[clamp(2rem,3vw,3rem)] pt-[var(--site-header-height)]' }>
        { words }
      </div>
    </section>
  );
}
