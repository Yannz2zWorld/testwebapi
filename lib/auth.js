const bcrypt = require('bcryptjs');
const supabase = require('./supabase');

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari

/**
 * Bikin API key acak, dipakai sekali waktu user baru daftar.
 * Format: yz_ + 32 karakter acak (biar gampang dikenali sebagai key dari Yannz2z Api).
 */
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'yz_';
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

/**
 * Daftar user baru: validasi input dasar, hash password, simpan ke Supabase,
 * lalu langsung buatkan 1 API key buat user tsb.
 */
async function registerUser({ username, email, password }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi di server');

  if (!username || !email || !password) {
    throw new Error('Username, email, dan password wajib diisi');
  }
  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter');
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .or(`username.eq.${username},email.eq.${email}`)
    .maybeSingle();

  if (existing) {
    throw new Error('Username atau email sudah terdaftar');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: user, error } = await supabase
    .from('users')
    .insert({ username, email, password_hash: passwordHash, plan: 'free' })
    .select('id, username, email, plan')
    .single();

  if (error) throw new Error(error.message);

  // Langsung buatkan 1 API key buat user baru ini
  const apiKey = generateApiKey();
  const { error: keyError } = await supabase
    .from('api_keys')
    .insert({ user_id: user.id, api_key: apiKey });

  if (keyError) throw new Error(keyError.message);

  return { user, apiKey };
}

/**
 * Login: cek username/email + password, kalau cocok buat session baru.
 * Return sessionId yang nanti disimpan sebagai cookie di browser user.
 */
async function loginUser({ usernameOrEmail, password }) {
  if (!supabase) throw new Error('Supabase belum dikonfigurasi di server');
  if (!usernameOrEmail || !password) {
    throw new Error('Username/email dan password wajib diisi');
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, username, email, password_hash, plan')
    .or(`username.eq.${usernameOrEmail},email.eq.${usernameOrEmail}`)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!user || !user.password_hash) {
    throw new Error('Username/email atau password salah');
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    throw new Error('Username/email atau password salah');
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, expires_at: expiresAt })
    .select('id')
    .single();

  if (sessionError) throw new Error(sessionError.message);

  return {
    sessionId: session.id,
    user: { id: user.id, username: user.username, email: user.email, plan: user.plan }
  };
}

/**
 * Ambil data user dari session ID (dipanggil di tiap request yang butuh login).
 * Return null kalau session gak valid / expired.
 */
async function getUserBySession(sessionId) {
  if (!supabase || !sessionId) return null;

  const { data: session, error } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !session) return null;
  if (new Date(session.expires_at) < new Date()) {
    // Session udah expired, hapus biar bersih
    await supabase.from('sessions').delete().eq('id', sessionId);
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, username, email, plan')
    .eq('id', session.user_id)
    .maybeSingle();

  if (userError || !user) return null;
  return user;
}

/**
 * Logout: hapus session dari Supabase.
 */
async function logoutSession(sessionId) {
  if (!supabase || !sessionId) return;
  await supabase.from('sessions').delete().eq('id', sessionId);
}

/**
 * Middleware Express: cek cookie session_id, kalau valid isi req.user,
 * kalau tidak req.user tetap null (gak langsung block, biar bisa dipakai
 * fleksibel: ada halaman yang wajib login, ada yang optional).
 */
async function attachUser(req, res, next) {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  req.user = sessionId ? await getUserBySession(sessionId) : null;
  next();
}

/**
 * Middleware Express: WAJIB login, kalau belum login redirect ke /login.
 */
function requireLogin(req, res, next) {
  if (!req.user) {
    return res.redirect('/login');
  }
  next();
}

module.exports = {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  generateApiKey,
  registerUser,
  loginUser,
  getUserBySession,
  logoutSession,
  attachUser,
  requireLogin
};
