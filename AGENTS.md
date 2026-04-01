# Watchlist — instructions for AI coding agents

Use this file with **`.cursor/rules/project-structure.mdc`** (enforced at commit). Prefer **small, focused changes**; match existing patterns in `server/server.js` and the React tree under `client/src/`.

## Product

- **Shared watchlist** — one backend, one URL; no per-user login in the default app. Data is **shared** for everyone hitting the same deployment.
- **Stack:** React (Vite) + Express + **SQLite** locally or **PostgreSQL** when `DATABASE_URL` is set (e.g. Render).

## Repo layout (strict)

| Area | Purpose |
|------|--------|
| `client/` | Frontend only: `src/App.jsx` (router), `src/pages/`, `src/components/`, `src/api.js`, `src/constants.js`, `src/styles/main.scss` (+ BEM partials), Vite config. **No** Node API here. |
| `server/` | Backend: `server.js`, `db.js`, optional helpers (`telegram-backup.js`, etc.). **No** React bundles. |
| `scripts/` | `check-structure.js`, Windows helpers. |
| `docs/` | **Gitignored** — local notes only. |
| Root | Allowed: `package.json`, lockfiles, `README.md`, `render.yaml`, `.gitignore`, `.env.example`, **`AGENTS.md`**, `scripts/`, `.cursor/`, `.husky/`. **No** app code or stray config at root. **No** committed `.env`. |

Pre-commit runs `node scripts/check-structure.js` — do not add forbidden paths.

## Commands

```bash
# Dev: API + Vite on one port (default 3001)
npm run dev

# Production-style: build client then `npm start`
npm run serve
```

Env: load order is **root `.env`** then **`server/.env`** (see `server/server.js`). Copy from `.env.example` / `server/.env.example`.

## Backend conventions

- **Single Express app** in `server/server.js` — new **REST** routes under `/api/...`.
- **DB access** via `db.js`: `query`, `queryOne`, `run`, `transaction`; supports `?` placeholders (SQLite) with PG translation internally when needed.
- **Demo user** — `user_list` uses `DEMO_USER = 'me'` (no auth layer in the shipped app).
- **Backup** — JSON export shape `{ version, exportedAt, tables: { titles, user_list, bookmarks } }` (version **2** includes `bookmarks`; older files may omit it—restore then leaves bookmarks unchanged). **`title_relations` is not exported**, so a full **restore** drops relation edges until you re-link. Restore/merge run in transactions; merge adds bookmark URLs that are not already stored.
- **Optional Telegram** — `telegram-backup.js`, env-gated; see `README.md`.

### API surface (representative)

- Titles: `GET/POST /api/titles`, `GET/PATCH/DELETE /api/titles/:id`, `GET /api/titles/slug/:slug`, feed routes under `/api/titles/feed/...`.
- **Related titles** (`title_relations`): `GET /api/titles/:id/related`, `POST /api/titles/:id/related` (body: `related_title_id`, `relation_type`), `DELETE /api/titles/:id/related/:relatedId`.
- Lists: `GET/POST /api/user/list`, `PATCH/DELETE /api/user/list/:titleId`, …
- Backup: `GET /api/backup/export`, `POST /api/backup/restore`, `POST /api/backup/merge`, optional `POST /api/backup/trigger-telegram`.
- Lookup: `GET /api/lookup` (TMDB/RAWG/etc. — keys from env).

## Frontend conventions

- **Router** in **`client/src/App.jsx`** — route-level screens in **`client/src/pages/`**, reusable pieces in **`client/src/components/`**, shared fetches in **`client/src/api.js`**, shared constants in **`client/src/constants.js`**.
- **Styles:** `client/src/styles/main.scss` (`@use` partials, BEM blocks) — design tokens in `_tokens.scss`; reuse `var(--…)` and existing class names unless introducing a new block.
- **API base:** `import.meta.env.VITE_API_URL || '/api'` (exported as `API` from `api.js`) — same origin in dev/production when served by Node.

### Client pattern (example)

```javascript
import { getTitles } from './api.js';
const data = await getTitles({ sort: 'popularity' });
```

## Coding style (must follow)

See `.cursor/rules/` for full detail. Summary:

- **SCSS:** BEM naming (`.block__element--modifier`). Nest only for `&:hover`, `&::before`, modifiers, and media queries — never nest child blocks. All design values via CSS custom properties (`var(--token)`). Mobile-first media queries. `@use` not `@import`.
- **React:** Component order: hooks → derived state → handlers → JSX. No logic in JSX — extract to named variables. Destructure props with defaults. Derive state instead of syncing with `useEffect`. Extract repeated logic into custom hooks (`useX`). Accept `className` on styled components. Named keys (never index). Simple ternaries; use early returns for complex conditions.
- **UI/UX:** Spacing and type from tokens only — no arbitrary values. Semantic color system (`--color-primary`, `--color-surface`, etc.), WCAG AA contrast. Every interactive element has all states (hover, focus-visible, active, disabled). Every async action has loading/success/error. Mobile-first, test at 320px/768px/1280px. Semantic HTML, visible focus ring, labelled inputs.

## Quality rules (must follow)

1. **Scope** — Only change what the task requires; no drive-by refactors or unrelated files.
2. **Secrets** — Never commit tokens, `.env`, or `server/data/*.db`. Use `.env.example` for placeholders only.
3. **Consistency** — Match naming, error handling (`try/catch` + `res.status(...).json({ error })`), and import style already in the file.
4. **Docs** — Do not add new tracked Markdown at root except what’s allowed; long-form personal docs go in gitignored `docs/`.
5. **Structure** — New server modules are OK under `server/` if the hook still passes; extend `check-structure.js` only if you add new allowed root paths.

## Deploy (short)

- **Render:** `npm run build`, `npm start`, optional `DATABASE_URL` for persistence (`render.yaml` in repo).
- **SQLite on ephemeral disk** loses data on restart unless you use Postgres or regular JSON backups.

## When unsure

- Read **`README.md`** for user-facing behavior and env vars.
- Read **`.cursor/rules/project-structure.mdc`** for layout enforcement.
