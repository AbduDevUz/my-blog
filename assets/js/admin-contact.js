import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';
import { sanitizeContactIntro, sanitizeTelegramUsername } from './contact-sanitize.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('contact-settings-form');
const errEl = document.getElementById('contact-admin-error');
const introInput = document.getElementById('contact-intro-input');
const tgInput = document.getElementById('contact-tg-user');
const saveOkEl = document.getElementById('contact-save-ok');
let saveOkHideTimer;

async function requireAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

async function load() {
  const { data, error } = await supabase
    .from('contact_settings')
    .select('intro_text,telegram_username')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    errEl.hidden = false;
    errEl.textContent = error.message + ' — contact_settings.sql ni Supabase da ishlatganingizni tekshiring.';
    return;
  }

  if (data) {
    introInput.value = data.intro_text || '';
    tgInput.value = data.telegram_username || '';
  }
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  errEl.hidden = true;

  const session = await requireAuth();
  if (!session) return;

  const intro_text = sanitizeContactIntro(introInput.value);
  const telegram_username = sanitizeTelegramUsername(tgInput.value);

  if (!telegram_username) {
    errEl.hidden = false;
    errEl.textContent =
      'Telegram username noto‘g‘ri: 5–32 belgi, faqat lotin harflari, raqam va pastki chiziq (@ yozmasdan).';
    return;
  }

  const row = { id: 1, intro_text, telegram_username };

  const { error: upErr } = await supabase.from('contact_settings').upsert(row, { onConflict: 'id' });

  if (upErr) {
    errEl.hidden = false;
    errEl.textContent = upErr.message;
    return;
  }

  introInput.value = intro_text;
  tgInput.value = telegram_username;

  if (saveOkEl) {
    saveOkEl.hidden = false;
    clearTimeout(saveOkHideTimer);
    saveOkHideTimer = setTimeout(() => {
      saveOkEl.hidden = true;
    }, 2500);
  }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
});

(async () => {
  if (SUPABASE_ANON_KEY.includes('BU_YERGA')) {
    errEl.hidden = false;
    errEl.textContent = 'supabase-config.js da anon kalitni kiriting.';
    return;
  }
  const session = await requireAuth();
  if (session) {
    await load();
  }
})();
