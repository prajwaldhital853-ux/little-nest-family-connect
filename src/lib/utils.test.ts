import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe( 'cn', () => {
  it( 'keeps a pack size next to a text colour', () => {
    expect( cn( 'text-h2', 'text-inherit' ) ).toBe( 'text-h2 text-inherit' );
    expect( cn( 'text-large text-white' ) ).toBe( 'text-large text-white' );
    expect( cn( 'text-meta', 'text-accent-foreground' ) ).toBe( 'text-meta text-accent-foreground' );
  } );

  it( 'still lets a later pack size replace an earlier one', () => {
    expect( cn( 'text-h2', 'text-small' ) ).toBe( 'text-small' );
  } );
} );
