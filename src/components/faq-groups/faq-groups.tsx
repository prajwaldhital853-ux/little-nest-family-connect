import type { ReactNode } from 'react';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface FaqGroup {
  id: string;
  title: ReactNode;
  items: Array<{ id: string; question: ReactNode; answer: ReactNode }>;
}

export interface FaqGroupsProps {
  groups: FaqGroup[];
  className?: string;
}

const rule = '[border-top:1px_solid_color-mix(in_srgb,currentColor_30%,transparent)]';

export function FaqGroups( { groups, className = '' }: FaqGroupsProps ) {
  return (
    <section className={ cn( 'bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]', className ) }>
      <div className="flex flex-col gap-16 lg:gap-[90px]">
        { groups.map( group => (
          <Reveal key={ group.id } className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:gap-[var(--grid-gutter)]">
            <h2 className="m-0 text-h3 lg:col-span-4">{ group.title }</h2>
            <Accordion type="multiple" className={ cn( 'lg:col-span-7 lg:col-start-6', '[border-bottom:1px_solid_color-mix(in_srgb,currentColor_30%,transparent)]' ) }>
              { group.items.map( item => (
                <AccordionItem key={ item.id } value={ item.id } className={ cn( 'border-0', rule, '[&_h3]:!m-0 [&_h3]:![font-family:inherit] [&_h3]:![font-weight:inherit] [&_h3]:![letter-spacing:inherit] [&_h3]:![line-height:inherit]' ) }>
                  <AccordionTrigger className="text-meta min-h-14 py-0 text-left text-small font-normal hover:no-underline">{ item.question }</AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2 text-large [&_p]:m-0">
                    <div className="max-w-[34rem]">{ item.answer }</div>
                  </AccordionContent>
                </AccordionItem>
              ) ) }
            </Accordion>
          </Reveal>
        ) ) }
      </div>
    </section>
  );
}
