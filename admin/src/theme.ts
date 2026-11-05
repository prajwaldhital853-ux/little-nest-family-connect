/* The panel's look is one attribute on the document, so it can be set before React renders and
   never flashes the other palette on the way in. */
export type Theme = "light" | "dark";

const STORED = "panel.theme";

export function storedTheme(): Theme {
  const saved = localStorage.getItem( STORED );
  if ( saved === "light" || saved === "dark" ) return saved;
  return window.matchMedia( "(prefers-color-scheme: dark)" ).matches ? "dark" : "light";
}

export function applyTheme( theme: Theme ) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem( STORED, theme );
}
