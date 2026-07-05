const axios = require("axios");

/**
 * SoundCloud Search & Download
 * Sumber: api.siputzx.my.id (API publik, tidak butuh apikey pihak ketiga)
 */

module.exports = [
  {
    name: "SoundCloud Search",
    desc: "Cari lagu di SoundCloud berdasarkan judul/kata kunci.",
    category: "Search",
    path: "/api/search/soundcloud?apikey=&query=",
    async run(req, res) {
      const { query, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
      }
      if (!query) {
        return res.status(400).json({ status: false, error: "Parameter 'query' wajib diisi" });
      }

      try {
        const { data } = await axios.get(`${global.apiSiputzx}/api/s/soundcloud`, {
          params: { query },
          timeout: 30000
        });

        if (!data.status || !data.data || data.data.length === 0) {
          return res.status(404).json({ status: false, error: `Lagu "${query}" tidak ditemukan` });
        }

        const tracks = data.data
          .filter(t => t.permalink_url && t.duration > 0)
          .slice(0, 10)
          .map(t => ({
            title: t.permalink,
            url: t.permalink_url,
            duration: t.duration,
            plays: t.playback_count || 0,
            thumbnail: t.artwork_url || null
          }));

        return res.status(200).json({ status: true, result: tracks });
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message || String(error) });
      }
    }
  },
  {
    name: "SoundCloud Downloader",
    desc: "Download audio dari link SoundCloud.",
    category: "Downloader",
    path: "/api/download/soundcloud?apikey=&url=",
    async run(req, res) {
      const { url, apikey } = req.query;

      if (!apikey || !global.apikey.includes(apikey)) {
        return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
      }
      if (!url) {
        return res.status(400).json({ status: false, error: "Parameter 'url' wajib diisi" });
      }
      if (!url.includes("soundcloud.com/")) {
        return res.status(400).json({ status: false, error: "Link SoundCloud tidak valid" });
      }

      try {
        const { data } = await axios.get(`${global.apiSiputzx}/api/d/soundcloud`, {
          params: { url },
          timeout: 30000
        });

        if (!data.status || !data.data) {
          throw new Error("Gagal mengambil data lagu");
        }

        const { title, url: audioUrl, thumbnail, duration, user } = data.data;

        return res.status(200).json({
          status: true,
          result: {
            title,
            artist: user?.username || "-",
            duration,
            thumbnail,
            audio: audioUrl
          }
        });
      } catch (error) {
        return res.status(500).json({ status: false, error: error.message || String(error) });
      }
    }
  }
];
