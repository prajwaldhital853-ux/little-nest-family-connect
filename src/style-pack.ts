export interface StylePack {
  label: string;
  previewColor: string;
  colors: [string, string, string, string];
  colorTokens: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebar?: string;
    sidebarForeground?: string;
    sidebarPrimary?: string;
    sidebarPrimaryForeground?: string;
    sidebarAccent?: string;
    sidebarAccentForeground?: string;
    sidebarBorder?: string;
    sidebarRing?: string;
  };
  font: {
    heading: { family: string; url: string };
    body: { family: string; url: string };
  };
}

const figtreeUrl =
  "https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&display=swap";

export const stylePack: StylePack = {
  label: "Neutral",
  previewColor: "#1a1a1a",
  colors: ["#1a1a1a", "#fafafa", "#f5f5f5", "#737373"],
  colorTokens: {
    primary: "oklch(0.205 0.029 264.7)",
    primaryForeground: "oklch(0.985 0 0)",
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0.029 264.7)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0.029 264.7)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0.016 264.7)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0.028 264.7)",
  },
  font: {
    heading: { family: "Figtree", url: figtreeUrl },
    body: { family: "Figtree", url: figtreeUrl },
  },
};

export default stylePack;
