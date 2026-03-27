/**
 * Watchlist backend — SQLite (local) or PostgreSQL (Render DATABASE_URL) + backup + all API routes.
 * Run: node server.js
 */
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { createServer as createHttpServer } from 'http';
import { existsSync } from 'fs';
import { readdir, unlink, stat } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { setupTelegramBackup, runTelegramBackupNow } from './telegram-backup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Load .env from project root then server/ so key in either place works
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

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

async function mergeBackup(backup) {
  if (!backup?.tables?.titles) throw new Error('Invalid backup');
  const isPg = db.isPg();
  const existingRows = await db.query('SELECT id, slug FROM titles');
  const existingBySlug = new Map(existingRows.map((r) => [r.slug, r.id]));
  const backupIdToOurId = new Map(); // backup title id -> our title id

  await db.transaction(async (tx) => {
    for (const row of backup.tables.titles || []) {
      const slug = row.slug ?? row.title?.toLowerCase().replace(/\s+/g, '-');
      if (!slug) continue;
      const ourId = existingBySlug.get(slug);
      if (ourId != null) {
        backupIdToOurId.set(row.id, ourId);
        continue;
      }
      const cols = TITLE_COLUMNS.filter((c) => row[c] !== undefined);
      const vals = cols.map((c) => row[c]);
      if (cols.length === 0) continue;
      let newId;
      if (isPg) {
        const inserted = await tx.queryOne(`INSERT INTO titles (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING id`, vals);
        newId = inserted?.id ?? (await tx.queryOne('SELECT id FROM titles WHERE slug = $1', [row.slug ?? slug]))?.id;
      } else {
        await tx.run(`INSERT INTO titles (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`, vals);
        const inserted = await tx.queryOne('SELECT id FROM titles WHERE slug = ?', [row.slug ?? slug]);
        newId = inserted?.id;
      }
      if (newId) {
        backupIdToOurId.set(row.id, newId);
        existingBySlug.set(slug, newId);
      }
    }
    const existingList = await tx.query('SELECT user_id, title_id FROM user_list');
    const listKey = (uid, tid) => `${uid}:${tid}`;
    const existingSet = new Set(existingList.map((r) => listKey(r.user_id, r.title_id)));
    for (const row of backup.tables.user_list || []) {
      const ourTitleId = backupIdToOurId.get(row.title_id);
      if (ourTitleId == null) continue;
      const key = listKey(row.user_id ?? DEMO_USER, ourTitleId);
      if (existingSet.has(key)) continue;
      existingSet.add(key);
      if (isPg) {
        await tx.run('INSERT INTO user_list (user_id, title_id, status, score, progress) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, title_id) DO NOTHING', [row.user_id ?? DEMO_USER, ourTitleId, row.status ?? 'planning', row.score ?? null, row.progress ?? null]);
      } else {
        await tx.run('INSERT OR IGNORE INTO user_list (user_id, title_id, status, score, progress) VALUES (?, ?, ?, ?, ?)', [row.user_id ?? DEMO_USER, ourTitleId, row.status ?? 'planning', row.score ?? null, row.progress ?? null]);
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

// Related titles (seasons, parts, remakes, other)
app.get('/api/titles/:id/related', async (req, res) => {
  try {
    const titleId = req.params.id;
    const rows = await db.query(
      'SELECT r.relation_type, r.related_title_id, t.slug, t.title, t.cover_image, t.media_type, t.release_date FROM title_relations r JOIN titles t ON t.id = r.related_title_id WHERE r.title_id = ? ORDER BY r.relation_type, t.release_date ASC, t.id ASC',
      [titleId]
    );
    res.json(rows.map((r) => ({ relation_type: r.relation_type, related_title_id: r.related_title_id, title: { id: r.related_title_id, slug: r.slug, title: r.title, cover_image: r.cover_image, media_type: r.media_type, release_date: r.release_date } })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/titles/:id/related', async (req, res) => {
  try {
    const titleId = Number(req.params.id);
    const { related_title_id, relation_type } = req.body;
    const type = ['season', 'part', 'remake', 'remaster', 'other'].includes(relation_type) ? relation_type : 'other';
    const relatedId = Number(related_title_id);
    if (!relatedId || relatedId === titleId) return res.status(400).json({ error: 'Invalid related_title_id' });
    const exists = await db.queryOne('SELECT id FROM titles WHERE id = ?', [titleId]);
    const relatedExists = await db.queryOne('SELECT id FROM titles WHERE id = ?', [relatedId]);
    if (!exists || !relatedExists) return res.status(404).json({ error: 'Not found' });
    const dup = await db.queryOne('SELECT id FROM title_relations WHERE title_id = ? AND related_title_id = ?', [titleId, relatedId]);
    if (dup) return res.status(409).json({ error: 'Already related' });
    if (db.isPg()) {
      await db.run('INSERT INTO title_relations (title_id, related_title_id, relation_type) VALUES ($1, $2, $3)', [titleId, relatedId, type]);
    } else {
      await db.run('INSERT INTO title_relations (title_id, related_title_id, relation_type) VALUES (?, ?, ?)', [titleId, relatedId, type]);
    }
    res.status(201).json({ ok: true, relation_type: type, related_title_id: relatedId });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.delete('/api/titles/:id/related/:relatedId', async (req, res) => {
  try {
    const titleId = req.params.id;
    const relatedId = req.params.relatedId;
    const r = db.isPg()
      ? await db.run('DELETE FROM title_relations WHERE title_id = $1 AND related_title_id = $2', [titleId, relatedId])
      : await db.run('DELETE FROM title_relations WHERE title_id = ? AND related_title_id = ?', [titleId, relatedId]);
    if (r.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
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

    // Slug already in use (friendly 409 instead of UNIQUE constraint error)
    const existingBySlug = await db.queryOne('SELECT * FROM titles WHERE slug = ?', [row.slug]);
    if (existingBySlug) {
      return res.status(409).json({
        error: 'This URL is already in use by another title. Use a different title or open the existing one.',
        code: 'DUPLICATE_SLUG',
        existing: rowToTitle(existingBySlug),
      });
    }

    // Duplicate check: same name (title or name), same type, same release year
    const normTitle = (row.title || row.name || '').toString().trim().toLowerCase();
    const releaseYear = row.release_date ? String(row.release_date).trim().slice(0, 4) : null;
    if (normTitle) {
      const candidates = await db.query(
        'SELECT id, slug, title, name, media_type, release_date FROM titles WHERE (LOWER(TRIM(COALESCE(title,\'\'))) = ? OR LOWER(TRIM(COALESCE(name,\'\'))) = ?) AND media_type = ?',
        [normTitle, normTitle, row.media_type]
      );
      const duplicate = candidates.find((t) => {
        const existingYear = t.release_date ? String(t.release_date).trim().slice(0, 4) : null;
        if (releaseYear === null && existingYear === null) return true;
        if (releaseYear !== null && existingYear !== null && releaseYear === existingYear) return true;
        return false;
      });
      if (duplicate) {
        const existingTitle = await db.queryOne('SELECT * FROM titles WHERE id = ?', [duplicate.id]);
        return res.status(409).json({
          error: 'A title with this name, type, and release already exists.',
          code: 'DUPLICATE_TITLE',
          existing: rowToTitle(existingTitle),
        });
      }
    }

    const params = TITLE_COLUMNS.map(k => row[k]);
    const id = await db.insertReturningId(`INSERT INTO titles (${TITLE_COLUMNS.join(',')}) VALUES (${TITLE_COLUMNS.map(() => '?').join(',')})`, params);
    const inserted = await db.queryOne('SELECT * FROM titles WHERE id = ?', [id]);
    res.status(201).json(rowToTitle(inserted));
  } catch (e) {
    const msg = e.message || '';
    if ((msg.includes('UNIQUE') && msg.includes('slug')) || msg.includes('duplicate key')) {
      const attemptedSlug = (req.body.slug || req.body.title || '')
        .toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `title-${Date.now()}`;
      const bySlug = await db.queryOne('SELECT * FROM titles WHERE slug = ?', [attemptedSlug]);
      if (bySlug) return res.status(409).json({ error: 'This URL is already in use. Use a different title or open the existing one.', code: 'DUPLICATE_SLUG', existing: rowToTitle(bySlug) });
      return res.status(409).json({ error: 'This URL is already in use. Try a different title or add a custom Slug below.', code: 'DUPLICATE_SLUG' });
    }
    res.status(400).json({ error: msg });
  }
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
app.post('/api/backup/merge', async (req, res) => {
  try {
    await mergeBackup(req.body);
    res.json({ ok: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

let lastTelegramBrowserBackupAt = 0;
app.post('/api/backup/trigger-telegram', async (req, res) => {
  try {
    if (!/^1|true|yes$/i.test(String(process.env.TELEGRAM_BACKUP_ON_BROWSER_OPEN || '').trim())) {
      return res.json({ ok: true, skipped: true, reason: 'disabled' });
    }
    const secret = process.env.TELEGRAM_BACKUP_BROWSER_SECRET?.trim();
    if (secret) {
      const got = req.get('X-Watchlist-Telegram-Secret');
      if (got !== secret) return res.status(403).json({ ok: false, error: 'forbidden' });
    }
    const cooldownSec = Math.max(60, parseInt(process.env.TELEGRAM_BACKUP_BROWSER_COOLDOWN_SEC || '300', 10) || 300);
    const now = Date.now();
    if (now - lastTelegramBrowserBackupAt < cooldownSec * 1000) {
      return res.json({ ok: true, skipped: true, reason: 'cooldown' });
    }
    lastTelegramBrowserBackupAt = now;
    const result = await runTelegramBackupNow(exportBackup);
    if (!result.ok && result.error === 'not_configured') {
      return res.json({ ok: true, skipped: true, reason: 'not_configured' });
    }
    if (!result.ok) return res.status(502).json({ ok: false, error: result.error });
    res.json({ ok: true, skipped: false, filename: result.filename });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ----- Look up title from web: IMDb (movie/series), TMDB fallback, RAWG (game), Open Library (book) -----
const TMDB_KEY = process.env.TMDB_API_KEY;
const RAWG_KEY = process.env.RAWG_API_KEY;
const IMDB_BASE = 'https://api.imdbapi.dev';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p';

function normLookupResult(r) {
  return { title: r.title ?? '', release_date: r.release_date ?? null, description: r.description ?? null, description_short: r.description_short ?? null, cover_image: r.cover_image ?? null, banner_image: r.banner_image ?? null, alternate_title: r.alternate_title ?? null, format: r.format ?? null };
}

// IMDb type filter: API returns camelCase (movie, tvSeries, tvMiniSeries). Normalize for comparison.
const IMDB_MOVIE_TYPES = ['MOVIE'];
const IMDB_SERIES_TYPES = ['TV_SERIES', 'TV_MINI_SERIES', 'TV_SPECIAL', 'TV_MOVIE', 'TVSERIES', 'TVMINISERIES', 'TVSPECIAL', 'TVMOVIE'];

app.get('/api/lookup', async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const type = req.query.type; // 'movie' | 'series' | 'game' | 'book'
    const expandSeasons = req.query.expand === 'seasons';
    if (!q) return res.json([]);
    if (!['movie', 'series', 'game', 'book'].includes(type)) return res.json([]);

    // ----- Series: expand to seasons (S1, S2, …) when requested (requires TMDB) -----
    if (type === 'series' && expandSeasons) {
      if (!TMDB_KEY) return res.json({ results: [], error: 'Season list requires TMDB API key. Add TMDB_API_KEY to server/.env (get one at themoviedb.org).' });
      try {
        const searchRes = await fetch(`${TMDB_BASE}/search/tv?api_key=${encodeURIComponent(TMDB_KEY)}&query=${encodeURIComponent(q)}&language=en-US`);
        const searchData = await searchRes.json().catch(() => ({}));
        const show = (searchData.results || [])[0];
        if (!show || !show.id) return res.json({ results: [], error: 'No series found for this title.' });
        const tvRes = await fetch(`${TMDB_BASE}/tv/${show.id}?api_key=${encodeURIComponent(TMDB_KEY)}&language=en-US`);
        const tv = await tvRes.json().catch(() => ({}));
        const seasons = Array.isArray(tv.seasons) ? tv.seasons : [];
        const showName = tv.name || show.name || q;
        const results = seasons
          .filter((s) => s.season_number != null && s.season_number >= 1)
          .map((s) => {
            const title = `${showName} - Season ${s.season_number}`;
            const release = s.air_date || null;
            const poster = s.poster_path ? `${TMDB_IMG}/w500${s.poster_path}` : null;
            const backdrop = (tv.backdrop_path || show.backdrop_path) ? `${TMDB_IMG}/w1280${tv.backdrop_path || show.backdrop_path}` : null;
            return normLookupResult({ title, release_date: release, description: s.overview || null, description_short: (s.overview || '').slice(0, 200) || null, cover_image: poster, banner_image: backdrop });
          });
        return res.json(results);
      } catch (e) {
        return res.status(500).json({ results: [], error: e.message || 'Failed to load seasons' });
      }
    }

    // ----- Movie / Series: IMDb (imdbapi.dev) first, then TMDB fallback -----
    if (type === 'movie' || type === 'series') {
      const allowedTypes = type === 'movie' ? IMDB_MOVIE_TYPES : IMDB_SERIES_TYPES;
      let results = [];

      // 1. Try IMDb API (free, no key) — https://imdbapi.dev
      let imdbError = null;
      try {
        const imdbUrl = `${IMDB_BASE}/search/titles?query=${encodeURIComponent(q)}&limit=20`;
        const imdbRes = await fetch(imdbUrl, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'WatchlistApp/1.0 (https://github.com/abhishekshakya-np/Watchlist)' },
        });
        const imdbData = await imdbRes.json().catch(() => ({}));
        const titles = Array.isArray(imdbData?.titles) ? imdbData.titles : [];
        if (!imdbRes.ok) imdbError = imdbData?.message || imdbData?.error || `IMDb returned ${imdbRes.status}`;
        else if (titles.length > 0) {
          const typeNorm = (t) => (t.type || '').toUpperCase().replace(/_/g, '');
          const allowedNorm = new Set(allowedTypes.map((x) => x.toUpperCase().replace(/_/g, '')));
          const mapOne = (t) => {
            const title = t.primaryTitle || t.originalTitle || '';
            const release = t.startYear ? `${String(t.startYear)}-01-01` : null;
            const plot = t.plot || '';
            const cover = t.primaryImage?.url || null;
            return normLookupResult({ title, release_date: release, description: plot || null, description_short: (plot || '').slice(0, 200) || null, cover_image: cover, banner_image: cover, alternate_title: t.originalTitle && t.originalTitle !== title ? t.originalTitle : null });
          };
          const filtered = titles.filter((t) => t.type && (allowedNorm.has(typeNorm(t)) || (type === 'series' && /SERIES|SPECIAL|TVMOVIE/i.test((t.type || '').replace(/_/g, '')))));
          results = (filtered.length > 0 ? filtered : titles).slice(0, 10).map(mapOne);
        }
      } catch (e) { imdbError = e.message || 'IMDb request failed'; }

      if (results.length === 0 && imdbError) console.warn('[lookup] IMDb:', imdbError);

      // If we have results, return them. If none and we have an error, return it so the client can show it.
      const returnError = results.length === 0 ? imdbError : null;

      // 2. Fallback to TMDB only if IMDb returned nothing and TMDB key is set (optional)
      if (results.length === 0 && TMDB_KEY) {
        try {
          const endpoint = type === 'movie' ? `${TMDB_BASE}/search/movie` : `${TMDB_BASE}/search/tv`;
          const r = await fetch(`${endpoint}?api_key=${encodeURIComponent(TMDB_KEY)}&query=${encodeURIComponent(q)}&language=en-US`);
          const data = await r.json().catch(() => ({}));
          if (r.ok && (data.results || []).length > 0) {
            results = (data.results || []).slice(0, 10).map((item) => {
              const title = type === 'movie' ? item.title : item.name;
              const release = type === 'movie' ? item.release_date : item.first_air_date;
              const poster = item.poster_path ? `${TMDB_IMG}/w500${item.poster_path}` : null;
              const backdrop = item.backdrop_path ? `${TMDB_IMG}/w1280${item.backdrop_path}` : null;
              return normLookupResult({ title, release_date: release || null, description: item.overview || null, description_short: (item.overview || '').slice(0, 200) || null, cover_image: poster, banner_image: backdrop });
            });
          }
        } catch (_) { /* keep existing results (e.g. from IMDb) or [] */ }
      }

      // No results: return list and optional error message so client can show "No results" or the actual error (only when TMDB fallback didn't fill results)
      if (results.length === 0 && returnError) return res.json({ results: [], error: returnError });
      return res.json(results);
    }

    // ----- Game: RAWG -----
    if (type === 'game') {
      if (!RAWG_KEY) return res.status(503).json({ error: 'Look up for games needs RAWG_API_KEY. Get a free key at rawg.io/apidocs' });
      const r = await fetch(`https://api.rawg.io/api/games?key=${encodeURIComponent(RAWG_KEY)}&search=${encodeURIComponent(q)}&page_size=10`);
      if (!r.ok) return res.status(502).json({ error: 'Look up service error' });
      const data = await r.json().catch(() => ({}));
      const results = (data.results || []).slice(0, 10).map((item) => {
        const released = item.released ? `${item.released}` : null;
        const desc = item.description_raw || item.description || '';
        const short = (desc || '').slice(0, 200) || null;
        const format = Array.isArray(item.genres) && item.genres.length > 0 ? item.genres.map((g) => g.name).join(', ') : null;
        return normLookupResult({ title: item.name || '', release_date: released, description: desc || null, description_short: short, cover_image: item.background_image || null, banner_image: item.background_image || null, format });
      });
      return res.json(results);
    }

    // ----- Book: Open Library (no key) -----
    if (type === 'book') {
      const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=10`);
      if (!r.ok) return res.status(502).json({ error: 'Look up service error' });
      const data = await r.json().catch(() => ({}));
      const results = (data.docs || []).slice(0, 10).map((doc) => {
        const title = doc.title || '';
        let year = doc.first_publish_year;
        if (year == null && doc.publish_date?.[0]) {
          const pubStr = String(doc.publish_date[0]);
          year = /^\d{4}/.test(pubStr) ? pubStr.slice(0, 4) : pubStr.match(/\b(19|20)\d{2}\b/)?.[0] ?? null;
        }
        const release = year ? `${String(year)}-01-01` : null;
        const author = Array.isArray(doc.author_name) ? doc.author_name.join(', ') : (doc.author_name || '');
        const desc = author ? `By ${author}.` : null;
        const cover = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null;
        return normLookupResult({ title, release_date: release, description: desc, description_short: desc, cover_image: cover, banner_image: null, alternate_title: author || null });
      });
      return res.json(results);
    }

    res.json([]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ----- Serve React app: Vite dev (hot reload) or built static -----
const clientRoot = join(__dirname, '..', 'client');
const clientDist = join(clientRoot, 'dist');
const isDev = process.env.NODE_ENV !== 'production';

/** Vite writes `vite.config.js.timestamp-*.mjs` cache files under client/ — clear leftovers; Vite recreates what it needs. */
const VITE_TS_CACHE = /^vite\.config\.js\.timestamp.+\.mjs$/;

async function removeAllViteTimestampFiles(root) {
  let names;
  try {
    names = await readdir(root);
  } catch {
    return 0;
  }
  let removed = 0;
  for (const name of names) {
    if (!VITE_TS_CACHE.test(name)) continue;
    try {
      await unlink(join(root, name));
      removed += 1;
    } catch {
      // skip
    }
  }
  if (removed > 0) {
    console.log(`Cleared ${removed} Vite config cache file(s) before dev server (Vite will recreate as needed).`);
  }
  return removed;
}

/** While dev runs, Vite may create multiple timestamp files — keep only the newest by mtime. */
async function removeViteTimestampFilesExceptNewest(root) {
  let names;
  try {
    names = await readdir(root);
  } catch {
    return 0;
  }
  const matches = [];
  for (const name of names) {
    if (!VITE_TS_CACHE.test(name)) continue;
    const full = join(root, name);
    try {
      const st = await stat(full);
      matches.push({ full, mtime: st.mtimeMs });
    } catch {
      // skip
    }
  }
  if (matches.length <= 1) return 0;
  matches.sort((a, b) => b.mtime - a.mtime);
  let removed = 0;
  for (const { full } of matches.slice(1)) {
    try {
      await unlink(full);
      removed += 1;
    } catch {
      // skip
    }
  }
  if (removed > 0) {
    console.log(`Removed ${removed} extra Vite config cache file(s) (kept newest).`);
  }
  return removed;
}

/** Dev only: optional repeat cleanup. Set VITE_TIMESTAMP_CLEANUP_DISABLED=1 to skip. */
function scheduleViteTimestampCacheCleanup(root) {
  if (process.env.VITE_TIMESTAMP_CLEANUP_DISABLED === '1') return;
  const intervalMs = Number(process.env.VITE_TIMESTAMP_CLEANUP_INTERVAL_MS ?? 120_000);
  const firstDelayMs = Number(process.env.VITE_TIMESTAMP_CLEANUP_FIRST_DELAY_MS ?? 90_000);
  const every = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 120_000;
  const first = Number.isFinite(firstDelayMs) && firstDelayMs >= 0 ? firstDelayMs : 90_000;

  setTimeout(() => {
    void removeViteTimestampFilesExceptNewest(root);
    const id = setInterval(() => {
      void removeViteTimestampFilesExceptNewest(root);
    }, every);
    const stop = () => clearInterval(id);
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
  }, first);
}

async function start() {
  await db.init();
  const { onListen: telegramOnListen } = setupTelegramBackup(exportBackup);

  if (isDev) {
    await removeAllViteTimestampFiles(clientRoot);
    const httpServer = createHttpServer(app);
    const { createServer } = await import('vite');
    const vite = await createServer({
      configFile: join(clientRoot, 'vite.config.js'),
      root: clientRoot,
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
    });
    app.use(vite.middlewares);

    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`);
      if (db.isPg()) console.log('Using PostgreSQL (persistent)');
      console.log('Dev mode: hot reload enabled (edit client/src and save)');
      scheduleViteTimestampCacheCleanup(clientRoot);
      telegramOnListen?.();
    });
  } else {
    if (existsSync(clientDist)) {
      app.use(express.static(clientDist));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next();
        res.sendFile(join(clientDist, 'index.html'));
      });
    }
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`);
      if (db.isPg()) console.log('Using PostgreSQL (persistent)');
      telegramOnListen?.();
    });
  }
}
start().catch((err) => { console.error(err); process.exit(1); });
