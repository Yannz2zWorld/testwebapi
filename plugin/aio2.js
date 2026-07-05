const axios = require("axios");

/**
 * All In One Downloader V2
 * Proxy ke API Theresav (api.theresav.biz.id) — sumber alternatif/backup
 * dari aio.js, dipakai untuk case "yandl2"/"aio2" pada bot.
 * Response diteruskan apa adanya (format sudah sesuai) supaya cocok
 * langsung dipakai oleh case tersebut.
 */

async function aioDl2(url) {
  try {
    const { data } = await axios.get(`${global.apiTheresav}/download/aio-v3`, {
      params: {
        url,
        apikey: global.apiKeyTheresav
      },
      timeout: 60000,
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!data || data.status !== true || !data.result || !Array.isArray(data.result.medias) || data.result.medias.length === 0) {
      throw new Error(data?.message || data?.error || "Gagal mengambil media dari platform tersebut");
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
  name: "All In One Downloader V2",
  desc: "Download video/foto/audio dari berbagai platform (TikTok, Instagram, Facebook, Twitter, YouTube, dll) — sumber alternatif.",
  category: "Downloader",
  path: "/api/download/aio2?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    // apikey di sini adalah apikey milik server kamu sendiri, BUKAN apikey Theresav.
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const result = await aioDl2(url);
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
