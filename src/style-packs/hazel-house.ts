import type { SitePack } from "./types";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Libre+Franklin:wght@400;500;700&display=swap";

export const hazelHouse: SitePack = {
  "label": "Karki Clinic",
  "previewColor": "#f2b705",
  "colors": [
    "#f2b705",
    "#17130b",
    "#d62828",
    "#faf6ec"
  ],
  "colorTokens": {
    "primary": "#f2b705",
    "primaryForeground": "#17130b",
    "background": "#faf6ec",
    "foreground": "#17130b",
    "secondary": "#17130b",
    "secondaryForeground": "#faf6ec",
    "accent": "#d62828",
    "accentForeground": "#faf6ec",
    "muted": "#f3ead4",
    "mutedForeground": "#5c5340",
    "card": "#faf6ec",
    "cardForeground": "#17130b",
    "popover": "#faf6ec",
    "popoverForeground": "#17130b",
    "destructive": "#d62828",
    "destructiveForeground": "#faf6ec",
    "border": "color-mix(in srgb, #17130b 22%, transparent)",
    "input": "color-mix(in srgb, #17130b 32%, transparent)",
    "ring": "#d62828"
  },
  "font": {
    "heading": { "family": "Archivo", "url": FONT_URL },
    "body": { "family": "Libre Franklin", "url": FONT_URL }
  },
  "typeset": {
    "name": "archivo-libre-franklin",
    "category": "sans-serif",
    "basePx": 16,
    "maxPageWidth": "1440px",
    "roles": {
      "heading": { "family": "Archivo", "url": FONT_URL, "weight": 800, "lineHeight": "1.05em", "letterSpacing": "-0.02em", "textTransform": "none" },
      "body": { "family": "Libre Franklin", "url": FONT_URL, "weight": 400, "lineHeight": "1.6em", "letterSpacing": "0em", "textTransform": "none" },
      "meta": { "family": "Libre Franklin", "url": FONT_URL, "weight": 700, "lineHeight": "1.3em", "letterSpacing": "0.14em", "textTransform": "uppercase" }
    },
    "scale": {
      "heading1": 4.24,
      "heading2": 2.85,
      "heading3": 1.93,
      "heading4": 1.35,
      "largeText": 1.23,
      "smallText": 0.88
    }
  },
  "corners": "sharp",
};

export default hazelHouse;
