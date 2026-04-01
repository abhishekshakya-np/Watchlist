import { useSearchParams } from 'react-router-dom';
import { MEDIA_TYPES, RELEASE_STATUSES, SORT_OPTIONS } from '../constants.js';

export default function FilterBar({ resultCount }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const genre = searchParams.get('genre') || '';
  const q = searchParams.get('q') || '';
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
      <div className="filter-bar__group">
        <label className="filter-bar__label">Type</label>
        <select className="native-select" value={type} onChange={(e) => set('type', e.target.value)}>
          {MEDIA_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="filter-bar__group">
        <label className="filter-bar__label">Status</label>
        <select className="native-select" value={status} onChange={(e) => set('status', e.target.value)}>
          {RELEASE_STATUSES.map(({ value, label }) => <option key={value || 'any'} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="filter-bar__group">
        <label className="filter-bar__label">Sort</label>
        <select className="native-select" value={sort} onChange={(e) => set('sort', e.target.value)}>
          {SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      {resultCount != null && (
        <span className="filter-bar__result-count">
          {resultCount} title{resultCount !== 1 ? 's' : ''}
        </span>
      )}
      {hasFilters && (
        <button type="button" className="filter-bar__clear" onClick={() => setSearchParams({})}>
          Clear all
        </button>
      )}
    </div>
  );
}
