import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface FactsBlockProps {
  title?: ReactNode;
  media?: ReactNode;
  name: ReactNode;
  action?: ReactNode;
  facts: Array<{ label: ReactNode; value: ReactNode }>;
  className?: string;
}

export function FactsBlock( { title, media, name, action, facts, className = '' }: FactsBlockProps ) {
  return (
    <section className={ cn( 'frame-rule bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]', className ) }>
      <Reveal>
        { title && <h2 className="m-0 text-center text-h2">{ title }</h2> }
        <div className="mx-auto mt-8 lg:w-[calc(var(--col)*6_-_var(--grid-gutter))]">
          { media && <div className="frame relative aspect-[4/3] overflow-hidden bg-muted [&_img]:absolute [&_img]:inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{ media }</div> }
          <div className="mt-[18px] flex flex-col gap-6 min-[735px]:grid min-[735px]:grid-cols-2 min-[735px]:gap-[var(--grid-gutter)]">
            <div>
              <h3 className="m-0 text-h3">{ name }</h3>
              { action && <div className="text-meta mt-2.5 text-small">{ action }</div> }
            </div>
            <dl className="m-0 flex flex-col gap-[18px]">
              { facts.map( ( fact, i ) => (
                <div key={ i }>
                  <dt className="text-meta text-small">{ fact.label }</dt>
                  <dd className="m-0 mt-2.5">{ fact.value }</dd>
                </div>
              ) ) }
            </dl>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
