create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique, name text not null, password_hash text not null,
  created_at timestamptz default now());
create table if not exists sessions (
  token_hash text primary key,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null);
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  name text not null, destination text default '',
  start_date date, end_date date, emoji text default '✈️',
  created_at timestamptz default now());
alter table trips add column if not exists user_id uuid references users(id) on delete cascade;
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  day int default 0, time text default '', title text not null,
  done boolean default false, created_at timestamptz default now());
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  kind text not null check (kind in ('doc','photo')),
  category text default 'Other', name text not null, mime text, size bigint,
  url text not null, caption text default '', created_at timestamptz default now());
create index if not exists trips_user on trips(user_id);
create index if not exists items_trip on items(trip_id);
create index if not exists files_trip on files(trip_id);
