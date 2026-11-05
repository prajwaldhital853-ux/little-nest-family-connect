# Backend

Django 5 + Django REST Framework + PostgreSQL. Five apps, kept separate on purpose:

- `apps/accounts` sign-in only: staff accounts, JWT login, one time codes, trusted devices
- `apps/appointments` the consultation inbox only: public submission, staff triage
- `apps/cms` the website text only: posts, media, press, publications, FAQs and every page's wording
- `apps/analytics` what the site does: visits, page views, vitals, and the summary behind the panel's chart
- `apps/audit` the history: who changed which word, from what to what

Patient names, phone numbers and consultation answers live only in the appointments app.
The CMS endpoints never return them. The audit trail of an appointment records which of its fields
moved, and the consultation itself, the `concerns`, `aim` and `message`, is never part of it.

## Database: already set up

The backend runs against its own PostgreSQL 18 cluster rather than the one that was already
installed, because provisioning on that one needs its `postgres` superuser password.

| | |
| --- | --- |
| Data directory | `D:\pgdata_kandel` |
| Port | `5433`, so it never collides with the existing service on `5432` |
| Role and database | `kandel` and `kandel_cms`, scram-sha-256 over TCP |
| Database password | `POSTGRES_PASSWORD` in `backend\.env` (gitignored) |
| Panel login | `backend\first-login.env` (gitignored): `drameshkandel@gmail.com` and a generated password. Change it on the Account screen once you are in. |

Migrations are applied. Start the API with:

```
.\.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

The API is on `http://127.0.0.1:8000/api/`. Django's own `/admin/` is off unless
`DJANGO_ADMIN_ENABLED=true`; the React panel is the intended front door.

The cluster is a normal server process, not a Windows service, so it does not come back after
a reboot by itself. To start it again:

```
"D:\postgress\18\bin\pg_ctl.exe" -D D:\pgdata_kandel -l D:\Temp\kandel_pg.log start
```

Keep that log file outside the data directory: a log inside it deadlocks startup on Windows
with a sharing violation. To stop it cleanly, use `pg_ctl -D D:\pgdata_kandel stop -m fast`
rather than killing the process, which forces crash recovery on the next start.

To move the backend onto another server later (the cluster on `5432`, or a hosted database),
change the `POSTGRES_*` values in `.env` and run `migrate` again. `db/init.sql` creates the
role and database wherever you can connect as an administrator, and takes the password as a
variable so the file itself stays secret-free:

```
"D:\postgress\18\bin\psql.exe" -U postgres -v app_password="%POSTGRES_PASSWORD%" -f db\init.sql
```

## Checks

```
.\.venv\Scripts\python.exe manage.py check
set DB_ENGINE=sqlite && .\.venv\Scripts\python.exe manage.py test apps
```

Tests run on SQLite so they do not need the database server, and on SQLite Django builds the
test database in memory, so they never touch `db.sqlite3`.

## Endpoints

Sign in, all under `/api/auth/`:

| Where | What |
| --- | --- |
| `POST login/` | email and password. A remembered device gets the tokens; a new one gets `otp_required` and nothing else |
| `POST otp/verify/` | the code mailed to that address, then the tokens |
| `POST refresh/` | a new access token, read only from the `kandel_rtk` cookie and refused if that browser is no longer remembered |
| `POST logout/` | retires the refresh token and clears the cookies |
| `GET PATCH me/` | own profile |
| `GET devices/`, `DELETE devices/<id>/` | which browsers hold a session; deleting stops that browser for real |
| `POST password/` | change own password, signs other devices out |
| `POST password/forgot/` | mails a reset link, and answers the same whether or not the address exists |
| `POST password/reset/` | the token from the link and a new password, single use |
| `/users/` | staff accounts, admin only |

Everything else:

| Where | What |
| --- | --- |
| `POST /api/appointments/` | public request form |
| `/api/appointments/` | staff inbox, filter by `status`, `date_from`, `date_to`, `unassigned`, `assigned_to`, `search` |
| `GET /api/cms/site/` | every published row in one response: posts, videos, press, faqs, publications, page wording |
| `/api/cms/feed/posts/`, `feed/posts/<slug>/`, `feed/media/` | the public feeds, cursor paged |
| `/api/cms/posts/ media/ press/ publications/ faqs/` | published items are public, staff also see drafts with `?status=draft` |
| `/api/cms/pages/`, `pages/<key>/` | the wording of a whole page, editable down to every word; no deletes, only `published` |
| `POST /api/analytics/collect/` | the site's own visit beacon |
| `GET /api/analytics/summary/` | the numbers behind the Analytics screen |
| `GET /api/audit/entries/` | read only history, filter by `action`, `actor`, `target`, `search`, `days` |
| `GET /api/health/` | is the API up, is the database reachable, are its tables there yet, does the database hold any content, and is there a mail account that can send a code |

