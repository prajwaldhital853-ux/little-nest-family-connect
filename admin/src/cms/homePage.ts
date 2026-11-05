/* What the home page is made of, in the order the site shows it.
   The words themselves live in one JSON blob on the page-copy row, so a new line of copy
   never needs a migration; this file only says how each box is typed and labelled. */

export type Leaf =
  | { kind: "text"; path: string; label: string; help?: string; wide?: boolean }
  | { kind: "textarea"; path: string; label: string; rows?: number; help?: string; wide?: boolean }
  | { kind: "number"; path: string; label: string; help?: string }
  | { kind: "toggle"; path: string; label: string; help?: string }
  | { kind: "photo"; base: string; label: string; help?: string }
  | { kind: "picture"; path: string; label: string; help?: string }
  | { kind: "pictures"; path: string; label: string; add: string; help?: string }
  | { kind: "link"; path: string; label: string; help?: string }
  | { kind: "list"; path: string; label: string; itemLabel: string; add: string; multiline?: boolean; wide?: boolean; help?: string }
  | { kind: "rows"; path: string; label: string; item: SimpleLeaf[]; add: string; help?: string }
  | { kind: "blocks"; path: string; label: string; item: SimpleLeaf[]; add: string; help?: string };

/** Anything a row can be made of: a box with a name, never a nested list or picture. */
export type SimpleLeaf = Extract<Leaf, { path: string }>;

export interface HomeSection {
  key: string;
  name: string;
  note: string;
  icon: string;
  fields: Leaf[];
  /** The fields are read from the top of the page's words instead of one named block. */
  root?: boolean;
}

/** The same shape, named for pages other than the front one. */
export type PageSection = HomeSection;

export const SHOW: Leaf = { kind: "toggle", path: "show", label: "Show this section on the site" };

