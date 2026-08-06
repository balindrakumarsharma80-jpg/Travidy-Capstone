create extension if not exists vector;

create table rag_documents (
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references destinations(id) on delete cascade,
  source_type text,
  source_url text,
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index on rag_documents
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

alter table rag_documents enable row level security;

create policy "Public read rag_documents"
on rag_documents
for select
using (true);