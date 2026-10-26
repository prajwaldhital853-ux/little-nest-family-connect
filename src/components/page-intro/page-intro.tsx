import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface PageIntroProps {
  title: ReactNode;
  line?: ReactNode;
  children?: ReactNode;
  align?: 'start' | 'center';
  mark?: ReactNode;
  pace?: 'normal' | 'slow';
  className?: string;
}

export function PageIntro( { title, line, children, align = 'start', mark, pace = 'slow', className = '' }: PageIntroProps ) {
  const centred = align === 'center';
  return (
    <section
      data-header="solid"
      className={ cn( 'bg-background px-[var(--grid-margin)] pb-20 pt-[calc(var(--site-header-height)_+_clamp(5rem,15vw,13.5rem))] text-foreground lg:pb-[120px]', className ) }
    >
      <div className={ centred ? 'mx-auto text-center lg:w-[calc(var(--col)*6_-_var(--grid-gutter))]' : 'lg:ml-[calc(var(--col)*2)] lg:w-[calc(var(--col)*8_-_var(--grid-gutter))]' }>
        { centred && mark && <Reveal pace={ pace } className="mb-6 flex justify-center">{ mark }</Reveal> }
        <Reveal as="h1" order={ 0 } variant="rise" pace={ pace } className="m-0 text-h1">{ title }</Reveal>
        { line && <Reveal as="p" order={ 1 } variant="rise" pace={ pace } className="type-heading m-0 mt-6 text-h3 italic">{ line }</Reveal> }
        { children && <Reveal as="p" order={ 2 } variant="rise" pace={ pace } className={ cn( 'm-0 mt-8 max-w-[40rem] text-large text-muted-foreground', centred && 'mx-auto' ) }>{ children }</Reveal> }
      </div>
    </section>
  );
}
