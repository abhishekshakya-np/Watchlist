import { useSearchParams } from 'react-router-dom';
import { BOOKMARK_SORT_OPTIONS } from '../constants.js';

export default function BookmarkFilterBar({ categoryOptions, resultCount }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const q = searchParams.get('q') || '';

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'category' && value === '') {
      next.delete('category');
    } else if (key === 'sort' && value === 'newest') {
      next.delete('sort');
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  const hasFilters = Boolean(category) || sort !== 'newest' || Boolean(q.trim());

  return (
    <div className="filter-bar">
      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="bookmark-filter-category">
          Category
        </label>
        <select
          id="bookmark-filter-category"
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
        >
          {categoryOptions.map(({ value, label }) => (
            <option key={value || 'all'} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="filter-bar__group">
        <label className="filter-bar__label" htmlFor="bookmark-filter-sort">
          Sort
        </label>
        <select
          id="bookmark-filter-sort"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          {BOOKMARK_SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {resultCount != null && (
        <span className="filter-bar__result-count">
          {resultCount} bookmark{resultCount !== 1 ? 's' : ''}
        </span>
      )}
      {hasFilters ? (
        <button type="button" className="filter-bar__clear" onClick={() => setSearchParams({})}>
          Clear all
        </button>
      ) : null}
    </div>
  );
}
