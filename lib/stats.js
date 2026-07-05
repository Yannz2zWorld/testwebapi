const supabase = require('./supabase');

// Fallback in-memory kalau supabase belum di-setup (biar server tetap jalan)
const memoryFallback = {
  total_requests: 0,
  total_visitors: 0
};

const TABLE = 'stats';
const ROW_ID = 1; // cuma 1 baris buat nyimpen counter global

/**
 * Nambah counter tertentu ('total_requests' atau 'total_visitors') sebesar 1,
 * langsung ditulis ke Supabase (realtime, sesuai request).
 * Kalau Supabase gagal/belum di-setup, fallback nambah di memory biar gak crash.
 */
async function increment(column) {
  if (!supabase) {
    memoryFallback[column] += 1;
    return memoryFallback[column];
  }

  try {
    const { data, error } = await supabase.rpc('increment_stat', {
      row_id: ROW_ID,
      col_name: column
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`[stats] Gagal increment ${column} di Supabase, fallback ke memory:`, err.message);
    memoryFallback[column] += 1;
    return memoryFallback[column];
  }
}

/**
 * Ambil nilai counter saat ini dari Supabase.
 * Kalau gagal/belum di-setup, kembalikan nilai fallback dari memory.
 */
async function getStats() {
  if (!supabase) {
    return { ...memoryFallback };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('total_requests, total_visitors')
      .eq('id', ROW_ID)
      .single();

    if (error) throw error;
    return {
      total_requests: data.total_requests ?? 0,
      total_visitors: data.total_visitors ?? 0
    };
  } catch (err) {
    console.error('[stats] Gagal ambil stats dari Supabase, fallback ke memory:', err.message);
    return { ...memoryFallback };
  }
}

module.exports = { increment, getStats };
