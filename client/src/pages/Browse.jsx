import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTitles, getFeedTop } from '../api.js';
import TitleCard from '../components/TitleCard.jsx';
import SidebarBlock from '../components/SidebarBlock.jsx';
import FilterBar from '../components/FilterBar.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { BROWSE_LAYOUT_OPTIONS, BROWSE_LAYOUT_STORAGE_KEY } from '../constants.js';

function readBrowseLayout() {
  try {
    const s = localStorage.getItem(BROWSE_LAYOUT_STORAGE_KEY);
    if (s && BROWSE_LAYOUT_OPTIONS.some((o) => o.id === s)) return s;
  } catch (_) {
    /* ignore */
  }
  return '1';
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const genre = searchParams.get('genre') || '';
  const [titles, setTitles] = useState([]);
  const [sidebar, setSidebar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [layoutDensity, setLayoutDensity] = useState(readBrowseLayout);

  useEffect(() => {
    try {
      localStorage.setItem(BROWSE_LAYOUT_STORAGE_KEY, layoutDensity);
    } catch (_) {
      /* ignore */
    }
  }, [layoutDensity]);

  useEffect(() => {
    setLoading(true);
    const trimmed = q.trim();
    getTitles({
      type: type === 'all' ? '' : type,
      status,
      sort,
      ...(genre ? { genre } : {}),
      ...(trimmed ? { q: trimmed } : {}),
    })
      .then(setTitles)
      .finally(() => setLoading(false));
  }, [q, type, status, sort, genre]);
  useEffect(() => {
    getFeedTop(type === 'all' ? 'all' : type, 6).then(setSidebar);
  }, [type]);
  const trimmedQ = q.trim();
  const showClearSearch = Boolean(trimmedQ);
  const emptyTitle = trimmedQ ? 'No results' : 'No titles match';
  const emptyMsg = trimmedQ
    ? `No titles match “${trimmedQ}”. Try different words or filters.`
    : 'Try changing filters, clear all, or add titles from Add title.';
  const listClassName = `title-list title-list--browse title-list--browse-${layoutDensity}`;

  const handleSearchChange = (e) => {
    const next = new URLSearchParams(searchParams);
    if (e.target.value.trim()) next.set('q', e.target.value);
    else next.delete('q');
    setSearchParams(next);
  };

  const handleClearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  return (
    <div className="page-shell page-shell--browse browse-page">
      <h2 className="page-title">Browse</h2>
      <div className="browse-search" role="search" aria-label="Search browse titles" aria-busy={loading}>
        <label htmlFor="browse-search-input" className="visually-hidden">
          Search titles by name
        </label>
        <div className={`browse-search__field${loading ? ' browse-search__field--busy' : ''}`}>
          <span className="browse-search__icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            id="browse-search-input"
            type="search"
            placeholder="Search titles by name…"
            value={q}
            onChange={handleSearchChange}
            className="browse-search__input"
            autoComplete="off"
            enterKeyHint="search"
          />
          {loading ? <span className="browse-search__spinner" aria-hidden="true" /> : null}
          {showClearSearch ? (
            <button
              type="button"
              className="browse-search__clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <span aria-hidden="true">×</span>
            </button>
          ) : null}
        </div>
      </div>
      <FilterBar
        resultCount={titles.length}
        layoutDensity={layoutDensity}
        onLayoutDensityChange={setLayoutDensity}
      />
      {loading ? (
        <p className="loading">Loading…</p>
      ) : titles.length === 0 ? (
        <EmptyState title={emptyTitle} message={emptyMsg} />
      ) : (
        <ul className={listClassName}>
          {titles.map((title) => (
            <li key={title.id}>
              <TitleCard title={title} />
            </li>
          ))}
        </ul>
      )}
      <aside className="browse-page__sidebar" aria-label="Suggestions">
        <SidebarBlock
          title="Top by score"
          items={sidebar}
          viewMoreLink={`/browse?type=${type}&sort=score`}
        />
      </aside>
    </div>
  );
}
