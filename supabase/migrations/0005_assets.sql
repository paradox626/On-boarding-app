-- IT assets and assignment history.

create type public.asset_status as enum ('available', 'assigned', 'in_repair', 'retired');

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  asset_tag text not null unique,
  name text not null,
  category text,
  manufacturer text,
  model text,
  serial_number text,
  purchase_date date,
  status public.asset_status not null default 'available',
  assigned_to uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assets_assigned_idx on public.assets(assigned_to);
create index assets_status_idx on public.assets(status);

create table public.asset_assignments (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  assigned_to uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  returned_at timestamptz,
  notes text
);

create index asset_assignments_asset_idx on public.asset_assignments(asset_id);

alter table public.assets enable row level security;
alter table public.asset_assignments enable row level security;

create policy "assets_read"
  on public.assets for select
  using (assigned_to = auth.uid() or public.is_staff());

create policy "assets_write_staff"
  on public.assets for all
  using (public.is_staff()) with check (public.is_staff());

create policy "asset_assignments_read"
  on public.asset_assignments for select
  using (assigned_to = auth.uid() or public.is_staff());

create policy "asset_assignments_write_staff"
  on public.asset_assignments for all
  using (public.is_staff()) with check (public.is_staff());
