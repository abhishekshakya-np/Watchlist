import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lookupTitle, createTitle, addRelatedTitle } from '../api.js';
import { RELATION_TYPES } from '../constants.js';

function lookupResultKey(r, index) {
  return `${r.title || ''}-${r.release_date || ''}-${r.cover_image || ''}-${index}`;
}

export default function AddRelatedModal({ titleId, currentTitle, onClose, onAdded }) {
  const [relationType, setRelationType] = useState('season');
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);
  const [error, setError] = useState(null);
  const [errorRawg, setErrorRawg] = useState(false);
  const [adding, setAdding] = useState(false);

  const primaryName = (currentTitle?.title || currentTitle?.name || '').trim();
  const mediaType = currentTitle?.media_type || 'series';

  const runLookup = () => {
    if (!primaryName) return;
    setError(null);
    setErrorRawg(false);
    setLookupLoading(true);
    setLookupResults([]);
    setLookupDone(false);
    const expandSeasons = relationType === 'season' && mediaType === 'series';
    lookupTitle(primaryName, mediaType, { expandSeasons })
      .then((data) => {
        const results = Array.isArray(data?.results) ? data.results : [];
        setLookupResults(results);
        setLookupDone(true);
        if (data?.error) setError(data.error);
      })
      .catch((e) => {
        const msg = e.message || '';
        if (msg.includes('TMDB_API_KEY') || msg.includes('themoviedb.org')) {
          setError('Lookup uses IMDb. Restart the server and try again.');
        } else if (msg.includes('RAWG_API_KEY') || msg.includes('rawg')) {
          setError(null);
          setErrorRawg(true);
        } else {
          setError(msg);
        }
        setLookupResults([]);
        setLookupDone(true);
      })
      .finally(() => setLookupLoading(false));
  };

  const handleSelectLookupResult = async (r) => {
    setAdding(true);
    setError(null);
    setErrorRawg(false);
    try {
      const payload = {
        title: (r.title || primaryName).trim(),
        media_type: mediaType,
        release_date: r.release_date ? String(r.release_date).slice(0, 10) : undefined,
        format: r.format || undefined,
        release_status: 'finished',
        description: r.description?.trim() || undefined,
        description_short: r.description_short?.trim() || undefined,
        cover_image: r.cover_image?.trim() || undefined,
        banner_image: r.banner_image?.trim() || undefined,
        alternate_title: r.alternate_title?.trim() || undefined,
      };
      try {
        const created = await createTitle(payload);
        await addRelatedTitle(titleId, created.id, relationType);
        onAdded();
      } catch (e) {
        if (e.existing) {
          await addRelatedTitle(titleId, e.existing.id, relationType);
          onAdded();
        } else {
          setError(e.message);
        }
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal related-modal" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="modal-header">
          <h3>Add related title</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p className="modal-intro">
            Use the <strong>primary title &quot;{primaryName || '…'}&quot;</strong> to search. Pick a result to create it in your library and link it here as a related title (season, part, remake, remaster, or other).
          </p>
          <div className="form-group">
            <label>Relation type</label>
            <select
              className="native-select"
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
            >
              {RELATION_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {relationType === 'season' && mediaType === 'series' && (
              <p className="modal-hint-inline">Shows Season 1, 2, 3… for this series (requires TMDB API key in server/.env).</p>
            )}
          </div>
          <div className="form-group">
            <button type="button" className="btn primary full-width" onClick={runLookup} disabled={!primaryName || lookupLoading}>
              {lookupLoading ? 'Searching…' : 'Search for related titles'}
            </button>
          </div>
          {(errorRawg || error) && (
            <p className="error" role="alert">
              {errorRawg ? (
                <>
                  Game search needs a RAWG API key on the server. Get a free key at{' '}
                  <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer">rawg.io/apidocs</a>, add{' '}
                  <code>RAWG_API_KEY=your_key</code> to <code>server/.env</code> or the project root <code>.env</code>, then
                  restart the server. You can still add a related game from the link below.
                </>
              ) : (
                error
              )}
            </p>
          )}
          {lookupDone && !lookupLoading && lookupResults.length === 0 && !error && !errorRawg && (
            <p className="loading-inline">
              No results found for &quot;{primaryName}&quot;. You can add a title manually from the Add title page and then link it here.
            </p>
          )}
          {lookupResults.length > 0 && (
            <div className="related-results-block">
              <p className="related-results-label">Select one to add as related (it will be created and linked):</p>
              <ul className="lookup-results">
                {lookupResults.map((r, i) => (
                  <li
                    key={lookupResultKey(r, i)}
                    className="lookup-result-item"
                    onClick={() => handleSelectLookupResult(r)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleSelectLookupResult(r)}
                  >
                    {r.cover_image && (
                      <div className="lookup-result-poster" style={{ backgroundImage: `url(${r.cover_image})` }} />
                    )}
                    <div className="lookup-result-info">
                      <strong>{r.title}</strong>
                      {r.release_date && (
                        <span className="lookup-result-date">{String(r.release_date).slice(0, 4)}</span>
                      )}
                      {r.alternate_title && <span className="lookup-result-alt">{r.alternate_title}</span>}
                      {r.description_short && (
                        <p>
                          {r.description_short.length >= 200 ? `${r.description_short.slice(0, 200)}…` : r.description_short}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="modal-hint">
            <Link to={`/admin/add?related_to=${titleId}&relation_type=${relationType}`} onClick={onClose}>
              Add a title manually and link it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
