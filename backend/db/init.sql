-- Creates the database and role used by the backend.
-- The password is passed in on the command line, so this file never holds a secret.
--
--   cmd:  "D:\postgress\18\bin\psql.exe" -U postgres -v app_password="%POSTGRES_PASSWORD%" -f db\init.sql
--   bash: psql -U postgres -v app_password="$POSTGRES_PASSWORD" -f db/init.sql
--
-- Use the same value you put in .env as POSTGRES_PASSWORD.
-- CREATEDB is needed so `python manage.py test` can build a temporary test database.

CREATE ROLE kandel WITH LOGIN CREATEDB PASSWORD :'app_password';

CREATE DATABASE kandel_cms
    WITH OWNER = kandel
         TEMPLATE = template0
         ENCODING = 'UTF8';

GRANT ALL PRIVILEGES ON DATABASE kandel_cms TO kandel;
