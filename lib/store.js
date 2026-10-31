'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

let db = null;

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expected) {
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64);
  const want = Buffer.from(expected, 'hex');
  if (want.length !== actual.length) return false;
  return crypto.timingSafeEqual(actual, want);
}

function freshSeed() {
  const seed = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  if (!seed.settings) seed.settings = {};
  const { salt, hash } = hashPassword(process.env.ADMIN_PASSWORD || 'touhid123');
  seed.settings.passwordSalt = salt;
  seed.settings.passwordHash = hash;
  seed.settings.adminUser = seed.settings.adminUser || 'admin';
  return seed;
}

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
      console.error('[store] db.json was unreadable, restoring from seed:', err.message);
      db = freshSeed();
      save();
    }
  } else {
    db = freshSeed();
    save();
  }
  db.products = Array.isArray(db.products) ? db.products : [];
  db.settings = db.settings || {};
  return db;
}

function save() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function get() {
  if (!db) load();
  return db;
}

function publicSettings() {
  const s = get().settings;
  return {
    siteName: s.siteName || 'Touhid Shakib',
    siteTagline: s.siteTagline || '',
    heroTitle: s.heroTitle || '',
    heroSubtitle: s.heroSubtitle || '',
    contactEmail: s.contactEmail || '',
    whatsapp: s.whatsapp || '',
    facebook: s.facebook || '',
    youtube: s.youtube || '',
    github: s.github || '',
    currency: s.currency || '৳',
    categories: get().categories || []
  };
}

module.exports = {
  load,
  save,
  get,
  publicSettings,
  hashPassword,
  verifyPassword,
  DATA_DIR,
  DB_FILE
};
