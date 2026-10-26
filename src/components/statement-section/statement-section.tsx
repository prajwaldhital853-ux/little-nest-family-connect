import type { ReactNode } from 'react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface StatementSectionProps {
  eyebrow?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  ruled?: boolean;
  centered?: boolean;
  lede?: ReactNode;
  heading?: 'h1' | 'h2';
  className?: string;
}

function CenteredStatement( { eyebrow, children, action, lede, heading = 'h2', className = '' }: StatementSectionProps ) {
  return (
    <section data-header="solid" className={ cn( 'flex flex-col items-center justify-center gap-10 bg-background px-[var(--grid-margin)] py-24 text-center text-foreground md:min-h-svh', className ) }>
      { eyebrow && <Reveal as="p" className="m-0 text-meta">{ eyebrow }</Reveal> }
      <Reveal as={ heading } variant="rise" className="m-0 text-h2 lg:max-w-[calc(var(--col)*10)]">{ children }</Reveal>
      { lede && <Reveal order={ 2 } variant="rise" className="flex max-w-[46ch] flex-col gap-4 text-large [&_p]:m-0">{ lede }</Reveal> }
      { action && <Reveal order={ 3 } variant="rise" className="mt-10">{ action }</Reveal> }
    </section>
  );
}

export function StatementSection( props: StatementSectionProps ) {
  const { eyebrow, children, action, ruled = false, centered = false, className = '' } = props;
  if ( centered ) {
    return <CenteredStatement { ...props } />;
  }
  return (
    <section data-header="solid" className={ cn( 'bg-background text-foreground', className ) }>
      <Reveal>
      <div className="flex flex-col gap-[3.75rem] px-[var(--grid-margin)] py-10 lg:py-[3.75rem]">
        { ruled && <hr className="m-0 -mb-5 h-px border-0 bg-current opacity-20" /> }
        <div className={ cn( 'flex flex-col', ruled ? 'gap-11' : 'gap-10' ) }>
          { eyebrow && <p className={ cn( 'm-0', ruled && 'text-meta' ) }>{ eyebrow }</p> }
          <h2
            className={ cn(
              'm-0 text-h2',
              '[font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)] lg:max-w-[calc(var(--col)*11_-_var(--grid-gutter))]'
            ) }
          >
            { children }
          </h2>
        </div>
        { action && <div className="">{ action }</div> }
      </div>
      </Reveal>
    </section>
  );
}
