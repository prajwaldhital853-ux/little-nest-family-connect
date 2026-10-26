import type { CSSProperties, ReactNode } from 'react';

import { cn } from '@/lib/utils';

import type { StickerProps } from './sticker';
import { Sticker } from './sticker';

type Length = string | number;

interface Place {
  top?: Length;
  right?: Length;
  bottom?: Length;
  left?: Length;
}

export interface StickerSpot extends Omit<StickerProps, 'className'>, Place {
  id: string;
  phone?: ( Place & { size: number; rotate?: number } ) | false;
}

export interface DecoratedProps {
  stickers: StickerSpot[];
  children: ReactNode;
  className?: string;
}

const PHONE_SCALE = 0.6;

const length = ( value: Length | undefined ) => value === undefined ? 'auto' : typeof value === 'number' ? `${ value }px` : value;

function placeVars( spot: StickerSpot ): CSSProperties {
  const phone = spot.phone || undefined;
  const ownPlace = phone && [ phone.top, phone.right, phone.bottom, phone.left ].some( value => value !== undefined );
  const phonePlace: Place = ownPlace ? phone : spot;
  return {
    '--t': length( spot.top ),
    '--r': length( spot.right ),
    '--b': length( spot.bottom ),
    '--l': length( spot.left ),
    '--rot': `${ spot.rotate ?? 0 }deg`,
    '--w': `${ spot.size }px`,
    '--pt': length( phonePlace.top ),
    '--pr': length( phonePlace.right ),
    '--pb': length( phonePlace.bottom ),
    '--pl': length( phonePlace.left ),
    '--prot': `${ phone?.rotate ?? spot.rotate ?? 0 }deg`,
    '--pw': `${ phone ? phone.size : Math.round( spot.size * PHONE_SCALE ) }px`
  } as CSSProperties;
}

const spotClass = cn(
  'pointer-events-none absolute z-[1] block',
  'top-[var(--t)] right-[var(--r)] bottom-[var(--b)] left-[var(--l)] rotate-[var(--rot)]',
  'max-lg:top-[var(--pt)] max-lg:right-[var(--pr)] max-lg:bottom-[var(--pb)] max-lg:left-[var(--pl)] max-lg:rotate-[var(--prot)]',
  '[&>svg]:h-auto [&>svg]:w-[var(--w)] max-lg:[&>svg]:w-[var(--pw)]'
);

export function Decorated( { stickers, children, className = '' }: DecoratedProps ) {
  return (
    <div className={ cn( 'relative [overflow-x:clip] [overflow-y:visible]', className ) }>
      { children }
      { stickers.map( spot => (
        <span key={ spot.id } className={ cn( spotClass, spot.phone === false && 'max-lg:hidden' ) } style={ placeVars( spot ) } aria-hidden="true">
          <Sticker shape={ spot.shape } color={ spot.color } size={ spot.size } />
        </span>
      ) ) }
    </div>
  );
}
