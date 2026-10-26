import '@/styles/site-grid.css';
import './menu-sheet.css';

import type { CSSProperties, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { TextLink } from '../base/text-link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const noCleanup = (): void => undefined;

export interface SiteHeaderLink {
  label: string;
  href: string;
}

export interface SiteHeaderProps {
  name: string;
  home?: string;
  start?: SiteHeaderLink[];
  end?: SiteHeaderLink[];
  overlay?: boolean;
  linkFont?: 'body' | 'heading';
  menu?: 'bar' | 'sheet';
  sheetGround?: string;
  sheetFoot?: ReactNode;
  sheetEnter?: 'fade' | 'wipe';
  className?: string;
}

function MenuSheet( { name, links, ground, foot, enter }: { name: string; links: SiteHeaderLink[]; ground: string; foot?: ReactNode; enter: 'fade' | 'wipe' } ) {
  const [ open, setOpen ] = useState( false );

  const onPick = useCallback( () => {
    setOpen( false );
  }, [] );

  return (
    <Dialog open={ open } onOpenChange={ setOpen }>
      <DialogTrigger asChild>
        <Button variant="ghost" className="h-auto p-0 text-inherit hover:bg-transparent hover:text-inherit">Menu</Button>
      </DialogTrigger>
      <DialogContent
        data-enter={ enter }
        className="menu-sheet themed-type left-0 top-0 z-[110] flex h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col justify-between gap-10 overflow-y-auto rounded-none border-0 px-[var(--grid-margin)] pb-6 pt-5 text-foreground shadow-none data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0 data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 sm:rounded-none [&>button:last-child]:right-[var(--grid-margin)] [&>button:last-child]:top-5"
        style={ { backgroundColor: ground } }
      >
        <DialogTitle className="type-brand m-0 text-small [font-family:var(--font-body)]">{ name }</DialogTitle>
        <DialogDescription className="sr-only">Every page on the site</DialogDescription>
        <nav aria-label="Menu" className="flex flex-col items-center">
          { links.map( ( link, i ) => (
            <TextLink key={ link.href } href={ link.href } underline="hover" onClick={ onPick } style={ { '--menu-i': i } as CSSProperties } className="menu-sheet-link type-heading text-h2 leading-[1.1]">{ link.label }</TextLink>
          ) ) }
        </nav>
        <div className="menu-sheet-foot text-small">{ foot }</div>
      </DialogContent>
    </Dialog>
  );
}

type Under = { kind: 'page' } | { kind: 'media' } | { kind: 'solid'; ground: string; ink: string };

function isTransparent( colour: string ): boolean {
  return colour === 'transparent' || /rgba\(.*,\s*0\)$/.test( colour );
}

export function SiteHeader( { name, home = '/', start = [], end = [], overlay = false, linkFont = 'body', menu = 'bar', sheetGround = 'var(--color-accent)', sheetFoot, sheetEnter = 'fade', className = '' }: SiteHeaderProps ) {
  const ref = useRef<HTMLElement>( null );
  const [ under, setUnder ] = useState<Under>( { kind: 'page' } );

  useEffect( () => {
    const header = ref.current;
    if ( !header ) {
      return noCleanup;
    }
    let observer: IntersectionObserver | null = null;
    const inBand = new Set<HTMLElement>();

    const pick = () => {
      const el = [ ...inBand ].pop();
      if ( !el ) {
        setUnder( { kind: 'page' } );
        return;
      }
      if ( el.dataset.header === 'over-media' ) {
        setUnder( { kind: 'media' } );
        return;
      }
      const style = getComputedStyle( el );
      setUnder( isTransparent( style.backgroundColor ) ?
        { kind: 'page' } :
        { kind: 'solid', ground: style.backgroundColor, ink: style.color } );
    };

    const watch = () => {
      observer?.disconnect();
      inBand.clear();
      const height = header.offsetHeight;
      observer = new IntersectionObserver( entries => {
        entries.forEach( entry => {
          if ( entry.isIntersecting ) {
            inBand.add( entry.target as HTMLElement );
          } else {
            inBand.delete( entry.target as HTMLElement );
          }
        } );
        pick();
      }, { rootMargin: `-${ height }px 0px -${ Math.max( 0, window.innerHeight - height - 1 ) }px 0px` } );
      document.querySelectorAll( '[data-header]' ).forEach( el => observer?.observe( el ) );
    };

    watch();
    window.addEventListener( 'resize', watch );
    return () => {
      window.removeEventListener( 'resize', watch );
      observer?.disconnect();
    };
  }, [] );

  const solid: CSSProperties | undefined = under.kind === 'solid' ? { backgroundColor: under.ground, color: under.ink } : undefined;
  const headerClass = cn(
    overlay ? 'fixed inset-x-0 top-0' : 'sticky top-0',
    'z-[100] flex h-[var(--site-header-height)] items-center justify-between',
    'px-[var(--grid-margin)] [font-family:var(--font-body)] transition-colors duration-100',
    under.kind === 'page' && 'bg-background text-foreground',
    under.kind === 'media' && 'bg-gradient-to-b from-black/35 to-transparent text-white',
    className
  );

  if ( menu === 'sheet' ) {
    return (
      <header ref={ ref } style={ solid } data-over-media={ under.kind === 'media' ? 'true' : undefined } className={ headerClass }>
        <TextLink href={ home } underline="hover" className="type-brand whitespace-nowrap text-small">{ name }</TextLink>
        <MenuSheet name={ name } links={ [ ...start, ...end ] } ground={ sheetGround } foot={ sheetFoot } enter={ sheetEnter } />
      </header>
    );
  }

  return (
    <header
      ref={ ref }
      style={ solid }
      data-over-media={ under.kind === 'media' ? 'true' : undefined }
      className={ cn(
        overlay ? 'fixed inset-x-0 top-0' : 'sticky top-0',
        'z-[100] flex h-[var(--site-header-height)] items-center justify-between',
        'px-[var(--grid-margin)] transition-colors duration-100',
        linkFont === 'heading' ? '[font-family:var(--font-heading)]' : '[font-family:var(--font-body)]',
        under.kind === 'page' && 'bg-background text-foreground',
        under.kind === 'media' && 'bg-gradient-to-b from-black/35 to-transparent text-white',
        className
      ) }
    >
      <nav className="hidden gap-5 lg:flex" aria-label="Primary">
        { start.map( link => <TextLink key={ link.href } href={ link.href } underline="hover">{ link.label }</TextLink> ) }
      </nav>
      <TextLink
        href={ home }
        underline="hover"
        className={ cn(
          'type-brand whitespace-nowrap text-small [font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)]',
          'lg:absolute lg:left-1/2 lg:-translate-x-1/2'
        ) }
      >
        { name }
      </TextLink>
      <div className="flex items-center gap-5">
        <nav className="flex gap-5" aria-label="Secondary">
          { end.map( link => <TextLink key={ link.href } href={ link.href } underline="hover">{ link.label }</TextLink> ) }
        </nav>
        { start.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-auto p-0 text-inherit hover:bg-transparent hover:text-inherit lg:hidden">Menu</Button>
            </DialogTrigger>
            <DialogContent className="bg-background text-foreground">
              <DialogTitle className="type-brand text-small [font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)]">{ name }</DialogTitle>
              <nav className="grid gap-4 pt-2 text-h2 [font-family:var(--font-heading)]" aria-label="Menu">
                { [ ...start, ...end ].map( link => (
                  <TextLink key={ link.href } href={ link.href } underline="hover" className="justify-self-start">{ link.label }</TextLink>
                ) ) }
              </nav>
            </DialogContent>
          </Dialog>
        ) }
      </div>
    </header>
  );
}
