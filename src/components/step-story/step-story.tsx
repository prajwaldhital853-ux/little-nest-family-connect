import type { KeyboardEvent, ReactNode } from 'react';
import { useCallback, useId, useRef, useState } from 'react';

import { IconArrowRight } from '@tabler/icons-react';

import { Reveal } from '@/lib/animations/reveal';
import { cn } from '@/lib/utils';

export interface StoryStep {
  id: string;
  tab?: string;
  title: ReactNode;
  media: ReactNode;
  children: ReactNode;
}

export interface StepStoryProps {
  steps: StoryStep[];
  nav?: 'tabs' | 'arrow';
  title?: ReactNode;
  titleAs?: 'h1' | 'h2';
  label?: ReactNode;
  mediaSide?: 'start' | 'end';
  className?: string;
}

const fade = 'transition-opacity duration-[400ms] [transition-timing-function:var(--site-ease)] motion-reduce:transition-none';

function Tab( { step, index, chosen, panelId, onChoose, onKey, tabRef }: { step: StoryStep; index: number; chosen: boolean; panelId: string; onChoose: ( index: number ) => void; onKey: ( event: KeyboardEvent<HTMLButtonElement>, index: number ) => void; tabRef: ( el: HTMLButtonElement | null ) => void } ) {
  const onClick = useCallback( () => {
    onChoose( index );
  }, [ index, onChoose ] );
  const onKeyDown = useCallback( ( event: KeyboardEvent<HTMLButtonElement> ) => {
    onKey( event, index );
  }, [ index, onKey ] );

  return (
    <button
      ref={ tabRef }
      type="button"
      role="tab"
      aria-selected={ chosen }
      aria-controls={ panelId }
      tabIndex={ chosen ? 0 : -1 }
      onClick={ onClick }
      onKeyDown={ onKeyDown }
      className={ cn( 'text-meta cursor-pointer border-0 bg-transparent p-0 text-small text-inherit', chosen ? 'opacity-100' : 'opacity-50 hover:opacity-100' ) }
    >
      { step.tab ?? step.title }
    </button>
  );
}

export function StepStory( { steps, nav = 'tabs', title, titleAs: Title = 'h2', label, mediaSide = 'start', className = '' }: StepStoryProps ) {
  const id = useId();
  const [ chosen, setChosen ] = useState( 0 );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>( [] );
  const end = mediaSide === 'end';
  const panelId = `${ id }-panel`;
  const step = steps[chosen];

  const onChoose = useCallback( ( index: number ) => {
    setChosen( index );
  }, [] );
  const onNext = useCallback( () => {
    setChosen( before => ( before + 1 ) % steps.length );
  }, [ steps.length ] );
  const onKey = useCallback( ( event: KeyboardEvent<HTMLButtonElement>, index: number ) => {
    if ( event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' ) {
      return;
    }
    event.preventDefault();
    const next = ( index + ( event.key === 'ArrowRight' ? 1 : -1 ) + steps.length ) % steps.length;
    setChosen( next );
    tabRefs.current[next]?.focus();
  }, [ steps.length ] );

  const arrow = (
    <button type="button" onClick={ onNext } aria-label="Next step" className={ cn( 'mt-10 cursor-pointer border-0 bg-transparent p-0 text-inherit', nav === 'tabs' && 'lg:hidden' ) }>
      <IconArrowRight size={ 28 } stroke={ 1 } aria-hidden="true" />
    </button>
  );

  return (
    <section data-header="solid" className={ cn( 'bg-background px-[var(--grid-margin)] py-20 text-foreground lg:py-[7.5rem]', className ) }>
      { ( label || title || nav === 'tabs' ) && (
        <div className="mb-6">
          { label && <p className="text-meta m-0 mb-2 text-small">{ label }</p> }
          { title && <Title className="m-0 text-h2">{ title }</Title> }
          { nav === 'tabs' && (
            <div role="tablist" aria-label={ typeof title === 'string' ? title : 'Chapters' } className="mt-6 hidden gap-5 lg:flex">
              { steps.map( ( one, i ) => (
                <Tab key={ one.id } step={ one } index={ i } chosen={ i === chosen } panelId={ panelId } onChoose={ onChoose } onKey={ onKey } tabRef={ el => { tabRefs.current[i] = el; } } />
              ) ) }
            </div>
          ) }
        </div>
      ) }
      <Reveal className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:items-stretch lg:gap-[var(--grid-gutter)]">
        <div className={ cn( 'frame relative overflow-hidden bg-muted [&_img]:absolute [&_img]:inset-0 [&_img]:h-full [&_img]:w-full [&_img]:object-cover', end ? 'aspect-[3/4] lg:col-span-4 lg:col-start-9 lg:row-start-1' : 'aspect-[3/2] lg:col-span-8' ) }>
          { steps.map( ( one, i ) => (
            <div key={ one.id } aria-hidden={ i === chosen ? undefined : 'true' } className={ cn( 'absolute inset-0', fade, i === chosen ? 'opacity-100' : 'opacity-0' ) }>
              { one.media }
            </div>
          ) ) }
        </div>
        <div
          id={ panelId }
          role={ nav === 'tabs' ? 'tabpanel' : undefined }
          aria-live="polite"
          className={ cn( 'flex flex-col text-center lg:text-left', end ? 'lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:justify-center' : 'lg:col-span-3 lg:col-start-10 lg:justify-between' ) }
        >
          <div>
            <p className="text-meta m-0 text-small">{ chosen + 1 } / { steps.length }</p>
            <h3 className="m-0 mt-4 text-h3">{ step.title }</h3>
          </div>
          <div className="mx-auto mt-6 max-w-[34rem] lg:mx-0 [&_p]:m-0">
            { step.children }
            { arrow }
          </div>
        </div>
      </Reveal>
    </section>
  );
}
