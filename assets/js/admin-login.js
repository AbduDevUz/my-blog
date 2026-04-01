import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

const form = document.getElementById('login-form');
const errEl = document.getElementById('login-error');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.href = 'dashboard.html';
  }
}

checkSession();

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  errEl.textContent = '';
  errEl.hidden = true;

  if (SUPABASE_ANON_KEY.includes('BU_YERGA')) {
    errEl.hidden = false;
    errEl.textContent = 'Avval supabase-config.js da anon kalitni qo‘ying.';
    return;
  }

  const email = form.email.value.trim();
  const password = form.password.value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    errEl.hidden = false;
    errEl.textContent = error.message;
    return;
  }

  window.location.href = 'dashboard.html';
});
