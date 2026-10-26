import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface ValueColumn {
  id: string;
  title: ReactNode;
  text: ReactNode;
  ground: string;
}

export interface ValueColumnsProps {
  title: ReactNode;
  values: ValueColumn[];
  className?: string;
}

export function ValueColumns( { title, values, className = '' }: ValueColumnsProps ) {
  return (
    <section data-header="solid" className={ cn( 'bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-28', className ) }>
      <Reveal as="h2" variant="rise" className="m-0 mb-12 text-h2">{ title }</Reveal>
      <ul className="m-0 grid list-none grid-cols-1 p-0 lg:auto-cols-fr lg:grid-flow-col">
        { values.map( ( value, i ) => (
          <li key={ value.id } className="p-8 lg:min-h-[460px] lg:p-12" style={ { backgroundColor: value.ground } }>
            <Reveal order={ i } variant="rise" className="flex flex-col gap-5">
              <h3 className="m-0 text-h3">{ value.title }</h3>
              <div className="flex flex-col gap-3 text-large [&_p]:m-0">{ value.text }</div>
            </Reveal>
          </li>
        ) ) }
      </ul>
    </section>
  );
}
