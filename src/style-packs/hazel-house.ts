import type { SitePack } from "./types";

export const hazelHouse: SitePack = {
  "label": "Hazel House",
  "previewColor": "#123f45",
  "colors": [
    "#123f45",
    "#fff7ec",
    "#d9ccf0",
    "#f6c453"
  ],
  "colorTokens": {
    "primary": "#123f45",
    "primaryForeground": "#fff7ec",
    "background": "#fff7ec",
    "foreground": "#123f45",
    "secondary": "#c3e6d1",
    "secondaryForeground": "#123f45",
    "accent": "#f6c453",
    "accentForeground": "#123f45",
    "muted": "#f6ebd9",
    "mutedForeground": "#3f6266",
    "card": "#fff7ec",
    "cardForeground": "#123f45",
    "popover": "#fff7ec",
    "popoverForeground": "#123f45",
    "destructive": "oklch(0.577 0.245 27.325)",
    "destructiveForeground": "#fff7ec",
    "border": "color-mix(in srgb, #123f45 20%, transparent)",
    "input": "color-mix(in srgb, #123f45 30%, transparent)",
    "ring": "#123f45"
  },
  "font": {
    "heading": { "family": "Fraunces", "url": "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Lato:wght@400;700&display=swap" },
    "body": { "family": "Lato", "url": "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Lato:wght@400;700&display=swap" }
  },
  "typeset": {
    "name": "fraunces-lato",
    "category": "mixed",
    "basePx": 16,
    "maxPageWidth": "1440px",
    "roles": {
      "heading": { "family": "Fraunces", "url": "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Lato:wght@400;700&display=swap", "weight": 300, "lineHeight": "1.08em", "letterSpacing": "-0.01em", "textTransform": "none" },
      "body": { "family": "Lato", "url": "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Lato:wght@400;700&display=swap", "weight": 400, "lineHeight": "1.6em", "letterSpacing": "0em", "textTransform": "none" },
      "meta": { "family": "Lato", "url": "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Lato:wght@400;700&display=swap", "weight": 700, "lineHeight": "1.3em", "letterSpacing": "0.12em", "textTransform": "uppercase" }
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
  "corners": "soft",
};

export default hazelHouse;
