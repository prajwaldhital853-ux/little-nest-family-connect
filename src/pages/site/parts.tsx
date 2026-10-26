import "./site.css";

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect } from "react";

import type { SiteFooterProps } from "@/components/site-footer/site-footer";
import { SiteFooter } from "@/components/site-footer/site-footer";
import type { SiteHeaderProps } from "@/components/site-header/site-header";
import { SiteHeader } from "@/components/site-header/site-header";
import type { StickerSpot } from "@/components/sticker/sticker-layer";
import { Decorated } from "@/components/sticker/sticker-layer";
import { cn } from "@/lib/utils";
import { applySitePack } from "@/style-packs";
import type { SitePack } from "@/style-packs/types";

import type { SitePhoto } from "./media";

export type PageLayout = "margin" | "apple-1260" | "apple-1100" | "apple-980";

export function SiteTemplate( { name, pack, header, footer, footerStickers, layout = "margin", children }: {
  name: string;
  pack: SitePack;
  layout?: PageLayout;
  header: SiteHeaderProps;
  footer?: SiteFooterProps;
  footerStickers?: StickerSpot[];
  children: ReactNode;
} ) {
  useLayoutEffect( () => {
    const root = document.documentElement;
    const before = root.getAttribute( "style" );
    applySitePack( pack );
    return () => {
      if ( before === null ) {
        root.removeAttribute( "style" );
      } else {
        root.setAttribute( "style", before );
      }
    };
  }, [ pack ] );

  return (
    <div className={ cn( "themed-type site-template min-h-screen bg-background text-foreground", `site-template-${ name }`, `layout-${ layout }` ) }>
      <SiteHeader overlay { ...header } />
      <main>{ children }</main>
      { footer && ( footerStickers ? <Decorated stickers={ footerStickers }><SiteFooter { ...footer } /></Decorated> : <SiteFooter { ...footer } /> ) }
    </div>
  );
}

export { ListSection } from "@/components/list-section/list-section";
export type { ListItem } from "@/components/list-section/list-section";

export function Img( { photo, style }: { photo: SitePhoto; style?: CSSProperties } ) {
  return <img src={ photo.src } alt={ photo.alt } style={ style } />;
}

