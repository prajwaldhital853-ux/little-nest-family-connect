# Hazel House

A preschool and daycare site: a home page, an about page, one page per room (babies, toddlers, preschoolers) with the day hour by hour and the slot happening now, an enrollment page with open spaces, tuition and an application form, and a contact page to book a tour.

## Pages

- `/`: Home
- `/about`: About
- `/contact`: Contact
- `/enroll`: Enroll
- `/infant`: Infant
- `/toddler`: Toddler
- `/preschool`: Preschool


## Change the words

Every page's words are in `src/pages/site/site.tsx`. The home page is `hero` and `after` (either may be empty); each other page is an entry under `pages`, with its `title` and `content`. The header and footer links are in the same file, under `header` and `footer`.

## Change the photos

Photos are listed in `src/pages/site/media.ts`, each with a `src` and an `alt`. Point `src` at your own image, and keep `alt` describing what the photo shows. Use images at least twice as wide as they appear on screen, so they stay sharp on high-resolution displays.

## Change the look

Colours, fonts and type sizes live in one file: `src/style-packs/hazel-house.ts`. Change them there and most of the site follows. Some sections also set colours of their own: 1 colour values are typed straight into the files in `src/pages/site/` (search them for `#`); change those there too. See [docs/design.md](docs/design.md).

## Add a page

Add an entry under `pages` in `src/pages/site/site.tsx`, with a `title` and its `content`, built from the components in [docs/components.md](docs/components.md). It appears at `/<its name>`. Add a link to it in the header or footer in the same file.

## Messages from the contact form

The contact form saves each message to the `contact_messages` table. Sign in at `/sign-in` and read them at `/admin/messages`.
