export const PUBLISH_OPTIONS: [string, string][] = [
  [ "draft", "Draft" ],
  [ "published", "Published" ],
];

const STATUS_FIELD: FieldDef = {
  key: "status",
  label: "Status",
  type: "select",
  options: PUBLISH_OPTIONS,
  help: "Only published items appear on the public site.",
};

const ORDER_FIELD: FieldDef = {
  key: "order",
  label: "Order",
  type: "number",
  help: "Lower numbers come first. Use a negative number to pin near the top.",
};

/* Images that ship inside the site bundle, so a row can name one instead of linking a file.
   Kept in step with SITE_PHOTOS in the backend and src/pages/site/media.ts in the site. */
export const PHOTO_OPTIONS: [string, string][] = [
  [ "", "None, use the photo link" ],
  [ "portrait", "Portrait of Dr. Kandel" ],
  [ "ageingCouple", "Older couple walking at sunset" ],
  [ "teaching", "Students in a lecture" ],
  [ "caregiver", "Caregiver helping an older woman stand" ],
  [ "research", "Papers and stethoscope on a desk" ],
  [ "checkup", "Community health camp checkup" ],
  [ "clinic", "Doctor consulting in a clinic" ],
  [ "press", "Dementia article quote card" ],
];

/* A row's picture is three columns on the server and one control in the panel: the name of an
   image the site already carries, the link to one that was uploaded, and the words that describe
   it. Only the control is drawn; the other two keys travel with the row so saving never drops a
   photo that was chosen the other way round. */
const PHOTO_FIELDS: FieldDef[] = [
  { key: "photo", label: "Picture", type: "photo", help: "Upload one from this computer, or choose one already in the gallery or shipped with the site." },
  { key: "photo_url", label: "Photo link", type: "url", hidden: true },
  { key: "photo_alt", label: "Photo description", type: "text", hidden: true },
];

/* The five kinds of written work the research page knows how to lay out. Kept in step with
   Publication.Kind in the backend and publicationKindHeading in the site. */
export const PUBLICATION_KIND_OPTIONS: [string, string][] = [
  [ "research", "Original research" ],
  [ "review", "Review or book chapter" ],
  [ "case", "Case report" ],
  [ "abstract", "Conference abstract or editorial" ],
  [ "other", "Other writing" ],
];

export type FieldType = "text" | "textarea" | "number" | "url" | "select" | "photo" | "blocks";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  max?: number;
  rows?: number;
  wide?: boolean;
  options?: [string, string][];
  placeholder?: string;
  /** What a brand new row starts with, so a required choice is never left empty. */
  initial?: string;
  /** Saved with the row but not drawn: the picture control owns all three of its keys. */
  hidden?: boolean;
}

export interface ResourceDef {
  slug: string;
  name: string;
  plural: string;
  endpoint: string;
  titleKey: string;
  detailPath?: string;
  /** The section's own colour, one of the t0 to t8 tones the panel stylesheet carries. */
  tone: number;
  /** The line under the heading that says what this part of the panel is for. */
  note: string;
  icon: string;
  /** A choice the list can be narrowed to, when one field splits the rows into useful halves. */
  filter?: { param: string; label: string; options: [string, string][] };
  columns: { key: string; label: string; type?: "text" | "status" | "number" | "date" }[];
  fields: FieldDef[];
}

