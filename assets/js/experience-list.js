import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const root = document.getElementById('timeline_2');
const statusEl = document.getElementById('experience-status');

function renderRow(row) {
  const wrap = document.createElement('div');
  wrap.className = 'timeline-item clearfix';

  const period = document.createElement('h5');
  period.className = 'item-period' + (row.period_is_current ? ' current' : '');
  period.textContent = row.period_text || '';

  const company = document.createElement('span');
  company.className = 'item-company';
  company.innerHTML = row.company_html || '';

  const title = document.createElement('h4');
  title.className = 'item-title';
  title.textContent = row.job_title || '';

  const p = document.createElement('p');
  p.innerHTML = row.body_html || '';

  wrap.appendChild(period);
  wrap.appendChild(company);
  wrap.appendChild(title);
  wrap.appendChild(p);
  return wrap;
}

async function load() {
  if (!root) return;
  if (SUPABASE_ANON_KEY.includes('BU_YERGA') || !SUPABASE_URL) {
    if (statusEl) statusEl.textContent = 'supabase-config.js ni tekshiring.';
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data, error } = await supabase
    .from('experience_items')
    .select('period_text,period_is_current,company_html,job_title,body_html,sort_order')
    .order('sort_order', { ascending: true });

  if (error) {
    if (statusEl) statusEl.textContent = error.message;
    return;
  }

  if (statusEl) statusEl.textContent = '';
  root.innerHTML = '';

  if (!data || !data.length) {
    if (statusEl) {
      statusEl.textContent =
        'Tajriba yozuvlari yo‘q. Supabase da experience.sql ni ishlating yoki Table Editor dan qo‘shing.';
    }
    return;
  }

  for (const row of data) {
    root.appendChild(renderRow(row));
  }
}

load();