export const HOME_SECTIONS: HomeSection[] = [
  {
    key: "hero",
    name: "Hero",
    note: "The first screen: the headline, the two buttons and the picture beside them.",
    icon: "home",
    fields: [
      SHOW,
      { kind: "text", path: "eyebrow", label: "Small line above the title", help: "Leave it empty to hide the line." },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "textarea", path: "lede", label: "Opening paragraph", rows: 3, wide: true },
      { kind: "link", path: "primary", label: "Main button" },
      { kind: "link", path: "secondary", label: "Second button" },
      { kind: "list", path: "ticks", label: "Reassuring lines", itemLabel: "Line", add: "Add a line" },
      { kind: "photo", base: "photo", label: "Picture beside the words", help: "One of the photos that ship with the site, or one you upload." },
      { kind: "text", path: "bandTitle", label: "Line under the hero", wide: true },
      {
        kind: "rows",
        path: "bandItems",
        label: "The points under it",
        add: "Add a point",
        item: [
          { kind: "text", path: "label", label: "Words" },
          { kind: "text", path: "icon", label: "Small picture", help: "heart-handshake, stethoscope, heart-pulse, graduation-cap and similar names." },
        ],
      },
    ],
  },
  {
    key: "namaste",
    name: "Introduction",
    note: "The greeting that follows the hero, with the name and the letters after it.",
    icon: "account",
    fields: [
      SHOW,
      { kind: "text", path: "eyebrow", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "list", path: "body", label: "Paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true, wide: true },
      { kind: "text", path: "name", label: "Name" },
      { kind: "textarea", path: "credentials", label: "Training and posts", rows: 2 },
      { kind: "list", path: "marks", label: "Institutions beside the name", itemLabel: "Institution", add: "Add an institution" },
    ],
  },
  {
    key: "work",
    name: "Areas of work",
    note: "The four things he spends his time on, each with a link to the page about it.",
    icon: "posts",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "photo", base: "photo", label: "Picture for this section" },
      { kind: "text", path: "caption", label: "Caption under the picture" },
      {
        kind: "rows",
        path: "areas",
        label: "Areas",
        add: "Add an area",
        help: "Each one links to the page a visitor goes to next.",
        item: [
          { kind: "text", path: "title", label: "Title" },
          { kind: "textarea", path: "text", label: "Words", rows: 3 },
          { kind: "text", path: "href", label: "Link to", help: "A page on this site, for example /about." },
        ],
      },
    ],
  },
  {
    key: "impact",
    name: "Selected work and impact",
    note: "Three or four lines about the wider work: programmes, policy and the posts held at the institution.",
    icon: "audit",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      {
        kind: "rows",
        path: "items",
        label: "Highlights",
        add: "Add a highlight",
        item: [
          { kind: "text", path: "title", label: "Title" },
          { kind: "textarea", path: "text", label: "Words", rows: 3 },
        ],
      },
    ],
  },
  {
    key: "why",
    name: "Healthy ageing and ICOPE",
    note: "The spotlight on the WHO ICOPE pathway, with the quote and the link to the healthy ageing page.",
    icon: "faqs",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "list", path: "body", label: "Paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true },
      { kind: "photo", base: "photo", label: "Picture for this section" },
      { kind: "textarea", path: "quote", label: "Quote", rows: 3, wide: true },
      { kind: "text", path: "quoteName", label: "Who said it" },
      { kind: "text", path: "quoteRole", label: "Their role" },
      { kind: "text", path: "quotePlace", label: "Where they work" },
      { kind: "link", path: "quoteLink", label: "Button under the quote" },
      { kind: "list", path: "items", label: "Words in the list", itemLabel: "Word", add: "Add a word" },
    ],
  },
  {
    key: "research",
    name: "Featured research",
    note: "A short list of papers taken from the publication record. The papers themselves live under Publications.",
    icon: "publications",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "textarea", path: "lede", label: "Line under the title", rows: 2, wide: true },
      { kind: "number", path: "limit", label: "How many to show", help: "Counted from the newest group of papers." },
      { kind: "text", path: "allHref", label: "Link to the full list" },
    ],
  },
  {
    key: "teaching",
    name: "Teaching and leadership",
    note: "A short statement about the academic work, with one button to the teaching page.",
    icon: "account",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "list", path: "body", label: "Paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true },
      { kind: "link", path: "cta", label: "Button" },
      { kind: "textarea", path: "note", label: "Small line under the button", rows: 2, wide: true },
    ],
  },
  {
    key: "journey",
    name: "The steps",
    note: "How care runs from the first conversation to the follow-up.",
    icon: "audit",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "textarea", path: "lede", label: "Line under the title", rows: 2, wide: true },
      {
        kind: "rows",
        path: "steps",
        label: "Steps",
        add: "Add a step",
        item: [
          { kind: "text", path: "title", label: "Title" },
          { kind: "textarea", path: "text", label: "Words", rows: 2 },
          { kind: "text", path: "icon", label: "Small picture", help: "users, stethoscope, clipboard-list, heart-handshake, activity." },
        ],
      },
    ],
  },
  {
    key: "media",
    name: "Talks and interviews",
    note: "A strip of the newest media items. The items themselves live under Media.",
    icon: "media",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "number", path: "limit", label: "How many to show", help: "The strip takes the newest ones." },
      { kind: "text", path: "allHref", label: "Link to the full list" },
    ],
  },
  {
    key: "blog",
    name: "Notes from the blog",
    note: "A strip of the newest articles. The articles themselves live under Blog posts.",
    icon: "posts",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "Title", wide: true },
      { kind: "list", path: "lede", label: "Line under the title", itemLabel: "Sentence", add: "Add a sentence" },
      { kind: "text", path: "allHref", label: "Link to the full blog" },
    ],
  },
  {
    key: "cta",
    name: "Invitation to book",
    note: "The coloured block that asks a visitor to send an enquiry.",
    icon: "appointments",
    fields: [
      SHOW,
      { kind: "text", path: "kicker", label: "Small line above the title" },
      { kind: "text", path: "title", label: "First half of the title" },
      { kind: "text", path: "accent", label: "Second half, in the accent colour" },
      { kind: "list", path: "body", label: "Paragraphs", itemLabel: "Paragraph", add: "Add a paragraph", multiline: true },
      {
        kind: "rows",
        path: "pills",
        label: "Buttons",
        add: "Add a button",
        item: [
          { kind: "text", path: "label", label: "Words on the button" },
          { kind: "text", path: "href", label: "Link to" },
        ],
      },
      { kind: "textarea", path: "note", label: "Small line under the buttons", rows: 2, wide: true },
    ],
  },
  {
    key: "faq",
    name: "Questions",
    note: "A few answers on the home page. The questions themselves live under FAQs.",
    icon: "faqs",
    fields: [
      SHOW,
      { kind: "textarea", path: "title", label: "Title", rows: 2, wide: true },
      { kind: "textarea", path: "lede", label: "Line under the title", rows: 2, wide: true },
      { kind: "link", path: "link", label: "Button" },
      { kind: "text", path: "group", label: "Which set of FAQs to show", help: "The home page shows the questions filed under this name." },
    ],
  },
  {
    key: "closing",
    name: "Last words",
    note: "The closing block before the footer, aimed at collaborators.",
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
