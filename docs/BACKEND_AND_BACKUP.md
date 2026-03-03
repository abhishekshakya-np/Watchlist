# Backend and Backup Implementation Guide

This document explains how to implement a **free**, **reliable** server-side data layer for your React watchlist site, with **full export/restore** so you can keep a local backup and restore it anytime.

---

## 1. Requirements recap

- **Free to use** – no paid services required for development or small-scale production.
- **Reliable** – structured storage (tables/collections), not just flat files.
- **Full backup** – export all data in a single, portable format (e.g. JSON or SQLite file).
- **Restore** – re-import a backup to recreate the database state.

---

## 2. Recommended approaches (free tier / self-hosted)

### Option A: Node + SQLite + backup API (recommended for full control)

| Aspect | Details |
|--------|--------|
| **Stack** | Node.js + Express + SQLite (e.g. `better-sqlite3`) |
| **Cost** | Free; you host the server (local, VPS, or free-tier PaaS with persistent disk). |
| **Backup** | (1) Copy the `.db` file, or (2) `GET /api/backup/export` returns JSON of all tables. |
| **Restore** | Replace the `.db` file, or `POST /api/backup/restore` with the JSON backup. |
| **Pros** | No vendor lock-in; backup = one file or one JSON; works offline. |
| **Cons** | You run and deploy the Node server. |

Best when you want full control, simple backup (file or JSON), and no external SaaS.

---

### Option B: PocketBase (open-source, single binary)

| Aspect | Details |
|--------|--------|
| **Stack** | PocketBase (Go) + SQLite; optional React SDK or REST. |
| **Cost** | Free; self-host one executable. |
| **Backup** | Copy the `pb_data` folder (or use built-in backup hooks). |
| **Restore** | Replace `pb_data` and restart. |
| **Pros** | Admin UI, auth, real-time, file storage; backup = folder copy. |
| **Cons** | You host the binary; schema is collection-based (no raw SQL). |

Best when you want auth + admin UI + file storage with minimal code.

---

### Option C: Supabase (hosted Postgres) + custom export/restore

| Aspect | Details |
|--------|--------|
| **Stack** | Supabase (Postgres) + React; optional Edge Functions. |
| **Cost** | Free tier (500MB DB, 2 projects). |
| **Backup** | Custom API or Edge Function that reads all tables and returns JSON. |
| **Restore** | Custom API that truncates and re-inserts from JSON (with care for FKs). |
| **Pros** | Hosted DB, auth, storage; no server to maintain. |
| **Cons** | Export/restore is custom code; free tier limits. |

Best when you prefer a hosted DB and are fine implementing export/restore in code.

---

## 3. Recommended choice for your watchlist

For your plan (unified titles, user lists, filters, one design system), **Option A (Node + SQLite + backup API)** is a strong default:

1. **Aligned with your plan** – One backend API for titles, user lists, genres; filters and sort can be implemented in SQL or in the API.
2. **Backup** – One JSON export endpoint gives a complete, version-control-friendly snapshot.
3. **Restore** – One restore endpoint lets you re-import that snapshot (e.g. after migrating host or recovering from a mistake).
4. **Free** – No per-user or per-request fees; deploy on Railway, Render, Fly.io, or a VPS with a small persistent volume for the `.db` file.

The rest of this guide and the example in the repo implement **Option A** and show how backup/restore fit in.

---

## 4. High-level architecture (Option A)

```
┌─────────────────┐      HTTP (REST)      ┌─────────────────────────────┐
│  React app      │ ◄──────────────────► │  Node + Express API          │
│  (Vite/CRA)     │   /api/titles        │  - CRUD for titles, lists    │
│                 │   /api/backup/export │  - Backup export (JSON)      │
│                 │   /api/backup/restore│  - Backup restore (JSON)    │
└─────────────────┘                      └──────────────┬──────────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │  SQLite (.db)   │
                                                │  - titles       │
                                                │  - user_list    │
                                                │  - genres, etc. │
                                                └─────────────────┘
```

- **React** talks only to your API; no direct DB access.
- **Backup** = call `GET /api/backup/export` and save the response as `watchlist-backup-YYYY-MM-DD.json`.
- **Restore** = call `POST /api/backup/restore` with that JSON in the body (with appropriate auth in production).

---

## 5. Backup export format (example)

Export should include every table your app needs to reconstruct state. Example structure:

```json
{
  "version": 1,
  "exportedAt": "2025-03-03T12:00:00.000Z",
  "tables": {
    "titles": [ { "id": 1, "slug": "show-1", "mediaType": "series", ... } ],
    "genres": [ { "id": 1, "name": "Action" } ],
    "user_list": [ { "userId": "abc", "titleId": 1, "status": "completed", "score": 8 } ]
  }
}
```

- **version** – so you can change the format later and still support old backups.
- **exportedAt** – when the backup was created.
- **tables** – one key per table; value = array of rows (no schema, just data; schema is fixed in code).

Your restore logic should:

1. Validate `version` and shape.
2. Run in a transaction: truncate (or delete) tables in dependency order, then insert rows from the JSON.
3. Preserve foreign-key order (e.g. genres before titles, titles before user_list).

---

## 6. Security and production notes

- **Restore** should be protected (e.g. API key, admin-only route, or only on localhost). Never expose restore publicly without auth.
- **Export** can be protected too if data is sensitive (e.g. user lists, private notes).
- Use **HTTPS** in production; store DB file and backups in a place that is included in your own backup strategy (e.g. server snapshot or separate backup job that calls `/api/backup/export` and saves to disk/S3).

---

## 7. Where the example code lives

- **Server (Node + Express + SQLite + backup API):** `server/` in this repo.
- **React app (minimal UI that uses the API and “Download backup”):** `client/` in this repo.

See the README in the repo root for how to run both and how to call export/restore.
