# Dr. Ramesh Kandel

A geriatrician's portfolio: a home page, `/about`, `/research`, `/healthy-ageing` (the consultation
walk, which also takes the old `/how-it-works` address), `/teaching`,
`/media`, `/blog` with one page per post, and `/contact` with the consultation enquiry form.

## Where things are

- Pages: `src/pages/site/site.tsx` builds every page from the content it is handed;
  `src/pages/site/index.tsx` picks the page from the address.
- Words: every word the site shows is in `src/pages/site/copy.json`, one key per page plus
  `global`, and `buildSite()` reads it through `mergeCopy()` in `src/pages/site/copy.ts`. The
  backend can replace any of it, so nothing here is a place to hardcode a sentence the doctor
  should own. Published content comes from `backend/` through `src/pages/site/site-data.tsx`,
  and `src/pages/site/content.ts` is the bundled copy of that. Both fall back to the bundle when
  the API is down, slow or empty, and `mergeValue()` refuses a live value that is not the same
  kind of thing as the bundled one.
- Paging: `/blog` and `/media` take one cursor page at a time from
  `src/pages/site/feed.ts` (`src/pages/site/paged.tsx` holds the sizes) and append on a click.
  Lazy-load anything below the first screen; the image above it stays eager.
- Counting: `src/pages/site/analytics.ts` sends page views and timings to
  `POST /api/analytics/collect/`. It reports paths and numbers about the page, never anything
  about the person, and a failed send is silent.
- Sections: `doctor-sections.tsx` in the same folder holds the blocks these pages are built
  from. Older generic blocks (`contact-details`, `facts-block`, `faq-groups`, `list-section`,
  `page-intro`, `photo-pause`, `poster-hero`, `quote-row`, `split-hero`, `statement-section`,
  `step-story`, `sticker`, `story-highlight`, `value-columns` and friends) are in
  `src/components/`.
- Photos: `src/pages/site/media.ts`, one entry per bundled image with its alt text. A CMS row
  picks one by key in its `photo` field.
- Look: `src/style-packs/hazel-house.ts` sets the colours, fonts and type sizes. Change them
  there, not in components.
- Enquiries: the contact form posts to `POST /api/appointments/` through
  `src/pages/site/enquiry.ts`. `src/lib/data-provider.tsx` and `src/integrations/supabase/` are
  leftovers from the template the site was built from and are being retired.

## Rules

- Type comes from the pack's seven styles: `text-h1` to `text-h4`, `text-large`, body,
  `text-small`. Never set a font size or a font family in a component.
- Keep every page's single h1, and words people can read in its first screen.
- Content columns live in `backend/apps/cms`. New tables or fields go through a Django
  migration there, never by editing `supabase/migrations/` by hand.
- A page must never render emptier than the bundled copy: anything read from the API needs the
  bundle as its fallback.
- `manage.py seed_page_copy` in the backend writes `copy.json` over the wording the doctor has
  edited in the panel. Run it on a fresh database, or when a reset is exactly what was asked for.
- Demo routes live under /demo/* and reuse the real admin pages wrapped in SeedDataProvider
  (src/lib/seed-data-provider.tsx); why: marketing screenshots without sign-in or database.
