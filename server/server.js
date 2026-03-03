/**
 * Watchlist backend — single file: SQLite + schema + backup + all API routes.
 * Run: node server.js
 */
import express from 'express';
import cors from 'cors';
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
const dbPath = join(dataDir, 'watchlist.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ----- Schema -----
db.exec(`
  CREATE TABLE IF NOT EXISTS titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    alternate_title TEXT,
    cover_image TEXT,
    banner_image TEXT,
    media_type TEXT NOT NULL CHECK(media_type IN ('game','book','movie','series')),
    format TEXT,
    genres TEXT,
    tags TEXT,
    release_status TEXT DEFAULT 'finished',
    release_date TEXT,
    release_date_end TEXT,
    season TEXT,
    average_score REAL,
    popularity INTEGER DEFAULT 0,
    description TEXT,
    description_short TEXT,
    trailer_url TEXT,
    type_specific TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS user_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    score INTEGER,
    progress TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, title_id)
  );
  CREATE INDEX IF NOT EXISTS idx_titles_media_type ON titles(media_type);
  CREATE INDEX IF NOT EXISTS idx_titles_slug ON titles(slug);
  CREATE INDEX IF NOT EXISTS idx_user_list_user ON user_list(user_id);
`);

const cols = db.prepare("PRAGMA table_info(titles)").all().map(r => r.name);
const add = (name, sql) => { if (!cols.includes(name)) { db.exec(sql); cols.push(name); } };
add('alternate_title', 'ALTER TABLE titles ADD COLUMN alternate_title TEXT');
add('cover_image', 'ALTER TABLE titles ADD COLUMN cover_image TEXT');
add('banner_image', 'ALTER TABLE titles ADD COLUMN banner_image TEXT');
add('format', 'ALTER TABLE titles ADD COLUMN format TEXT');
add('genres', 'ALTER TABLE titles ADD COLUMN genres TEXT');
add('tags', 'ALTER TABLE titles ADD COLUMN tags TEXT');
add('release_date_end', 'ALTER TABLE titles ADD COLUMN release_date_end TEXT');
add('season', 'ALTER TABLE titles ADD COLUMN season TEXT');
add('description_short', 'ALTER TABLE titles ADD COLUMN description_short TEXT');
add('trailer_url', 'ALTER TABLE titles ADD COLUMN trailer_url TEXT');
add('type_specific', 'ALTER TABLE titles ADD COLUMN type_specific TEXT');
add('native_title', 'ALTER TABLE titles ADD COLUMN native_title TEXT');
add('romaji', 'ALTER TABLE titles ADD COLUMN romaji TEXT');
add('note', 'ALTER TABLE titles ADD COLUMN note TEXT');
add('source_credit', 'ALTER TABLE titles ADD COLUMN source_credit TEXT');
add('source_type', 'ALTER TABLE titles ADD COLUMN source_type TEXT');
add('chapters', 'ALTER TABLE titles ADD COLUMN chapters INTEGER');
add('mean_score', 'ALTER TABLE titles ADD COLUMN mean_score REAL');
add('popularity_rank', 'ALTER TABLE titles ADD COLUMN popularity_rank INTEGER');
add('name', 'ALTER TABLE titles ADD COLUMN name TEXT');

// ----- Helpers -----
const TITLE_COLUMNS = ['slug', 'title', 'name', 'alternate_title', 'native_title', 'romaji', 'note', 'cover_image', 'banner_image', 'media_type', 'format', 'genres', 'tags', 'release_status', 'release_date', 'release_date_end', 'season', 'chapters', 'average_score', 'mean_score', 'popularity', 'popularity_rank', 'description', 'description_short', 'source_credit', 'source_type', 'trailer_url', 'type_specific'];
function parseJson(v) { if (v == null || v === '') return null; if (typeof v === 'string') try { return JSON.parse(v); } catch { return null; } return v; }
function rowToTitle(row) {
  if (!row) return null;
  const r = { ...row };
  if (r.genres != null) r.genres = parseJson(r.genres);
  if (r.tags != null) r.tags = parseJson(r.tags);
  if (r.type_specific != null) r.type_specific = parseJson(r.type_specific);
  return r;
}

function exportBackup() {
  const tables = { titles: db.prepare('SELECT * FROM titles').all(), user_list: db.prepare('SELECT * FROM user_list').all() };
  return { version: 1, exportedAt: new Date().toISOString(), tables };
}
function restoreBackup(backup) {
  if (!backup?.tables) throw new Error('Invalid backup');
  const run = db.transaction(() => {
    db.prepare('DELETE FROM user_list').run();
    db.prepare('DELETE FROM titles').run();
    for (const row of backup.tables.titles || []) {
      const cols = Object.keys(row);
      db.prepare(`INSERT OR REPLACE INTO titles (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map(c => row[c]));
    }
    for (const row of backup.tables.user_list || []) {
      const cols = Object.keys(row);
      db.prepare(`INSERT OR REPLACE INTO user_list (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...cols.map(c => row[c]));
    }
  });
  run();
}

const DEMO_USER = 'me';
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ----- Routes -----
app.get('/api/titles', (req, res) => {
  try {
    const { type, genre, status, year, sort = 'popularity', q } = req.query;
    let sql = 'SELECT * FROM titles WHERE 1=1';
    const params = [];
    if (type && type !== 'all') { sql += ' AND media_type = ?'; params.push(type); }
    if (status) { sql += ' AND release_status = ?'; params.push(status); }
    if (year) { sql += ' AND (release_date IS NULL OR release_date LIKE ?)'; params.push(`${year}%`); }
    if (genre) { const g = `%"${genre}"%`; sql += ' AND (genres LIKE ? OR tags LIKE ?)'; params.push(g, g); }
    if (q?.trim()) { const term = `%${q.trim()}%`; sql += ' AND (title LIKE ? OR alternate_title LIKE ? OR description LIKE ?)'; params.push(term, term, term); }
    const sortMap = { popularity: 'popularity DESC, id DESC', newest: 'id DESC', 'release-newest': 'release_date DESC', 'release-oldest': 'release_date ASC', score: 'average_score DESC', 'score-low': 'average_score ASC', title: 'title ASC' };
    sql += ' ORDER BY ' + (sortMap[sort] || sortMap.popularity);
    res.json(db.prepare(sql).all(...params).map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/titles/feed/trending', (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? ORDER BY popularity DESC LIMIT ?' : 'SELECT * FROM titles ORDER BY popularity DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    res.json(db.prepare(sql).all(...params).map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/feed/top', (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? AND average_score IS NOT NULL ORDER BY average_score DESC LIMIT ?' : 'SELECT * FROM titles WHERE average_score IS NOT NULL ORDER BY average_score DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    res.json(db.prepare(sql).all(...params).map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/feed/recent', (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? ORDER BY release_date DESC, id DESC LIMIT ?' : 'SELECT * FROM titles ORDER BY release_date DESC, id DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    res.json(db.prepare(sql).all(...params).map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/titles/slug/:slug', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM titles WHERE slug = ?').get(req.params.slug);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTitle(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM titles WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTitle(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/titles', (req, res) => {
  try {
    const b = req.body;
    const rawSlug = (b.slug || b.title || '').toString().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const slug = rawSlug || `title-${Date.now()}`;
    const row = {};
    TITLE_COLUMNS.forEach(c => {
      const camel = c.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
      let v = b[c] ?? b[camel];
      if (['genres', 'tags', 'type_specific'].includes(c)) v = typeof v === 'object' ? JSON.stringify(v) : v;
      row[c] = v ?? (c === 'slug' ? slug : c === 'media_type' ? 'series' : c === 'release_status' ? 'finished' : c === 'popularity' ? 0 : null);
    });
    row.slug = (row.slug && String(row.slug).trim()) || slug;
    row.title = row.title || 'Untitled';
    db.prepare(`INSERT INTO titles (${TITLE_COLUMNS.join(',')}) VALUES (${TITLE_COLUMNS.map(() => '?').join(',')})`).run(...TITLE_COLUMNS.map(k => row[k]));
    const inserted = db.prepare('SELECT * FROM titles WHERE id = last_insert_rowid()').get();
    res.status(201).json(rowToTitle(inserted));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.patch('/api/titles/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM titles WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const up = { ...existing, ...req.body };
    ['genres', 'tags', 'type_specific'].forEach(k => { if (typeof up[k] === 'object') up[k] = JSON.stringify(up[k]); });
    const setClause = TITLE_COLUMNS.filter(c => c !== 'slug').map(c => `${c}=?`).join(',');
    db.prepare(`UPDATE titles SET ${setClause}, updated_at=datetime('now') WHERE id=?`).run(...TITLE_COLUMNS.filter(c => c !== 'slug').map(c => up[c]), req.params.id);
    res.json(rowToTitle(db.prepare('SELECT * FROM titles WHERE id = ?').get(req.params.id)));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/titles/:id', (req, res) => {
  try {
    const r = db.prepare('DELETE FROM titles WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/list', (req, res) => {
  try {
    res.json(db.prepare('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? ORDER BY ul.created_at DESC').all(DEMO_USER));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/user/list', (req, res) => {
  try {
    const { title_id, status = 'planning', score, progress } = req.body;
    db.prepare('INSERT INTO user_list (user_id, title_id, status, score, progress) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, title_id) DO UPDATE SET status=excluded.status, score=excluded.score, progress=excluded.progress').run(DEMO_USER, title_id, status, score ?? null, progress ?? null);
    const row = db.prepare('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? AND ul.title_id = ?').get(DEMO_USER, title_id);
    res.status(201).json(row);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.patch('/api/user/list/:titleId', (req, res) => {
  try {
    const { status, score, progress } = req.body;
    const r = db.prepare('UPDATE user_list SET status=COALESCE(?,status), score=?, progress=COALESCE(?,progress) WHERE user_id=? AND title_id=?').run(status ?? null, score ?? null, progress ?? null, DEMO_USER, req.params.titleId);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json(db.prepare('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? AND ul.title_id = ?').get(DEMO_USER, req.params.titleId));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/user/list/:titleId', (req, res) => {
  try {
    const r = db.prepare('DELETE FROM user_list WHERE user_id = ? AND title_id = ?').run(DEMO_USER, req.params.titleId);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/user/list/entry/:titleId', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM user_list WHERE user_id = ? AND title_id = ?').get(DEMO_USER, req.params.titleId) || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backup/export', (req, res) => {
  try {
    const backup = exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="watchlist-backup-${backup.exportedAt.slice(0, 10)}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/backup/restore', (req, res) => {
  try {
    restoreBackup(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Watchlist API http://localhost:${PORT}`));
