import type { ReactNode } from "react";

import type { StickerSpot } from "@/components/sticker/sticker-layer";
import type { SitePack } from "@/style-packs/types";

import type { PageLayout } from "./parts";
import type { DoctorHeaderData } from "./doctor-sections";

export interface SiteEntry {
  title: string;
  description?: string;
  content: ReactNode;
}

export interface SiteContent {
  name: string;
  title: string;
  titleSuffix: string;
  description?: string;
  /** The picture a search result or a chat preview shows beside the words. */
  image?: { src: string; alt: string };
  keywords?: string;
  indexable?: boolean;
  person: Record<string, unknown>;
  pack: SitePack;
  layout: PageLayout;
  header: DoctorHeaderData;
  footer: ReactNode;
  footerStickers?: StickerSpot[];
  hero: ReactNode;
  after: ReactNode;
  pages?: Record<string, SiteEntry>;
  items?: Record<string, ( id: string ) => SiteEntry | undefined>;
}
