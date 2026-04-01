import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const root = document.getElementById('blog-posts-root');
const statusEl = document.getElementById('blog-posts-status');

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function groupByYear(rows) {
  const map = new Map();
  for (const row of rows) {
    const y = new Date(row.created_at).getFullYear();
    if (!map.has(y)) map.set(y, []);
    map.get(y).push(row);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]);
}

async function load() {
  if (!root) return;
  if (SUPABASE_ANON_KEY.includes('BU_YERGA') || SUPABASE_URL.includes('YOUR_')) {
    statusEl.textContent =
      'Supabase sozlanmagan: assets/js/supabase-config.js da URL va anon kalitni kiriting.';
    return;
  }

  statusEl.textContent = 'Yuklanmoqda…';
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data, error } = await supabase
    .from('posts')
    .select('id,title,slug,excerpt,created_at,cover_image_url')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    statusEl.textContent = 'Xatolik: ' + error.message;
    return;
  }

  statusEl.textContent = '';
  root.innerHTML = '';

  if (!data || data.length === 0) {
    statusEl.textContent = 'Hozircha chop etilgan postlar yo‘q. Admin paneldan qo‘shing.';
    return;
  }

  for (const [year, posts] of groupByYear(data)) {
    const yearH = document.createElement('h4');
    yearH.className = 'sticky about__subtitle';
    yearH.textContent = String(year);
    root.appendChild(yearH);

    for (const post of posts) {
      const a = document.createElement('a');
      a.href = 'blog-post.html?slug=' + encodeURIComponent(post.slug);
      a.className = 'itne-about-my about__subtitle';

      const row = document.createElement('div');
      row.className = 'blog-list__row';

      if (post.cover_image_url) {
        const thumb = document.createElement('img');
        thumb.className = 'blog-list__thumb';
        thumb.src = post.cover_image_url;
        thumb.alt = '';
        thumb.loading = 'lazy';
        row.appendChild(thumb);
      }

      const inner = document.createElement('div');
      inner.className = 'w-100 blog-list__text';

      const h2 = document.createElement('h2');
      h2.className = 'about__subtitle blog-list__title';
      h2.textContent = post.title;

      const dateP = document.createElement('p');
      dateP.className = 'about__text blog-list__meta';
      dateP.textContent = formatDate(post.created_at);

      const p = document.createElement('p');
      p.className = 'about__text';
      p.textContent = post.excerpt || '';

      inner.appendChild(h2);
      inner.appendChild(dateP);
      if (p.textContent) inner.appendChild(p);
      row.appendChild(inner);
      a.appendChild(row);
      root.appendChild(a);
    }
  }
}

load();
