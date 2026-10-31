'use strict';

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const store = require('./lib/store');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
const FILE_DIR = path.join(UPLOAD_DIR, 'files');
const SESSION_COOKIE = 'ts_session';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

fs.mkdirSync(IMAGE_DIR, { recursive: true });
fs.mkdirSync(FILE_DIR, { recursive: true });
store.load();

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

/* ------------------------------------------------------------------ *
 * Sessions (in-memory; restarting the server logs admins out)
 * ------------------------------------------------------------------ */
const sessions = new Map();

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > -1) acc[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    return acc;
  }, {});
}

function currentSession(req) {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  if (!token) return null;
  const entry = sessions.get(token);
  if (!entry || entry.expires < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return entry;
}

function requireAuth(req, res, next) {
  if (!currentSession(req)) return res.status(401).json({ error: 'Please sign in to continue.' });
  next();
}

const loginAttempts = new Map();
function tooManyAttempts(key) {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    loginAttempts.delete(key);
    return false;
  }
  return entry.count >= 8;
}
function noteFailedAttempt(key) {
  const entry = loginAttempts.get(key) || { count: 0, resetAt: Date.now() + 1000 * 60 * 10 };
  entry.count += 1;
  entry.resetAt = Date.now() + 1000 * 60 * 10;
  loginAttempts.set(key, entry);
}

/* ------------------------------------------------------------------ *
 * Uploads
 * ------------------------------------------------------------------ */
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif']);

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, file.fieldname === 'cover' ? IMAGE_DIR : FILE_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').slice(0, 12).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 }, // 512 MB
  fileFilter(req, file, cb) {
    if (file.fieldname === 'cover' && !IMAGE_TYPES.has(file.mimetype)) {
      return cb(new Error('Cover image must be a JPG, PNG, WEBP, GIF or SVG file.'));
    }
    cb(null, true);
  }
});

const uploadFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
const CATEGORY_IDS = ['product', 'software', 'course', 'apk'];

function str(value, max = 4000) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max);
}

function bool(value) {
  return value === true || value === 'true' || value === 'on' || value === '1';
}

