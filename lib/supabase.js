const { createClient } = require('@supabase/supabase-js');
const settings = require('../settings');

const { url, secretKey } = settings.supabase || {};

let supabase = null;

if (url && secretKey) {
  supabase = createClient(url, secretKey, {
    auth: { persistSession: false }
  });
} else {
  console.warn('[supabase] SUPABASE_URL / SUPABASE_SECRET_KEY belum di-set. Counter akan fallback ke memory (tidak persist).');
}

module.exports = supabase;
