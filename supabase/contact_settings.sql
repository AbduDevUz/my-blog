-- Contact sahifasi matni (bitta qator). SQL Editor da 1 marta RUN.
-- Intro matni oddiy matn; Telegram username alohida — havola brauzerda xavfsiz yig‘iladi.

create table if not exists public.contact_settings (
  id smallint primary key default 1,
  intro_text text not null default '',
  telegram_username text not null default 'tinch_dev',
  updated_at timestamptz not null default now(),
  constraint contact_settings_singleton check (id = 1)
);

create or replace function public.set_contact_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_settings_updated_at on public.contact_settings;
create trigger contact_settings_updated_at
  before update on public.contact_settings
  for each row
  execute function public.set_contact_settings_updated_at();

alter table public.contact_settings enable row level security;

drop policy if exists "Public read contact_settings" on public.contact_settings;
create policy "Public read contact_settings"
  on public.contact_settings for select
  to anon, authenticated
  using (id = 1);

drop policy if exists "Authenticated insert contact_settings" on public.contact_settings;
create policy "Authenticated insert contact_settings"
  on public.contact_settings for insert
  to authenticated
  with check (id = 1);

drop policy if exists "Authenticated update contact_settings" on public.contact_settings;
create policy "Authenticated update contact_settings"
  on public.contact_settings for update
  to authenticated
  using (id = 1)
  with check (id = 1);

insert into public.contact_settings (id, intro_text, telegram_username) values
(
  1,
  'Formani yuborsangiz, xabar avvalo sayt orqali saqlanadi; Telegram bo''lsa, yangi oynada ochiladi — u yerdan ham yozishingiz mumkin.',
  'tinch_dev'
)
on conflict (id) do nothing;
