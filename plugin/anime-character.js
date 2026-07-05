const axios = require("axios");

/**
 * Anime Character Search
 * Sumber: api.covenant.sbs (butuh x-api-key)
 */

module.exports = {
  name: "Cari Character A",
  desc: "Cari karakter anime berdasarkan nama.",
  category: "Search",
  path: "/api/search/anime-character?apikey=&query=",
  async run(req, res) {
    const { query, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!query) {
      return res.status(400).json({ status: false, error: "Parameter 'query' wajib diisi" });
    }

    try {
      const params = new URLSearchParams({ q: query, limit: "10" });

      const response = await axios.get(`${global.apiCovenant}/api/media/anime-character?${params}`, {
        headers: { "x-api-key": global.apiKeyCovenant },
        timeout: 30000
      });

      const result = response.data;
      const list = result?.data?.characters || [];

      if (!result.status || list.length === 0) {
        return res.status(404).json({ status: false, error: `Karakter dengan nama "${query}" tidak ditemukan` });
      }

      const characters = list.map(char => ({
        id: char.id,
        name: char.name,
        nameKanji: char.name_kanji || null,
        nicknames: char.nicknames || [],
        favorites: char.favorites ?? 0,
        url: char.url,
        image: char.image || null
      }));

      return res.status(200).json({
        status: true,
        result: {
          query,
          total: result.data.total ?? list.length,
          characters
        }
      });
    } catch (error) {
      let errorMsg = error.message || "Gagal mencari karakter";
      if (error.code === "ECONNABORTED") errorMsg = "Timeout, coba lagi nanti";
      else if (error.response?.status === 401) errorMsg = "API key tidak valid";
      else if (error.response?.status === 429) errorMsg = "Terlalu banyak request, coba lagi nanti";
      else if (error.response?.status === 404) errorMsg = `Karakter dengan nama "${query}" tidak ditemukan`;

      return res.status(500).json({ status: false, error: errorMsg });
    }
  }
};
