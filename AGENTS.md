# Hazel House

A preschool and daycare site: a home page, an about page, one page per room (babies, toddlers, preschoolers) with the day hour by hour and the slot happening now, an enrollment page with open spaces, tuition and an application form, and a contact page to book a tour.

## Where things are

- Pages: `src/pages/site/site.tsx` holds every page's content: home, /about, /contact, /enroll, /infant, /toddler, /preschool. `src/pages/site/index.tsx` picks the page from the address.
- Photos: `src/pages/site/media.ts`, one entry per photo with its alt text.
- Look: `src/style-packs/hazel-house.ts` sets the colours, fonts and type sizes. Change them there, not in components.
- Sections: `contact-details`, `day-schedule`, `facts-block`, `faq-groups`, `growth-steps`, `list-section`, `page-intro`, `photo-pause`, `pill-link`, `poster-hero`, `quote-row`, `room-tabs`, `site-footer`, `site-header`, `split-hero`, `statement-section`, `step-story`, `sticker`, `story-highlight`, `value-columns` in `src/components/`.
- Contact form: saves to the `contact_messages` table; the admin pages read it.

## Rules

- Type comes from the pack's seven styles: `text-h1` to `text-h4`, `text-large`, body, `text-small`. Never set a font size or a font family in a component.
- Keep every page's single h1, and words people can read in its first screen.
- New database tables go through a migration, not by editing `supabase/migrations/` by hand.
- Demo routes live under /demo/* and reuse the real admin pages wrapped in SeedDataProvider (src/lib/seed-data-provider.tsx); why: marketing screenshots without sign-in or database.
