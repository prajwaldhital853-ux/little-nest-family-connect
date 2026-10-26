import type { StylePack } from "../style-pack";

export interface FontRole {
  family: string;
  url: string | null;
  weight: number;
  lineHeight: string;
  letterSpacing: string;
  textTransform: "none" | "uppercase" | "lowercase" | "capitalize";
}

export interface Typeset {
  name: string;
  category: "serif" | "sans-serif" | "mixed" | "mono";
  basePx: number;
  maxPageWidth: string;
  roles: {
    heading: FontRole;
    body: FontRole;
    meta: FontRole;
  };
  scale: {
    heading1: number;
    heading2: number;
    heading3: number;
    heading4: number;
    largeText: number;
    smallText: number;
  };
}

export type Corners = 'sharp' | 'soft' | 'round';
export type Frames = 'none' | 'hairline';

export interface SitePack extends StylePack {
  typeset: Typeset;
  corners?: Corners;
  frames?: Frames;
}
