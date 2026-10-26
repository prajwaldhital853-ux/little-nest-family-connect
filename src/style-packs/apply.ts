import type { SitePack } from "./types";
import { sitePackVars, sitePackFontUrls } from "./index";

export function applySitePack(pack: SitePack): void {
  const root = document.documentElement;

  for (const [name, value] of Object.entries(sitePackVars(pack))) {
    root.style.setProperty(name, value);
  }

  root.style.setProperty("--font-heading", quoteFamily(pack.typeset.roles.heading.family));
  root.style.setProperty("--font-body", quoteFamily(pack.typeset.roles.body.family));
  root.style.setProperty("--font-meta", quoteFamily(pack.typeset.roles.meta.family));
  root.style.setProperty(
    "--font-heading-weight",
    String(pack.typeset.roles.heading.weight),
  );
  root.style.setProperty(
    "--font-body-weight",
    String(pack.typeset.roles.body.weight),
  );

  const radius = { sharp: '0px', soft: '12px' }[pack.corners ?? 'round'];
  if (radius === undefined) {
    root.style.removeProperty('--radius-card');
  } else {
    root.style.setProperty('--radius-card', radius);
  }

  if (pack.frames === 'hairline') {
    root.style.setProperty('--frame-width', '1px');
    root.style.setProperty('--frame-color', 'var(--color-accent)');
  } else {
    root.style.removeProperty('--frame-width');
    root.style.removeProperty('--frame-color');
  }

  for (const [token, value] of Object.entries(pack.colorTokens)) {
    const cssName = token.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
    root.style.setProperty(`--color-${cssName}`, value);
  }

  loadFonts(pack);
}

export function quoteFamily(family: string): string {
  return `"${family.replace(/"/g, "")}"`;
}

function loadFonts(pack: SitePack): void {
  for (const href of sitePackFontUrls(pack)) {
    if (document.querySelector(`link[href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  const missing = Object.entries(pack.typeset.roles)
    .filter(([, role]) => !role.url)
    .map(([name, role]) => `${name}: ${role.family}`);

  if (import.meta.env.DEV && missing.length > 0) {
    const roles = Object.entries(pack.typeset.roles).filter(([, role]) => !role.url);
    void Promise.all(
      roles.map(async ([name, role]) =>
        (await document.fonts.load(`${role.weight} 1em "${role.family}"`)).length === 0 ? `${name}: ${role.family}` : null,
      ),
    ).then((list) => {
      const unserved = list.filter((entry): entry is string => entry !== null);
      if (unserved.length > 0) {
        console.warn(
          `[style-pack] "${pack.label}" names fonts nothing can load — ${unserved.join(", ")}. ` +
            `A family with no URL must be declared in fonts.css and have its file in ` +
            `public/fonts.`,
        );
      }
    });
  }
}
