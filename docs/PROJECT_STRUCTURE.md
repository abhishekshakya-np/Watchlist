# Project structure (enforced at commit)

The repo layout is enforced by a pre-commit hook. If you add files in the wrong place or commit forbidden paths, the commit is blocked.

## Allowed layout

```
watchlist/
├── package.json          # Root scripts (dev, build, start)
├── package-lock.json
├── README.md
├── render.yaml
├── .gitignore
├── .env.example          # Committed; copy to .env locally (or use server/.env.example)
├── scripts/              # check-structure.js, etc.
├── .cursor/rules/        # Cursor AI rules
├── .husky/               # Git hooks (pre-commit)
├── docs/                 # *.md only
├── client/               # Frontend (Vite + React)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── index.css
└── server/               # Backend (Node + Express)
    ├── package.json
    ├── server.js
    ├── db.js
    ├── telegram-backup.js  # Optional daily Telegram upload (env-gated)
    ├── telegram-chat-id.js # Helper: npm run telegram-chat-id → TELEGRAM_CHAT_ID
    ├── .env.example      # Committed; copy to .env locally
    └── data/             # Gitignored (SQLite files)
```

## Forbidden (commit will fail)

- **Build/cache:** `client/dist/`, `client/vite.config.js.timestamp*`, any `node_modules/`
- **Secrets:** `.env` (root or under `server/`) — use `.env.example` only in git
- **DB files:** `server/data/*.db`, `server/data/*.db-wal`, `server/data/*.db-shm`
- **Stray root files:** Adding random files at repo root that aren’t in the allowed list (see `scripts/check-structure.js`)

## Run the check manually

```bash
node scripts/check-structure.js
```

Exit code 0 = OK; non-zero = structure violated (same as pre-commit).
