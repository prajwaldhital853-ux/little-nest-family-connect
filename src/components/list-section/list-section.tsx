import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface ListItem {
  name: ReactNode;
  detail: ReactNode;
  note?: ReactNode;
}

export interface ListSectionProps {
  title: ReactNode;
  items: ListItem[];
  eyebrow?: ReactNode;
  layout?: 'list' | 'prices';
  notes?: ReactNode[];
  className?: string;
}

export function ListSection( { title, items, eyebrow, layout = 'list', notes = [], className = '' }: ListSectionProps ) {
  if ( layout === 'prices' ) {
    return (
      <section className={ cn( 'bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]', className ) }>
        <Reveal className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:gap-[var(--grid-gutter)]">
          <div className="lg:col-span-5">
            <h2 className="m-0 text-h2">{ title }</h2>
            { notes.length > 0 && (
              <div className="mt-4 flex flex-col gap-1">
                { notes.map( ( note, i ) => <p key={ i } className="text-meta m-0 text-small">{ note }</p> ) }
              </div>
            ) }
          </div>
          <dl className="m-0 grid grid-cols-1 gap-x-[var(--grid-gutter)] gap-y-6 min-[735px]:grid-cols-2 lg:col-span-6 lg:col-start-7">
            { items.map( ( item, i ) => (
              <div key={ i }>
                <dt>{ item.name }</dt>
                <dd className="m-0 opacity-70">{ item.detail }</dd>
              </div>
            ) ) }
          </dl>
        </Reveal>
      </section>
    );
  }

  return (
    <section className={ cn( 'bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]', className ) }>
      { eyebrow && <p className="mb-4 text-large">{ eyebrow }</p> }
      <h2 className="mb-[clamp(2rem,4vw,4rem)] max-w-[18ch] text-h2">{ title }</h2>
      <ul className="m-0 list-none border-t border-current p-0">
        { items.map( ( item, i ) => (
          <li key={ i } className="grid gap-1 border-b border-current py-4 lg:grid-cols-3 lg:items-baseline">
            <span className="type-heading text-h4">{ item.name }</span>
            <span>{ item.detail }</span>
            { item.note && <span className="opacity-70">{ item.note }</span> }
          </li>
        ) ) }
      </ul>
    </section>
  );
}
