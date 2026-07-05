const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const settings = require('./settings');
const stats = require('./lib/stats');
const auth = require('./lib/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.enable("trust proxy");
app.set("json spaces", 2);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 150,
  message: {
    creator: settings.creatorName || "YannAjah",
    status: false,
    message: "Terlalu banyak permintaan dari IP Anda, silakan coba lagi nanti."
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }
});
app.use(limiter);

app.use('/views', express.static(path.join(__dirname, 'views')));

global.getBuffer = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'get',
      url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1,
        'User-Agent': 'Mozilla/5.0'
      },
      ...options,
      responseType: 'arraybuffer'
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.fetchJson = async (url, options = {}) => {
  try {
    const res = await axios({
      method: 'GET',
      url,
      headers: {
        'User-Agent': 'Mozilla/5.0'
      },
      ...options
    });
    return res.data;
  } catch (err) {
    return err;
  }
};

global.apikey = settings.apiKeys || [];

// ==== Load semua API sumber pihak ketiga ke global ====
// Bisa dipakai di plugin langsung, misal: global.apiAlip, global.apiKeyAlip
for (const [name, cfg] of Object.entries(settings.sourceApis || {})) {
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  global[`api${cap}`] = cfg.url;
  global[`apiKey${cap}`] = cfg.key;
}

app.use((req, res, next) => {
  // Realtime, langsung ditulis ke Supabase (tidak nunggu, biar gak nge-block request)
  stats.increment('total_requests').catch(() => {});

  const originalJson = res.json;
  res.json = function (data) {
    if (
      data &&
      typeof data === 'object' &&
      req.path !== '/api/endpoints' &&
      req.path !== '/api/set'
    ) {
      return originalJson.call(this, {
        creator: settings.creatorName || "YannAjah",
        ...data
      });
    }
    return originalJson.call(this, data);
  };

  next();
});

app.use(auth.attachUser);

app.get('/api/set', (req, res) => {
  const publicSettings = { ...settings };
  delete publicSettings.apiKeys;
  res.json(publicSettings);
});

app.get('/api/logo-proxy', async (req, res) => {
  try {
    const logoUrl = settings.logoIconUrl || settings.favicon || "https://img2.pixhost.to/images/9050/745481347_yannganteng-1783009788991.jpg";
    const response = await axios({
      method: 'get',
      url: logoUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://clutch-api.run.app/'
      },
      responseType: 'arraybuffer'
    });
    
    res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(response.data);
  } catch (err) {
    return res.redirect("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=128&h=128&fit=crop");
  }
});

let totalRoutes = 0;
let rawEndpoints = {};
const pluginFolder = path.join(__dirname, 'plugin');

if (!fs.existsSync(pluginFolder)) {
  fs.mkdirSync(pluginFolder);
}

fs.readdirSync(pluginFolder).forEach(file => {
  const fullPath = path.join(pluginFolder, file);
  if (file.endsWith('.js')) {
    try {
      const routes = require(fullPath);
      const handlers = Array.isArray(routes) ? routes : [routes];

      handlers.forEach(route => {
        const { name, desc, category, path: routePath, run } = route;

        if (name && desc && category && routePath && typeof run === 'function') {
          const cleanPath = routePath.split('?')[0];
          app.get(cleanPath, run);

          if (!rawEndpoints[category]) rawEndpoints[category] = [];
          rawEndpoints[category].push({ 
            name, 
            desc, 
            path: routePath,
            cleanPath: cleanPath
          });

          totalRoutes++;
          console.log(chalk.hex('#ff79c6')(`✔ Loaded Plugin Route: `) + chalk.hex('#f1fa8c')(`${cleanPath} (${file})`));
        } else {
          console.warn(chalk.bgRed.white(` ⚠ Skipped invalid route in ${file}`));
        }
      });

    } catch (err) {
      console.error(chalk.bgRed.white(` ❌ Error in plugin ${file}: ${err.message}`));
    }
  }
});

const sortedEndpoints = Object.keys(rawEndpoints)
  .sort((a, b) => a.localeCompare(b))
  .reduce((sorted, category) => {
    sorted[category] = rawEndpoints[category].sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, {});

app.get('/api/endpoints', async (req, res) => {
  const current = await stats.getStats();
  res.json({
    total: totalRoutes,
    totalRequests: current.total_requests,
    endpoints: sortedEndpoints
  });
});

app.get('/', async (req, res) => {
  try {
    // Realtime, tapi tidak nge-block render halaman
    stats.increment('total_visitors').catch(() => {});
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman utama: " + err.message);
  }
});

app.get('/api/playground', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'playground.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman playground: " + err.message);
  }
});

app.get('/api', (req, res) => {
  try {
    res.sendFile(path.join(__dirname, 'views', 'api.html'));
  } catch (err) {
    res.status(500).send("Gagal memuat halaman API docs: " + err.message);
  }
});

app.get('/api/stats', async (req, res) => {
  const current = await stats.getStats();
  res.json({
    status: true,
    totalRequests: current.total_requests,
    totalVisitors: current.total_visitors,
    totalEndpoints: totalRoutes,
    activeKeys: global.apikey.length,
    uptime: process.uptime()
  });
});

// ==================== AUTH ROUTES ====================

// Halaman login (kalau udah login, langsung lempar ke dashboard)
app.get('/login', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Halaman register (kalau udah login, langsung lempar ke dashboard)
app.get('/register', (req, res) => {
  if (req.user) return res.redirect('/dashboard');
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Proses daftar akun baru
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const { user, apiKey } = await auth.registerUser({ username, email, password });
    res.json({ status: true, message: 'Akun berhasil dibuat, silakan login', user, apiKey });
  } catch (err) {
    res.status(400).json({ status: false, error: err.message });
  }
});

// Proses login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const { sessionId, user } = await auth.loginUser({ usernameOrEmail, password });

    res.cookie(auth.SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: auth.SESSION_DURATION_MS
    });

    res.json({ status: true, message: 'Login berhasil', user });
  } catch (err) {
    res.status(400).json({ status: false, error: err.message });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  const sessionId = req.cookies?.[auth.SESSION_COOKIE_NAME];
  await auth.logoutSession(sessionId);
  res.clearCookie(auth.SESSION_COOKIE_NAME);
  res.json({ status: true, message: 'Berhasil logout' });
});

// Info user yang lagi login (dipakai halaman dashboard buat ambil data via JS)
app.get('/api/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ status: false, error: 'Belum login' });
  res.json({ status: true, user: req.user });
});

// Halaman dashboard (WAJIB login)
app.get('/dashboard', auth.requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.bgHex('#ffb86c').black(` 🚀 SERVER IS RUNNING ON PORT ${PORT} `));
  console.log(chalk.bgHex('#50fa7b').black(` 📦 TOTAL ROUTES LOADED: ${totalRoutes} `));
});

module.exports = app;
