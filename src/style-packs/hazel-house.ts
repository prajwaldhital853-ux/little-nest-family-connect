import type { SitePack } from "./types";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap";

export const hazelHouse: SitePack = {
  "label": "Prof. Ramesh Kandel",
  "previewColor": "#f2b705",
  "colors": [
    "#f2b705",
    "#17130b",
    "#c8102e",
    "#fbf8f1"
  ],
  "colorTokens": {
    "primary": "#f2b705",
    "primaryForeground": "#17130b",
    "background": "#fbf8f1",
    "foreground": "#17130b",
    "secondary": "#17130b",
    "secondaryForeground": "#fbf8f1",
    "accent": "#c8102e",
    "accentForeground": "#fbf8f1",
    "muted": "#f3ead4",
    "mutedForeground": "#5c5340",
    "card": "#ffffff",
    "cardForeground": "#17130b",
    "popover": "#fbf8f1",
    "popoverForeground": "#17130b",
    "destructive": "#c8102e",
    "destructiveForeground": "#fbf8f1",
    "border": "color-mix(in srgb, #17130b 18%, transparent)",
    "input": "color-mix(in srgb, #17130b 30%, transparent)",
    "ring": "#c8102e"
  },
  "font": {
    "heading": { "family": "Cormorant Garamond", "url": FONT_URL },
    "body": { "family": "Nunito Sans", "url": FONT_URL }
  },
  "typeset": {
    "name": "cormorant-nunito",
    "category": "mixed",
    "basePx": 16,
    "maxPageWidth": "1440px",
    "roles": {
      "heading": { "family": "Cormorant Garamond", "url": FONT_URL, "weight": 600, "lineHeight": "1.08em", "letterSpacing": "-0.01em", "textTransform": "none" },
      "body": { "family": "Nunito Sans", "url": FONT_URL, "weight": 400, "lineHeight": "1.65em", "letterSpacing": "0em", "textTransform": "none" },
      "meta": { "family": "Nunito Sans", "url": FONT_URL, "weight": 700, "lineHeight": "1.3em", "letterSpacing": "0.2em", "textTransform": "uppercase" }
    },
    "scale": {
      "heading1": 4.4,
      "heading2": 3.1,
      "heading3": 2.05,
      "heading4": 1.4,
      "largeText": 1.25,
      "smallText": 0.88
    }
  },
  "corners": "sharp",
};

export default hazelHouse;
