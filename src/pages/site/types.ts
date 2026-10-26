import type { ReactNode } from "react";

import type { SiteFooterProps } from "@/components/site-footer/site-footer";
import type { SiteHeaderProps } from "@/components/site-header/site-header";
import type { StickerSpot } from "@/components/sticker/sticker-layer";
import type { SitePack } from "@/style-packs/types";

import type { PageLayout } from "./parts";

export interface SiteContent {
  name: string;
  title: string;
  pack: SitePack;
  layout: PageLayout;
  header: SiteHeaderProps;
  footer: SiteFooterProps;
  footerStickers?: StickerSpot[];
  hero: ReactNode;
  after: ReactNode;
  pages?: Record<string, { title: string; content: ReactNode }>;
  items?: Record<string, ( id: string ) => { title: string; content: ReactNode } | undefined>;
}
