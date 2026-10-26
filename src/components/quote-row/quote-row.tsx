import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface Quote {
  id: string;
  text: ReactNode;
  who: ReactNode;
}

export function QuoteRow( { label, quotes, size = 'large', className = '' }: { label: ReactNode; quotes: Quote[]; size?: 'large' | 'display'; className?: string } ) {
  return (
    <section data-header="solid" className={ cn( 'bg-background px-[var(--grid-margin)] py-10 text-foreground lg:py-[3.75rem]', className ) }>
      <hr className="m-0 mb-10 h-px border-0 bg-current opacity-20" />
      <h2 className="text-meta m-0">{ label }</h2>
      <ul className="m-0 mt-20 grid list-none grid-cols-1 gap-x-[var(--grid-gutter)] gap-y-12 p-0 lg:grid-cols-3">
        { quotes.map( quote => (
          <Reveal as="li" key={ quote.id }>
            <figure className="m-0">
              <blockquote className={ cn( 'type-heading m-0', size === 'display' ? 'text-h3' : 'text-large' ) }>{ quote.text }</blockquote>
              <figcaption className="text-meta mt-5">{ quote.who }</figcaption>
            </figure>
          </Reveal>
        ) ) }
      </ul>
    </section>
  );
}
