-- Supabase → SQL Editor → New query → bu faylning hammasini joylashtirib RUN qiling.

-- 1) Jadval
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null default '',
  cover_image_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_slug_idx on public.posts (slug);
create index if not exists posts_published_created_idx on public.posts (published, created_at desc);

-- 2) updated_at avtomatik
create or replace function public.set_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row
  execute function public.set_posts_updated_at();

-- 3) RLS
alter table public.posts enable row level security;

-- Hamma chop etilgan postlarni o‘qiy oladi (sayt uchun)
drop policy if exists "Public read published posts" on public.posts;
create policy "Public read published posts"
  on public.posts for select
  to anon, authenticated
  using (published = true);

-- Kirgan foydalanuvchi barcha qatorlarni ko‘radi (draftlar admin uchun)
drop policy if exists "Authenticated read all posts" on public.posts;
create policy "Authenticated read all posts"
  on public.posts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated insert posts" on public.posts;
create policy "Authenticated insert posts"
  on public.posts for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update posts" on public.posts;
create policy "Authenticated update posts"
  on public.posts for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated delete posts" on public.posts;
create policy "Authenticated delete posts"
  on public.posts for delete
  to authenticated
  using (true);

-- (ixtiyoriy) Birinchi post — keyin admindan ham yozasiz
-- insert into public.posts (title, slug, excerpt, body, published) values
-- (
--   'Men dasturiy ta''minot muhandisi bo''lish sayohatim',
--   'dasturiy-taminot-muhandisi-sayohat',
--   'Qisqa tavsif shu yerda.',
--   'To''liq matn...',
--   true
-- );
