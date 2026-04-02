# Watchlist – React + Node + SQLite with backup/restore

**One backend file + one React file** = full watchlist site (Home, Browse with search, detail pages, My lists, optional **admin** dashboard with login, backup/restore, and add/edit flows).

**GitHub:** [abhishekshakya-np/Watchlist](https://github.com/abhishekshakya-np/Watchlist) · [Profile](https://github.com/abhishekshakya-np)

**Free public link (one URL, shared data):** Deploy to [Render.com](https://render.com) (free) — connect this repo, use **`npm run build`** / **`npm start`** (see [`render.yaml`](render.yaml)). Optional: add a PostgreSQL instance and set **`DATABASE_URL`** so data survives restarts. You get a URL like `https://watchlist-xxxx.onrender.com`; open it from any device or place. Anything you or others add is visible to everyone.

## What’s included

- **AI / agent context:** [`AGENTS.md`](AGENTS.md) — project rules, layout, and patterns for coding assistants (read with `.cursor/rules/`).
- **Backend (1 file):** `server/server.js` — Node + Express + SQLite in a single file: schema, migrations, titles CRUD, feeds, user list, backup export/restore.
- **Frontend (1 file):** `client/src/App.jsx` — React app in a single file: API helpers, Layout, all components (TitleCard, FilterBar, Sidebar, Detail hero, List widget), and all pages (Home, Browse, Title detail, My lists, Backup, Add title). Styles are SCSS with BEM partials under `client/src/styles/` (entry: `main.scss`).

## Quick start

### Development (one URL + hot reload)

From the repo root:

```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
npm run dev
```

(Or once: **`npm run install:all`** from the repo root — installs root, `server/`, and `client/` deps.)

Then open **http://localhost:3001** in your browser.

**Windows (double-click):** run `scripts/start-watchlist-windows.bat` from Explorer, or create a shortcut to that file. It installs missing dependencies, clears port **3001** if something else is using it, waits until the server responds, then opens your default browser. If the browser never opens, go to **http://localhost:3001** manually once the window shows `http://localhost:3001`.

- **One process, one URL:** App and API both at **http://localhost:3001**.
- **Hot reload:** Edit `client/src/App.jsx` or `client/src/styles/**/*.scss` and save — the browser updates without refresh.
- **Server auto-restart:** Edit `server/server.js` (or `server/db.js`) and save — the server restarts; refresh the page if needed.

**If you use Vite on port 5173:** the UI proxies `/api` to **127.0.0.1:3001** (override with **`VITE_API_PROXY_PORT`**). From the repo root run **`npm run install:all`** once if `client` deps are missing, then **`npm run dev:split`** (API + Vite). If **port 3001 is already in use** (e.g. another `npm run dev`), use **`npm run dev:split:3002`** instead. Easiest workflow is still **`npm run dev`** and open **http://localhost:3001** only.

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

From the **admin** area (**Add title** / **Edit title**), click **Look up online** to fetch details from the internet by type:

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

Default schedule is **04:00** on the server clock (`TELEGRAM_BACKUP_CRON`, default `0 4 * * *`). On Render that is **UTC** unless you set `TELEGRAM_BACKUP_TIMEZONE` (IANA name, e.g. `America/New_York`). Omit the Telegram variables to disable this entirely. Set `TELEGRAM_BACKUP_ON_START=1` to send one backup each time the server starts listening on its port (localhost is ready; upload runs right after the `http://localhost:…` log). Set `TELEGRAM_BACKUP_ON_BROWSER_OPEN=1` to also trigger a backup when someone opens the site (SPA load); `TELEGRAM_BACKUP_BROWSER_COOLDOWN_SEC` defaults to **300** so refreshes don’t spam Telegram. That hook **does not require admin login**, even when **`ADMIN_PASSWORD`** is set, so Telegram backups still run for anonymous visitors. On Render, add the same Telegram env vars under **Environment**.

### 4. Use backup and restore

- **Export / restore in the UI:** Open **Admin** (`/admin`), then **Backup and restore**. If **`ADMIN_PASSWORD`** is set, sign in first; the same cookie is used for **Download backup** and file restore.
- **Export:** **Download backup** saves a file like `watchlist-backup-2025-03-03.json` with `titles`, `user_list`, and `bookmarks`.
- **Restore:** Choose a previously saved backup JSON file. Full restore replaces titles and list data; if the file includes `tables.bookmarks`, bookmarks are replaced too (older exports without that key leave bookmarks as they are).

You can also call the API directly. With **`ADMIN_PASSWORD`** set, log in via **`POST /api/admin/login`** (JSON body `{"password":"…"}`) and pass the session cookie on subsequent requests (e.g. `curl -b cookies.txt -c cookies.txt …`).

```bash
# Export (save to file) — omit -b when ADMIN_PASSWORD is unset
curl -b cookies.txt -o my-backup.json http://localhost:3001/api/backup/export

# Restore (from file)
curl -b cookies.txt -X POST http://localhost:3001/api/backup/restore -H "Content-Type: application/json" -d @my-backup.json
```

## Backup format

The export is a single JSON object:

```json
{
  "version": 2,
  "exportedAt": "2025-03-03T12:00:00.000Z",
  "tables": {
    "titles": [ { "id": 1, "slug": "...", "title": "...", ... } ],
    "user_list": [ ... ],
    "bookmarks": [ { "id": 1, "url": "https://...", "label": null, "notes": null, "category": "design_tools", "image_url": null, "created_at": "..." } ]
  }
}
```

- `version` **1** exports omit `bookmarks`; they remain compatible with restore.
- Keep this file anywhere (local disk, cloud storage, version control if non-sensitive).
- Restore anytime via the UI or `POST /api/backup/restore` with this JSON in the body.

## Docs (local only)

The **`docs/`** directory is **gitignored** — keep your own Markdown notes there (e.g. extra deployment notes, `BACKEND_AND_BACKUP.md`). Nothing under `docs/` is committed. Root **`CLAUDE.md`** (e.g. for Claude Code) is also **gitignored**.

## Production notes

- Set **`ADMIN_PASSWORD`** (and optionally **`ADMIN_SESSION_SECRET`**) in the environment so only signed-in admins can change data or use backup/restore; see root **`.env.example`**. Without it, the app stays in open shared-edit mode (legacy behavior).
- **Restore** is protected whenever **`ADMIN_PASSWORD`** is set.
- For deployment, run the Node server on a host that persists the `server/data` folder (or mount a volume). The same backup/restore API works in production.
- Use HTTPS in production; consider backing up the DB file or the export JSON regularly (e.g. cron calling `/api/backup/export` and saving to disk or S3).
