/**
 * Watchlist backend — SQLite (local) or PostgreSQL (Render DATABASE_URL) + backup + all API routes.
 * Run: node server.js
 */
import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

async function exportBackup() {
  const [titles, user_list] = await Promise.all([db.query('SELECT * FROM titles'), db.query('SELECT * FROM user_list')]);
  return { version: 1, exportedAt: new Date().toISOString(), tables: { titles, user_list } };
}
async function restoreBackup(backup) {
  if (!backup?.tables) throw new Error('Invalid backup');
  const isPg = db.isPg();
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM user_list');
    await tx.run('DELETE FROM titles');
    for (const row of backup.tables.titles || []) {
      const cols = Object.keys(row);
      const vals = cols.map(c => row[c]);
      if (isPg) {
        await tx.run(`INSERT INTO titles (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT (id) DO UPDATE SET ${cols.filter(c => c !== 'id').map(c => `${c}=EXCLUDED.${c}`).join(',')}`, vals);
      } else {
        await tx.run(`INSERT OR REPLACE INTO titles (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
      }
    }
    for (const row of backup.tables.user_list || []) {
      const cols = Object.keys(row);
      const vals = cols.map(c => row[c]);
      if (isPg) {
        await tx.run(`INSERT INTO user_list (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) ON CONFLICT (user_id, title_id) DO UPDATE SET status=EXCLUDED.status, score=EXCLUDED.score, progress=EXCLUDED.progress`, vals);
      } else {
        await tx.run(`INSERT OR REPLACE INTO user_list (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
      }
    }
  });
}

const DEMO_USER = 'me';
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ----- API routes -----
app.get('/api/titles', async (req, res) => {
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
    const rows = await db.query(sql, params);
    res.json(rows.map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/titles/feed/trending', async (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? ORDER BY popularity DESC LIMIT ?' : 'SELECT * FROM titles ORDER BY popularity DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    const rows = await db.query(sql, params);
    res.json(rows.map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/feed/top', async (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? AND average_score IS NOT NULL ORDER BY average_score DESC LIMIT ?' : 'SELECT * FROM titles WHERE average_score IS NOT NULL ORDER BY average_score DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    const rows = await db.query(sql, params);
    res.json(rows.map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/feed/recent', async (req, res) => {
  try {
    const { type, limit = 8 } = req.query;
    const L = Math.min(Number(limit) || 8, 20);
    const sql = type && type !== 'all' ? 'SELECT * FROM titles WHERE media_type = ? ORDER BY release_date DESC, id DESC LIMIT ?' : 'SELECT * FROM titles ORDER BY release_date DESC, id DESC LIMIT ?';
    const params = type && type !== 'all' ? [type, L] : [L];
    const rows = await db.query(sql, params);
    res.json(rows.map(rowToTitle));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/titles/slug/:slug', async (req, res) => {
  try {
    const row = await db.queryOne('SELECT * FROM titles WHERE slug = ?', [req.params.slug]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTitle(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/titles/:id', async (req, res) => {
  try {
    const row = await db.queryOne('SELECT * FROM titles WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(rowToTitle(row));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/titles', async (req, res) => {
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
    const params = TITLE_COLUMNS.map(k => row[k]);
    const id = await db.insertReturningId(`INSERT INTO titles (${TITLE_COLUMNS.join(',')}) VALUES (${TITLE_COLUMNS.map(() => '?').join(',')})`, params);
    const inserted = await db.queryOne('SELECT * FROM titles WHERE id = ?', [id]);
    res.status(201).json(rowToTitle(inserted));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.patch('/api/titles/:id', async (req, res) => {
  try {
    const existing = await db.queryOne('SELECT * FROM titles WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const up = { ...existing, ...req.body };
    ['genres', 'tags', 'type_specific'].forEach(k => { if (typeof up[k] === 'object') up[k] = JSON.stringify(up[k]); });
    const nowExpr = db.isPg() ? 'CURRENT_TIMESTAMP' : "datetime('now')";
    const setClause = TITLE_COLUMNS.filter(c => c !== 'slug').map(c => `${c}=?`).join(',');
    const params = [...TITLE_COLUMNS.filter(c => c !== 'slug').map(c => up[c]), req.params.id];
    const r = await db.run(`UPDATE titles SET ${setClause}, updated_at=${nowExpr} WHERE id=?`, params);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    const row = await db.queryOne('SELECT * FROM titles WHERE id = ?', [req.params.id]);
    res.json(rowToTitle(row));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/titles/:id', async (req, res) => {
  try {
    const r = await db.run('DELETE FROM titles WHERE id = ?', [req.params.id]);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/user/list', async (req, res) => {
  try {
    const rows = await db.query('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? ORDER BY ul.created_at DESC', [DEMO_USER]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/user/list', async (req, res) => {
  try {
    const { title_id, status = 'planning', score, progress } = req.body;
    await db.run('INSERT INTO user_list (user_id, title_id, status, score, progress) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, title_id) DO UPDATE SET status=excluded.status, score=excluded.score, progress=excluded.progress', [DEMO_USER, title_id, status, score ?? null, progress ?? null]);
    const row = await db.queryOne('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? AND ul.title_id = ?', [DEMO_USER, title_id]);
    res.status(201).json(row);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.patch('/api/user/list/:titleId', async (req, res) => {
  try {
    const { status, score, progress } = req.body;
    const r = await db.run('UPDATE user_list SET status=COALESCE(?,status), score=?, progress=COALESCE(?,progress) WHERE user_id=? AND title_id=?', [status ?? null, score ?? null, progress ?? null, DEMO_USER, req.params.titleId]);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    const row = await db.queryOne('SELECT ul.*, t.slug, t.title, t.cover_image, t.media_type FROM user_list ul JOIN titles t ON t.id = ul.title_id WHERE ul.user_id = ? AND ul.title_id = ?', [DEMO_USER, req.params.titleId]);
    res.json(row);
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/user/list/:titleId', async (req, res) => {
  try {
    const r = await db.run('DELETE FROM user_list WHERE user_id = ? AND title_id = ?', [DEMO_USER, req.params.titleId]);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/user/list/entry/:titleId', async (req, res) => {
  try {
    const row = await db.queryOne('SELECT * FROM user_list WHERE user_id = ? AND title_id = ?', [DEMO_USER, req.params.titleId]);
    res.json(row || null);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/backup/export', async (req, res) => {
  try {
    const backup = await exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="watchlist-backup-${backup.exportedAt.slice(0, 10)}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/backup/restore', async (req, res) => {
  try {
    await restoreBackup(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ----- Serve built React app (one URL for API + app) -----
const clientDist = join(__dirname, '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
}

async function start() {
  await db.init();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Watchlist API http://localhost:${PORT}`);
    if (db.isPg()) console.log('Using PostgreSQL (persistent)');
    if (existsSync(clientDist)) console.log(`App served at http://localhost:${PORT} (open in browser)`);
  });
}
start().catch((err) => { console.error(err); process.exit(1); });
