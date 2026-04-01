import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_STORAGE_BUCKET } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listEl = document.getElementById('posts-list');
const form = document.getElementById('post-form');
const errEl = document.getElementById('dash-error');
const editingIdInput = document.getElementById('editing-id');
const coverExisting = document.getElementById('cover-url-existing');
const coverFile = document.getElementById('cover-file');
const coverPreviewWrap = document.getElementById('cover-preview-wrap');
const coverPreview = document.getElementById('cover-preview');
const removeCover = document.getElementById('remove-cover');
const removeCoverLabel = document.getElementById('remove-cover-label');
const bucketHintEl = document.getElementById('bucket-hint');

function showBucketMissingHint() {
  if (!bucketHintEl) return;
  bucketHintEl.hidden = false;
  bucketHintEl.style.whiteSpace = 'pre-wrap';
  bucketHintEl.textContent =
    'Storage: «Bucket not found» — loyihada «' +
    SUPABASE_STORAGE_BUCKET +
    '» bucket yo‘q yoki nom noto‘g‘ri.\n\n' +
    'QILISH KERAK:\n' +
    '1) Supabase → chap menyu STORAGE (vedro ikonka), «New bucket».\n' +
    '2) Name maydoniga aynan yozing: ' +
    SUPABASE_STORAGE_BUCKET +
    ' (boshqa yozuv emas).\n' +
    '3) «Public bucket» ni yoqing → Create.\n' +
    '4) SQL Editor da «select id, name from storage.buckets;» ishlating — ro‘yxatda id ko‘rinishi kerak.\n' +
    '5) Keyin storage_rls_fix.sql ni Run qiling.\n\n' +
    'Agar bucket boshqa nomda bo‘lsa: supabase-config.js da SUPABASE_STORAGE_BUCKET ni o‘sha nomga o‘zgartiring.';
}

async function probeStorageBucket() {
  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).list('', { limit: 1 });
  if (!error) return;
  const m = (error.message || '').toLowerCase();
  if (m.includes('bucket') && m.includes('not found')) {
    showBucketMissingHint();
  }
}

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const EXT_TO_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
};
const MIME_ALIASES = {
  'image/x-png': 'image/png',
  'image/jpg': 'image/jpeg',
  'image/pjpeg': 'image/jpeg',
};

/** Windows / brauzer ba’zan file.type ni bo‘sh qoldiradi — Supabase bo‘sh content-type bilan 400 qaytaradi */
function resolveImageContentType(file) {
  let t = (file.type || '').trim().toLowerCase();
  if (MIME_ALIASES[t]) t = MIME_ALIASES[t];
  if (t && ALLOWED_IMAGE_TYPES.includes(t)) return t;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return EXT_TO_MIME[ext] || '';
}

function isAllowedImageFile(file) {
  const t = resolveImageContentType(file);
  return !!t;
}

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function setCoverPreviewFromUrl(url) {
  if (url) {
    coverPreview.src = url;
    coverPreviewWrap.hidden = false;
    removeCoverLabel.hidden = false;
    removeCover.checked = false;
  } else {
    coverPreview.removeAttribute('src');
    coverPreviewWrap.hidden = true;
    removeCoverLabel.hidden = true;
    removeCover.checked = false;
  }
}

function resetCoverUi() {
  coverExisting.value = '';
  if (coverFile) coverFile.value = '';
  setCoverPreviewFromUrl('');
}

coverFile?.addEventListener('change', () => {
  const file = coverFile.files?.[0];
  if (!file) return;
  if (file.size > MAX_IMAGE_BYTES) {
    errEl.hidden = false;
    errEl.textContent = 'Rasm 3 MB dan katta bo‘lmasligi kerak.';
    coverFile.value = '';
    return;
  }
  if (!isAllowedImageFile(file)) {
    errEl.hidden = false;
    errEl.textContent = 'Faqat JPG, PNG, WebP yoki GIF (.jpg, .png, .webp, .gif).';
    coverFile.value = '';
    return;
  }
  errEl.textContent = '';
  errEl.hidden = true;
  removeCover.checked = false;
  const r = new FileReader();
  r.onload = () => {
    coverPreview.src = r.result;
    coverPreviewWrap.hidden = false;
  };
  r.readAsDataURL(file);
});

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

async function uploadCover(session, file) {
  if (!file.size) {
    return { error: new Error('Fayl bo‘sh.') };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: new Error('Rasm 3 MB dan oshmasin.') };
  }
  const contentType = resolveImageContentType(file);
  if (!contentType) {
    return { error: new Error('Ruxsat etilgan formatlar: JPG, PNG, WebP, GIF.') };
  }
  await supabase.auth.refreshSession();

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const safeExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? (ext === 'jpg' ? 'jpeg' : ext) : 'png';
  const path = `${session.user.id}/${Date.now()}-cover.${safeExt}`;
  const buf = await file.arrayBuffer();
  const blob = new Blob([buf], { type: contentType });

  const { error } = await supabase.storage.from(SUPABASE_STORAGE_BUCKET).upload(path, blob, {
    cacheControl: '3600',
    upsert: true,
    contentType,
  });
  if (error) {
    const msg = [error.message, error.statusCode, error.error].filter(Boolean).join(' | ');
    if ((msg || '').toLowerCase().includes('bucket') && (msg || '').toLowerCase().includes('not found')) {
      showBucketMissingHint();
    }
    return { error: new Error(msg || 'Yuklash xatosi') };
  }
  const { data: pub } = supabase.storage.from(SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
  return { publicUrl: pub.publicUrl };
}

