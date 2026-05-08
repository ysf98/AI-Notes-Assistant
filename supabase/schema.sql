create extension if not exists pgcrypto;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_updated_at_idx on public.notes (updated_at desc);

alter table public.notes enable row level security;

drop policy if exists "Allow anon select notes" on public.notes;
drop policy if exists "Allow anon insert notes" on public.notes;
drop policy if exists "Allow anon update notes" on public.notes;
drop policy if exists "Allow anon delete notes" on public.notes;

create policy "Allow anon select notes"
on public.notes for select
to anon
using (true);

create policy "Allow anon insert notes"
on public.notes for insert
to anon
with check (true);

create policy "Allow anon update notes"
on public.notes for update
to anon
using (true)
with check (true);

create policy "Allow anon delete notes"
on public.notes for delete
to anon
using (true);
