-- ============================================================
-- Travidy Backend: Remaining schema and infrastructure
-- ============================================================


-- ============================================================
-- 1. New tables
-- ============================================================

-- Private personal travel journal
create table trip_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  trip_id uuid references trips(id) on delete set null,
  destination_id uuid references destinations(id) on delete cascade,
  poi_id uuid references pois(id) on delete set null,
  title text,
  body text,
  media_urls text[],
  status text default 'active'
    check (status in ('active', 'removed')),
  created_at timestamptz default now()
);


-- Trip check-ins
create table trip_checkins (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  poi_id uuid references pois(id) on delete set null,
  lat numeric,
  lng numeric,
  checked_in_at timestamptz default now()
);


-- System-generated trip alerts
create table trip_alerts (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade,
  type text,
  message text,
  triggered_at timestamptz default now(),
  read boolean default false
);


-- Agent execution/audit log
create table agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  trip_id uuid references trips(id) on delete set null,
  agent_type text,
  input text,
  output text,
  tools_used jsonb,
  created_at timestamptz default now()
);


-- Web search cache
create table web_search_cache (
  id uuid primary key default gen_random_uuid(),
  query_hash text unique not null,
  query_text text,
  results jsonb,
  source text,
  fetched_at timestamptz default now(),
  expires_at timestamptz
);


-- ============================================================
-- 2. Freshness tracking on existing reference tables
-- ============================================================

alter table destinations
  add column updated_at timestamptz default now();

alter table pois
  add column updated_at timestamptz default now(),
  add column last_verified_at timestamptz;

alter table hotels
  add column updated_at timestamptz default now(),
  add column last_verified_at timestamptz;

alter table activities
  add column updated_at timestamptz default now();

alter table transport_options
  add column updated_at timestamptz default now();


-- ============================================================
-- 3. Row Level Security
-- ============================================================

alter table trip_posts enable row level security;
alter table trip_checkins enable row level security;
alter table trip_alerts enable row level security;
alter table agent_runs enable row level security;


-- ------------------------------------------------------------
-- trip_posts
-- Owner-only access
-- ------------------------------------------------------------

create policy "Users manage own trip posts"
on trip_posts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- ------------------------------------------------------------
-- trip_checkins
-- Owner determined through trips.user_id
-- ------------------------------------------------------------

create policy "Users manage own trip checkins"
on trip_checkins
for all
using (
  exists (
    select 1
    from trips
    where trips.id = trip_checkins.trip_id
      and trips.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from trips
    where trips.id = trip_checkins.trip_id
      and trips.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- trip_alerts
-- User can read alerts belonging to their own trip.
-- System/service role creates alerts.
-- ------------------------------------------------------------

create policy "Users read own trip alerts"
on trip_alerts
for select
using (
  exists (
    select 1
    from trips
    where trips.id = trip_alerts.trip_id
      and trips.user_id = auth.uid()
  )
);


-- ------------------------------------------------------------
-- agent_runs
-- User can read their own agent runs.
-- Service role writes the audit records.
-- ------------------------------------------------------------

create policy "Users read own agent runs"
on agent_runs
for select
using (auth.uid() = user_id);


-- web_search_cache intentionally has no RLS.
-- It is backend/service-role infrastructure.


-- ============================================================
-- 4. Automatically create profile after signup
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);

  return new;
end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();


-- ============================================================
-- 5. Automatically maintain updated_at
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


create trigger set_destinations_updated_at
before update on destinations
for each row
execute function set_updated_at();


create trigger set_pois_updated_at
before update on pois
for each row
execute function set_updated_at();


create trigger set_hotels_updated_at
before update on hotels
for each row
execute function set_updated_at();


create trigger set_activities_updated_at
before update on activities
for each row
execute function set_updated_at();


create trigger set_transport_options_updated_at
before update on transport_options
for each row
execute function set_updated_at();


-- ============================================================
-- 6. RAG similarity search RPC
-- ============================================================

create or replace function match_rag_documents(
  query_embedding vector(1536),
  match_destination_id uuid default null,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  source_type text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    rag_documents.id,
    rag_documents.content,
    rag_documents.source_type,
    rag_documents.metadata,
    1 - (rag_documents.embedding <=> query_embedding) as similarity
  from rag_documents
  where match_destination_id is null
     or rag_documents.destination_id = match_destination_id
  order by rag_documents.embedding <=> query_embedding
  limit match_count;
$$;


-- ============================================================
-- 7. Replace IVFFlat with HNSW
-- ============================================================

drop index if exists rag_documents_embedding_idx;

create index if not exists rag_documents_embedding_hnsw_idx
on rag_documents
using hnsw (embedding vector_cosine_ops);


-- ============================================================
-- 8. Performance indexes
-- ============================================================

create index if not exists idx_trips_user_id
on trips(user_id);

create index if not exists idx_itinerary_items_trip_id
on itinerary_items(trip_id);

create index if not exists idx_chat_history_user_trip
on chat_history(user_id, trip_id);

create index if not exists idx_trip_posts_user_id
on trip_posts(user_id);

create index if not exists idx_trip_posts_destination_id
on trip_posts(destination_id);

create index if not exists idx_pois_destination_id
on pois(destination_id);

create index if not exists idx_hotels_destination_id
on hotels(destination_id);


-- ============================================================
-- 9. Supabase Storage: trip-media
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'trip-media',
  'trip-media',
  false,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm'
  ];


-- ============================================================
-- 10. Storage RLS
-- ============================================================

create policy "Users upload own trip media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'trip-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "Users read own trip media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'trip-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "Users update own trip media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'trip-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'trip-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "Users delete own trip media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'trip-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);