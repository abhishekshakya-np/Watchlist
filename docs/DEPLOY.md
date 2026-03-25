# Deploy Watchlist so you can access it from anywhere

**Goal:** One **free public link** — open it from any browser, any place. When you or anyone adds a title, **everyone sees it** (shared watchlist).

---

## Free public site (one link, shared data for everyone)

Deploy to **Render.com** (free). You get a URL like `https://watchlist-xxxx.onrender.com`. Anyone who opens that link can use the app and see the same titles (shared data).

### Step 1: Push your code to GitHub

Make sure your Watchlist repo is on GitHub (e.g. [github.com/abhishekshakya-np/Watchlist](https://github.com/abhishekshakya-np/Watchlist)).

### Step 2: Deploy on Render (free)

1. Go to **[render.com](https://render.com)** and sign up (free).
2. Click **New +** → **Web Service**.
3. **Connect** your GitHub repo `abhishekshakya-np/Watchlist` (or your fork).
4. Use these settings:
   - **Name:** `watchlist` (or any name)
   - **Root Directory:** leave **empty** (use repo root)
   - **Runtime:** Node
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click **Create Web Service**. Render will install deps, build the client, and start the server.
6. When it finishes, you’ll get a URL like **`https://watchlist-xxxx.onrender.com`**.

### Step 2b: Keep data from vanishing (free PostgreSQL)

On the free tier, Render’s **disk is ephemeral**: when the app sleeps or restarts, SQLite data is lost and titles disappear. To **persist data** (titles stay after sleep/restart):

1. In the Render dashboard, click **New +** → **PostgreSQL**.
2. Create a free database (same region as your web service is best). Note: free Postgres may have a 90-day limit; you can recreate or upgrade later.
3. After the DB is created, open it and go to **Connect** → copy the **Internal Database URL** (use Internal if the web service is in the same region).
4. Open your **Web Service** (watchlist) → **Environment** → **Add Environment Variable**:
   - **Key:** `DATABASE_URL`
   - **Value:** paste the Internal Database URL (starts with `postgresql://`).
5. Click **Save Changes**. Render will redeploy; after deploy, the app uses PostgreSQL and **data persists** across restarts and sleep.

You do **not** need to change any code or build command. The server automatically uses PostgreSQL when `DATABASE_URL` is set.

### Step 2c: Optional — daily backup to Telegram

The server can upload the same JSON as **Download backup** once per day to a Telegram chat (see `README.md`). On Render:

1. In Telegram, talk to [@BotFather](https://t.me/BotFather) → **/newbot** → copy the **HTTP API token**.
2. Set **`TELEGRAM_CHAT_ID`** to **your** numeric user id (private chat target). Easiest: message [@userinfobot](https://t.me/userinfobot) and copy the id it shows. **Alternatively**, open **your** new bot (the one for this token), send `/start`, then call `getUpdates` once (or run `npm run telegram-chat-id` from `server/` locally) to read `message.chat.id`. Use a *different* random bot’s chat only if that bot is the one tied to `TELEGRAM_BOT_TOKEN` — messaging some other bot does not populate updates for yours.
3. Open your **Web Service** → **Environment** → add:
   - `TELEGRAM_BOT_TOKEN` = token from BotFather  
   - `TELEGRAM_CHAT_ID` = your chat id (or a group id if the bot is in a group)  
   Optional: `TELEGRAM_BACKUP_CRON` (default `0 4 * * *` = 04:00 **UTC** on Render), `TELEGRAM_BACKUP_TIMEZONE` (IANA name, e.g. `Asia/Kathmandu`). `TELEGRAM_BACKUP_ON_BROWSER_OPEN=1` sends a backup when the site is opened (rate-limited by `TELEGRAM_BACKUP_BROWSER_COOLDOWN_SEC`, default 300).
4. **Save** — Render redeploys; check **Logs** for `[telegram-backup] Scheduled:` and, after the scheduled time, `[telegram-backup] Sent`.

### Step 3: Use your public link

- Open **that URL** on any device (phone, tablet, another country) — no login needed.
- **Add titles** — they’re saved on the server.
- **Everyone** who opens the same link sees the **same list** (shared). If someone else adds a title, you’ll see it too.

**Free tier note:** The app may **sleep** after ~15 minutes of no use; the first visit after that can take 30–60 seconds to wake up. **Without** `DATABASE_URL`, data is stored in SQLite and can be lost on restart—use **Backup** in the app often. **With** `DATABASE_URL` (PostgreSQL), data persists.

---

## One URL locally (then expose with a tunnel)

The Node server can serve both the **API** and the **built React app**. One port, one URL.

### 1. Build the client

```bash
cd client
npm run build
```

### 2. Start the server (from project root or from `server`)

```bash
cd server
node server.js
```

If `client/dist` exists, the server will serve the app at **http://localhost:3001** as well as the API at **http://localhost:3001/api**. Open **http://localhost:3001** in your browser.

### 3. Expose with a tunnel (access from anywhere)

With the server running:

```bash
ngrok http 3001
```

Or with Cloudflare Tunnel:

```bash
cloudflared tunnel --url http://localhost:3001
```

Open the **HTTPS URL** (e.g. `https://abc123.ngrok-free.app`) on your phone or another device. You can add titles from anywhere; no need to set `VITE_API_URL` because the app and API are on the same URL.

---

## Option 1 (alt): Expose local server with a tunnel (dev + separate API)

Keep running the app on your machine and make it reachable from the internet via a tunnel.

### 1. Start your server and client as usual

```bash
# Terminal 1 – API
cd server && npm start

# Terminal 2 – React
cd client && npm run dev
```

### 2. Expose the API with a tunnel

**Using ngrok (free):**

1. Sign up at [ngrok.com](https://ngrok.com) and install ngrok.
2. Run:
   ```bash
   ngrok http 3001
   ```
3. Copy the **HTTPS URL** ngrok shows (e.g. `https://abc123.ngrok-free.app`).

**Using Cloudflare Tunnel (free, no account for quick try):**

1. Download [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/).
2. Run:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```
3. Copy the `*.trycloudflare.com` URL it prints.

### 3. Use the app from anywhere

- **Same computer:** Keep using `http://localhost:5173` (Vite proxies `/api` to your server).
- **Phone or another device:** You have two options:

  **A) Only the API is tunneled**  
  - Open the tunnel URL in the browser: you’ll see JSON (e.g. from `GET /api/titles`).  
  - To use the full UI from another device, you’d need to tunnel the React app too (e.g. `ngrok http 5173`) and open that URL. The React app would still call `/api`, which would go to the same origin (the tunnel to 5173), and the Vite proxy would not help because the request comes from the browser on the other device. So the React app must know the API URL.
  - Build the client with the tunnel API URL and serve it:
    ```bash
    cd client
    echo "VITE_API_URL=https://YOUR-TUNNEL-URL" > .env.production
    npm run build
    npx serve dist
    ```
    Then tunnel port 3000 (or whatever `serve` uses) and open that tunnel URL on your phone.  
  - Simpler: use **B**.

  **B) Tunnel both with one URL (e.g. only the React app)**  
  - Build the client to use the **API tunnel URL**:
    ```bash
    cd client
    echo "VITE_API_URL=https://YOUR-API-TUNNEL-URL" > .env.production
    npm run build
    npx serve dist -p 5173
    ```
  - Run **two** tunnels: one for API (3001), one for frontend (5173). On your phone, open the **frontend** tunnel URL. The built app will call the API tunnel URL you set in `VITE_API_URL`.

**Simplest for “use from phone right now”:**  
- Tunnel **only the API** (port 3001).  
- On your **computer**, create `.env.production` with `VITE_API_URL=https://your-ngrok-or-cloudflare-url`.  
- Run `npm run build` and `npx serve dist -p 5173`.  
- Tunnel port 5173 as well. Open the **frontend** tunnel URL on your phone. The app will talk to the API tunnel URL and you can add titles from anywhere.

---

## Option 2: Deploy to the cloud (permanent)

Deploy the **backend** to a host that runs Node and the **frontend** to a static host. You’ll get a permanent URL (e.g. `https://your-app.vercel.app` and `https://your-api.onrender.com`).

### Backend (e.g. Render or Railway)

**Render (free tier):**

1. Push your code to GitHub (including the `server/` folder).
2. Go to [render.com](https://render.com) → New → Web Service.
3. Connect the repo, set:
   - **Root directory:** `server` (or leave blank if repo root is the app and you set start command to `cd server && npm start`; better to set root to `server`).
   - **Build:** `npm install`
   - **Start:** `npm start`
4. Create the service. Render will give a URL like `https://watchlist-xxx.onrender.com`.
5. **Note:** On Render’s free tier, the disk is ephemeral. SQLite data can be lost on restart. Use **Backup** in the app to download a JSON backup often, or use a database that Render supports (e.g. PostgreSQL) if you want persistence without restore.

**Railway (free tier, with volume for SQLite):**

1. Go to [railway.app](https://railway.app), connect GitHub, New Project from repo.
2. Set root to `server` (or add a `railway.json` / use `server` as service root).
3. Add a **volume** and mount it at `server/data` so `watchlist.db` persists.
4. Deploy; note the public URL (e.g. `https://your-api.railway.app`).

### Frontend (e.g. Vercel or Netlify)

1. In the repo root, create a production env file or set in the host’s dashboard:
   - `VITE_API_URL=https://your-api.onrender.com` (or your Railway/backend URL).
   - No trailing slash.
2. **Vercel:**
   - Import the repo at [vercel.com](https://vercel.com).
   - Root directory: `client`.
   - Build: `npm run build`, output: `dist`.
   - Add env var `VITE_API_URL` = your backend URL.
   - Deploy.
3. **Netlify:**
   - Import the repo at [netlify.com](https://netlify.com).
   - Base directory: `client`, build command: `npm run build`, publish directory: `client/dist`.
   - Add env var `VITE_API_URL` = your backend URL.
   - Deploy.

### After deploy

- Open the **frontend** URL (Vercel/Netlify). The app will call the **backend** URL you set in `VITE_API_URL`.
- You can add titles from anywhere. If the backend uses SQLite and a persistent volume (e.g. Railway), data is kept. Otherwise, use Backup often.

---

## Summary

| Goal | What to do |
|------|------------|
| **Use from phone / elsewhere right now** | Expose API (port 3001) with ngrok or Cloudflare Tunnel. Build client with `VITE_API_URL=<tunnel-url>`, serve `dist`, optionally tunnel the frontend too, and open the frontend URL on your phone. |
| **Permanent URL, free** | Deploy backend to Render or Railway, frontend to Vercel or Netlify. Set `VITE_API_URL` to the backend URL. Prefer Railway + volume if you want SQLite to persist. |

The client uses `VITE_API_URL` when set (e.g. in `.env.production` or the host’s env); otherwise it uses `/api` (local proxy in dev). So once the server is reachable (tunnel or deployed URL), set that URL and build the client to start adding from anywhere.