function num(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function lines(value, max = 12) {
  return str(value, 4000)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

function localUploadPath(urlPath) {
  if (typeof urlPath !== 'string' || !urlPath.startsWith('/uploads/')) return null;
  const resolved = path.join(ROOT, decodeURIComponent(urlPath));
  if (!resolved.startsWith(UPLOAD_DIR)) return null;
  return resolved;
}

function removeUpload(urlPath) {
  const filePath = localUploadPath(urlPath);
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
}

function relativeUploadPath(file) {
  return `/uploads/${file.fieldname === 'cover' ? 'images' : 'files'}/${file.filename}`;
}

function formatSize(bytes) {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value >= 10 || unit === 0 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`;
}

function serializeProduct(product, { admin = false } = {}) {
  const out = {
    id: product.id,
    title: product.title,
    category: product.category,
    tagline: product.tagline,
    description: product.description,
    features: product.features || [],
    tags: product.tags || [],
    price: num(product.price, 0),
    priceLabel: product.priceLabel || '',
    version: product.version || '',
    fileType: product.fileType || '',
    fileSize: product.fileSize || '',
    cover: product.cover || '',
    demoUrl: product.demoUrl || '',
    featured: !!product.featured,
    downloads: num(product.downloads, 0),
    views: num(product.views, 0),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  };
  const hasFile = Boolean(product.fileUrl || product.externalUrl);
  out.hasDownload = hasFile;
  if (admin) {
    out.fileUrl = product.fileUrl || '';
    out.externalUrl = product.externalUrl || '';
    out.published = product.published !== false;
  } else {
    out.externalDownload = Boolean(product.externalUrl && !product.fileUrl);
  }
  return out;
}

function sortProducts(products, sort) {
  const list = [...products];
  switch (sort) {
    case 'downloads':
      return list.sort((a, b) => num(b.downloads) - num(a.downloads));
    case 'az':
      return list.sort((a, b) => a.title.localeCompare(b.title));
    case 'oldest':
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    default:
      return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

function publicStats(products) {
  const published = products.filter((p) => p.published !== false);
  return {
    products: published.length,
    downloads: published.reduce((sum, p) => sum + num(p.downloads), 0),
    views: published.reduce((sum, p) => sum + num(p.views), 0),
    free: published.filter((p) => num(p.price) === 0).length
  };
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */
app.get('/api/site', (req, res) => {
  const db = store.get();
  res.json({
    settings: store.publicSettings(),
    categories: db.categories || [],
    stats: publicStats(db.products)
  });
});

app.get('/api/products', (req, res) => {
  const db = store.get();
  const isAdmin = Boolean(currentSession(req)) && req.query.all === '1';
  let products = db.products.filter((p) => isAdmin || p.published !== false);

  const category = str(req.query.category, 40);
  if (category && category !== 'all') products = products.filter((p) => p.category === category);

  const q = str(req.query.q, 120).toLowerCase();
  if (q) {
    const terms = q.split(/\s+/).filter(Boolean);
    products = products.filter((p) => {
      const haystack = [p.title, p.tagline, p.description, (p.tags || []).join(' '), p.category]
        .join(' ')
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  if (bool(req.query.featured)) products = products.filter((p) => p.featured);

  const limit = Math.min(num(req.query.limit, 200) || 200, 200);
  products = sortProducts(products, str(req.query.sort, 20)).slice(0, limit);

  res.json({ products: products.map((p) => serializeProduct(p, { admin: isAdmin })) });
});

app.get('/api/products/:id', (req, res) => {
  const db = store.get();
  const product = db.products.find((p) => p.id === req.params.id);
  const isAdmin = Boolean(currentSession(req));
  if (!product || (product.published === false && !isAdmin)) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  if (bool(req.query.view)) {
    product.views = num(product.views) + 1;
    store.save();
  }
  const related = sortProducts(
    db.products.filter((p) => p.published !== false && p.category === product.category && p.id !== product.id),
    'downloads'
  )
    .slice(0, 3)
    .map((p) => serializeProduct(p));
  res.json({ product: serializeProduct(product, { admin: isAdmin }), related });
});

app.get('/api/products/:id/download', (req, res) => {
  const db = store.get();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product || product.published === false) {
    return res.status(404).send('Product not found.');
  }
  const filePath = localUploadPath(product.fileUrl);
  product.downloads = num(product.downloads) + 1;
  store.save();

  if (filePath && fs.existsSync(filePath)) {
    return res.download(filePath, path.basename(filePath));
  }
  if (product.externalUrl) return res.redirect(product.externalUrl);
  return res
    .status(404)
    .send('This product is delivered manually. Please contact the seller to receive your files.');
});

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */
app.post('/api/login', (req, res) => {
  const key = req.ip || 'unknown';
  if (tooManyAttempts(key)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 10 minutes and try again.' });
  }
  const username = str(req.body.username, 80) || 'admin';
  const password = str(req.body.password, 200);
  const settings = store.get().settings;

  const usernameOk = username.toLowerCase() === (settings.adminUser || 'admin').toLowerCase();
  const passwordOk = store.verifyPassword(password, settings.passwordSalt, settings.passwordHash);
  if (!usernameOk || !passwordOk) {
    noteFailedAttempt(key);
    return res.status(401).json({ error: 'Wrong username or password.' });
  }

  loginAttempts.delete(key);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expires: Date.now() + SESSION_TTL });
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL,
    path: '/'
  });
  res.json({ ok: true, user: settings.adminUser || 'admin' });
});

app.post('/api/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie || '')[SESSION_COOKIE];
  if (token) sessions.delete(token);
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/me', (req, res) => {
  const session = currentSession(req);
  if (!session) return res.status(401).json({ authenticated: false });
  res.json({ authenticated: true, user: store.get().settings.adminUser || 'admin' });
});

/* ------------------------------------------------------------------ *
 * Admin API
 * ------------------------------------------------------------------ */
function readProductPayload(req, existing = {}) {
  const body = req.body || {};
  const coverFile = req.files?.cover?.[0];
  const dataFile = req.files?.file?.[0];

  const title = str(body.title, 160);
  const category = CATEGORY_IDS.includes(str(body.category, 20)) ? str(body.category, 20) : 'product';
  const priceValue = str(body.price, 40);

  const payload = {
    title,
    category,
    tagline: str(body.tagline, 300),
    description: str(body.description, 8000),
    features: lines(body.features),
    tags: lines(body.tags, 10).flatMap((line) => line.split(',')).map((t) => t.trim()).filter(Boolean).slice(0, 10),
    price: priceValue === '' ? 0 : num(priceValue, 0),
    priceLabel: str(body.priceLabel, 40),
    version: str(body.version, 60),
    fileType: str(body.fileType, 80),
    fileSize: str(body.fileSize, 60),
    demoUrl: str(body.demoUrl, 500),
    featured: bool(body.featured),
    published: bool(body.published)
  };

  if (coverFile) {
    payload.cover = relativeUploadPath(coverFile);
  } else if (body.cover && body.cover !== existing.cover && /^https?:\/\//i.test(body.cover)) {
    payload.cover = str(body.cover, 500);
  } else if (body.removeCover === 'true') {
    payload.cover = '';
  }

  if (dataFile) {
    payload.fileUrl = relativeUploadPath(dataFile);
    payload.externalUrl = '';
    payload.fileSize = payload.fileSize || formatSize(dataFile.size);
    payload.fileType = payload.fileType || path.extname(dataFile.originalname).replace('.', '').toUpperCase();
  } else if (str(body.externalUrl, 800)) {
    payload.externalUrl = str(body.externalUrl, 800);
    payload.fileUrl = '';
  }

  return payload;
}

app.get('/api/admin/stats', requireAuth, (req, res) => {
  const db = store.get();
  const stats = publicStats(db.products);
  const byCategory = CATEGORY_IDS.map((id) => ({
    id,
    count: db.products.filter((p) => p.category === id).length
  }));
  res.json({
    ...stats,
    total: db.products.length,
    drafts: db.products.filter((p) => p.published === false).length,
    byCategory,
    recent: sortProducts(db.products, 'newest')
      .slice(0, 5)
      .map((p) => serializeProduct(p, { admin: true }))
  });
});

app.post('/api/admin/products', requireAuth, uploadFields, (req, res) => {
  const db = store.get();
  const payload = readProductPayload(req);
  if (!payload.title) return res.status(400).json({ error: 'A product title is required.' });
  if (!payload.tagline) return res.status(400).json({ error: 'A short tagline is required.' });

  const now = new Date().toISOString();
  const product = {
    id: `p_${crypto.randomBytes(6).toString('hex')}`,
    ...payload,
    priceLabel: payload.priceLabel || (payload.price === 0 ? 'Free' : ''),
    downloads: 0,
    views: 0,
    createdAt: now,
    updatedAt: now
  };
  db.products.unshift(product);
  store.save();
  res.status(201).json({ product: serializeProduct(product, { admin: true }) });
});

app.put('/api/admin/products/:id', requireAuth, uploadFields, (req, res) => {
  const db = store.get();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });

  const existing = db.products[index];
  const payload = readProductPayload(req, existing);
  if (!payload.title) return res.status(400).json({ error: 'A product title is required.' });

  const previous = { cover: existing.cover, fileUrl: existing.fileUrl };
  const updated = {
    ...existing,
    ...payload,
    priceLabel: payload.priceLabel || (payload.price === 0 ? 'Free' : ''),
    updatedAt: new Date().toISOString()
  };

  db.products[index] = updated;
  store.save();

  if (previous.cover && previous.cover !== updated.cover) removeUpload(previous.cover);
  if (previous.fileUrl && previous.fileUrl !== updated.fileUrl) removeUpload(previous.fileUrl);

  res.json({ product: serializeProduct(updated, { admin: true }) });
});

app.delete('/api/admin/products/:id', requireAuth, (req, res) => {
  const db = store.get();
  const index = db.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });
  const [removed] = db.products.splice(index, 1);
  store.save();
  removeUpload(removed.cover);
  removeUpload(removed.fileUrl);
  res.json({ ok: true });
});

app.patch('/api/admin/products/:id/publish', requireAuth, (req, res) => {
  const db = store.get();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  product.published = !product.published;
  product.updatedAt = new Date().toISOString();
  store.save();
  res.json({ product: serializeProduct(product, { admin: true }) });
});

app.get('/api/admin/settings', requireAuth, (req, res) => {
  res.json({ settings: store.publicSettings(), adminUser: store.get().settings.adminUser || 'admin' });
});

app.put('/api/admin/settings', requireAuth, (req, res) => {
  const db = store.get();
  const body = req.body || {};
  const allowed = ['siteName', 'siteTagline', 'heroTitle', 'heroSubtitle', 'contactEmail', 'whatsapp', 'facebook', 'youtube', 'github', 'currency'];
  allowed.forEach((key) => {
    if (body[key] !== undefined) db.settings[key] = str(body[key], 600);
  });
  store.save();
  res.json({ settings: store.publicSettings() });
});

app.put('/api/admin/password', requireAuth, (req, res) => {
  const db = store.get();
  const current = str(req.body.currentPassword, 200);
  const next = str(req.body.newPassword, 200);
  if (!store.verifyPassword(current, db.settings.passwordSalt, db.settings.passwordHash)) {
    return res.status(400).json({ error: 'Your current password is not correct.' });
  }
  if (next.length < 6) return res.status(400).json({ error: 'The new password must be at least 6 characters.' });

  const { salt, hash } = store.hashPassword(next);
  db.settings.passwordSalt = salt;
  db.settings.passwordHash = hash;
  store.save();
  res.json({ ok: true });
});

app.get('/api/admin/backup', requireAuth, (req, res) => {
  const db = store.get();
  res.setHeader('Content-Disposition', `attachment; filename="store-backup-${Date.now()}.json"`);
  res.json({ settings: store.publicSettings(), categories: db.categories, products: db.products });
});

/* ------------------------------------------------------------------ *
 * Static assets & pages
 * ------------------------------------------------------------------ */
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }));
app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }));

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Unknown endpoint.' });
  res.status(404).sendFile(path.join(PUBLIC_DIR, '404.html'));
});

app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That file is too large. The limit is 512 MB.' });
  }
  res.status(400).json({ error: err.message || 'Something went wrong.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Touhid Shakib store running at http://localhost:${PORT}`);
  console.log('Admin panel: /admin.html');
});
