# Watchlist – React + Node + SQLite with backup/restore

**One backend file + one React file** = full watchlist site (Home, Browse, Search, detail pages, My lists, backup/restore).

**GitHub:** [abhishekshakya-np/Watchlist](https://github.com/abhishekshakya-np/Watchlist) · [Profile](https://github.com/abhishekshakya-np)

**Free public link (one URL, shared data):** Deploy to [Render.com](https://render.com) (free) — see [docs/DEPLOY.md](docs/DEPLOY.md). You get a link like `https://watchlist-xxxx.onrender.com`; open it from any device or place. Anything you or others add is visible to everyone.

## What’s included

- **Backend (1 file):** `server/server.js` — Node + Express + SQLite in a single file: schema, migrations, titles CRUD, feeds, user list, backup export/restore.
- **Frontend (1 file):** `client/src/App.jsx` — React app in a single file: API helpers, Layout, all components (TitleCard, FilterBar, Sidebar, Detail hero, List widget), and all pages (Home, Browse, Search, Title detail, My lists, Backup, Add title). Styles live in `client/src/index.css`.

## Quick start

### Development (one URL + hot reload)

From the repo root:

```bash
npm install
cd server && npm install && cd ..
npm run dev
```

Then open **http://localhost:3001** in your browser.

**Windows (double-click):** run `scripts/start-watchlist-windows.bat` from Explorer, or create a shortcut to that file. It installs missing dependencies, clears port **3001** if something else is using it, waits until the server responds, then opens your default browser. If the browser never opens, go to **http://localhost:3001** manually once the window shows `http://localhost:3001`.

- **One process, one URL:** App and API both at **http://localhost:3001**.
- **Hot reload:** Edit `client/src/App.jsx` or `client/src/index.css` and save — the browser updates without refresh.
- **Server auto-restart:** Edit `server/server.js` (or `server/db.js`) and save — the server restarts; refresh the page if needed.

### Production

```bash
npm run serve
```

Then open **http://localhost:3001**. Built app + API, no hot reload.

**Port 3001 in use?** Stop any other server (Ctrl+C), then on Windows: `netstat -ano | findstr :3001`, then `taskkill /PID <PID> /F`.

### Push to GitHub (abhishekshakya-np/Watchlist)

```bash
git add .
git commit -m "Watchlist: React + Node + SQLite"
git branch -M main
git push -u origin main
```

If the remote repo already has content, pull first: `git pull origin main --allow-unrelated-histories`, then push.

### Look up from web (optional)

On **Add title** or **Edit title**, click **Look up online** to fetch details from the internet by type:

| Type   | Source        | Env variable   | Key required |
|--------|---------------|----------------|--------------|
| Movie  | [IMDb API](https://imdbapi.dev/) (then TMDB fallback) | `TMDB_API_KEY` only for fallback | No (IMDb is free); optional TMDB key if IMDb returns nothing |
| Series | Same as Movie | Same | Same |
| Game   | RAWG          | `RAWG_API_KEY` | Yes — [rawg.io/apidocs](https://rawg.io/apidocs) |
| Book   | Open Library  | —              | No |

```bash
export TMDB_API_KEY=your_tmdb_key   # optional fallback when IMDb has no results
export RAWG_API_KEY=your_rawg_key   # for games
# books work with no key
```

For local development, add these to `server/.env` (copy from `server/.env.example`), then restart the server. Game search will work once `RAWG_API_KEY` is set.

### Daily backup to Telegram (optional)

If `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set (in `.env` at repo root or `server/.env`), the server uploads the same JSON as **Download backup** once per day via Telegram `sendDocument`.

**`TELEGRAM_CHAT_ID` is your numeric Telegram user id** (or a group id), not the bot’s username. Two ways to get it:

1. **Helper bot:** Message [@userinfobot](https://t.me/userinfobot) (or any bot that replies with your id). Copy the number into `TELEGRAM_CHAT_ID=`. If another bot never answers, it cannot give you an id—use a different helper or method (2).
2. **Your Watchlist bot:** Open the bot **@BotFather** gave you for this project (same token as `TELEGRAM_BOT_TOKEN`). Send `/start` **there** — not only in unrelated chats like @userinfokeepbot unless that account is literally the same bot. Then from `server/` run `npm run telegram-chat-id` and paste the printed line into `.env`.

Default schedule is **04:00** on the server clock (`TELEGRAM_BACKUP_CRON`, default `0 4 * * *`). On Render that is **UTC** unless you set `TELEGRAM_BACKUP_TIMEZONE` (IANA name, e.g. `America/New_York`). Omit the Telegram variables to disable this entirely. Set `TELEGRAM_BACKUP_ON_START=1` to send one backup each time the server starts listening on its port (localhost is ready; upload runs right after the `http://localhost:…` log). Set `TELEGRAM_BACKUP_ON_BROWSER_OPEN=1` to also trigger a backup when someone opens the site (SPA load); `TELEGRAM_BACKUP_BROWSER_COOLDOWN_SEC` defaults to **300** so refreshes don’t spam Telegram. Deploy steps: [docs/DEPLOY.md](docs/DEPLOY.md) (Step 2c).

### 4. Use backup and restore

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
