-- SQL Editor → Run — qaysi bucket lar borligini ko‘rasiz.
-- «blog-images» qatori chiqmasa → Dashboard dan bucket yarating.

select id, name, public, file_size_limit
from storage.buckets
order by name;
