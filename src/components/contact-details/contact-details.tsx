import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface ContactDetailsRow {
  id: string;
  label: ReactNode;
  content: ReactNode;
  /* A row that needs the whole column for itself, like the booking form, instead of sharing it
     with the label beside it. */
  wide?: boolean;
}

export interface ContactDetailsProps {
  title: ReactNode;
  rows: ContactDetailsRow[];
  media: ReactNode;
  className?: string;
}

export function ContactDetails( { title, rows, media, className = '' }: ContactDetailsProps ) {
  return (
    <section
      data-header="solid"
      className={ cn( 'bg-background px-[var(--grid-margin)] pb-16 pt-[calc(var(--site-header-height)_+_3.75rem)] text-foreground', className ) }
    >
      <Reveal as="h1" className="m-0 text-h1 lg:w-[calc(var(--col)*11_-_var(--grid-gutter))]">{ title }</Reveal>
      <div className="mt-16 flex flex-col gap-[var(--grid-gutter)] lg:mt-[96px] lg:grid lg:grid-cols-12 lg:items-start">
        <div
          className={ cn(
            'relative aspect-[3/4] overflow-hidden lg:sticky lg:top-[calc(var(--site-header-height)_+_1.25rem)] lg:order-2 lg:col-span-6 lg:col-start-7',
            '[&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover'
          ) }
        >
          { media }
        </div>
        <div className="mt-10 flex flex-col gap-[120px] lg:order-1 lg:col-span-6 lg:mt-0">
          { rows.map( row => (
            <div key={ row.id } className="flex flex-col gap-10">
              <p className={ cn( 'm-0', !row.wide && 'lg:w-[calc(var(--col)*2_-_var(--grid-gutter))]' ) }>{ row.label }</p>
              <div
                className={ cn(
                  'flex flex-col gap-[1.3em] [&>a]:self-start [&_p]:m-0',
                  row.wide ? 'lg:w-full' : 'lg:ml-[calc(var(--col)*2)] lg:w-[calc(var(--col)*3_-_var(--grid-gutter))]'
                ) }
              >
                { row.content }
              </div>
            </div>
          ) ) }
        </div>
      </div>
    </section>
  );
}
