import type { AnchorHTMLAttributes } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TextLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  underline?: 'always' | 'hover';
}

export function TextLink( { href, underline = 'always', className, children, ...props }: TextLinkProps ) {
  return (
    <Button
      asChild
      variant="link"
      className={ cn(
        'h-auto rounded-none p-0 [font-family:inherit] [font-weight:inherit] text-[length:inherit] text-inherit',
        'whitespace-normal no-underline hover:no-underline',
        'border-b border-current',
        underline === 'hover' && 'border-transparent hover:border-current focus-visible:border-current',
        className
      ) }
    >
      { href.startsWith( '/' ) ?
        <Link to={ href } { ...props }>{ children }</Link> :
        <a href={ href } { ...props }>{ children }</a> }
    </Button>
  );
}
