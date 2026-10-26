import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface PhotoPauseProps {
  media: ReactNode;
  children?: ReactNode;
  by?: ReactNode;
  shade?: 'soft' | 'strong';
  className?: string;
}

export function PhotoPause( { media, children, by, shade = 'soft', className = '' }: PhotoPauseProps ) {
  return (
    <section data-header="over-media" className={ cn( 'relative h-[140svh] min-h-[40rem] overflow-clip bg-foreground text-white', className ) }>
      <div className="absolute inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">{ media }</div>
      <div className={ shade === 'strong' ? 'absolute inset-0 bg-black/55' : 'absolute inset-0 bg-black/30' } aria-hidden="true" />
      { children && (
        <div className="sticky top-[40svh] px-[var(--grid-margin)]">
          <Reveal variant="rise" pace="slow" className="text-center lg:ml-[calc(var(--col)*2)] lg:w-[calc(var(--col)*8_-_var(--grid-gutter))]">
            <p className="type-heading m-0 text-h2 italic">{ children }</p>
            { by && <p className="m-0 mt-6 text-small opacity-75">{ by }</p> }
          </Reveal>
        </div>
      ) }
    </section>
  );
}
