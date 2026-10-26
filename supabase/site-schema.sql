-- The whole database a site template ships with; safe to run on an empty database or an old one, and to run twice.

drop table if exists public.enquiries;
drop table if exists public.date_overrides;
drop table if exists public.availability;
drop table if exists public.items;

drop view if exists public.site_owner;

drop function if exists public.seed_starter_items(uuid);
drop function if exists public.get_owner_owner_id();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);
alter table public.profiles drop column if exists enquiry_buffer_hours;

create index if not exists profiles_id_idx on public.profiles(id);

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select (id) on public.profiles to anon, authenticated;

alter table public.profiles enable row level security;
drop policy if exists "profiles select own" on public.profiles;
create policy "profiles select own" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles delete own" on public.profiles;
create policy "profiles delete own" on public.profiles
  for delete to authenticated using (auth.uid() = id);
drop policy if exists "profiles select owner public" on public.profiles;
drop policy if exists "profiles select public columns" on public.profiles;
create policy "profiles select public columns" on public.profiles
  for select to anon, authenticated using (true);

create table if not exists public.contact_messages (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  subject text not null,
  inquiry_type text not null check (inquiry_type in ('General Question','Press / Media','Collaboration','Other')),
  message text not null,
  status text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz not null default now()
);

alter index if exists public.contact_messages_coach_created_idx rename to contact_messages_owner_created_idx;
create index if not exists contact_messages_owner_created_idx on public.contact_messages(owner_id, created_at desc);
create index if not exists contact_messages_owner_status_idx on public.contact_messages(owner_id, status);

grant select, insert, update, delete on public.contact_messages to authenticated;
grant insert on public.contact_messages to anon;
grant all on public.contact_messages to service_role;

alter table public.contact_messages enable row level security;
drop policy if exists "contact_messages select own" on public.contact_messages;
create policy "contact_messages select own" on public.contact_messages
  for select to authenticated using (auth.uid() = owner_id);
drop policy if exists "contact_messages insert anon" on public.contact_messages;
create policy "contact_messages insert anon" on public.contact_messages
  for insert to anon
  with check (
    length(btrim(name)) between 1 and 200
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and length(email) <= 320
    and length(btrim(subject)) between 1 and 300
    and length(btrim(message)) between 1 and 10000
    and length(btrim(inquiry_type)) between 1 and 100
  );
drop policy if exists "contact_messages insert auth" on public.contact_messages;
create policy "contact_messages insert auth" on public.contact_messages
  for insert to authenticated
  with check (
    length(btrim(name)) between 1 and 200
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    and length(email) <= 320
    and length(btrim(subject)) between 1 and 300
    and length(btrim(message)) between 1 and 10000
    and length(btrim(inquiry_type)) between 1 and 100
  );
drop policy if exists "contact_messages update own" on public.contact_messages;
create policy "contact_messages update own" on public.contact_messages
  for update to authenticated
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "contact_messages delete own" on public.contact_messages;
create policy "contact_messages delete own" on public.contact_messages
  for delete to authenticated using (auth.uid() = owner_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1),
      ''
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- A remix copies the public schema but not triggers on auth.users, so the app calls this on sign-in as well.
create or replace function public.claim_site()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    return;
  end if;
  insert into public.profiles (id, full_name)
  select u.id, coalesce(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    ''
  )
  from auth.users u
  where u.id = me
  on conflict (id) do nothing;
  if me = (select id from public.profiles order by created_at asc limit 1) then
    update public.contact_messages set owner_id = me where owner_id is null;
  end if;
end;
$$;

revoke execute on function public.claim_site() from public, anon;
grant execute on function public.claim_site() to authenticated;

create view public.site_owner
with (security_invoker = true) as
select id as owner_id
from public.profiles
order by created_at asc
limit 1;

grant select on public.site_owner to anon, authenticated;
