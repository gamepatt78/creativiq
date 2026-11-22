-- Run manually in the Supabase SQL editor.
-- Keep RLS enabled. This example restricts reads to explicitly enabled dashboard users.

alter table public.advertisement_analysis enable row level security;

create table if not exists public.dashboard_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.dashboard_access enable row level security;

grant usage on schema public to authenticated;
grant select on table public.advertisement_analysis to authenticated;
grant select on table public.dashboard_access to authenticated;

drop policy if exists "Users can read their own dashboard access" on public.dashboard_access;
create policy "Users can read their own dashboard access"
on public.dashboard_access
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Authorized users can read advertisement analysis" on public.advertisement_analysis;

create policy "Authorized users can read advertisement analysis"
on public.advertisement_analysis
for select
to authenticated
using (
  exists (
    select 1
    from public.dashboard_access
    where dashboard_access.user_id = auth.uid()
      and dashboard_access.enabled = true
  )
);