## What the rate limits are

Three rules the doctor asked for, all enforced server side:

- 3 wrong passwords from one device and one IP locks that pair for 5 minutes and answers `429`
  with a `Retry-After` header. `LOGIN_MAX_ATTEMPTS` and `LOGIN_LOCK_MINUTES` set both numbers.
- Signing in from a device that has not been seen before mails a code first, whatever the password.
  The tokens are only issued after `otp/verify/` accepts it, and the code expires in
  `OTP_TTL_MINUTES` with `OTP_MAX_ATTEMPTS` tries. A server with no mail account, or one the mail
  server refuses, answers `503` with the reason in the panel's own notice, rather than starting a
  code that nobody will ever read. That step is `OTP_REQUIRED`: left `true` it is the rule, and set
  `false` on a server with no mail account the allowlisted address signs in on its password alone,
  which is the only step that can work there. It is written in the audit trail as
  `login.device_trusted_without_a_code`, and the browser is remembered, so switching back to `true`
  later does not lock the doctor out of his own panel.
- The appointment form accepts one request per IP, device and wording for `SUBMISSION_DEDUPE_HOURS`
  (24 by default). A repeat is refused with a line that says the enquiry is already on file.

Scoped throttles sit on top: login 10/min, otp 6/min, reset 6/min, the analytics beacon 60/min,
appointments 20/day, anonymous API 100/min and public feeds 300/hour.

Only addresses in `ADMIN_LOGIN_EMAILS` can sign in with a password at all. Staff helpers get
accounts, and the panel gives them a session only through that list, so a second mailbox can never
open the inbox.

An appointment arrives with no time: `scheduled_at` is empty until the clinic agrees one, so the
inbox sorts on `created_at`, not on the slot.

## Deploying

The site and the panel are static builds, so the API needs its own host that both can reach.
Set in the server's environment (all read in `config/settings.py`, none of it committed):

| Variable | What to set |
| --- | --- |
| `DJANGO_SECRET_KEY` | a long random string |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | the API's own hostnames, comma separated |
| `ADMIN_LOGIN_EMAILS` | the doctor's address, comma separated if there is a second one. Nothing else can sign in. |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | the database to use |
| `PANEL_ORIGIN` | where the panel is served from, with scheme. Checked against the `Origin` header on every cookie-backed auth call. |
| `CORS_ALLOWED_ORIGINS` | the site's origin, comma separated, with scheme |
| `AUTH_COOKIE_DOMAIN` | leave empty unless the panel and the API share a registrable domain |
| `EMAIL_HOST` and friends | the mail account that sends the one time codes and reset links. Without them those mails are written to `outbox/` and sign in cannot be completed. |
| `USE_X_FORWARDED_FOR` | `true` only behind a proxy that overwrites the client address, otherwise an IP can be faked and the lockout is guesswork |
| `THROTTLE_APPOINTMENT` | submissions allowed per address per day, default `20/day` |

With `DJANGO_DEBUG=false` the auth cookies are `Secure` and `SameSite=None`, so the panel must be
served over HTTPS, and so must the API. Over plain http the browser refuses to store them and the
session cannot be resumed after a reload.

Then, in the two front ends, point them at it: `VITE_API_URL` on the site
(`little-nest-family-connect`, read in `src/pages/site/api.ts`), `VITE_API_URL` and `VITE_SITE_URL`
on the panel (`admin/src/api/client.ts`, and the site links in `src/pages/PageCopyPages.tsx`).
Both fall back to a relative `/api`, which is what the local dev proxies use.

Leave `CORS_ALLOW_ALL_ORIGINS` at `false`: the only public endpoints are content and the
submission form, and neither needs every origin.

### On Render

`render.yaml`, in the folder above this one, is the whole stack: one web service and one PostgreSQL
database, both from this repository. Made by hand instead, the service settings are:

| | |
| --- | --- |
| Root directory | `backend`. Left at the repository top, the build command needs `cd backend &&` in front of it and the start command becomes `bash backend/render.sh`. |
| Build command | `pip install -r requirements.txt && python manage.py collectstatic --noinput` |
| Start command | `bash render.sh` |
| Health check path | `/api/health/` |
| Python | `3.12`, read from `backend\.python-version` |

There is no Release command on this plan, and no shell to run one-off commands in, so `render.sh`
does the three things that would have been done by hand, on every boot, before it hands over to
gunicorn: `migrate --noinput`, then `ensure_first_account`, then `ensure_first_content`. None of them
can damage what is already there, which is what makes running them at start safe: a current database
migrates in a second, an existing account is left exactly as it is, and a database that already holds
content is not re-seeded, so the doctor's own edits outlive every deploy. The script also starts
gunicorn with one worker, so the start command is only ever `bash render.sh`. If a step fails the
service still comes up and the log says why in a line starting `!!`, because a crash loop hides the
reason and a live service with one clear error in its log does not.

