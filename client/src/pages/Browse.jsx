import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTitles, getFeedTop } from '../api.js';
import TitleCard from '../components/TitleCard.jsx';
import SidebarBlock from '../components/SidebarBlock.jsx';
import FilterBar from '../components/FilterBar.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Browse() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const [titles, setTitles] = useState([]);
  const [sidebar, setSidebar] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    getTitles({ type: type === 'all' ? '' : type, status, sort }).then(setTitles).finally(() => setLoading(false));
  }, [type, status, sort]);
  useEffect(() => {
    getFeedTop(type === 'all' ? 'all' : type, 6).then(setSidebar);
  }, [type]);
  return (
    <div className="two-col">
      <div>
        <h2 className="page-title">Browse</h2>
        <FilterBar resultCount={titles.length} />
        {loading ? (
          <p className="loading">Loading…</p>
        ) : titles.length === 0 ? (
          <EmptyState title="No titles match" message="Try changing filters or clear all." />
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
      <div className="sidebar-col">
        <SidebarBlock
          title="Top by score"
          items={sidebar}
          viewMoreLink={`/browse?type=${type}&sort=score`}
        />
      </div>
    </div>
  );
}
