const axios = require("axios");

/**
 * Spotify Search & Download
 * Search: api.nexray.web.id (publik, tanpa apikey)
 * Download: proxy ke docs-alip.clutch.web.id (global.apialip)
 */


module.exports = [
  {
    name: "Spotify Search",
    desc: "Cari lagu di Spotify berdasarkan judul/kata kunci.",
    category: "Search",
    path: "/api/search/spotify?apikey=&query=",
    async run(req, res) {
      const { query, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
      }
      if (!query) {
        return res.status(400).json({ status: false, error: "Parameter 'query' wajib diisi" });
      }

      try {
        const { data } = await axios.get(`${global.apiNexray}/search/spotify`, {
          params: { q: query },
          timeout: 30000
        });

        if (!data.status || !data.result || data.result.length === 0) {
          return res.status(404).json({ status: false, error: `Lagu "${query}" tidak ditemukan` });
        }

        const tracks = data.result.slice(0, 10).map(t => ({
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          url: t.url,
          thumbnail: t.image || null
        }));

        return res.status(200).json({ status: true, result: tracks });
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message || String(error) });
      }
    }
  },
  {
    name: "Spotify Downloader",
    desc: "Download audio dari link Spotify.",
    category: "Downloader",
    path: "/api/download/spotify?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
      }
      if (!url) {
        return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
      }
      if (!url.includes("open.spotify.com/")) {
        return res.status(400).json({ status: false, error: "Link Spotify tidak valid" });
      }

      try {
        const { data } = await axios.get(`${global.apiAlip}/download/spotify`, {
          params: { apikey: global.apiKeyAlip, url },
          timeout: 60000,
          headers: { "User-Agent": "Mozilla/5.0" }
        });

        if (!data.status || !data.result) {
          throw new Error("Gagal mengambil data lagu");
        }

        return res.status(200).json({ status: true, result: data.result });
      } catch (error) {
        if (error.response?.data) {
          return res.status(500).json({ status: false, error: error.response.data.message || error.response.data.error || "Sumber API menolak permintaan" });
        }
        return res.status(500).json({ status: false, error: error.message || String(error) });
      }
    }
  }
];
