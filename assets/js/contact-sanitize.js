/**
 * Contact sahifasi uchun matn — HTML/script saqlanmaydi, XSS yo‘qoladi.
 * Saytda intro faqat textContent orqali chiqariladi.
 */

const BAD_PATTERNS = [
  /<\s*script/gi,
  /<\s*\/\s*script/gi,
  /javascript\s*:/gi,
  /vbscript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /on\w+\s*=/gi,
];

const DEFAULT_INTRO =
  "Formani yuborsangiz, xabar avvalo sayt orqali saqlanadi; Telegram bo‘lsa, yangi oynada ochiladi — u yerdan ham yozishingiz mumkin.";

const DEFAULT_TELEGRAM_USERNAME = 'tinch_dev';

/** Matndan teglar va tez-tez XSS uchun ishlatiladigan qatorlarni olib tashlash */
export function sanitizeContactIntro(raw) {
  let s = String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  for (const re of BAD_PATTERNS) {
    s = s.replace(re, '');
  }
  s = s.replace(/[<>]/g, '');
  if (s.length > 4000) s = s.slice(0, 4000);
  return s;
}

/** Telegram username: faqat harf, raqam, pastki chiziq; @ boshida bo‘lsa olib tashlanadi */
export function sanitizeTelegramUsername(raw) {
  const u = String(raw ?? '')
    .trim()
    .replace(/^@+/, '');
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(u)) return null;
  return u;
}

export function getDefaultIntro() {
  return DEFAULT_INTRO;
}

export function getDefaultTelegramUsername() {
  return DEFAULT_TELEGRAM_USERNAME;
}

/** Forma: ism (HTML yo‘q) */
export function sanitizeContactFormName(raw) {
  let s = String(raw ?? '')
    .replace(/\r\n/g, ' ')
    .trim();
  for (const re of BAD_PATTERNS) {
    s = s.replace(re, '');
  }
  s = s.replace(/[<>]/g, '');
  if (s.length > 120) s = s.slice(0, 120);
  return s;
}

/** Forma: email — tekshiruvdan o‘tmasa null */
export function sanitizeContactFormEmail(raw) {
  let e = String(raw ?? '')
    .trim()
    .toLowerCase();
  e = e.replace(/[<>]/g, '');
  if (e.length > 254) e = e.slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/** Forma: xabar matni */
export function sanitizeContactFormMessage(raw) {
  let s = String(raw ?? '')
    .replace(/\r\n/g, '\n')
    .trim();
  for (const re of BAD_PATTERNS) {
    s = s.replace(re, '');
  }
  s = s.replace(/[<>]/g, '');
  if (s.length > 8000) s = s.slice(0, 8000);
  return s;
}
