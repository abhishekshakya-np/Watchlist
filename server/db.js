/**
 * Database layer: SQLite (local) or PostgreSQL (Render DATABASE_URL).
 * Exposes async query, queryOne, run, insertReturningId, transaction.
 */

import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Convert ? placeholders to $1, $2 for pg
function toPgParams(sql) {
  let n = 0;
  return sql.replace(/\?/g, () => `$${++n}`);
}

let sqliteDb = null;
let pgPool = null;
let isPg = false;

function getSqliteDb() {
  return sqliteDb;
}

async function init() {
  if (process.env.DATABASE_URL) {
    const pg = await import('pg');
    const { Pool } = pg.default;
    pgPool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    isPg = true;
    await runPgSchema();
    return;
  }
  const Database = (await import('better-sqlite3')).default;
  const dataDir = join(__dirname, 'data');
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, 'watchlist.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  runSqliteSchema(sqliteDb);
}

function runSqliteSchema(db) {
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
      updated_at TEXT DEFAULT (datetime('now')),
      native_title TEXT,
      romaji TEXT,
      note TEXT,
      source_credit TEXT,
      source_type TEXT,
      chapters INTEGER,
      mean_score REAL,
      popularity_rank INTEGER,
      name TEXT
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
}

async function runPgSchema() {
  const client = await pgPool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS titles (
        id SERIAL PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        alternate_title TEXT,
        cover_image TEXT,
        banner_image TEXT,
        media_type TEXT NOT NULL CHECK (media_type IN ('game','book','movie','series')),
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
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        native_title TEXT,
        romaji TEXT,
        note TEXT,
        source_credit TEXT,
        source_type TEXT,
        chapters INTEGER,
        mean_score REAL,
        popularity_rank INTEGER,
        name TEXT
      );
      CREATE TABLE IF NOT EXISTS user_list (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        score INTEGER,
        progress TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, title_id)
      );
      CREATE INDEX IF NOT EXISTS idx_titles_media_type ON titles(media_type);
      CREATE INDEX IF NOT EXISTS idx_titles_slug ON titles(slug);
      CREATE INDEX IF NOT EXISTS idx_user_list_user ON user_list(user_id);
    `);
  } finally {
    client.release();
  }
}

async function query(sql, params = []) {
  if (isPg) {
    const res = await pgPool.query(toPgParams(sql), params);
    return res.rows;
  }
  const db = getSqliteDb();
  return Promise.resolve(db.prepare(sql).all(...params));
}

async function queryOne(sql, params = []) {
  if (isPg) {
    const res = await pgPool.query(toPgParams(sql), params);
    return res.rows[0] ?? null;
  }
  const db = getSqliteDb();
  return Promise.resolve(db.prepare(sql).get(...params) ?? null);
}

async function run(sql, params = []) {
  if (isPg) {
    const res = await pgPool.query(toPgParams(sql), params);
    return { changes: res.rowCount ?? 0 };
  }
  const db = getSqliteDb();
  const r = db.prepare(sql).run(...params);
  return Promise.resolve({ changes: r.changes });
}

async function insertReturningId(sql, params = []) {
  if (isPg) {
    if (!sql.trim().toUpperCase().includes('RETURNING')) sql = sql.trim() + ' RETURNING id';
    const res = await pgPool.query(toPgParams(sql), params);
    return res.rows[0]?.id ?? null;
  }
  const db = getSqliteDb();
  db.prepare(sql).run(...params);
  const row = db.prepare('SELECT last_insert_rowid() as id').get();
  return Promise.resolve(row?.id ?? null);
}

async function transaction(fn) {
  if (isPg) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        query: (sql, params) => client.query(toPgParams(sql), params).then(r => r.rows),
        queryOne: (sql, params) => client.query(toPgParams(sql), params).then(r => r.rows[0] ?? null),
        run: (sql, params) => client.query(toPgParams(sql), params).then(r => ({ changes: r.rowCount ?? 0 })),
      };
      await fn(tx);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    return;
  }
  const db = getSqliteDb();
  const tx = {
    query: (sql, params = []) => Promise.resolve(db.prepare(sql).all(...params)),
    queryOne: (sql, params = []) => Promise.resolve(db.prepare(sql).get(...params) ?? null),
    run: (sql, params = []) => Promise.resolve(db.prepare(sql).run(...params)).then(r => ({ changes: r.changes })),
  };
  return new Promise((resolve, reject) => {
    try {
      db.exec('BEGIN');
      fn(tx).then(() => {
        db.exec('COMMIT');
        resolve();
      }).catch((e) => {
        try { db.exec('ROLLBACK'); } catch (_) {}
        reject(e);
      });
    } catch (e) {
      try { db.exec('ROLLBACK'); } catch (_) {}
      reject(e);
    }
  });
}

export default { init, query, queryOne, run, insertReturningId, transaction, isPg: () => isPg };
