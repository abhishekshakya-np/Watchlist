import { useState } from 'react';
import { lookupTitle } from '../api.js';

function lookupResultKey(r, index) {
  return `${r.title || ''}-${r.release_date || ''}-${r.cover_image || ''}-${index}`;
}

export default function TitleForm({ initial, onSubmit, submitLabel = 'Save', loadingLabel = 'Saving…' }) {
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupDone, setLookupDone] = useState(false);
  const canLookup = !!form.title?.trim();

  const handleLookup = async () => {
    if (!canLookup) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResults([]);
    setLookupDone(false);
    try {
      const { results, error: lookupErr } = await lookupTitle(form.title.trim(), form.media_type);
      setLookupResults(Array.isArray(results) ? results : []);
      setLookupDone(true);
      if (lookupErr) setLookupError(lookupErr);
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('TMDB_API_KEY') || msg.includes('themoviedb.org')) {
        setLookupError('Movie/series lookup uses IMDb and does not need a key. Restart your server (or redeploy) so it loads the latest code, then try again.');
      } else if (msg.includes('RAWG_API_KEY') || msg.includes('rawg')) {
        setLookupError('Game search needs a RAWG key. Get a free key at rawg.io/apidocs, add RAWG_API_KEY=your_key to server/.env, then restart the server. You can still add this game by filling the form below.');
      } else {
        setLookupError(msg);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const applyLookup = (r) => {
    setForm((f) => ({
      ...f,
      title: r.title || f.title,
      release_date: r.release_date ? r.release_date.slice(0, 10) : f.release_date,
      format: r.format ?? f.format,
      description: r.description ?? f.description,
      description_short: r.description_short ?? f.description_short,
      cover_image: r.cover_image ?? f.cover_image,
      banner_image: r.banner_image ?? f.banner_image,
      alternate_title: r.alternate_title ?? f.alternate_title,
    }));
    setLookupResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug?.trim() || undefined,
        media_type: form.media_type,
        format: form.format?.trim() || undefined,
        release_status: form.release_status,
        release_date: form.release_date || undefined,
        release_date_end: form.release_date_end || undefined,
        description: form.description?.trim() || undefined,
        description_short: form.description_short?.trim() || undefined,
        cover_image: form.cover_image?.trim() || undefined,
        banner_image: form.banner_image?.trim() || undefined,
        alternate_title: form.alternate_title?.trim() || undefined,
      };
      const data = await onSubmit(payload);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-add-title">
      <p className="form-section-title">Basics</p>
      <div className="form-field">
        <label className="form-label">Title *</label>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Primary title"
          required
        />
      </div>
      <div className="form-field">
        <label className="form-label">Slug (optional)</label>
        <input
          value={form.slug || ''}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          placeholder="url-slug"
        />
      </div>
      <div className="form-field">
        <label className="form-label">Alternate title (optional)</label>
        <input
          value={form.alternate_title || ''}
          onChange={(e) => setForm((f) => ({ ...f, alternate_title: e.target.value }))}
          placeholder="Alternative name"
        />
      </div>
      <div className="form-field">
        <label className="form-label">Media type</label>
        <select value={form.media_type} onChange={(e) => setForm((f) => ({ ...f, media_type: e.target.value }))}>
          <option value="series">Series</option>
          <option value="movie">Movie</option>
          <option value="game">Game</option>
          <option value="book">Book</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Format (optional)</label>
        <input
          value={form.format || ''}
          onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))}
          placeholder="e.g. TV, RPG"
        />
      </div>
      <div className="form-field lookup-block">
        <p className="form-section-title">Search and auto-fill from the web</p>
        <p className="lookup-hint">
          Enter a title and select type (Movie, Series, Game, or Book) above, then click the button below. Results will appear; click one to fill the form.
        </p>
        {form.media_type === 'game' && (
          <p className="lookup-hint lookup-key-hint">
            Game search needs a free{' '}
            <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer">RAWG</a>{' '}
            key. Get a key, add <code>RAWG_API_KEY=your_key</code> to <code>server/.env</code>, then restart the server. You can still add games by filling the form manually.
          </p>
        )}
        <button type="button" className="btn primary" onClick={handleLookup} disabled={!canLookup || lookupLoading}>
          {lookupLoading ? 'Searching…' : 'Search and auto-fill'}
        </button>
        {lookupError && <p className="form-error">{lookupError}</p>}
        {lookupDone && !lookupLoading && lookupResults.length === 0 && !lookupError && (
          <p className="lookup-hint" style={{ marginTop: 8 }}>No results found. Try a different title or type.</p>
        )}
        {lookupResults.length > 0 && (
          <ul className="lookup-results">
            {lookupResults.map((r, i) => (
              <li key={lookupResultKey(r, i)} className="lookup-result-item" onClick={() => applyLookup(r)}>
                {r.cover_image && (
                  <div className="lookup-result-poster" style={{ backgroundImage: `url(${r.cover_image})` }} />
                )}
                <div className="lookup-result-info">
                  <strong>{r.title}</strong>
                  {r.release_date && <span className="lookup-result-date">{r.release_date.slice(0, 4)}</span>}
                  {r.alternate_title && <span className="lookup-result-alt">{r.alternate_title}</span>}
                  {r.description_short && (
                    <p>
                      {r.description_short}
                      {r.description_short.length >= 200 ? '…' : ''}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="form-section-title">Publication</p>
      <div className="form-field">
        <label className="form-label">Release status</label>
        <select value={form.release_status} onChange={(e) => setForm((f) => ({ ...f, release_status: e.target.value }))}>
          <option value="releasing">Releasing</option>
          <option value="finished">Finished</option>
          <option value="not_yet_released">Not yet released</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="form-field">
        <label className="form-label">Release date (optional)</label>
        <input
          type="date"
          value={form.release_date || ''}
          onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))}
        />
      </div>
      <div className="form-field">
        <label className="form-label">Release date end (optional)</label>
        <input
          type="date"
          value={form.release_date_end || ''}
          onChange={(e) => setForm((f) => ({ ...f, release_date_end: e.target.value }))}
        />
      </div>
      <p className="form-section-title">Media</p>
      <div className="form-field">
        <label className="form-label">Cover image URL (optional)</label>
        <input
          type="url"
          value={form.cover_image || ''}
          onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
          placeholder="https://…"
        />
      </div>
      <div className="form-field">
        <label className="form-label">Hero banner URL (optional)</label>
        <input
          type="url"
          value={form.banner_image || ''}
          onChange={(e) => setForm((f) => ({ ...f, banner_image: e.target.value }))}
          placeholder="https://…"
        />
      </div>
      <p className="form-section-title">Description</p>
      <div className="form-field form-field-span-2">
        <label className="form-label">Description (optional)</label>
        <textarea
          value={form.description || ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Full description"
          rows={3}
        />
      </div>
      <div className="form-field form-field-span-2">
        <label className="form-label">Short description (optional)</label>
        <textarea
          value={form.description_short || ''}
          onChange={(e) => setForm((f) => ({ ...f, description_short: e.target.value }))}
          placeholder="One-line summary"
          rows={1}
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="primary form-submit" disabled={loading}>
        {loading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}
