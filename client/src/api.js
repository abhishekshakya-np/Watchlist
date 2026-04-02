/** API base and fetch helpers — single place for all /api calls */
import { bookmarkCategoriesList } from './constants.js';

export const API = import.meta.env.VITE_API_URL || '/api';

/** Server returns this `code` with HTTP 409 when a bookmark URL already exists. */
export const BOOKMARK_URL_DUPLICATE_CODE = 'BOOKMARK_URL_DUPLICATE';

function throwBookmarkConflictIfPresent(r, data, text) {
  if (r.status === 409 && data && data.code === BOOKMARK_URL_DUPLICATE_CODE) {
    const e = new Error(
      data.error ||
        'This URL is already saved. Edit the existing bookmark on the Bookmarks page to add or change categories.',
    );
    e.code = data.code;
    e.existing = data.existing;
    throw e;
  }
}

const ADMIN_REQUEST_TIMEOUT_MS = 20_000;

async function apiFetch(input, init = {}) {
  return fetch(input, { credentials: 'include', ...init });
}

/** Resolves/rejects with `promise`, or rejects after `ADMIN_REQUEST_TIMEOUT_MS` (clears timer; aborts fetch). */
function raceAdminRequest(promise, abortCtrl, timeoutMessage) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      abortCtrl.abort();
      reject(new Error(timeoutMessage));
    }, ADMIN_REQUEST_TIMEOUT_MS);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function getAdminSession() {
  const ctrl = new AbortController();
  const r = await raceAdminRequest(
    apiFetch(`${API}/admin/session`, { signal: ctrl.signal }),
    ctrl,
    'Server did not respond in time. Check that the app is running and try again.',
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return {
    ok: data.ok === true,
    configured: data.configured === true,
  };
}

export async function adminLogin(password) {
  const ctrl = new AbortController();
  const r = await raceAdminRequest(
    apiFetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
      signal: ctrl.signal,
    }),
    ctrl,
    'Sign-in timed out. From repo root run npm run dev (http://localhost:3001), or npm run dev:split / npm run dev:api so port 5173 can reach the API (or set VITE_API_PROXY_PORT).',
  );
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

