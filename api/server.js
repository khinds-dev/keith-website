'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
app.use(express.json());

// ── Config ────────────────────────────────────────────────────────────────────
const PORT        = process.env.PORT        || 3000;
const ADMIN_PASS  = process.env.ADMIN_PASS  || 'changeme';
const JWT_SECRET  = process.env.JWT_SECRET  || 'changeme-secret';
const DB_PATH     = process.env.DB_PATH     || '/data/posts.db';
const IMAGES_DIR  = process.env.IMAGES_DIR  || '/data/images';

// ── Database setup ────────────────────────────────────────────────────────────
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    slug            TEXT    NOT NULL UNIQUE,
    body            TEXT    NOT NULL DEFAULT '',
    cover_image     TEXT,
    cover_focal_x   REAL    NOT NULL DEFAULT 50,
    cover_focal_y   REAL    NOT NULL DEFAULT 50,
    cover_zoom      REAL    NOT NULL DEFAULT 1,
    published       INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

// Migrate: add columns if upgrading from old schema
try { db.exec('ALTER TABLE posts ADD COLUMN cover_image TEXT'); }     catch (_) {}
try { db.exec('ALTER TABLE posts ADD COLUMN cover_focal_x REAL NOT NULL DEFAULT 50'); } catch (_) {}
try { db.exec('ALTER TABLE posts ADD COLUMN cover_focal_y REAL NOT NULL DEFAULT 50'); } catch (_) {}
try { db.exec('ALTER TABLE posts ADD COLUMN cover_zoom REAL NOT NULL DEFAULT 1'); }    catch (_) {}

// ── Multer (image uploads) ────────────────────────────────────────────────────
const imageFileFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, GIF or WebP images are allowed'));
};

// Cover image upload — filename includes post id
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = 'post-' + req.params.id + '-' + Date.now() + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// Inline image upload — generic filename
const inlineStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMAGES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, 'inline-' + Date.now() + ext);
  }
});
const uploadInline = multer({
  storage: inlineStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: imageFileFilter
});

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorised' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ── Slug helper ───────────────────────────────────────────────────────────────
function toSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/login
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASS) {
    return res.status(401).json({ error: 'Wrong password' });
  }
  const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// GET /api/posts  — public, returns published posts only
app.get('/api/posts', (req, res) => {
  const posts = db
    .prepare('SELECT id, title, slug, cover_image, cover_focal_x, cover_focal_y, cover_zoom, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC')
    .all();
  res.json(posts);
});

// GET /api/posts/all  — admin, returns all posts
app.get('/api/posts/all', requireAuth, (req, res) => {
  const posts = db
    .prepare('SELECT id, title, slug, body, cover_image, cover_focal_x, cover_focal_y, cover_zoom, published, created_at, updated_at FROM posts ORDER BY created_at DESC')
    .all();
  res.json(posts);
});

// GET /api/posts/:slug  — public, returns a single published post by slug
app.get('/api/posts/:slug', (req, res) => {
  const post = db
    .prepare('SELECT id, title, slug, body, cover_image, cover_focal_x, cover_focal_y, cover_zoom, created_at FROM posts WHERE slug = ? AND published = 1')
    .get(req.params.slug);
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

// POST /api/posts  — admin, create a post
app.post('/api/posts', requireAuth, (req, res) => {
  const { title, body = '', published = 0 } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title is required' });

  const slug = toSlug(title);
  try {
    const info = db
      .prepare('INSERT INTO posts (title, slug, body, published) VALUES (?, ?, ?, ?)')
      .run(title, slug, body, published ? 1 : 0);
    res.status(201).json({ id: info.lastInsertRowid, slug });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A post with that title already exists' });
    }
    throw e;
  }
});

// PUT /api/posts/:id  — admin, update a post
app.put('/api/posts/:id', requireAuth, (req, res) => {
  const { title, body, published } = req.body || {};
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const newTitle     = title     !== undefined ? title     : existing.title;
  const newBody      = body      !== undefined ? body      : existing.body;
  const newPublished = published !== undefined ? (published ? 1 : 0) : existing.published;
  const newSlug      = title     !== undefined ? toSlug(title) : existing.slug;

  db.prepare(`
    UPDATE posts
    SET title = ?, slug = ?, body = ?, published = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newTitle, newSlug, newBody, newPublished, req.params.id);

  res.json({ id: Number(req.params.id), slug: newSlug });
});

// DELETE /api/posts/:id  — admin, delete a post
app.delete('/api/posts/:id', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ deleted: true });
});

// POST /api/posts/:id/image  — admin, upload cover image
app.post('/api/posts/:id/image', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    // Delete old image file if it exists
    if (existing.cover_image) {
      const oldFile = path.join(IMAGES_DIR, path.basename(existing.cover_image));
      if (fs.existsSync(oldFile)) fs.unlink(oldFile, () => {});
    }

    const imageUrl = '/api/images/' + req.file.filename;
    db.prepare(`UPDATE posts SET cover_image = ?, cover_focal_x = 50, cover_focal_y = 50, cover_zoom = 1, updated_at = datetime('now') WHERE id = ?`)
      .run(imageUrl, req.params.id);

    res.json({ cover_image: imageUrl, cover_focal_x: 50, cover_focal_y: 50, cover_zoom: 1 });
  });
});

// DELETE /api/posts/:id/image  — admin, remove cover image
app.delete('/api/posts/:id/image', requireAuth, (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (existing.cover_image) {
    const file = path.join(IMAGES_DIR, path.basename(existing.cover_image));
    if (fs.existsSync(file)) fs.unlink(file, () => {});
  }

  db.prepare(`UPDATE posts SET cover_image = NULL, cover_focal_x = 50, cover_focal_y = 50, cover_zoom = 1, updated_at = datetime('now') WHERE id = ?`)
    .run(req.params.id);

  res.json({ deleted: true });
});

// PUT /api/posts/:id/image  — admin, update focal point and zoom
app.put('/api/posts/:id/image', requireAuth, (req, res) => {
  const { cover_focal_x, cover_focal_y, cover_zoom } = req.body || {};
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const fx = cover_focal_x !== undefined ? Number(cover_focal_x) : existing.cover_focal_x;
  const fy = cover_focal_y !== undefined ? Number(cover_focal_y) : existing.cover_focal_y;
  const fz = cover_zoom    !== undefined ? Number(cover_zoom)    : existing.cover_zoom;

  db.prepare(`UPDATE posts SET cover_focal_x = ?, cover_focal_y = ?, cover_zoom = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(fx, fy, fz, req.params.id);

  res.json({ cover_focal_x: fx, cover_focal_y: fy, cover_zoom: fz });
});

// POST /api/images  — admin, upload a standalone inline image
app.post('/api/images', requireAuth, (req, res) => {
  uploadInline.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });
    res.json({ url: '/api/images/' + req.file.filename });
  });
});

// GET /api/images/:filename  — public, serve uploaded images
app.get('/api/images/:filename', (req, res) => {
  const file = path.join(IMAGES_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Not found' });
  res.sendFile(file);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`keith-api listening on port ${PORT}`);
});
