import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const listEl = document.getElementById('messages-list');
const errEl = document.getElementById('messages-error');

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

async function loadList() {
  listEl.innerHTML = '<p class="admin-hint">Yuklanmoqda…</p>';
  errEl.hidden = true;
  errEl.textContent = '';

  const { data, error } = await supabase
    .from('contact_messages')
    .select('id,name,email,body,created_at')
    .order('created_at', { ascending: false });

  if (error) {
    listEl.innerHTML = '';
    errEl.hidden = false;
    errEl.textContent = error.message + ' — contact_messages.sql ni ishlatganingizni tekshiring.';
    return;
  }

  listEl.innerHTML = '';
  if (!data.length) {
    const p = document.createElement('p');
    p.className = 'admin-hint';
    p.textContent = 'Hali xabar yo‘q.';
    listEl.appendChild(p);
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-data-table';
  table.innerHTML =
    '<thead><tr><th>Sana</th><th>Ism</th><th>Email</th><th>Xabar</th><th></th></tr></thead><tbody></tbody>';
  const tbody = table.querySelector('tbody');

  for (const row of data) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td></td><td></td><td></td><td class="admin-msg-cell"></td><td class="admin-data-table__actions"></td>';

    tr.cells[0].textContent = fmtDate(row.created_at);
    tr.cells[1].textContent = row.name || '';
    tr.cells[2].textContent = row.email || '';

    const msgCell = tr.cells[3];
    msgCell.style.maxWidth = '320px';
    msgCell.style.whiteSpace = 'pre-wrap';
    msgCell.style.wordBreak = 'break-word';
    msgCell.textContent = row.body || '';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'admin-btn admin-btn--danger admin-btn--sm';
    delBtn.textContent = 'O‘chirish';
    delBtn.addEventListener('click', async () => {
      if (!confirm('O‘chirilsinmi?')) return;
      const { error: delErr } = await supabase.from('contact_messages').delete().eq('id', row.id);
      if (delErr) {
        alert(delErr.message);
        return;
      }
      loadList();
    });

    tr.cells[4].appendChild(delBtn);
    tbody.appendChild(tr);
  }

  listEl.appendChild(table);
}

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

document.getElementById('messages-refresh')?.addEventListener('click', () => loadList());

(async () => {
  if (SUPABASE_ANON_KEY.includes('BU_YERGA')) {
    errEl.hidden = false;
    errEl.textContent = 'supabase-config.js da anon kalitni kiriting.';
    listEl.innerHTML = '';
    return;
  }
  const session = await requireAuth();
  if (session) {
    await loadList();
  }
})();
