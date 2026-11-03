import type { ReactNode } from "react";

import type { StickerSpot } from "@/components/sticker/sticker-layer";
import type { SitePack } from "@/style-packs/types";

import type { PageLayout } from "./parts";
import type { DrHeaderLink } from "./doctor-sections";

export interface SiteContent {
  name: string;
  title: string;
  pack: SitePack;
  layout: PageLayout;
  header: {
    name: string;
    role: string;
    strip: string;
    place: string;
    links: DrHeaderLink[];
    phone: { label: string; href: string };
    cta: DrHeaderLink;
  };
  footer: ReactNode;
  footerStickers?: StickerSpot[];
  hero: ReactNode;
  after: ReactNode;
  pages?: Record<string, { title: string; content: ReactNode }>;
  items?: Record<string, ( id: string ) => { title: string; content: ReactNode } | undefined>;
}
