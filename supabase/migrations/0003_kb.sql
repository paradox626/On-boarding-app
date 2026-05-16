-- Knowledge base: categories and articles.

create table public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.kb_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.kb_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  body text not null,
  published boolean not null default false,
  author_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index kb_articles_category_idx on public.kb_articles(category_id);
create index kb_articles_published_idx on public.kb_articles(published);

alter table public.kb_categories enable row level security;
alter table public.kb_articles enable row level security;

create policy "kb_categories_read_all" on public.kb_categories for select using (true);
create policy "kb_categories_write_staff" on public.kb_categories for all
  using (public.is_staff()) with check (public.is_staff());

create policy "kb_articles_read_published"
  on public.kb_articles for select
  using (published or public.is_staff());

create policy "kb_articles_write_staff"
  on public.kb_articles for all
  using (public.is_staff()) with check (public.is_staff());
