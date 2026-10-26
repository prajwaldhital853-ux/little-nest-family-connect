import type { CSSProperties, KeyboardEvent, MutableRefObject, ReactNode } from 'react';
import { useCallback, useId, useRef, useState } from 'react';

import { TextLink } from '@/components/base/text-link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RoomTab {
  id: string;
  name: string;
  ground: string;
  links: Array<{ label: string; href: string }>;
  media: ReactNode;
}

export interface RoomTabsProps {
  label: ReactNode;
  tabs: RoomTab[];
  title?: ReactNode;
  className?: string;
}

const groundClass = 'bg-[var(--panel-ground)] transition-[background-color] duration-300 motion-reduce:transition-none motion-reduce:!duration-0';
const arrowClass = 'ml-3 inline-block align-middle transition-transform duration-300 group-hover/link:translate-x-[5px] group-focus-visible/link:translate-x-[5px] motion-reduce:transition-none motion-reduce:!duration-0';

function LinkWords( { label }: { label: string } ) {
  const cut = label.lastIndexOf( ' ' );
  return (
    <>
      { label.slice( 0, cut + 1 ) }
      <span className="whitespace-nowrap">{ label.slice( cut + 1 ) }<Arrow /></span>
    </>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false" className={ arrowClass }>
      <path d="M1 7h11M8 3l4 4-4 4" fill="none" stroke="currentColor" strokeWidth={ 1.25 } strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RoomTabs( { label, tabs, title, className = '' }: RoomTabsProps ) {
  const id = useId();
  const [ selected, setSelected ] = useState( 0 );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>( [] );
  const current = tabs[ selected ];
  const labelId = `${ id }-label`;
  const panelId = `${ id }-panel`;
  const tabId = ( index: number ) => `${ id }-tab-${ index }`;

  const choose = useCallback( ( index: number ) => {
    setSelected( index );
    tabRefs.current[ index ]?.focus();
  }, [] );

  const onKeyDown = useCallback( ( event: KeyboardEvent<HTMLDivElement> ) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: selected === last ? 0 : selected + 1, ArrowLeft: selected === 0 ? last : selected - 1, Home: 0, End: last }[ event.key ];
    if ( next !== undefined ) {
      event.preventDefault();
      choose( next );
    }
  }, [ choose, selected, tabs.length ] );

  return (
    <section
      data-header="solid"
      className={ cn( 'room-tabs relative bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-28', className ) }
      style={ { '--panel-ground': current.ground } as CSSProperties }
    >
      { title && <h2 className="pointer-events-none absolute m-0 h-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)]">{ title }</h2> }
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted lg:order-2 lg:aspect-[1014/720] [&_img]:absolute [&_img]:inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover" data-rt-photo="">
          { current.media }
        </div>
        <div className={ cn( 'flex flex-col justify-center px-5 py-12 lg:order-1', groundClass ) }>
          <p id={ labelId } className="text-meta m-0 text-small">{ label }</p>
          <div role="tablist" aria-labelledby={ labelId } onKeyDown={ onKeyDown } className="mt-4 flex flex-nowrap gap-4">
            { tabs.map( ( tab, i ) => (
              <TabButton
                key={ tab.id }
                index={ i }
                id={ tabId( i ) }
                controls={ panelId }
                selected={ i === selected }
                onChoose={ choose }
                refs={ tabRefs }
              >
                { tab.name }
              </TabButton>
            ) ) }
          </div>
          <div id={ panelId } role="tabpanel" aria-labelledby={ tabId( selected ) } className={ cn( 'mt-8', groundClass ) }>
            <ul className="m-0 flex list-none flex-col gap-4 p-0 text-h3 [font-family:var(--font-heading)] [font-weight:var(--font-heading-weight)]">
              { current.links.map( link => (
                <li key={ link.href }>
                  <TextLink href={ link.href } className="group/link inline border-0 [&_svg]:!size-[14px]">
                    <LinkWords label={ link.label } />
                  </TextLink>
                </li>
              ) ) }
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function TabButton( { index, id, controls, selected, onChoose, refs, children }: {
  index: number;
  id: string;
  controls: string;
  selected: boolean;
  onChoose: ( index: number ) => void;
  refs: MutableRefObject<Array<HTMLButtonElement | null>>;
  children: string;
} ) {
  const onClick = useCallback( () => {
    onChoose( index );
  }, [ index, onChoose ] );

  const setRef = useCallback( ( el: HTMLButtonElement | null ) => {
    refs.current[ index ] = el;
  }, [ index, refs ] );

  return (
    <Button
      ref={ setRef }
      id={ id }
      type="button"
      variant="ghost"
      role="tab"
      aria-selected={ selected }
      aria-controls={ controls }
      tabIndex={ selected ? 0 : -1 }
      onClick={ onClick }
      className={ cn(
        'h-auto rounded-none border-0 border-b border-solid border-transparent p-0 pb-1 text-large font-normal text-inherit opacity-80 transition-opacity duration-300 motion-reduce:transition-none motion-reduce:!duration-0',
        'hover:bg-transparent hover:font-bold hover:text-inherit hover:opacity-100',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current focus-visible:ring-0 focus-visible:ring-offset-0',
        selected && 'border-foreground font-bold opacity-100'
      ) }
    >
      <span data-label={ children } className="inline-flex flex-col after:invisible after:h-0 after:overflow-hidden after:font-bold after:content-[attr(data-label)]">
        { children }
      </span>
    </Button>
  );
}
