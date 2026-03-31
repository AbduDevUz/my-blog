import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const titleEl = document.getElementById('post-title');
const dateEl = document.getElementById('post-date');
const bodyEl = document.getElementById('post-body');
const statusEl = document.getElementById('post-status');
const coverWrap = document.getElementById('post-cover-wrap');
const coverImg = document.getElementById('post-cover');
const metaDesc = document.getElementById('meta-desc');

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function load() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    if (statusEl) statusEl.textContent = 'slug parametri yo‘q (?slug=...).';
    return;
  }

  if (SUPABASE_ANON_KEY.includes('BU_YERGA') || SUPABASE_URL.includes('YOUR_')) {
    if (statusEl) statusEl.textContent = 'supabase-config.js ni to‘ldiring.';
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('posts')
    .select('title,body,excerpt,created_at,cover_image_url')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    if (statusEl) statusEl.textContent = error.message;
    return;
  }

  if (!data) {
    if (statusEl) statusEl.textContent = 'Post topilmadi yoki hali chop etilmagan.';
    document.title = 'Topilmadi | Blog';
    if (metaDesc) metaDesc.setAttribute('content', 'Post topilmadi.');
    return;
  }

  const desc = (data.excerpt || data.title || '').slice(0, 160);
  document.title = data.title + ' | Blog';
  if (metaDesc) metaDesc.setAttribute('content', desc);

  if (titleEl) titleEl.textContent = data.title;
  if (dateEl) dateEl.textContent = formatDate(data.created_at);
  if (bodyEl) {
    bodyEl.textContent = data.body || '';
    bodyEl.style.whiteSpace = 'pre-wrap';
  }

  if (data.cover_image_url && coverWrap && coverImg) {
    coverImg.src = data.cover_image_url;
    coverImg.alt = data.title || 'Post rasmi';
    coverWrap.hidden = false;
  } else if (coverWrap) {
    coverWrap.hidden = true;
    coverImg.removeAttribute('src');
  }

  if (statusEl) statusEl.textContent = '';
}

load();
