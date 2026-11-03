import "./site.css";

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect } from "react";

import { cn } from "@/lib/utils";
import { applySitePack } from "@/style-packs";
import type { SitePack } from "@/style-packs/types";

import { DoctorHeader, type DrHeaderLink } from "./doctor-sections";
import type { SitePhoto } from "./media";

export type PageLayout = "margin" | "apple-1260" | "apple-1100" | "apple-980";

export function SiteTemplate( { name, pack, header, footer, layout = "margin", children }: {
  name: string;
  pack: SitePack;
  layout?: PageLayout;
  header: {
    name: string;
    role: string;
    strip: string;
    place: string;
    links: DrHeaderLink[];
    phone: { label: string; href: string };
    cta: DrHeaderLink;
  };
  footer?: ReactNode;
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
      <DoctorHeader { ...header } />
      <main>{ children }</main>
      { footer }
    </div>
  );
}

export function Img( { photo, style }: { photo: SitePhoto; style?: CSSProperties } ) {
  return <img src={ photo.src } alt={ photo.alt } style={ style } />;
}
