/** API base and fetch helpers — single place for all /api calls */
export const API = import.meta.env.VITE_API_URL || '/api';

export async function getTitles(params = {}) {
  const r = await fetch(`${API}/titles?${new URLSearchParams(params)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getTitleBySlug(slug) {
  const r = await fetch(`${API}/titles/slug/${encodeURIComponent(slug)}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function updateTitle(id, body) {
  const r = await fetch(`${API}/titles/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

export async function getFeedTrending(type, limit = 8) {
  const r = await fetch(`${API}/titles/feed/trending?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFeedTop(type, limit = 8) {
  const r = await fetch(`${API}/titles/feed/top?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getFeedRecent(type, limit = 8) {
  const r = await fetch(`${API}/titles/feed/recent?type=${type}&limit=${limit}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getUserList() {
  const r = await fetch(`${API}/user/list`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addToList(titleId, opts = {}) {
  const r = await fetch(`${API}/user/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title_id: titleId, status: 'planning', ...opts }) });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

export async function updateListEntry(titleId, opts) {
  const r = await fetch(`${API}/user/list/${titleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

export async function removeFromList(titleId) {
  const r = await fetch(`${API}/user/list/${titleId}`, { method: 'DELETE' });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
}

export async function getListEntry(titleId) {
  const r = await fetch(`${API}/user/list/entry/${titleId}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function getRelatedTitles(titleId) {
  const r = await fetch(`${API}/titles/${titleId}/related`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function addRelatedTitle(titleId, related_title_id, relation_type) {
  const r = await fetch(`${API}/titles/${titleId}/related`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ related_title_id, relation_type }) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

export async function createTitle(payload) {
  const r = await fetch(`${API}/titles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
  const r = await fetch(`${API}/titles/${titleId}/related/${relatedId}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
}

export async function deleteTitle(id) {
  const r = await fetch(`${API}/titles/${id}`, { method: 'DELETE' });
  if (!r.ok && r.status !== 204) throw new Error((await r.json().catch(() => ({}))).error || r.statusText);
}

export async function lookupTitle(q, type, opts = {}) {
  const params = { q, type };
  if (opts.expandSeasons) params.expand = 'seasons';
  const r = await fetch(`${API}/lookup?${new URLSearchParams(params)}`);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText || 'Lookup failed');
  const results = Array.isArray(data) ? data : (data.results || data.titles || []);
  const error = Array.isArray(data) ? null : (data.error || null);
  return { results: Array.isArray(results) ? results : [], error };
}
