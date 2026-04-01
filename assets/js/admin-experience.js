import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listEl = document.getElementById('exp-list');
const form = document.getElementById('exp-form');
const errEl = document.getElementById('exp-error');
const editingIdInput = document.getElementById('exp-editing-id');
const sortInput = document.getElementById('exp-sort');
const periodInput = document.getElementById('exp-period');
const currentInput = document.getElementById('exp-current');
const companyInput = document.getElementById('exp-company');
const titleInput = document.getElementById('exp-title');
const bodyInput = document.getElementById('exp-body');

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function stripHtml(s) {
  const d = document.createElement('div');
  d.innerHTML = s || '';
  const t = (d.textContent || '').trim();
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

async function loadList() {
  listEl.innerHTML = '<p class="admin-hint">Yuklanmoqda…</p>';
  const { data, error } = await supabase
    .from('experience_items')
    .select('id,sort_order,period_text,period_is_current,company_html,job_title,body_html')
    .order('sort_order', { ascending: true });

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
    p.textContent = 'Qatorlar yo‘q.';
    listEl.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-data-table';
  table.innerHTML =
    '<thead><tr><th>#</th><th>Davr</th><th>Joriy</th><th>Lavozim</th><th>Kompaniya</th><th></th></tr></thead><tbody></tbody>';
  const tbody = table.querySelector('tbody');

  for (const row of data) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td></td><td></td><td></td><td></td><td></td><td class="admin-data-table__actions"></td>';
    tr.cells[0].textContent = String(row.sort_order ?? '');
    tr.cells[1].textContent = row.period_text || '';
    tr.cells[2].textContent = row.period_is_current ? 'Ha' : 'Yo‘q';
    tr.cells[3].textContent = row.job_title || '';
    tr.cells[4].textContent = stripHtml(row.company_html) || '—';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'admin-btn admin-btn--ghost admin-btn--sm';
    editBtn.textContent = 'Tahrir';
    editBtn.addEventListener('click', () => {
      editingIdInput.value = row.id;
      sortInput.value = row.sort_order ?? 0;
      periodInput.value = row.period_text || '';
      currentInput.checked = !!row.period_is_current;
      companyInput.value = row.company_html || '';
      titleInput.value = row.job_title || '';
      bodyInput.value = row.body_html || '';
      periodInput.focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-btn admin-btn--danger admin-btn--sm';
    delBtn.textContent = 'O‘chirish';
    delBtn.addEventListener('click', async () => {
      if (!confirm('O‘chirilsinmi?')) return;
      const { error: delErr } = await supabase.from('experience_items').delete().eq('id', row.id);
      if (delErr) {
        alert(delErr.message);
        return;
      }
      if (editingIdInput.value === row.id) {
        resetForm();
      }
      loadList();
    });

    tr.cells[5].append(editBtn, delBtn);
    tbody.appendChild(tr);
  }

  listEl.appendChild(table);
}

function resetForm() {
  form.reset();
  editingIdInput.value = '';
  sortInput.value = '1';
  currentInput.checked = false;
  errEl.textContent = '';
  errEl.hidden = true;
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  errEl.hidden = true;

  const session = await requireAuth();
  if (!session) return;

  const sort_order = Number.parseInt(String(sortInput.value), 10);
  const payload = {
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
    period_text: periodInput.value.trim(),
    period_is_current: currentInput.checked,
    company_html: companyInput.value,
    job_title: titleInput.value.trim(),
    body_html: bodyInput.value,
  };

  if (!payload.period_text) {
    errEl.hidden = false;
    errEl.textContent = 'Davr matni majburiy.';
    return;
  }
  if (!payload.job_title) {
    errEl.hidden = false;
    errEl.textContent = 'Lavozim majburiy.';
    return;
  }

  const id = editingIdInput.value;

  if (id) {
    const { error } = await supabase.from('experience_items').update(payload).eq('id', id);
    if (error) {
      errEl.hidden = false;
      errEl.textContent = error.message;
      return;
    }
  } else {
    const { error } = await supabase.from('experience_items').insert(payload);
    if (error) {
      errEl.hidden = false;
      errEl.textContent = error.message;
      return;
    }
  }

  resetForm();
  loadList();
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

document.getElementById('new-exp-btn')?.addEventListener('click', () => {
  resetForm();
  periodInput.focus();
});

(async () => {
  if (SUPABASE_ANON_KEY.includes('BU_YERGA')) {
    errEl.hidden = false;
    errEl.textContent = 'supabase-config.js da anon kalitni kiriting.';
    return;
  }
  const session = await requireAuth();
  if (session) {
    await loadList();
  }
})();
