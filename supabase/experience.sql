-- Experience sahifasi uchun jadval + RLS + boshlang‘ich ma’lumotlar (1 marta Run).
-- Keyin qatorlarni Supabase → Table Editor dan tahrirlashingiz mumkin.

create table if not exists public.experience_items (
  id uuid primary key default gen_random_uuid(),
  sort_order int not null default 0,
  period_text text not null,
  period_is_current boolean not null default false,
  company_html text not null default '',
  job_title text not null default '',
  body_html text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists experience_items_sort_idx on public.experience_items (sort_order asc);

alter table public.experience_items enable row level security;

drop policy if exists "Public read experience_items" on public.experience_items;
create policy "Public read experience_items"
  on public.experience_items for select
  to anon, authenticated
  using (true);

drop policy if exists "Authenticated insert experience_items" on public.experience_items;
create policy "Authenticated insert experience_items"
  on public.experience_items for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated update experience_items" on public.experience_items;
create policy "Authenticated update experience_items"
  on public.experience_items for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated delete experience_items" on public.experience_items;
create policy "Authenticated delete experience_items"
  on public.experience_items for delete
  to authenticated
  using (true);

-- Hozirgi HTML dagi 3 ta yozuv (jadval bo‘sh bo‘lsa)
do $$
begin
  if not exists (select 1 from public.experience_items limit 1) then
    insert into public.experience_items (sort_order, period_text, period_is_current, company_html, job_title, body_html) values
    (
      1,
      '2023-September - Current',
      true,
      'Asakabank <a href="https://asakabank.uz/" target="_blank" rel="noopener noreferrer">asakabank.uz</a>',
      'Frontend developer, Chief specialist',
      'Department of Digital Technology Development, <br> Software Development Office, <br> Chief specialist'
    ),
    (
      2,
      '2020 - 2023-September',
      false,
      'WEB PRO SERVICE / <a href="https://goodone.uz/" target="_blank" rel="noopener noreferrer">goodone.uz</a>',
      'Frontend developer, TeamLead',
      'My custom web system CRM, ERP. KPI... <br> First of all, I work with companies and create websites, and in the last 2 years I work with ERP, CRM and system automation meditsinskih Dannyx,'
    ),
    (
      3,
      '2019 - 2020',
      false,
      'WEB PRO SERVICE  / <a href="https://goodone.uz/" target="_blank" rel="noopener noreferrer">goodone.uz</a>',
      'Верстальщик, Frontend',
      'Программирую различные сайты более 2 лет.'
    );
  end if;
end $$;
