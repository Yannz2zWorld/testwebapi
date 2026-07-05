-- ============================================================
-- TAHAP 1: Schema untuk sistem login (users, api_keys, sessions)
-- Jalankan SEKALI di Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run
-- ============================================================

-- 1. Tabel users
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  email text unique not null,
  password_hash text, -- null kalau user daftar via OAuth (Google/GitHub) aja
  plan text not null default 'free', -- 'free' | 'pro' | 'premium'
  created_at timestamptz not null default now()
);

-- 2. Tabel api_keys (1 user = 1 api key, sesuai keputusan kita)
create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  api_key text unique not null,
  request_count bigint not null default 0,
  request_count_reset_at date not null default current_date, -- buat reset limit harian
  created_at timestamptz not null default now()
);

-- 3. Tabel sessions (session-based login, disimpan di Supabase krn Vercel serverless)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(), -- ini yang jadi "session token"
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- 4. Index biar query cepat
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);
create index if not exists idx_api_keys_key on api_keys(api_key);

-- 5. Aktifkan Row Level Security (server kita akses pakai secret key,
--    jadi RLS ini gak ganggu kode kita, tapi cegah akses langsung dari luar)
alter table users enable row level security;
alter table api_keys enable row level security;
alter table sessions enable row level security;
