-- Jalankan script ini SEKALI di Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run

-- 1. Buat tabel stats (cuma bakal ada 1 baris, id = 1)
create table if not exists stats (
  id int primary key,
  total_requests bigint not null default 0,
  total_visitors bigint not null default 0
);

-- 2. Insert baris awal (id=1) kalau belum ada
insert into stats (id, total_requests, total_visitors)
values (1, 0, 0)
on conflict (id) do nothing;

-- 3. Function buat nambah counter secara atomic (aman dari race condition)
create or replace function increment_stat(row_id int, col_name text)
returns bigint
language plpgsql
as $$
declare
  new_value bigint;
begin
  if col_name = 'total_requests' then
    update stats set total_requests = total_requests + 1
    where id = row_id
    returning total_requests into new_value;
  elsif col_name = 'total_visitors' then
    update stats set total_visitors = total_visitors + 1
    where id = row_id
    returning total_visitors into new_value;
  else
    raise exception 'Kolom % tidak dikenal', col_name;
  end if;

  return new_value;
end;
$$;

-- 4. (Opsional tapi disarankan) Aktifkan Row Level Security dan batasi akses
-- Karena kita akses pakai secret key (service_role) dari server, RLS ini
-- gak akan menghalangi kode kita, tapi mencegah akses langsung dari client lain.
alter table stats enable row level security;
