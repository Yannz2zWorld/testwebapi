module.exports = {
  creatorName: "Yannz2z",
  apiTitle: "Yannz2z Api",
  webName: "Yannz Api",
  favicon: "https://img2.pixhost.to/images/9050/745481347_yannganteng-1783009788991.jpg",
  logoIcon: "⚡",
  logoIconUrl: "https://img2.pixhost.to/images/9050/745481347_yannganteng-1783009788991.jpg",
  whatsappLink: "https://wa.me/6281249703469",
  githubLink: "https://github.com/Yannz2z",
  instagramLink: "https://www.instagram.com/yannznms10?igsh=OXRlc2g1MHIydGky",
  telegramLink: "https://t.me/Yannz2z",
  whatsappChannelLink: "https://whatsapp.com/channel/0029VbCBj0N3LdQTosP3Hj0T",
  emailAddress: "yannzworld@gmail.com",
  apiKeys: ["yansuperiors"],

  // ==== Supabase (buat nyimpen counter Requests & Visitors biar persist) ====
  // Isi lewat environment variable di Vercel: SUPABASE_URL & SUPABASE_SECRET_KEY
  // Kalau kosong/tidak diset, counter otomatis fallback ke memory biasa (gak persist).
  supabase: {
    url: process.env.SUPABASE_URL || "",
    secretKey: process.env.SUPABASE_SECRET_KEY || ""
  },

  // ==== Sumber API pihak ketiga (dipakai di dalam /plugin) ====
  // Format: apiXxx = base url, apiKeyXxx = apikey milik sumber tsb (kalau ada)
  sourceApis: {
    alip: {
      url: "https://docs-alip.clutch.web.id",
      key: "alipaiapikeybaru"
    },
    theresav: {
      url: "https://api.theresav.biz.id",
      key: "Yannhebatbgtz2z"
    },
    covenant: {
      url: "https://api.covenant.sbs",
      key: "cov_live_4952f36ac5a68c15567e74a3d8816266b8829fed8c7f7eb3"
    },
    botcahx: {
      url: "https://api.botcahx.eu.org",
      key: "YannzSuperior"
    },
    atomesus: {
      url: "https://api.atomesus.com",
      key: null
    },
    azbry: {
      url: "https://chat.azbry.com",
      key: null
    },
    live3d: {
      url: "https://app-v1.live3d.io",
      key: null
    },
    tenor: {
      url: "https://tenor.googleapis.com",
      key: "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ"
    },
    yupra: {
      url: "https://api.yupra.my.id",
      key: null
    },
    apiFaa: {
      url: "https://api-faa.my.id",
      key: null
    },
    siputzx: {
      url: "https://api.siputzx.my.id",
      key: null
    },
    nexray: {
      url: "https://api.nexray.web.id",
      key: null
    },
    tikwm: {
      url: "https://www.tikwm.com",
      key: null
    }
  }
};
