const axios = require("axios");

/**
 * GPT-5 Chat
 * Sumber: api.yupra.my.id (publik, tanpa apikey pihak ketiga)
 * Catatan: di bot asal, "gpt5plus" dan "gptonline" memanggil endpoint
 * sumber yang sama persis — di sini digabung jadi satu plugin.
 */

async function askGpt5(text) {
  const { data } = await axios.get(`${global.apiYupra}/api/ai/gpt5`, {
    params: { text },
    timeout: 180000
  });

  if (!data.status || !data.result) {
    throw new Error("GPT-5 tidak dapat menjawab pertanyaan tersebut");
  }

  return data.result;
}

module.exports = {
  name: "GPT-5+ Chat",
  desc: "Tanya jawab dengan AI GPT-5.",
  category: "AI",
  path: "/api/ai/gpt5?apikey=&text=",
  async run(req, res) {
    const { text, apikey } = req.query;

    if (!apikey || !global.apikey.includes(apikey)) {
      return res.status(401).json({ status: false, error: "Apikey invalid atau tidak terdaftar" });
    }
    if (!text) {
      return res.status(400).json({ status: false, error: "Parameter 'text' wajib diisi" });
    }

    try {
      const result = await askGpt5(text);
      return res.status(200).json({ status: true, result });
    } catch (error) {
      return res.status(500).json({ status: false, error: error.message || String(error) });
    }
  }
};
