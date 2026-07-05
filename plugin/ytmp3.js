const axios = require("axios");

/**
 * YouTube Audio Downloader (MP3)
 * Proxy ke docs-alip.clutch.web.id (global.apialip)
 */


module.exports = {
  name: "YouTube MP3r",
  desc: "Download audio dari video YouTube dalam format MP3.",
  category: "Downloader",
  path: "/api/download/ytmp3?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) {
      return res.status(400).json({ status: false, error: "Link YouTube tidak valid" });
    }

    try {
      const { data } = await axios.get(`${global.apiAlip}/download/ytmp3`, {
        params: { apikey: global.apiKeyAlip, url },
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!data.status || !data.result || !data.result.audio) {
        throw new Error("Gagal mendapatkan audio");
      }

      return res.status(200).json({ status: true, result: data.result });
    } catch (error) {
      let errorMsg = error.message || "Gagal mengambil audio";
      if (error.code === "ECONNABORTED") errorMsg = "Timeout, coba lagi nanti";
      else if (error.response?.status === 404) errorMsg = "Audio tidak ditemukan";
      else if (error.response?.data) errorMsg = error.response.data.message || error.response.data.error || errorMsg;

      return res.status(500).json({ status: false, error: errorMsg });
    }
  }
};
