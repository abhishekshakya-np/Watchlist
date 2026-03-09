# Related titles – functions and flows

This doc describes every part of the **related title** feature: seasons, parts, remakes, remasters, and other.

---

## 1. Relation types

| Type      | Use case |
|----------|----------|
| **season** | Series: another season (S2, S3, …). |
| **part**   | Movie/game/book: sequel or part (Part 2, Part 3). |
| **remake** | Same story/game in a new version. |
| **remaster** | Same title with improved graphics/audio (e.g. games). |
| **other**   | Any other relation. |

---

## 2. Backend

### 2.1 Database (`server/db.js`)

**Table: `title_relations`**

- `id` – primary key  
- `title_id` – the main title (e.g. “The Boys”)  
- `related_title_id` – the linked title (e.g. “The Boys - Season 2”)  
- `relation_type` – one of `season`, `part`, `remake`, `remaster`, `other`  
- `created_at`  
- `UNIQUE(title_id, related_title_id)` – no duplicate links  
- Index on `title_id` for fast lookups  

**SQLite:** `runSqliteSchema()` creates the table; migration adds `remaster` if the table had the old CHECK.  
**PostgreSQL:** `runPgSchema()` creates the table with the same relation types.

### 2.2 API routes (`server/server.js`)

**GET `/api/titles/:id/related`**

- Returns all related titles for `title_id`.
- Joins `title_relations` with `titles` to get slug, title, cover_image, media_type, release_date.
- Response: array of `{ relation_type, related_title_id, title: { id, slug, title, cover_image, media_type, release_date } }`.
- Sorted by `relation_type`, then `release_date`, then `id`.

**POST `/api/titles/:id/related`**

- Body: `{ related_title_id, relation_type }`.
- Validates: `relation_type` in allowed list (else `other`); `related_title_id` is a number and ≠ `title_id`; both titles exist; no duplicate relation.
- Inserts one row into `title_relations`.
- Returns 201 with `{ ok, relation_type, related_title_id }` or 400/404/409 with `{ error }`.

**DELETE `/api/titles/:id/related/:relatedId`**

- Removes the relation for that `title_id` and `relatedId`.
- Returns 204 or 404 if no row deleted.

---

## 3. Lookup (seasons from TMDB)

**GET `/api/lookup?q=...&type=series&expand=seasons`**

- Used when relation type is **Season** and media type is **series**.
- Requires `TMDB_API_KEY` in env.
- Flow: search TMDB TV by `q` → take first show → fetch `/tv/{id}` → map `seasons` (season_number ≥ 1) to lookup results.
- Each result: `title` (e.g. “The Boys - Season 2”), `release_date`, `cover_image`, `description_short`, etc.
- Returns array of results or `{ results: [], error }` if no key or no series found.

---

## 4. Frontend

### 4.1 API helpers (`client/src/App.jsx`)

- **getRelatedTitles(titleId)** – `GET /api/titles/:id/related` → array of related items.
- **addRelatedTitle(titleId, related_title_id, relation_type)** – `POST` to add one relation.
- **removeRelatedTitle(titleId, relatedId)** – `DELETE` to remove one relation.
- **createTitle(payload)** – `POST /api/titles` to create a title (used when adding from lookup).
- **lookupTitle(q, type, opts)** – `GET /api/lookup?...`; if `opts.expandSeasons` then `expand=seasons`.

### 4.2 Constants

- **RELATION_TYPES** – array of `{ value, label }` for the dropdown: Season, Part, Remake, Remaster, Other.

### 4.3 Title detail page

- **State:** `related` (list), `showAddRelated` (modal open/closed).
- **Load:** On slug change, fetches title, list entry, and **getRelatedTitles(title.id)**.
- **refreshRelated()** – re-fetches related list (e.g. after adding one).
- **UI:**
  - **Related** section in main column: groups by `relation_type` (Seasons, Parts, Remakes, Remasters, Other). Each item is a link to `/title/:slug` with poster and meta.
  - **Add related title** button in sidebar opens **AddRelatedModal**.

### 4.4 AddRelatedModal

- **Props:** `titleId`, `currentTitle`, `onClose`, `onAdded`.
- **State:** `relationType`, `lookupResults`, `lookupLoading`, `lookupDone`, `error`, `adding`.
- **runLookup()**  
  - Uses **primary title name** and **media_type** (no typing).  
  - If relation type is **Season** and media is **series**, calls **lookupTitle(..., { expandSeasons: true })** to get S1, S2, … from TMDB.  
  - Otherwise normal lookup (IMDb/TMDB/RAWG/Open Library).  
  - Sets `lookupResults` and `lookupDone` / `error`.
- **handleSelectLookupResult(r)**  
  - Builds a title payload from the lookup result (title, media_type, release_date, cover_image, etc.).  
  - **createTitle(payload)** → then **addRelatedTitle(titleId, created.id, relationType)**.  
  - Calls **onAdded()** (refreshes related list and closes modal).
- **Fallback:** Link to `/add?related_to=...&relation_type=...` to add a title manually and link it later.

---

## 5. End-to-end flows

**Add a season (series)**  
Choose relation type **Season** → “Search for related titles” (uses primary title, TMDB seasons) → pick “Show - Season 2” → title is created and linked as `season` → appears under “Seasons” on the detail page.

**Add a part / remake / remaster / other**  
Choose type → Search (same primary title, normal lookup) → pick a result → create + link → appears under the right group (Parts, Remakes, Remasters, Other).

**View related**  
Detail page loads related via **getRelatedTitles** and shows them grouped by type with links to each title.

**Remove**  
Currently no remove button in the UI; **removeRelatedTitle** exists for the API and could be wired to a “Remove” control per related item.