export async function adminLogout() {
  const r = await apiFetch(`${API}/admin/logout`, { method: 'POST' });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

/** Aggregate counts for admin dashboard (requires admin session when ADMIN_PASSWORD is set). */
export async function getAdminStats() {
  const r = await apiFetch(`${API}/admin/stats`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return {
    titles: Number(data.titles) || 0,
    userList: Number(data.userList) || 0,
    bookmarks: Number(data.bookmarks) || 0,
    byMediaType: data.byMediaType && typeof data.byMediaType === 'object' ? data.byMediaType : {},
  };
}

export async function getTitles(params = {}) {
  const r = await apiFetch(`${API}/titles?${new URLSearchParams(params)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getTitleBySlug(slug) {
  const r = await apiFetch(`${API}/titles/slug/${encodeURIComponent(slug)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateTitle(id, body) {
  const r = await apiFetch(`${API}/titles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

export async function getFeedTrending(type, limit = 8) {
  const r = await apiFetch(`${API}/titles/feed/trending?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFeedTop(type, limit = 8) {
  const r = await apiFetch(`${API}/titles/feed/top?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFeedRecent(type, limit = 8) {
  const r = await apiFetch(`${API}/titles/feed/recent?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFeedUpcoming(type, limit = 8) {
  const r = await apiFetch(`${API}/titles/feed/upcoming?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getUserList() {
  const r = await apiFetch(`${API}/user/list`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addToList(titleId, opts = {}) {
  const r = await apiFetch(`${API}/user/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title_id: titleId, status: 'planning', ...opts }) });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

export async function updateListEntry(titleId, opts) {
  const r = await apiFetch(`${API}/user/list/${titleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

export async function removeFromList(titleId) {
  const r = await apiFetch(`${API}/user/list/${titleId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
}

export async function getListEntry(titleId) {
  const r = await apiFetch(`${API}/user/list/entry/${titleId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getRelatedTitles(titleId) {
  const r = await apiFetch(`${API}/titles/${titleId}/related`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addRelatedTitle(titleId, related_title_id, relation_type) {
  const r = await apiFetch(`${API}/titles/${titleId}/related`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ related_title_id, relation_type }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

export async function createTitle(payload) {
  const r = await apiFetch(`${API}/titles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (!r.ok) {
    const err = new Error(data.error || r.statusText);
    if (r.status === 409 && data.existing) err.existing = data.existing;
    if (r.status === 409 && data.code) err.code = data.code;
    throw err;
  }
  return data;
}

export async function removeRelatedTitle(titleId, relatedId) {
  const r = await apiFetch(`${API}/titles/${titleId}/related/${relatedId}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
}

export async function deleteTitle(id) {
  const r = await apiFetch(`${API}/titles/${id}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
}

export async function getBookmarks(params = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  let r;
  try {
    r = await apiFetch(`${API}/bookmarks${suffix}`);
  } catch (e) {
    throw new Error(
      e.message === 'Failed to fetch'
        ? 'Could not reach the server. Run npm run dev (or npm start) and open the app from that URL, then try again.'
        : (e.message || 'Network error'),
    );
  }
  const text = await r.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      !r.ok
        ? (text.trim().slice(0, 180) || `Request failed (${r.status})`)
        : 'Invalid JSON from server.',
    );
  }
  if (!r.ok) {
    const fromJson =
      data && typeof data === 'object' && data.error != null ? String(data.error).trim() : '';
    const snippet = text.trim().slice(0, 180);
    const msg = fromJson || snippet || `Request failed (${r.status})`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
}

async function uniqueCategoriesFromBookmarks() {
  const bookmarks = await getBookmarks();
  const set = new Set();
  for (const b of bookmarks) {
    bookmarkCategoriesList(b).forEach((c) => set.add(c));
  }
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

async function categoriesFromCategoriesEndpoint() {
  try {
    const r = await apiFetch(`${API}/bookmarks/categories`);
    const text = await r.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      return [];
    }
    if (r.ok && data && Array.isArray(data.categories)) {
      return data.categories.map((c) => String(c).trim()).filter(Boolean);
    }
  } catch {
    /* network */
  }
  return [];
}

/**
 * Distinct non-empty categories used on bookmarks.
 * Merges GET /bookmarks/categories with categories inferred from GET /bookmarks so the list is never
 * empty when the DB has custom categories but the dedicated route returns [] (e.g. driver/shape quirks).
 */
export async function getBookmarkCategories() {
  const [fromEndpoint, fromList] = await Promise.all([
    categoriesFromCategoriesEndpoint(),
    uniqueCategoriesFromBookmarks().catch(() => []),
  ]);
  const merged = new Set([...fromEndpoint, ...fromList]);
  return [...merged].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

/** Fetches Open Graph / Twitter meta (and favicon fallback) for a page URL — server-side only. */
export async function fetchBookmarkLinkPreview(pageUrl) {
  let r;
  try {
    r = await apiFetch(`${API}/bookmarks/link-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: pageUrl }),
    });
  } catch (e) {
    if (e.message === 'Failed to fetch') {
      throw new Error('Could not reach the server to load a preview.');
    }
    throw e;
  }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    throw new Error((data && data.error) || r.statusText || 'Preview failed');
  }
  return {
    image_url: data.image_url ?? null,
    suggested_title: data.suggested_title ?? null,
    suggested_description: data.suggested_description ?? null,
  };
}

function bookmarkFetchTimeoutMs() {
  return 45_000;
}

export async function createBookmark(body) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), bookmarkFetchTimeoutMs());
  let r;
  try {
    r = await apiFetch(`${API}/bookmarks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } catch (e) {
    if (ctrl.signal.aborted) {
      throw new Error(
        'Request timed out. Start the app with npm run dev from the project root and open that URL (not only the Vite port).',
      );
    }
    if (e.message === 'Failed to fetch') {
      throw new Error('Could not reach the server. Run npm run dev from the repo root and use the URL it prints.');
    }
    throw e;
  } finally {
    clearTimeout(tid);
  }

  const text = await r.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        !r.ok ? text.trim().slice(0, 200) || `Request failed (${r.status})` : 'Invalid JSON from server.',
      );
    }
  }
  if (!r.ok) {
    throwBookmarkConflictIfPresent(r, data, text);
    throw new Error((data && data.error) || text.trim().slice(0, 200) || `Request failed (${r.status})`);
  }
  if (data == null || typeof data !== 'object' || data.id == null) {
    throw new Error('Server returned an unexpected response. Check the terminal running the server for errors.');
  }
  return data;
}

export async function updateBookmark(id, body) {
  const r = await apiFetch(`${API}/bookmarks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      !r.ok ? text.trim().slice(0, 200) || `Request failed (${r.status})` : 'Invalid JSON from server.',
    );
  }
  if (!r.ok) {
    throwBookmarkConflictIfPresent(r, data, text);
    throw new Error((data && data.error) || text.trim().slice(0, 200) || `Request failed (${r.status})`);
  }
  if (data == null || typeof data !== 'object' || data.id == null) {
    throw new Error('Server returned an unexpected response after updating the bookmark.');
  }
  return data;
}

export async function deleteBookmark(id) {
  const r = await apiFetch(`${API}/bookmarks/${id}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
}

export async function lookupTitle(q, type, opts = {}) {
  const params = { q, type };
  if (opts.expandSeasons) params.expand = 'seasons';
  const r = await apiFetch(`${API}/lookup?${new URLSearchParams(params)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText || 'Lookup failed');
  const results = Array.isArray(data) ? data : (data.results || data.titles || []);
  const error = Array.isArray(data) ? null : (data.error || null);
  return { results: Array.isArray(results) ? results : [], error };
}
