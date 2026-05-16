-- Live chat helpdesk: sessions between a user and an agent.

create type public.chat_status as enum ('waiting', 'active', 'closed');

create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid references public.profiles(id) on delete set null,
  subject text,
  status public.chat_status not null default 'waiting',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index chat_sessions_user_idx on public.chat_sessions(user_id);
create index chat_sessions_agent_idx on public.chat_sessions(agent_id);
create index chat_sessions_status_idx on public.chat_sessions(status);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages(session_id);

alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

create policy "chat_sessions_read"
  on public.chat_sessions for select
  using (user_id = auth.uid() or agent_id = auth.uid() or public.is_staff());

create policy "chat_sessions_insert"
  on public.chat_sessions for insert
  with check (user_id = auth.uid());

create policy "chat_sessions_update_staff"
  on public.chat_sessions for update
  using (public.is_staff()) with check (public.is_staff());

create policy "chat_messages_read"
  on public.chat_messages for select
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id
        and (s.user_id = auth.uid() or s.agent_id = auth.uid() or public.is_staff())
    )
  );

create policy "chat_messages_insert"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chat_sessions s
      where s.id = session_id
        and (s.user_id = auth.uid() or s.agent_id = auth.uid() or public.is_staff())
    )
  );

-- Enable Realtime for the chat tables so the UI receives live updates.
alter publication supabase_realtime add table public.chat_messages;
alter publication supabase_realtime add table public.chat_sessions;
