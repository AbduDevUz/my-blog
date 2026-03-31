-- "Bucket not found" → bu bucket loyihada yo‘q.
-- Avval DASHBOARD orqali yarating (tavsiya), yoki SQL (pastda).

-- === VARIANT A (eng ishonchli) ===
-- 1) Supabase → Storage
-- 2) "New bucket"
-- 3) Name: blog-images  (faqat shu, kichik harf, tire)
-- 4) "Public bucket" yoqilgan bo‘lsin
-- 5) Create

-- === VARIANT B (SQL) — A ishlamasa yoki bucket yo‘q bo‘lsa ===
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;
