# Dr. Ramesh Kandel

The public site for a geriatrician: a home page, `/about`, `/research`, `/how-it-works`,
`/teaching`, `/media`, `/blog`, `/post/<slug>` and `/contact`.

## Run it

```
npm run dev
```

It serves on `http://127.0.0.1:8080`. The dev server forwards `/api` to the Django backend on
`http://127.0.0.1:8000`, or to whatever `VITE_BACKEND_URL` names, so start that first if you want
live content.

## Where the words come from

Published content is read from the backend, `GET /api/cms/site/`, in
`src/pages/site/site-data.tsx`. Add or edit a post, interview, press item, publication or FAQ
in the admin panel and publish it; the page changes on the next load.

`src/pages/site/content.ts` is the bundled copy of the same content. It is what renders when
the API is down, slow, or answers with an empty collection, so a page is never emptier than
the bundle. Keep it in step with anything you add by hand.

To point a deployed build at the API, set `VITE_API_URL` in the host's environment settings
(for example the Vercel dashboard) to the backend's public origin, without a trailing slash.
Without it the site uses the bundled copy. That is enough for the public site, which only reads.
The panel needs more, and the next section is the whole of it.

## Deploying, with the panel beside the site

The panel (`admin/`) is a second single-page app mounted at `/admin` on the same address as this
site, because its sign-in cookie is trusted by matching that address. A deployment therefore
publishes one folder that holds both:

```
npm run build --prefix admin         # the panel into admin/dist
npm run panel:vendor                 # carries that build into panel-dist, which is committed
npm run build                        # the site into dist
npm run build:panel                  # copies panel-dist into dist/admin
```

`vercel.json` runs the last two on the host. That host installs only this folder's dependencies, so
it does not build `admin` itself: `panel-dist` is how the panel travels. After any change to the
panel, run the first two commands here and commit `panel-dist` with the rest.

`vercel.json` sends `/admin/*` to `dist/admin/index.html`, ahead of the site's own catch-all, and
`robots.txt` keeps `/admin` out of search results.

The API also has to answer on the same address as the page, so the host proxies `/api` and `/media`
to the backend instead of the build naming the backend's origin. `VITE_API_URL` cannot do that job
for the panel: a cross-origin call cannot carry its cookie, and `CORS_ALLOW_CREDENTIALS` is off on
purpose. Once the backend has a public address, add these beside the rewrites above:

```
{ "source": "/api/:path*", "destination": "https://<backend>/api/:path*" },
{ "source": "/media/:path*", "destination": "https://<backend>/media/:path*" }
```

On the backend, set that same public site address as `PANEL_ORIGIN`, list it in
`DJANGO_ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`, and keep `ADMIN_LOGIN_EMAILS` to the doctor's own
address. Pictures uploaded from the panel are files in the backend's `media/` folder, so the host
has to keep that folder between deploys; an ephemeral one loses every picture he has added.

## Every word of every page

`src/pages/site/copy.json` is the wording of the whole site, one key per page plus `global` for
the header, the footer, the page titles and the small labels. `buildSite()` in
`src/pages/site/site.tsx` reads it through `mergeCopy()` and hands each section its words, so no
component holds a string of its own and a headline with no component beside it is still an
editable line in that file.

`GET /api/cms/site/` returns the same shape under `copy`, and the panel's Page wording screen
edits it. `mergeValue()` decides what wins: live wording replaces a bundled value only where it is
the same kind of thing, so a half-written or emptied section cannot leave a page blanker than the
bundle. A new page means a new key here, then `manage.py seed_page_copy` in the backend so the
panel can see it.

Marks the site understands inside a string: `**bold**`, `*emphasis*`, `[label](https://link)`, and
a blank line for a paragraph break. One lone asterisk is drawn as typed, so a copy edit that leaves
an unbalanced pair shows on the page.

## Paging and pictures

`/blog` and `/media` ask the CMS for one cursor page at a time (`src/pages/site/feed.ts`, sizes in
`src/pages/site/paged.tsx`) and append the next page when the button is pressed. The API answers
with `next` holding the cursor; if it is unreachable the button walks the bundled list instead, so
the page is never worse than the file in the repo.

Every image below the first screen is `loading="lazy" decoding="async"`; the one above it is not,
because a lazy hero is a slow first paint. Give a new image a `width` and `height`, or the layout
shifts as it arrives.

## The site counts its own visitors

`src/pages/site/analytics.ts` sends a page view, how long the page was held, and the timings the
browser measured. What leaves is a path, two random tokens and five numbers, and the backend salts
those tokens afresh each day, so no visit can be stitched to a person or to yesterday. The send
goes to `VITE_API_URL` when set and to this same host otherwise, and if nothing answers it fails
quietly: a visitor never sees a consequence of the counting.

## Enquiries

The contact form posts to `POST /api/appointments/` in `src/pages/site/enquiry.ts` and lands in
the panel's consultation inbox. A field whose id is one of `name`, `email`, `phone`,
`concerns`, `aim`, `message` is stored in its own column; every other field travels as a
labelled line inside the message, so adding a question to the form needs no backend change.
If the API rejects an answer, the message appears under that field.

## Photos

`src/pages/site/media.ts` holds the images bundled with the site, each with its alt text. A CMS
row names one of them in its `photo` field, or uses `photo_url` for a link of its own. Use
images at least twice as wide as they appear on screen.

## The look

Colours, fonts and type sizes live in one file: `src/style-packs/hazel-house.ts`. Change them
there, not in components. Some sections also set colours of their own; search
`src/pages/site/` for `#` to find those. See [docs/design.md](docs/design.md), and
[docs/components.md](docs/components.md) for the sections available when adding a page.

Adding a page means an entry under `pages` in `src/pages/site/site.tsx` with a `title` and its
`content`, plus a link in the header or footer in the same file.