`ensure_first_content` exists because a brand new database arrives with tables and no rows: the panel
opens on empty lists and the site keeps showing its bundled wording, which looks like the content was
lost. It loads the same two files the site ships with, `src/pages/site/copy.json` for the wording and
`db/site-content.json` for posts, media, press, publications and FAQs. A picture uploaded in a panel
is not in either file, so a hero pointed at an upload comes up empty until that picture is uploaded
again on the deployed panel.

In order, for a service made by hand:

1. Set the start command to `bash render.sh`.
2. Add the variables below. `DATABASE_URL`, `DJANGO_SECRET_KEY`, `DJANGO_DEBUG`, `DJANGO_ALLOWED_HOSTS`
   and `ADMIN_LOGIN_EMAILS` are the ones the site needs to answer at all; `DJANGO_SUPERUSER_PASSWORD`
   is the one that makes his account; the `EMAIL_*` names are the one that lets him sign in.
3. Deploy, then open `/api/health/` in a browser. `"schema": "current"` says the tables exist,
   `"content": "11 pages, 13 posts"` says the panel has something to edit, and `"mail": "configured"`
   says a code can reach his mailbox. Anything else now fails with a sentence in the panel, not a
   `500`.

One worker on purpose. The wrong password count and the throttles are held in the process's own
memory, so two workers would each keep their own idea of how many tries this browser has had.

The variables to add, and what goes in each:

