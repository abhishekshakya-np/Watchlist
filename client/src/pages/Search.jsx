import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTitles } from '../api.js';
import TitleCard from '../components/TitleCard.jsx';
import FilterBar from '../components/FilterBar.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    getTitles({ q: q.trim(), type: type === 'all' ? '' : type, status, sort }).then(setTitles).finally(() => setLoading(false));
  }, [q, type, status, sort]);
  return (
    <div>
      <h2 className="page-title">Search</h2>
      <div className="search-input-wrap">
        <input
          type="search"
          placeholder="Search titles…"
          value={q}
          onChange={(e) => {
            const next = new URLSearchParams(searchParams);
            if (e.target.value) next.set('q', e.target.value);
            else next.delete('q');
            setSearchParams(next);
          }}
          className="search-input"
        />
      </div>
      <FilterBar resultCount={titles.length} />
      {loading ? (
        <p className="loading">Loading…</p>
      ) : !q.trim() ? (
        <EmptyState title="Enter a search" message="Type above and use filters." />
      ) : titles.length === 0 ? (
        <EmptyState title="No results" message={`No titles match "${q}".`} />
      ) : (
        <ul className="title-list">
          {titles.map((title, i) => (
            <li key={title.id}>
              <TitleCard title={title} rank={i + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
