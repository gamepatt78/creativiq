# MySivi AI Ad Intelligence Dashboard

A React and Tailwind dashboard for reviewing AI-analyzed Meta advertisements stored in Supabase.

The application does not create, modify, or delete advertisement records. It only reads `public.advertisement_analysis` for authenticated users.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local`:

   ```text
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
   ```

3. Start the dashboard:

   ```bash
   npm run dev
   ```

4. Open the local URL shown by Vite.

## Supabase configuration

Enable Email authentication in Supabase Authentication settings and create dashboard users manually or through an approved provisioning process.

Keep Row Level Security enabled on `advertisement_analysis`. Create an authenticated read policy for authorized accounts:

```sql
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

create policy "Users can read their own dashboard access"
on public.dashboard_access
for select
to authenticated
using (user_id = auth.uid());

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
```

This example requires a `public.dashboard_access` table containing `user_id uuid` and `enabled boolean`. It intentionally restricts access rather than allowing every authenticated account.

If you prefer not to add the access table, create a temporary policy with only authenticated users:

```sql
create policy "Authenticated users can read advertisement analysis"
on public.advertisement_analysis
for select
to authenticated
using (true);
```

The restricted policy is recommended for a private commercial dashboard. Never grant insert, update, or delete access to the dashboard role.

The dashboard uses only `VITE_SUPABASE_ANON_KEY` or an equivalent publishable key. Never put a Supabase service-role key in frontend environment variables.

## Features

- Overview KPIs and score distributions
- Searchable and sortable advertisement explorer
- Platform and AI score filtering
- Advertisement detail analysis
- Two-advertisement creative comparison
- Derived AI insights and date trends
- Loading, empty, and database error states
- Supabase email/password authentication
- Protected routes
- Light and dark modes
- Responsive desktop, tablet, and mobile layouts

## Data behavior

The dashboard reads `public.advertisement_analysis` and normalizes missing or malformed JSON fields at render time. AI creative scores are clearly labeled and are not presented as ad delivery, revenue, CTR, impressions, conversion, or ROAS metrics.

No performance metrics are fabricated. The score is out of 60 unless a record provides another positive `maximum_score`.

## Build

```bash
npm run build
npm run preview
```
