-- Bir marta: SQL Editor → Run (oldingi schema allaqachon ishlagan bo‘lsa ham xavfsiz)

-- 1) Postda rasm URL
alter table public.posts add column if not exists cover_image_url text;

-- 2) Storage bucket (ochiq o‘qish — blog rasmlari uchun)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 3) Storage RLS
drop policy if exists "Public read blog images" on storage.objects;
create policy "Public read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "Authenticated insert blog images" on storage.objects;
create policy "Authenticated insert blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated update blog images" on storage.objects;
create policy "Authenticated update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');

drop policy if exists "Authenticated delete blog images" on storage.objects;
create policy "Authenticated delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');
