-- Contact formadan kelgan xabarlar (Telegram bo‘lmasa ham saqlanadi).
-- SQL Editor da 1 marta RUN.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint contact_messages_name_len check (char_length(name) between 1 and 120),
  constraint contact_messages_email_len check (char_length(email) between 3 and 254),
  constraint contact_messages_body_len check (char_length(body) between 1 and 8000)
);

create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- Sayt: har kim xabar yubora oladi (anon kalit bilan)
drop policy if exists "Anyone insert contact_messages" on public.contact_messages;
create policy "Anyone insert contact_messages"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

-- O‘qish va o‘chirish — faqat kirgan admin
drop policy if exists "Authenticated read contact_messages" on public.contact_messages;
create policy "Authenticated read contact_messages"
  on public.contact_messages for select
  to authenticated
  using (true);

drop policy if exists "Authenticated delete contact_messages" on public.contact_messages;
create policy "Authenticated delete contact_messages"
  on public.contact_messages for delete
  to authenticated
  using (true);
