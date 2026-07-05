const axios = require("axios");

/**
 * iPhone Quote Card V2
 * Sumber: api-faa.my.id (publik, tanpa apikey pihak ketiga)
 * Menghasilkan gambar (buffer) langsung, bukan JSON.
 */

module.exports = {
  name: "IQC iPhone Chat V2",
  desc: "IQC iPhone quoted image generator via canvas V2",
  category: "Maker",
  path: "/api/maker/iqc2?apikey=&text=",
  async run(req, res) {
    const { text, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const jam = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const batre = Math.floor(Math.random() * 100) + 1;

      const apiUrl = `${global.apiApiFaa}/faa/iqcv2?prompt=${encodeURIComponent(text)}&jam=${encodeURIComponent(jam)}&batre=${batre}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer", timeout: 30000 });
      const buffer = Buffer.from(response.data);

      res.setHeader("Content-Type", "image/png");
      return res.status(200).send(buffer);
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || String(error) });
    }
  }
};
