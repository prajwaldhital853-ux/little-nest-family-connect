import type { SitePack } from "./types";

export type { SitePack, Typeset, FontRole } from "./types";
export { applySitePack } from "./apply";

import { hazelHouse } from "./hazel-house";

export const sitePacks: readonly SitePack[] = [hazelHouse];

export type SitePackName = (typeof sitePacks)[number]["label"];

export function sitePackByLabel(label: string): SitePack | undefined {
  return sitePacks.find((p) => p.label === label);
}

export function sitePackVars(pack: SitePack): Record<string, string> {
  const { typeset: t } = pack;
  return {
    "--base-font-size": `${t.basePx}px`,
    "--max-page-width": t.maxPageWidth,

    "--heading-font-family": t.roles.heading.family,
    "--heading-font-weight": String(t.roles.heading.weight),
    "--heading-font-line-height": t.roles.heading.lineHeight,
    "--heading-font-letter-spacing": t.roles.heading.letterSpacing,
    "--heading-font-text-transform": t.roles.heading.textTransform,

    "--body-font-family": t.roles.body.family,
    "--body-font-weight": String(t.roles.body.weight),
    "--body-font-line-height": t.roles.body.lineHeight,
    "--body-font-letter-spacing": t.roles.body.letterSpacing,
    "--body-font-text-transform": t.roles.body.textTransform,

    "--meta-font-family": t.roles.meta.family,
    "--meta-font-weight": String(t.roles.meta.weight),
    "--meta-font-line-height": t.roles.meta.lineHeight,
    "--meta-font-letter-spacing": t.roles.meta.letterSpacing,
    "--meta-font-text-transform": t.roles.meta.textTransform,

    "--heading-1-size-value": String(t.scale.heading1),
    "--heading-2-size-value": String(t.scale.heading2),
    "--heading-3-size-value": String(t.scale.heading3),
    "--heading-4-size-value": String(t.scale.heading4),
    "--large-text-size-value": String(t.scale.largeText),
    "--small-text-size-value": String(t.scale.smallText),
  };
}

export function sitePackFontUrls(pack: SitePack): string[] {
  const urls = Object.values(pack.typeset.roles)
    .map((r) => r.url)
    .filter((u): u is string => Boolean(u));
  return [...new Set(urls)];
}
