import type { ReactNode } from 'react';

import { TextLink } from '@/components/base/text-link';
import { cn } from '@/lib/utils';

export interface PillLinkProps {
  href: string;
  tone?: 'solid' | 'light' | 'pale';
  className?: string;
  children: ReactNode;
}

const toneClass = {
  solid: 'bg-primary text-primary-foreground hover:bg-[var(--pill-pale)] hover:text-primary focus-visible:bg-[var(--pill-pale)] focus-visible:text-primary',
  light: 'bg-background text-foreground hover:bg-primary hover:text-primary-foreground',
  pale: 'bg-[var(--pill-pale)] text-primary hover:bg-primary hover:text-primary-foreground'
};

export function PillLink( { href, tone = 'solid', className, children }: PillLinkProps ) {
  return (
    <TextLink
      href={ href }
      data-tone={ tone }
      className={ cn(
        'pill-link inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border-0 px-6 py-0',
        'text-small [font-family:var(--font-body)] [font-weight:700]',
        'transition-[background-color,color] duration-300 motion-reduce:transition-none motion-reduce:!duration-0',
        'focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2',
        toneClass[ tone ],
        className
      ) }
    >
      { children }
    </TextLink>
  );
}
