import type { CSSProperties, ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface StoryHighlightProps {
  title: ReactNode;
  lede?: ReactNode;
  action?: ReactNode;
  media: ReactNode;
  ground?: string;
  ink?: string;
  align?: 'top' | 'center';
  className?: string;
}

export function StoryHighlight( { title, lede, action, media, ground, ink, align = 'top', className = '' }: StoryHighlightProps ) {
  const centre = align === 'center';
  const style = ground ? { '--color-background': ground, '--color-foreground': ink ?? 'inherit' } as CSSProperties : undefined;

  return (
    <section data-header="solid" className={ cn( 'bg-background text-foreground', className ) } style={ style }>
      <Reveal>
      <div className="grid grid-cols-1 gap-10 px-[var(--grid-margin)] py-[3.75rem] lg:grid-cols-2 lg:gap-[var(--grid-gutter)]">
        <div className={ centre ? 'flex flex-col lg:self-center' : 'flex flex-col lg:pt-20' }>
          <h2
            className={ centre ? cn(
              'mb-5 mt-0 text-h2 [font-family:var(--font-heading)]',
              '[font-weight:var(--font-heading-weight)] lg:w-[calc(var(--col)*4_-_var(--grid-gutter))]'
            ) : cn(
              'mb-5 mt-0 text-h3 [font-family:var(--font-heading)]',
              '[font-weight:var(--font-heading-weight)] lg:w-[calc(var(--col)*3_-_var(--grid-gutter))]'
            ) }
          >
            { title }
          </h2>
          { lede && <p className={ centre ? 'mb-8 mt-0 text-large lg:w-[calc(var(--col)*4_-_var(--grid-gutter))]' : 'mb-10 mt-0 lg:w-[calc(var(--col)*3_-_var(--grid-gutter))]' }>{ lede }</p> }
          { action && <div className="">{ action }</div> }
        </div>
        <div className="relative aspect-[3/4] overflow-hidden [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">{ media }</div>
      </div>
      </Reveal>
    </section>
  );
}
