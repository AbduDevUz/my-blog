-- Agar rasm yuklashda 400 (Bad Request) chiqsa — bucket MIME ro‘yxati juda qat’iy bo‘lishi mumkin.
-- SQL Editor → Run

-- Barcha turlarga ruxsat (yoki Dashboard → Storage → blog-images → Configuration)
update storage.buckets
set allowed_mime_types = null
where id = 'blog-images';

-- Limit va ochiq o‘qishni saqlab qolish (ixtiyoriy)
update storage.buckets
set file_size_limit = 3145728,
    public = true
where id = 'blog-images';
