const axios = require("axios");

/**
 * Google Drive Downloader
 * Sumber: global.btc (api.botcahx.eu.org) + global.btcApikey
 */

module.exports = {
  name: "Google Drive DL",
  desc: "Ambil link download langsung dari file Google Drive yang publik.",
  category: "Downloader",
  path: "/api/download/gdrive?apikey=&url=",
  async run(req, res) {
    const { url, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!url) {
      return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
    }

    try {
      const { data } = await axios.get(`${global.apiBotcahx}/api/download/gdrive`, {
        params: { url, apikey: global.apiKeyBotcahx },
        timeout: 60000,
        headers: { "User-Agent": "Mozilla/5.0" }
      });

      if (!data.status || !data.result?.status || !data.result?.data) {
        return res.status(404).json({ status: false, error: "Gagal mengambil file. Pastikan link Google Drive valid dan filenya public." });
      }

      const r = data.result;
      return res.status(200).json({
        status: true,
        result: {
          fileName: r.fileName || null,
          fileSize: r.fileSize || null,
          mimetype: r.mimetype || null,
          downloadUrl: r.data
        }
      });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || String(error) });
    }
  }
};
