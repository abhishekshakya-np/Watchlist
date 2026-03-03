# Watchlist – React + Node + SQLite with backup/restore

**One backend file + one React file** = full watchlist site (Home, Browse, Search, detail pages, My lists, backup/restore).

**GitHub:** [abhishekshakya-np/Watchlist](https://github.com/abhishekshakya-np/Watchlist) · [Profile](https://github.com/abhishekshakya-np)

## What’s included

- **Backend (1 file):** `server/server.js` — Node + Express + SQLite in a single file: schema, migrations, titles CRUD, feeds, user list, backup export/restore.
- **Frontend (1 file):** `client/src/App.jsx` — React app in a single file: API helpers, Layout, all components (TitleCard, FilterBar, Sidebar, Detail hero, List widget), and all pages (Home, Browse, Search, Title detail, My lists, Backup, Add title). Styles live in `client/src/index.css`.

## Quick start

### 1. Install and run the server

```bash
cd server
npm install
npm start
```

Server runs at **http://localhost:3001**. The SQLite file is created at `server/data/watchlist.db`.

### 2. Install and run the React app

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:5173** and proxies `/api` to the server.

### Push to GitHub (abhishekshakya-np/Watchlist)

```bash
git add .
git commit -m "Watchlist: React + Node + SQLite"
git branch -M main
git push -u origin main
```

If the remote repo already has content, pull first: `git pull origin main --allow-unrelated-histories`, then push.

### 3. Use backup and restore

- **Export:** In the UI, click **Download backup**. A file like `watchlist-backup-2025-03-03.json` is downloaded with all `titles` and `user_list` data.
- **Restore:** Click **Restore** and choose a previously saved backup JSON file. The server replaces current data with the backup (in a transaction).

You can also call the API directly:

```bash
# Export (save to file)
curl -o my-backup.json http://localhost:3001/api/backup/export

# Restore (from file)
curl -X POST http://localhost:3001/api/backup/restore -H "Content-Type: application/json" -d @my-backup.json
```

## Backup format

The export is a single JSON object:

```json
{
  "version": 1,
  "exportedAt": "2025-03-03T12:00:00.000Z",
  "tables": {
    "titles": [ { "id": 1, "slug": "...", "title": "...", ... } ],
    "user_list": [ ... ]
  }
}
```

- Keep this file anywhere (local disk, cloud storage, version control if non-sensitive).
- Restore anytime via the UI or `POST /api/backup/restore` with this JSON in the body.

## Docs

- **[docs/BACKEND_AND_BACKUP.md](docs/BACKEND_AND_BACKUP.md)** – Full explanation of free backend options (Node+SQLite, PocketBase, Supabase) and how backup/restore fit into your watchlist plan.

## Production notes

- **Restore** should be protected (e.g. API key or admin-only) so only you can replace data.
- For deployment, run the Node server on a host that persists the `server/data` folder (or mount a volume). The same backup/restore API works in production.
- Use HTTPS in production; consider backing up the DB file or the export JSON regularly (e.g. cron calling `/api/backup/export` and saving to disk or S3).
