create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  home_city text,
  travel_style text,
  created_at timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  destination_id uuid references destinations(id) on delete restrict,
  start_date date,
  end_date date,
  budget_tier text,
  status text default 'draft',
  created_at timestamptz default now()
);

create table itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  day_number int,
  poi_id uuid references pois(id),
  activity_id uuid references activities(id),
  start_time time,
  notes text,
  order_index int
);

create table chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references trips(id),
  role text check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz default now()
);

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references trips(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table trips enable row level security;
alter table itinerary_items enable row level security;
alter table chat_history enable row level security;
alter table feedback enable row level security;


create policy "Users manage own profile"
on profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users manage own trips"
on trips
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own chat"
on chat_history
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own feedback"
on feedback
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own itinerary"
on itinerary_items
for all
using (
  exists (
    select 1
    from trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from trips
    where trips.id = itinerary_items.trip_id
      and trips.user_id = auth.uid()
  )
);