async function loadList() {
  listEl.innerHTML = '<p class="admin-hint">Yuklanmoqda…</p>';
  const { data, error } = await supabase
    .from('posts')
    .select('id,title,slug,published,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    listEl.innerHTML = '';
    const p = document.createElement('p');
    p.className = 'admin-alert admin-alert--error';
    p.textContent = error.message;
    listEl.appendChild(p);
    return;
  }

  listEl.innerHTML = '';
  if (!data.length) {
    const p = document.createElement('p');
    p.className = 'admin-hint';
    p.textContent = 'Postlar yo‘q.';
    listEl.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-data-table';
  table.innerHTML =
    '<thead><tr><th>Sarlavha</th><th>Slug</th><th>Chop etilgan</th><th></th></tr></thead><tbody></tbody>';
  const tbody = table.querySelector('tbody');

  for (const row of data) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td></td><td><code></code></td><td></td><td class="admin-data-table__actions"></td>';
    tr.cells[0].textContent = row.title;
    tr.cells[1].querySelector('code').textContent = row.slug;
    tr.cells[2].textContent = row.published ? 'Ha' : 'Yo‘q';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'admin-btn admin-btn--ghost admin-btn--sm';
    editBtn.textContent = 'Tahrir';
    editBtn.addEventListener('click', () => {
      editingIdInput.value = row.id;
      form.title.value = row.title;
      form.slug.value = row.slug;
      form.excerpt.value = '';
      form.body.value = '';
      form.published.checked = row.published;
      coverFile.value = '';
      supabase
        .from('posts')
        .select('excerpt,body,cover_image_url')
        .eq('id', row.id)
        .single()
        .then(({ data: full, error: e2 }) => {
          if (!e2 && full) {
            form.excerpt.value = full.excerpt || '';
            form.body.value = full.body || '';
            const u = full.cover_image_url || '';
            coverExisting.value = u;
            setCoverPreviewFromUrl(u);
          }
        });
      form.title.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-btn admin-btn--danger admin-btn--sm';
    delBtn.textContent = 'O‘chirish';
    delBtn.addEventListener('click', async () => {
      if (!confirm('O‘chirilsinmi?')) return;
      const { error: delErr } = await supabase.from('posts').delete().eq('id', row.id);
      if (delErr) {
        alert(delErr.message);
        return;
      }
      if (editingIdInput.value === row.id) {
        form.reset();
        editingIdInput.value = '';
        resetCoverUi();
      }
      loadList();
    });

    tr.cells[3].append(editBtn, delBtn);
    tbody.appendChild(tr);
  }

  listEl.appendChild(table);
}

form?.title?.addEventListener('blur', () => {
  if (!form.slug.value.trim() && form.title.value.trim()) {
    form.slug.value = slugify(form.title.value);
  }
});

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  errEl.hidden = true;

  const session = await requireAuth();
  if (!session) return;

  let cover_image_url = coverExisting.value.trim() || null;

  if (removeCover.checked) {
    cover_image_url = null;
  }

  const file = coverFile?.files?.[0];
  if (file) {
    const up = await uploadCover(session, file);
    if (up.error) {
      errEl.hidden = false;
      errEl.textContent = up.error.message;
      return;
    }
    cover_image_url = up.publicUrl;
  }

  const payload = {
    title: form.title.value.trim(),
    slug: form.slug.value.trim() || slugify(form.title.value),
    excerpt: form.excerpt.value.trim() || null,
    body: form.body.value,
    published: form.published.checked,
    cover_image_url,
  };

  if (!payload.title || !payload.slug) {
    errEl.hidden = false;
    errEl.textContent = 'Sarlavha va slug majburiy.';
    return;
  }

  const id = editingIdInput.value;

  if (id) {
    const { error } = await supabase.from('posts').update(payload).eq('id', id);
    if (error) {
      errEl.hidden = false;
      errEl.textContent = error.message;
      return;
    }
  } else {
    const { error } = await supabase.from('posts').insert(payload);
    if (error) {
      errEl.hidden = false;
      errEl.textContent = error.message;
      return;
    }
  }

  form.reset();
  editingIdInput.value = '';
  resetCoverUi();
  loadList();
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

document.getElementById('new-post-btn')?.addEventListener('click', () => {
  form.reset();
  editingIdInput.value = '';
  resetCoverUi();
  form.title.focus();
});

(async () => {
  if (SUPABASE_ANON_KEY.includes('BU_YERGA')) {
    errEl.hidden = false;
    errEl.textContent = 'supabase-config.js da anon kalitni kiriting.';
    return;
  }
  const session = await requireAuth();
  if (session) {
    await probeStorageBucket();
    await loadList();
  }
})();
