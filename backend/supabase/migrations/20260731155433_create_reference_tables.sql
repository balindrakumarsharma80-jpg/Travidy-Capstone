create extension if not exists pgcrypto;
create table destinations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    state text,
    description text,
    best_season text,
    created_at timestamptz default now()
);

create table pois (
    id uuid primary key default gen_random_uuid(),
    destination_id uuid references destinations(id) on delete cascade,
    name text not null,
    category text,
    description text,
    lat numeric,
    lng numeric,
    entry_fee numeric,
    timings text,
    source_url text,
    created_at timestamptz default now()
);

create table hotels (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  name text not null,
  star_rating numeric,
  price_min numeric,
  price_max numeric,
  location_zone text,
  dist_from_station_km numeric,
  key_audience text,
  source text,
  created_at timestamptz default now()
);

create table transport_options (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  type text,
  route text,
  price_range text,
  notes text,
  created_at timestamptz default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  name text not null,
  price_min numeric,
  price_max numeric,
  rules text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table destinations enable row level security;
alter table pois enable row level security;
alter table hotels enable row level security;
alter table transport_options enable row level security;
alter table activities enable row level security;


create policy "Public read destinations"
on destinations
for select
using (true);

create policy "Public read pois"
on pois
for select
using (true);

create policy "Public read hotels"
on hotels
for select
using (true);

create policy "Public read transport"
on transport_options
for select
using (true);

create policy "Public read activities"
on activities
for select
using (true);