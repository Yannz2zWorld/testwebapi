const axios = require("axios");

/**
 * Image To 2D Style
 * Proxy ke docs-alip.clutch.web.id (global.apiAlip) — endpoint /imagecreator/to2d
 * Sumber ini balikin gambar langsung (arraybuffer), jadi diteruskan
 * apa adanya sebagai image/png/jpeg.
 */

module.exports = {
  name: "Image To 2D",
  desc: "Konversi foto menjadi gaya ilustrasi 2D berdasarkan URL gambar.",
  category: "AI",
  path: "/api/imagecreator/to2d?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const response = await axios.get(`${global.apiAlip}/imagecreator/to2d`, {
        params: { apikey: global.apiKeyAlip, url },
        timeout: 60000,
        responseType: "arraybuffer",
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      const contentType = response.headers["content-type"] || "image/jpeg";
      if (!contentType.startsWith("image/")) {
        // Sumber balikin JSON (biasanya error), coba parse buat pesan yang jelas
        let message = "Gagal memproses gambar dari sumber";
        try {
          const parsed = JSON.parse(Buffer.from(response.data).toString("utf-8"));
          message = parsed.message || parsed.error || message;
        } catch (_) {}
        return res.status(502).json({ status: false, error: message });
      }

      const buffer = Buffer.from(response.data);
      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": buffer.length,
        "Cache-Control": "public, max-age=86400"
      });
      return res.end(buffer);
    } catch (error) {
      const message = error.response?.data
        ? (() => {
            try {
              const parsed = JSON.parse(Buffer.from(error.response.data).toString("utf-8"));
              return parsed.message || parsed.error;
            } catch (_) {
              return null;
            }
          })()
        : null;

      return res.status(500).json({ status: false, error: message || error.message || "Gagal memproses gambar" });
    }
  }
};