export const resources: ResourceDef[] = [
  {
    slug: "posts",
    name: "Blog post",
    plural: "Blog posts",
    endpoint: "/api/cms/posts/",
    titleKey: "title",
    detailPath: "slug",
    tone: 1,
    icon: "posts",
    note: "The reading the Insights page is made of. Only a published post reaches the site.",
    columns: [
      { key: "title", label: "Title" },
      { key: "topic", label: "Topic" },
      { key: "minutes", label: "Minutes", type: "number" },
      { key: "status", label: "Status", type: "status" },
      { key: "updated_at", label: "Updated", type: "date" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", max: 200, wide: true },
      { key: "topic", label: "Topic", type: "text", max: 80 },
      { key: "minutes", label: "Reading time (minutes)", type: "number", initial: "5", help: "Left empty it is refused, so a new post starts at what the site keeps." },
      { key: "excerpt", label: "Excerpt", type: "textarea", max: 300, rows: 3, wide: true, help: "The one or two lines shown under the title in the list." },
      { key: "blocks", label: "Article", type: "blocks", wide: true, help: "Headings, paragraphs, lists and a pull quote, in the order the article reads on the site." },
      ...PHOTO_FIELDS,
      STATUS_FIELD,
      ORDER_FIELD,
    ],
  },
  {
    slug: "media",
    name: "Media item",
    plural: "Media",
    endpoint: "/api/cms/media/",
    titleKey: "title",
    tone: 2,
    icon: "media",
    note: "Interviews, talks and clips, each one pointed at its own recording.",
    columns: [
      { key: "title", label: "Title" },
      { key: "kind_display", label: "Kind" },
      { key: "source", label: "Channel" },
      { key: "status", label: "Status", type: "status" },
      { key: "order", label: "Order", type: "number" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", max: 200, wide: true },
      {
        key: "kind",
        label: "Kind",
        type: "select",
        options: [
          [ "interview", "Interview" ],
          [ "tv_interview", "TV interview" ],
          [ "talk", "Talk" ],
          [ "reel", "Reel" ],
          [ "local", "Uploaded video" ],
        ],
      },
      { key: "source", label: "Channel, programme or outlet", type: "text", max: 120 },
      { key: "url", label: "Recording link", type: "url", wide: true, placeholder: "https://www.youtube.com/watch?v=..." },
      { key: "poster_url", label: "Thumbnail link", type: "url", wide: true },
      STATUS_FIELD,
      ORDER_FIELD,
    ],
  },
  {
    slug: "press",
    name: "Press article",
    plural: "Press",
    endpoint: "/api/cms/press/",
    titleKey: "title",
    tone: 3,
    icon: "press",
    note: "Written features about his work, kept with the headline the outlet printed.",
    columns: [
      { key: "title", label: "Headline" },
      { key: "source", label: "Outlet" },
      { key: "topic", label: "Topic" },
      { key: "status", label: "Status", type: "status" },
      { key: "updated_at", label: "Updated", type: "date" },
    ],
    fields: [
      { key: "title", label: "Headline", type: "text", max: 200, wide: true },
      { key: "source", label: "Outlet", type: "text", max: 120 },
      { key: "topic", label: "Topic", type: "text", max: 80 },
      { key: "url", label: "Link to the article", type: "url", wide: true },
      { key: "blurb", label: "Summary", type: "textarea", max: 400, rows: 4, wide: true },
      ...PHOTO_FIELDS,
      STATUS_FIELD,
      ORDER_FIELD,
    ],
  },
  {
    slug: "publications",
    name: "Publication",
    plural: "Publications",
    endpoint: "/api/cms/publications/",
    titleKey: "title",
    tone: 4,
    icon: "publications",
    note: "The research page list. The type of work decides which part of the list an entry sits in and how it is drawn.",
    filter: { param: "kind", label: "Every type", options: PUBLICATION_KIND_OPTIONS },
    columns: [
      { key: "title", label: "Title" },
      { key: "kind_display", label: "Type" },
      { key: "venue", label: "Journal" },
      { key: "year", label: "Year", type: "number" },
      { key: "status", label: "Status", type: "status" },
    ],
    fields: [
      { key: "title", label: "Title", type: "text", max: 300, wide: true },
      {
        key: "kind",
        label: "Type of work",
        type: "select",
        wide: true,
        options: PUBLICATION_KIND_OPTIONS,
        initial: "research",
        help: "Decides which part of the research page this appears under, and how it is laid out there.",
      },
      { key: "authors", label: "Authors", type: "textarea", max: 500, rows: 3, wide: true },
      { key: "venue", label: "Journal, conference or book", type: "text", max: 200, wide: true },
      { key: "year", label: "Year", type: "number" },
      { key: "tag", label: "Theme", type: "text", max: 60, help: "A word to search the list by, such as frailty or dementia. It does not move the entry to another part of the page." },
      { key: "link", label: "Link", type: "url", wide: true, placeholder: "https://pubmed.ncbi.nlm.nih.gov/..." },
      STATUS_FIELD,
      ORDER_FIELD,
    ],
  },
  {
    slug: "faqs",
    name: "FAQ item",
    plural: "FAQs",
    endpoint: "/api/cms/faqs/",
    titleKey: "question",
    tone: 6,
    icon: "faqs",
    note: "Questions and answers, each filed under the page that shows it.",
    columns: [
      { key: "question", label: "Question" },
      { key: "group_display", label: "Block" },
      { key: "status", label: "Status", type: "status" },
      { key: "order", label: "Order", type: "number" },
    ],
    fields: [
      {
        key: "group",
        label: "Question block",
        type: "select",
        wide: true,
        options: [
          [ "home", "Home page" ],
          [ "how-it-works", "How it works page" ],
          [ "teaching", "Teaching page" ],
        ],
        help: "Which page's questions and answers this belongs to.",
      },
      { key: "question", label: "Question", type: "text", max: 300, wide: true },
      { key: "answer", label: "Answer", type: "textarea", rows: 8, wide: true },
      STATUS_FIELD,
      ORDER_FIELD,
    ],
  },
];

export function findResource( slug?: string ): ResourceDef | undefined {
  return resources.find( item => item.slug === slug );
}

export function keyFor( resource: ResourceDef, row: Record<string, unknown> ): string {
  const value = row[ resource.detailPath ?? "id" ];
  return value === null || value === undefined ? "" : String( value );
}
