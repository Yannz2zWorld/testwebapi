const axios = require("axios");

/**
 * Brat Cewe Maker
 * Proxy ke API Theresav (api.theresav.biz.id) — sumber yang sama dipakai
 * aio2.js, dipakai untuk case "bratcewe" pada bot.
 * Sumber ini balikin gambar langsung (arraybuffer), jadi diteruskan
 * apa adanya sebagai image/png supaya cocok dipakai langsung oleh bot.
 */

async function bratCewe(text) {
  try {
    const response = await axios.get(`${global.apiTheresav}/maker/bratcewe`, {
      params: {
        text,
        apikey: global.apiKeyTheresav
      },
      timeout: 60000,
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const buffer = Buffer.from(response.data);

    if (!buffer || buffer.length < 100) {
      throw new Error("Gagal memproses gambar atau data gambar korup");
    }

    return buffer;
  } catch (e) {
    if (e.response?.data) {
      // Kalau sumber balikin JSON error meski responseType arraybuffer, coba parse
      try {
        const parsed = JSON.parse(Buffer.from(e.response.data).toString("utf-8"));
        throw new Error(parsed.message || parsed.error || "Sumber API menolak permintaan");
      } catch {
        throw new Error("Sumber API menolak permintaan");
      }
    }
    throw new Error(e.message || "Gagal mengambil data");
  }
}

module.exports = {
  name: "Brat Cewe Maker",
  desc: "Membuat gambar sticker teks bergaya Brat aesthetic versi cewe",
  category: "Maker",
  path: "/api/maker/bratcewe?apikey=&text=",
  async run(req, res) {
    const { apikey, text } = req.query;

    // apikey di sini adalah apikey milik server kamu sendiri, BUKAN apikey Theresav.
    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({
        status: false,
        error: "Apikey tidak valid. Silakan gunakan apikey yang terdaftar."
      });
    }

    if (!text) {
      return res.status(400).json({
        status: false,
        error: "Parameter 'text' wajib diisi."
      });
    }

    try {
      const buffer = await bratCewe(text);

      res.writeHead(200, {
        "Content-Type": "image/png",
        "Content-Length": buffer.length
      });
      res.end(buffer);
    } catch (error) {
      console.error("[BRATCEWE ERROR]", error.message || error);
      res.status(500).json({
        status: false,
        error: error.message || "Terjadi kesalahan saat menghubungi API Brat Cewe."
      });
    }
  }
};
