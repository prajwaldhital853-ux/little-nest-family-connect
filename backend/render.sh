#!/usr/bin/env bash
# Render's free plan offers no release command and no shell, so the three steps that cannot be done by
# hand happen here, just before gunicorn takes traffic: bring the database schema up to date, make the
# panel account on a database that has none, and load the first content into a database that has none.
# All three are safe to repeat on every boot.
#
# Set the service's start command to `bash render.sh`. With the root directory left at the repository
# root it is `bash backend/render.sh`; the cd below means either one works.

set -uo pipefail

cd "$(dirname "$0")"

echo "==> render.sh: applying database migrations"
if python manage.py migrate --noinput; then
	echo "==> render.sh: schema is up to date"
else
	echo "!! render.sh: migrations failed, so the API will start and then error on every page that"
	echo "!! reads the database. Check DATABASE_URL and that the database is running."
fi

echo "==> render.sh: checking for a panel account"
if python manage.py ensure_first_account; then
	echo "==> render.sh: panel account is in place"
else
	echo "!! render.sh: no panel account was made. Set DJANGO_SUPERUSER_EMAIL and"
	echo "!! DJANGO_SUPERUSER_PASSWORD in the service's environment and deploy again."
fi

echo "==> render.sh: checking for content"
if python manage.py ensure_first_content; then
	echo "==> render.sh: the panel has content to edit"
else
	echo "!! render.sh: content was not loaded, so the panel lists will be empty. The site still"
	echo "!! renders from the wording it ships with, so this is not visible to patients."
fi

echo "==> render.sh: starting gunicorn on port ${PORT:-10000}"
exec gunicorn config.wsgi:application \
	--bind 0.0.0.0:${PORT:-10000} \
	--workers 1 \
	--threads 4 \
	--timeout 60
