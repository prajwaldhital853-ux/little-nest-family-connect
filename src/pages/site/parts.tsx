import "./site.css";

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect } from "react";

import { cn } from "@/lib/utils";
import { applySitePack } from "@/style-packs";
import type { SitePack } from "@/style-packs/types";

import { DoctorHeader, type DoctorHeaderData } from "./doctor-sections";
import type { SitePhoto } from "./media";

export type PageLayout = "margin" | "apple-1260" | "apple-1100" | "apple-980";

export function SiteTemplate( { name, pack, header, footer, skip, layout = "margin", children }: {
  name: string;
  pack: SitePack;
  layout?: PageLayout;
  header: DoctorHeaderData;
  footer?: ReactNode;
  skip?: string;
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
      <a className="dr-skip text-small" href="#main">{ skip ?? "Skip to the page" }</a>
      <DoctorHeader { ...header } />
      <main id="main">{ children }</main>
      { footer }
    </div>
  );
}

export function Img( { photo, style }: { photo: SitePhoto; style?: CSSProperties } ) {
  return (
    <img
      src={ photo.src }
      alt={ photo.alt }
      style={ style }
      width={ photo.width }
      height={ photo.height }
      loading="lazy"
      decoding="async"
    />
  );
}
