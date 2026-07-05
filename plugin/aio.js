const axios = require("axios");

/**
 * All In One Downloader
 * Proxy ke API docs-alip.clutch.web.id yang sudah mendukung banyak platform
 * (TikTok, Instagram, Facebook, Twitter/X, YouTube, dll).
 * Response diteruskan apa adanya (sudah dalam format yang benar) supaya
 * cocok langsung dipakai oleh case "yandl"/"aio" pada bot.
 */

async function aioDl(url) {
  try {
    const { data } = await axios.get(`${global.apiAlip}/download/aio`, {
      params: {
        apikey: global.apiKeyAlip,
        url
      },
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!data || data.status !== true || !data.result) {
      throw new Error(data?.message || data?.error || "Gagal mengambil data dari sumber");
    }

    return data.result;
  } catch (e) {
    if (e.response?.data) {
      throw new Error(e.response.data.message || e.response.data.error || "Sumber API menolak permintaan");
    }
    throw new Error(e.message || "Gagal mengambil data");
  }
}

module.exports = {
  name: "Yann All Downloader",
  desc: "Download video/foto/audio dari TikTok, Instagram, Facebook, Twitter, dan YouTube dalam satu endpoint.",
  category: "Downloader",
  path: "/api/download/aio?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    // apikey di sini adalah apikey milik server kamu sendiri (untuk membatasi siapa
    // yang boleh pakai endpoint kamu), BUKAN apikey docs-alip.
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const result = await aioDl(url);
      return res.status(200).json({
        status: true,
        result
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        error: error.message || String(error)
      });
    }
  }
};
