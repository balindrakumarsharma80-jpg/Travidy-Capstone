-- ============================================================
-- Travidy Backend Addendum
-- Migration: add_travidy_trip_features
-- ============================================================


-- ============================================================
-- 1. New tables
-- ============================================================

-- 1.1 Checklists
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  label text not null,
  done boolean default false,
  order_index int,
  created_at timestamptz default now()
);

alter table checklist_items enable row level security;


-- 1.2 Saved destinations
create table saved_destinations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  destination_id uuid references destinations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, destination_id)
);

alter table saved_destinations enable row level security;

create policy "Users manage own saved destinations"
on saved_destinations for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- 1.3 Trip collaborators
create table trip_collaborators (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'editor'
    check (role in ('viewer','editor')),
  invited_at timestamptz default now(),
  unique(trip_id, user_id)
);

alter table trip_collaborators enable row level security;

create policy "Trip owners manage collaborators"
on trip_collaborators for all
using (
  exists (
    select 1
    from trips
    where trips.id = trip_collaborators.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from trips
    where trips.id = trip_collaborators.trip_id
      and trips.user_id = auth.uid()
  )
);

create policy "Collaborators read their own trip's collaborator list"
on trip_collaborators for select
using (
  exists (
    select 1
    from trip_collaborators tc
    where tc.trip_id = trip_collaborators.trip_id
      and tc.user_id = auth.uid()
  )
);


-- ============================================================
-- 2. Alter existing tables
-- ============================================================

-- 2.1 trips
alter table trips
  add column title text,
  add column travellers int default 1,
  add column budget_amount numeric,
  add column spent_amount numeric default 0,
  add column share_token uuid default gen_random_uuid();


-- 2.2 itinerary_items
alter table itinerary_items
  add column place_name text,
  add column category text,
  add column price_label text,
  add column item_status text default 'planned'
    check (item_status in ('planned','done','skipped')),
  add column source text default 'manual'
    check (source in ('manual','agent'));


-- 2.3 profiles
alter table profiles
  add column budget_style text,
  add column preferred_language text default 'en',
  add column preferred_currency text default 'INR',
  add column notifications_enabled boolean default true;


-- 2.4 chat_history
alter table chat_history
  add column sources jsonb;


-- ============================================================
-- 3. RLS changes
-- ============================================================

-- 3.1 Trips
drop policy if exists "Users manage own trips" on trips;

create policy "Owner or collaborator access trip"
on trips for all
using (
  auth.uid() = user_id
  or exists (
    select 1
    from trip_collaborators
    where trip_collaborators.trip_id = trips.id
      and trip_collaborators.user_id = auth.uid()
  )
)
with check (auth.uid() = user_id);


-- 3.2 Itinerary items
drop policy if exists "Users manage own itinerary" on itinerary_items;

create policy "Owner or editor-collaborator manage itinerary"
on itinerary_items for all
using (
  exists (
    select 1
    from trips
    left join trip_collaborators tc
      on tc.trip_id = trips.id
      and tc.user_id = auth.uid()
    where trips.id = itinerary_items.trip_id
      and (
        trips.user_id = auth.uid()
        or tc.role = 'editor'
      )
  )
)
with check (
  exists (
    select 1
    from trips
    left join trip_collaborators tc
      on tc.trip_id = trips.id
      and tc.user_id = auth.uid()
    where trips.id = itinerary_items.trip_id
      and (
        trips.user_id = auth.uid()
        or tc.role = 'editor'
      )
  )
);


-- 3.3 Checklist items
create policy "Owner or editor-collaborator manage checklist"
on checklist_items for all
using (
  exists (
    select 1
    from trips
    left join trip_collaborators tc
      on tc.trip_id = trips.id
      and tc.user_id = auth.uid()
    where trips.id = checklist_items.trip_id
      and (
        trips.user_id = auth.uid()
        or tc.role = 'editor'
      )
  )
)
with check (
  exists (
    select 1
    from trips
    left join trip_collaborators tc
      on tc.trip_id = trips.id
      and tc.user_id = auth.uid()
    where trips.id = checklist_items.trip_id
      and (
        trips.user_id = auth.uid()
        or tc.role = 'editor'
      )
  )
);


-- NOTE:
-- trip_posts remains owner-only.
-- No collaborator policy is added to trip_posts.


-- ============================================================
-- 4. Shared read-only trip link
-- ============================================================

create or replace function get_shared_trip(p_share_token uuid)
returns table (
  trip_id uuid,
  title text,
  destination_id uuid,
  start_date date,
  end_date date,
  travellers int,
  itinerary jsonb
)
language sql
stable
security definer
as $$
  select
    trips.id,
    trips.title,
    trips.destination_id,
    trips.start_date,
    trips.end_date,
    trips.travellers,
    (
      select jsonb_agg(
        itinerary_items.*
        order by itinerary_items.day_number,
                 itinerary_items.order_index
      )
      from itinerary_items
      where itinerary_items.trip_id = trips.id
    ) as itinerary
  from trips
  where trips.share_token = p_share_token;
$$;


-- ============================================================
-- 5. New indexes
-- ============================================================

create index on trips(share_token);

create index on checklist_items(trip_id);

create index on saved_destinations(user_id);

create index on trip_collaborators(trip_id);

create index on trip_collaborators(user_id);