-- Storage 400: auth.uid() Storage kontekstida ba’zan NULL → policy rad qiladi.
-- SQL Editor → Run (barcha qator)

update storage.buckets
set allowed_mime_types = null,
    file_size_limit = 3145728,
    public = true
where id = 'blog-images';

drop policy if exists "Public read blog images" on storage.objects;
drop policy if exists "Authenticated insert blog images" on storage.objects;
drop policy if exists "Authenticated update blog images" on storage.objects;
drop policy if exists "Authenticated delete blog images" on storage.objects;
drop policy if exists "blog_images_public_read" on storage.objects;
drop policy if exists "blog_images_auth_insert" on storage.objects;
drop policy if exists "blog_images_auth_update" on storage.objects;
drop policy if exists "blog_images_auth_delete" on storage.objects;
drop policy if exists "blog_images_insert_authenticated" on storage.objects;
drop policy if exists "blog_images_update_authenticated" on storage.objects;
drop policy if exists "blog_images_delete_authenticated" on storage.objects;

-- O‘qish: hammaga (public bucket rasmlari)
create policy "blog_images_public_read"
  on storage.objects for select
  using (bucket_id = 'blog-images');

-- Yuklash: faqat JWT da role = authenticated (auth.uid() tekshiruvsiz)
create policy "blog_images_insert_authenticated"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images');

create policy "blog_images_update_authenticated"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');

create policy "blog_images_delete_authenticated"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images');
