/* The standing words of a page, described the same way the front page is: blocks in the order the
   visitor meets them, each with named boxes. A page listed here is edited from that list instead of
   from whatever shape the JSON happens to be in. */

import type { PageSection, SimpleLeaf } from "./homePage";
import { SHOW } from "./homePage";

export interface PageSchema {
  title: string;
  icon: string;
  note: string;
  /** The sentence under the switch that decides whether the words go live. */
  fallback: string;
  sections: PageSection[];
}

/* The public site, so a panel screen can point at the page it is editing. Configured for a
   deployment; in development the site runs beside the panel on its own port. */
export function siteOrigin(): string {
  const configured = ( import.meta.env.VITE_SITE_URL ?? "" ).replace( /\/$/, "" );
  return configured || ( import.meta.env.DEV ? "http://localhost:8080" : "" );
}

/* Which page of the site these words land on. Global wording has no page of its own. */
export function sitePath( key: string ): string | null {
  if ( key === "global" ) return null;
  if ( key === "home" ) return "/";
  if ( key === "article" ) return "/blog";
  return `/${ key }`;
}

const ENTRY_LINE: SimpleLeaf[] = [
  { kind: "textarea", path: "text", label: "Words", rows: 2 },
  { kind: "text", path: "meta", label: "Small line under it", help: "The journal and year, or a short note." },
  { kind: "text", path: "href", label: "Link", help: "Optional. A page on this site, or the paper itself." },
];

const RESEARCH_SECTIONS: PageSection[] = [
  {
    key: "page",
    name: "This page",
    note: "The name of the page, as the browser tab and the site title show it.",
    icon: "pages",
    root: true,
    fields: [
      { kind: "text", path: "title", label: "Name of the page", wide: true, help: "Marks the page in the browser and in the panel." },
    ],
  },
  {
    key: "hero",
    name: "Opening screen",
    note: "The first thing a visitor reads, with the picture beside it.",
    icon: "home",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "list", path: "lede", label: "Opening paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true, wide: true },
      { kind: "picture", path: "photo", label: "Picture", help: "One from the gallery, or one uploaded from this computer." },
    ],
  },
  {
    key: "lead",
    name: "Questions",
    note: "The questions the work keeps asking, and the button under them.",
    icon: "faqs",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "list", path: "questions", label: "Questions", itemLabel: "Question", add: "Add a question", multiline: true, wide: true },
      { kind: "link", path: "cta", label: "Button" },
    ],
  },
  {
    key: "story",
    name: "The work",
    note: "Longer prose about the programme work, with its pictures and the signature.",
    icon: "posts",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the section" },
      { kind: "list", path: "body", label: "Paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true, wide: true },
      { kind: "pictures", path: "photos", label: "Pictures beside the words", add: "Add a picture" },
      { kind: "text", path: "signature", label: "Signature" },
    ],
  },
  {
    key: "statement",
    name: "How the work is used",
    note: "The coloured band that says what the research changes in practice.",
    icon: "audit",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the band" },
      { kind: "list", path: "body", label: "Lines", itemLabel: "Line", add: "Add a line", multiline: true },
      { kind: "link", path: "cta", label: "Button" },
      { kind: "textarea", path: "note", label: "Small line under the button", rows: 2, wide: true },
    ],
  },
  {
    key: "credentials",
    name: "Selected publications",
    note: "The named lists near the foot of the page: selected publications, research interests, and where the work appears.",
    icon: "publications",
    fields: [
      SHOW,
      {
        kind: "blocks",
        path: "columns",
        label: "The lists on this page",
        add: "Add a line",
        help: "Name a list, then fill its lines. A list named for publications gets an Add a publication button, which takes a paper straight out of Publications without any typing.",
        item: ENTRY_LINE,
      },
    ],
  },
  {
    key: "publications",
    name: "Full list",
    note: "The heading over the complete list. The papers themselves are rows under Publications.",
    icon: "publications",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "textarea", path: "lede", label: "Line under the title", rows: 2, wide: true },
    ],
  },
  {
    key: "closing",
    name: "Invitation to collaborate",
    note: "The closing block, with the two buttons and the line under them.",
    icon: "press",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "textarea", path: "lede", label: "Line under the title", rows: 3, wide: true },
      { kind: "link", path: "primary", label: "Main button" },
      { kind: "link", path: "secondary", label: "Second button" },
      { kind: "textarea", path: "note", label: "Small line under the buttons", rows: 2, wide: true },
    ],
  },
];

export const PAGE_SCHEMAS: Record<string, PageSchema> = {
  research: {
    title: "Research page",
    icon: "publications",
    note: "Every block of the research page, in the order the visitor meets it.",
    fallback: "Held back, the page falls back to the words that ship with the site, so nothing disappears by accident.",
    sections: RESEARCH_SECTIONS,
  },
};
