import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';
import {
  sanitizeContactIntro,
  sanitizeTelegramUsername,
  sanitizeContactFormName,
  sanitizeContactFormEmail,
  sanitizeContactFormMessage,
  getDefaultIntro,
  getDefaultTelegramUsername,
} from './contact-sanitize.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const introEl = document.getElementById('contact-intro');
const tgLinkEl = document.getElementById('contact-telegram-link');
const form = document.getElementById('contact-form');
const statusEl = document.getElementById('contact-form-status');
const submitBtn = form?.querySelector('button[type="submit"]');

let telegramUsername = getDefaultTelegramUsername();

function applySettings(introText, username) {
  const intro = sanitizeContactIntro(introText || getDefaultIntro()) || getDefaultIntro();
  const user = sanitizeTelegramUsername(username) || getDefaultTelegramUsername();
  telegramUsername = user;

  if (introEl) {
    introEl.textContent = intro;
  }
  if (tgLinkEl) {
    tgLinkEl.textContent = `@${user}`;
    tgLinkEl.href = `https://t.me/${encodeURIComponent(user)}`;
    tgLinkEl.rel = 'noopener noreferrer';
    tgLinkEl.target = '_blank';
  }
}

async function load() {
  if (SUPABASE_ANON_KEY.includes('BU_YERGA') || !SUPABASE_URL) {
    applySettings(getDefaultIntro(), getDefaultTelegramUsername());
    return;
  }

  const { data, error } = await supabase
    .from('contact_settings')
    .select('intro_text,telegram_username')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    applySettings(getDefaultIntro(), getDefaultTelegramUsername());
    return;
  }

  applySettings(data.intro_text, data.telegram_username);
}

function setStatus(kind, text) {
  if (!statusEl) return;
  statusEl.hidden = false;
  statusEl.textContent = text;
  statusEl.style.color = kind === 'error' ? '#c0392b' : kind === 'ok' ? '#1e8449' : '';
  statusEl.style.display = text ? 'block' : 'none';
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (statusEl) {
    statusEl.textContent = '';
    statusEl.hidden = true;
    statusEl.style.display = 'none';
  }

  const rawName = form.elements.namedItem('name')?.value ?? '';
  const rawEmail = form.elements.namedItem('email')?.value ?? '';
  const rawMessage = form.elements.namedItem('message')?.value ?? '';

  const name = sanitizeContactFormName(rawName);
  const email = sanitizeContactFormEmail(rawEmail);
  const body = sanitizeContactFormMessage(rawMessage);

  if (!name || !body) {
    setStatus('error', 'Ism va xabar to‘ldirilishi kerak.');
    return;
  }
  if (!email) {
    setStatus('error', 'To‘g‘ri email manzilini kiriting.');
    return;
  }

  const user = sanitizeTelegramUsername(telegramUsername) || getDefaultTelegramUsername();
  const tgBody = `Salom! Portfolio saytidan xabar.\n\nIsm: ${name}\nEmail: ${email}\n\n${body}`;
  const tgUrl = `https://t.me/${encodeURIComponent(user)}?text=${encodeURIComponent(tgBody)}`;

  const configOk = SUPABASE_URL && !SUPABASE_ANON_KEY.includes('BU_YERGA');

  if (configOk) {
    if (submitBtn) submitBtn.disabled = true;
    const { error } = await supabase.from('contact_messages').insert({ name, email, body });
    if (submitBtn) submitBtn.disabled = false;

    if (error) {
      setStatus(
        'error',
        'Bazaga yozilmadi: ' +
          error.message +
          ' (contact_messages.sql ni tekshiring). Telegram oynasi baribir ochiladi — xabar u yerdan ham yuborilishi mumkin.',
      );
    } else {
      setStatus('ok', 'Rahmat! Xabaringiz bazaga tushdi — tez orada ko‘rib chiqaman. Telegram bo‘lsa, yangi oynada ochiladi.');
    }
  }

  window.open(tgUrl, '_blank', 'noopener,noreferrer');
});

load();
