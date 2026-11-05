# Clinic panel

The admin side of the site: the consultation inbox and everything the doctor can edit
without opening a code editor. It is a React + Vite + TypeScript single page app that
talks to the Django/DRF API in `../backend`. It has no server of its own and no secrets.

## Run it

```bat
cd admin
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173` and sign in. The panel only accepts the address in the backend's
`ADMIN_LOGIN_EMAILS`, which is the doctor's; the generated password is in
`backend\first-login.env` until it is changed on the Account screen. The first sign-in from a
browser the backend has not seen before asks for a code as well, mailed to that address; without
SMTP set up, the letter is written to `backend\outbox\` and the code is in it.

`npm run dev` needs the backend running in a second terminal:

```bat
cd ..\backend
.venv\Scripts\python.exe manage.py runserver 8000
```

And the Postgres cluster behind it:

```bat
"D:\postgress\18\bin\pg_ctl.exe" -D D:\pgdata_kandel -l D:\Temp\kandel_pg.log start
```

## Where the API lives

In development you do not configure a URL. `/api/*` and `/media/*` are proxied to the backend by
`vite.config.ts`, which reads `VITE_BACKEND_URL` (default `http://127.0.0.1:8000`) and forwards the
request with the browser's own address left in the `Host` header, because Django matches that
address against the `Origin` before it accepts a cookie-backed call. Rewriting it would make every
call from this port look like a forgery.

For a deployed panel set `VITE_API_URL` to the API's absolute origin; `src/api/client.ts`
prefaces every request with it. `django-cors-headers` on the backend must then list the
panel's origin in `CORS_ALLOWED_ORIGINS`, and the panel's origin goes in `PANEL_ORIGIN` so the
backend can check the `Origin` header on the cookie-backed auth calls.

`VITE_SITE_URL` is only used for the "view this page on the site" links in Page wording. Left
empty in development it points at the site on `http://localhost:8080`.

## Signs in, signs out

The access token lives in a variable in `src/api/client.ts` and nowhere else, so nothing that can
read the page's storage can take a session over. The long lived refresh token is never sent to
this JavaScript at all: it sits in an httpOnly cookie scoped to `/api/auth/`, and `POST
/api/auth/refresh/` reads it from there. That is how a reopened tab knows it is still signed in,
and one in-flight refresh is shared when several requests expire at once.

A refresh is also refused if the browser presenting the cookie is no longer a remembered device,
which is what makes removing a device on the Account screen end that laptop's session rather than
leaving it running.

Three cookies are the whole surface: `kandel_rtk` for the refresh token, `kandel_did` for the
device, `kandel_otp` for a pending one time code. All are httpOnly, `SameSite` and `Secure` as the
backend's settings decide, and none carries a password.

Wrong passwords are counted per device and per address: three and the backend answers `429` with a
`Retry-After`, which the login page counts down instead of letting anyone guess again. Forgotten
passwords go through `password/forgot/` and a link into `/reset-password`; the link works once.

Routes behind `RequireAuth` bounce to `/login`, and the panel is marked
`noindex, nofollow` so it never appears in a search result.

## What is on each screen

| Screen | Path | Does |
| --- | --- | --- |
| Dashboard | `/` | Today's pending and confirmed consultations, newest requests, and how many drafts sit in each content type (each number links to that list filtered to drafts). |
| Appointments | `/appointments` | Search by name, phone or reference; filter by status; show only unassigned. |
| Appointment | `/appointments/:id` | The patient's answers, the status moves the API allows, assign to a staff member, one private note that is never sent to the patient. |
| Content | `/content/:resource` | The list for one type, with search, a status filter kept in the URL (`/content/faqs?status=draft`), publish/unpublish, delete, and paging. |
| Edit | `/content/:resource/:id/edit` | The fields for one item. `/new` is the same form empty, defaulting to draft. |
| Page wording | `/pages`, `/pages/:key` | Every word the site renders, one page at a time, in the order the page shows them. Nothing is deleted, only covered over, and "Show this wording on the site" is the switch. |
| Analytics | `/analytics` | Visits, visitors, page views and enquiries with a daily chart, the pages that carried them, devices and browsers, and the real visitor timings. |
| Audit | `/audit` | Who changed what, down to the individual word, with the value before and after. Read only by design. |
| Staff | `/staff` | Add or edit a colleague, set their role, reset a password. |
| Account | `/account` | Your own name and job title, change-password, and the browsers that hold a session. |

## Content types are configuration, not code

`src/cms/resources.ts` holds one object per editable model (blog posts, media, press,
publications, FAQs) listing its endpoint, columns and fields. `ResourceList` and
`ResourceForm` render from that config, so adding a type is a new entry here plus a model
and viewset in the backend. `detailPath` is what identifies a row: posts use their slug,
everything else the id.

Statuses, not free text: `src/components/ui.tsx` colours the draft/published and
pending/confirmed/completed/cancelled/no-show pills, and the appointment detail page builds
its buttons from the `next_statuses` the API returns rather than assuming which transitions
are legal.

## Build

```bat
npm run build
```

Runs `tsc --noEmit` then writes `dist/`, which is static and can be served by any host.
Deploy it somewhere separate from the public site and keep it off the doctor's SEO
authority.
