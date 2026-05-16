-- Support tickets and comments.

create type public.ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  description text not null,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'medium',
  category text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_created_by_idx on public.tickets(created_by);
create index tickets_assigned_to_idx on public.tickets(assigned_to);
create index tickets_status_idx on public.tickets(status);

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index ticket_comments_ticket_idx on public.ticket_comments(ticket_id);

alter table public.tickets enable row level security;
alter table public.ticket_comments enable row level security;

-- Ticket policies: users see their own; staff see all.
create policy "tickets_read"
  on public.tickets for select
  using (created_by = auth.uid() or public.is_staff());

create policy "tickets_insert"
  on public.tickets for insert
  with check (created_by = auth.uid());

create policy "tickets_update_owner"
  on public.tickets for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "tickets_update_staff"
  on public.tickets for update
  using (public.is_staff())
  with check (public.is_staff());

create policy "tickets_delete_admin"
  on public.tickets for delete
  using (public.is_admin());

-- Comment policies. Internal comments are staff-only.
create policy "comments_read"
  on public.ticket_comments for select
  using (
    (not is_internal and (
      exists (select 1 from public.tickets t where t.id = ticket_id and t.created_by = auth.uid())
      or public.is_staff()
    ))
    or (is_internal and public.is_staff())
  );

create policy "comments_insert"
  on public.ticket_comments for insert
  with check (
    author_id = auth.uid()
    and (
      exists (select 1 from public.tickets t where t.id = ticket_id and t.created_by = auth.uid())
      or public.is_staff()
    )
  );

create or replace function public.touch_ticket_updated_at()
returns trigger language plpgsql as $$
begin
  update public.tickets set updated_at = now() where id = new.ticket_id;
  return new;
end;
$$;

create trigger ticket_comments_touch
  after insert on public.ticket_comments
  for each row execute function public.touch_ticket_updated_at();