| Variable | What to set |
| --- | --- |
| `DATABASE_URL` | the database's internal connection string, as Render writes it. `settings.py` takes it apart, so none of the five `POSTGRES_*` names are needed. |
| `DJANGO_SECRET_KEY` | generate one. Changing it signs everyone out, because it is what the session rests on. |
| `JWT_SIGNING_KEY` | generate one, or leave it out and `DJANGO_SECRET_KEY` signs the tokens. |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | the site's domain and the service's own `*.onrender.com` name, comma separated. The site forwards `/api` here, so the calls arrive naming the site's domain. Add `.vercel.app` with a leading dot if the preview builds should reach it too. |
| `ADMIN_LOGIN_EMAILS` | the doctor's address. Nothing else can sign in with a password. |
| `OTP_REQUIRED` | `true` normally. `false` lets the allowlisted address in on its password alone, which is the only way in while the server has no mail account: the allowlist, the password check and the three tries and five minute block all still apply. A browser that got in that way is remembered, so setting it back to `true` later does not lock him out of his own panel. `/api/health/` answers `otp: off` so the choice stays visible. |
| `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD` | the account `render.sh` makes on a database that has no accounts yet; the address is taken from `ADMIN_LOGIN_EMAILS` when the email one is left out, so a password alone is enough. It never changes a password that is already set, so once the panel works, change it there and these two can be cleared. |
| `PANEL_ORIGIN` | `https://` and the site's domain. The reset link mailed out is built from this, so the development default would mail him a link to his own laptop. |
| `PANEL_PATH` | `/admin` |
| `CORS_ALLOWED_ORIGINS` | the same site origin. Only needed when a call really does cross origins; a forwarded `/api` is the same origin. |
| `AUTH_COOKIE_SECURE` | `true` |
| `AUTH_COOKIE_SAMESITE` | `Lax`, when the site forwards `/api` and `/media` here as below. `None` only if the panel really does call this address across origins, and then Safari drops the cookie. |
| `USE_X_FORWARDED_HOST` | `true` |
| `SECURE_PROXY_SSL_HEADER` | `HTTP_X_FORWARDED_PROTO,https` |
| `USE_X_FORWARDED_FOR` | `true`, because Render's proxy is what overwrites the client address the lockout and the duplicate enquiry check are counted against. |
| `SECURE_SSL_REDIRECT` | `true` |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` | a real mail account. Left blank, the letters go into `outbox/` inside the build, which the next deploy throws away. Left as the dashboard's placeholder, the server tries to reach a host that does not exist. Either way a new device cannot finish signing in, and `/api/health/` answers `mail: not configured`. |
| `MEDIA_ROOT` | a folder inside an attached Disk, see below. |
| `UPLOAD_MAX_BYTES` | the largest picture the panel will take, default 6 MB. |

Every row has to be replaced, because a placeholder is not empty as far as the server is concerned.
`ADMIN_LOGIN_EMAILS` is the one that misleads: only an address on that list can sign in with a
password, so a leftover `FILL:` value answers a perfectly correct password with "Email or password is
not correct". The mail names are honest about it, and `/api/health/` says `mail: not configured`
until the host looks like a host and the account looks like an address.

Filled in for the live site, everything except the three values marked below. `DATABASE_URL` is
pasted from the database's own page (Internal key), and `ADMIN_LOGIN_EMAILS`, `EMAIL_HOST_USER`,
`EMAIL_HOST_PASSWORD` and `DEFAULT_FROM_EMAIL` are the doctor's addresses and his mail account:

```
DJANGO_SECRET_KEY=<generated, see the service's Info page once created>
JWT_SIGNING_KEY=<generated, same>
DATABASE_URL=<From Database picker, Internal key>
DJANGO_DEBUG=false
DJANGO_TIME_ZONE=Asia/Kathmandu
DJANGO_ALLOWED_HOSTS=drkandel.vercel.app,little-nest-family-connect.onrender.com,.vercel.app
ADMIN_LOGIN_EMAILS=<the doctor's address>
OTP_REQUIRED=false
DJANGO_SUPERUSER_EMAIL=<the same address, for the account render.sh makes>
DJANGO_SUPERUSER_PASSWORD=<a passphrase of at least 10 characters, changed later on the account screen>
PANEL_ORIGIN=https://drkandel.vercel.app
PANEL_PATH=/admin
CORS_ALLOWED_ORIGINS=https://drkandel.vercel.app
CORS_ALLOW_ALL_ORIGINS=false
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAMESITE=Lax
USE_X_FORWARDED_HOST=true
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
USE_X_FORWARDED_FOR=true
SECURE_SSL_REDIRECT=true
EMAIL_HOST=<smtp host>
EMAIL_PORT=587
EMAIL_HOST_USER=<mail account>
EMAIL_HOST_PASSWORD=<mail app password>
EMAIL_USE_TLS=true
DEFAULT_FROM_EMAIL=<the address letters appear to come from>
UPLOAD_MAX_BYTES=6291456
```

`VITE_API_URL` stays empty in Vercel's settings for both the site and the panel: an empty value
means "call my own origin", which is what makes `vercel.json`'s `/api` and `/media` rewrites the
whole of the wiring. Set it to the Render address instead and the sign in cookies go cross site and
the panel stops remembering the doctor between tabs.

Two things the API cannot settle by itself, and both are about where a request comes in:

- The site's host has to forward `/api/*` **and** `/media/*` to Render. That is what keeps the
  panel's sign in cookies first party, and it is the only way a picture uploaded from the panel is
  served: `/media/` belongs to Django, not to the static build, so a host that serves only the
  build answers those addresses with its own 404.
- Uploaded pictures are written to the container's own disk, and Render wipes that on every deploy.
  Attach a Disk to the service (Resources, Add Disk) and point `MEDIA_ROOT` at a folder inside its
  mount path, or the gallery empties itself the first time the site is rebuilt. A Disk needs a paid
  instance type. Until there is one, a picture chosen in the deployed panel shows live only until the
  next deploy, so the page that uses it has to be pointed at it again.

Both halves of the first deploy happen on their own, from `render.sh`: `ensure_first_account` makes
the panel account and `ensure_first_content` loads the wording and the rows. Anywhere with a shell,
the same steps by hand:

```
python manage.py migrate --noinput
python manage.py createsuperuser      # the doctor's address, which must be in ADMIN_LOGIN_EMAILS
python manage.py ensure_first_content # or the two commands below, one at a time
```

All of those read files that ship in this repository, so they run anywhere. `seed_page_copy`
writes the file's wording over whatever the panel holds, which on a new database is nothing; never
run it against a database the doctor has been working in. `ensure_first_content` is the safe form of
the same loading: it refuses to touch a database that already has content.

The free instance sleeps when nothing has asked it anything for a quarter of an hour, so the first
visitor after a quiet stretch waits a few seconds while it wakes. The free database is deleted
thirty days after it is made. Both are worth moving to a paid plan before the site takes a real
patient request.

## Loading the site's text

`db/site-content.json` holds the content that was written in the site's own files. To put it
into the database:

```
.\.venv\Scripts\python.exe manage.py import_site_content
```

It matches on slug, title, url and question, so running it again updates rather than duplicates.
Pass `--draft` to import as drafts, or `--file path\to.json` for another export.

The wording of each page lives in `little-nest-family-connect/src/pages/site/copy.json`. A row per
page appears in the panel through:

```
.\.venv\Scripts\python.exe manage.py seed_page_copy
```

That file is also what a boot on a fresh database seeds from, through `ensure_first_content`, so the
panel and the site start from the same words.

Read that before running it again: it writes the file's wording over whatever the panel holds for
those pages, so every edit the doctor has made is lost. Run it when seeding a new database, or when
deliberately resetting the wording to what the site ships. `--draft` seeds the rows unpublished,
which leaves the site on its own bundled words, and `--prune` removes rows for pages that no longer
exist in the file.
