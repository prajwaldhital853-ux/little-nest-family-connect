import '@/styles/site-grid.css';

import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { SegmentedText } from '@/lib/animations/segmented-text';
import { cn } from '@/lib/utils';

export interface SplitHeroProps {
  media: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  mediaSide?: 'start' | 'end';
  titleSize?: 'h2' | 'h1';
  stack?: 'media-first' | 'text-first';
  className?: string;
}

const titleClass = [
  'm-0 mt-10 text-h2 font-light',
  '[font-family:var(--font-heading)] lg:mt-[11.3125rem]'
].join( ' ' );
const bodyClass = 'm-0 mt-5 [font-family:var(--font-body)]';
const bigTitleClass = [
  'm-0 mt-10 text-h1 font-light',
  '[font-family:var(--font-heading)] lg:mt-[11.3125rem]'
].join( ' ' );
const bigLedeClass = 'm-0 mt-5 max-w-[34ch] [font-family:var(--font-body)]';

export function SplitHero( { media, eyebrow, title, lede, action, mediaSide = 'start', titleSize = 'h2', stack = 'media-first', className = '' }: SplitHeroProps ) {
  const end = mediaSide === 'end';
  const textFirst = stack === 'text-first';
  const big = titleSize === 'h1';
  const heading = big ? bigTitleClass : titleClass;
  return (
    <section
      data-header="solid"
      className={ cn(
        'grid grid-cols-6 items-start gap-x-[var(--grid-gutter)] bg-background px-[var(--grid-margin)] py-[3.75rem] text-foreground lg:grid-cols-12',
        textFirst && 'max-lg:pt-[calc(var(--site-header-height)_+_2.5rem)]',
        className
      ) }
    >
      <Reveal
        order={ 4 }
        className={ cn(
          'relative col-span-full aspect-[3/4] overflow-hidden lg:col-span-6 lg:row-start-1',
          end && 'lg:col-start-7',
          textFirst && 'max-lg:order-last max-lg:mt-10',
          '[&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover'
        ) }
      >
        { media }
      </Reveal>
      { eyebrow && (
        <Reveal as="p" order={ 0 } variant="rise"
          className={ cn(
            'col-span-full m-0 mt-10 lg:col-span-2',
            end ? 'lg:col-start-1' : 'lg:col-start-7',
            'lg:row-start-1 lg:mt-20',
            textFirst && 'max-lg:mt-0'
          ) }>
          { eyebrow }
        </Reveal>
      ) }
      <div className={ cn( big ? 'col-span-full lg:col-span-4 lg:row-start-1' : 'col-span-full lg:col-span-3 lg:row-start-1', end ? 'lg:col-start-3' : 'lg:col-start-9' ) }>
        { typeof title === 'string' ?
          <SegmentedText as="h1" baseDelayMs={ 90 } className={ heading }>{ title }</SegmentedText> :
          <h1 className={ heading }>{ title }</h1> }
        { lede && <Reveal as="p" order={ 2 } variant="rise" className={ big ? bigLedeClass : bodyClass }>{ lede }</Reveal> }
        { action && <Reveal order={ 3 } variant="rise" className={ bodyClass }>{ action }</Reveal> }
      </div>
    </section>
  );
}
