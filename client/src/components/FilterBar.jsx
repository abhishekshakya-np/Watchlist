import { useSearchParams } from 'react-router-dom';
import { BROWSE_LAYOUT_OPTIONS, MEDIA_TYPES, RELEASE_STATUSES, SORT_OPTIONS } from '../constants.js';

export default function FilterBar({ resultCount, layoutDensity, onLayoutDensityChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const genre = searchParams.get('genre') || '';
  const q = searchParams.get('q') || '';
  const showLayoutControls = layoutDensity != null && typeof onLayoutDensityChange === 'function';
  const set = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === 'all') next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };
  const hasFilters =
    type !== 'all' || status || sort !== 'popularity' || Boolean(genre) || Boolean(q.trim());
  return (
    <div className="filter-bar">
      <div className="filter-bar__cluster">
        <div className="filter-bar__group">
          <label className="filter-bar__label" htmlFor="filter-bar-type">
            Type
          </label>
          <select
            id="filter-bar-type"
            className="native-select"
            value={type}
            onChange={(e) => set('type', e.target.value)}
          >
            {MEDIA_TYPES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-bar__group">
          <label className="filter-bar__label" htmlFor="filter-bar-status">
            Status
          </label>
          <select
            id="filter-bar-status"
            className="native-select"
            value={status}
            onChange={(e) => set('status', e.target.value)}
          >
            {RELEASE_STATUSES.map(({ value, label }) => (
              <option key={value || 'any'} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-bar__group">
          <label className="filter-bar__label" htmlFor="filter-bar-sort">
            Sort
          </label>
          <select
            id="filter-bar-sort"
            className="native-select"
            value={sort}
            onChange={(e) => set('sort', e.target.value)}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {showLayoutControls ? (
          <div className="filter-bar__layout" role="group" aria-labelledby="filter-bar-layout-label">
            <span className="filter-bar__label" id="filter-bar-layout-label">
              Layout
            </span>
            <div className="filter-bar__layout-toggle">
              {BROWSE_LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`filter-bar__layout-btn${layoutDensity === opt.id ? ' filter-bar__layout-btn--active' : ''}`}
                  onClick={() => onLayoutDensityChange(opt.id)}
                  aria-pressed={layoutDensity === opt.id}
                  aria-label={opt.label}
                  title={opt.label}
                >
                  {opt.shortLabel}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <div className="filter-bar__meta">
        {resultCount != null ? (
          <span className="filter-bar__result-count">
            {resultCount} title{resultCount !== 1 ? 's' : ''}
          </span>
        ) : null}
        {hasFilters ? (
          <button type="button" className="filter-bar__clear" onClick={() => setSearchParams({})}>
            Clear all
          </button>
        ) : null}
      </div>
    </div>
  );
}
