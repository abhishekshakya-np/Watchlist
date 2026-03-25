import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getTitles, getFeedTrending, getFeedTop, getFeedRecent } from '../api.js';
import TitleCard from '../components/TitleCard.jsx';
import SidebarBlock from '../components/SidebarBlock.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Home() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const [spotlight, setSpotlight] = useState([]);
  const [trending, setTrending] = useState([]);
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = type === 'all' ? 'all' : type;
    Promise.all([
      getTitles({ type: t, sort: 'newest' }).then(setSpotlight),
      getFeedTrending(t, 8).then(setTrending),
      getFeedTop(t, 8).then(setTop),
      getFeedRecent(t, 8).then(setRecent),
    ]).finally(() => setLoading(false));
  }, [type]);
  if (loading) return <p className="loading">Loading…</p>;
  return (
    <div className="two-col">
      <div>
        <h2 className="page-title">Spotlight — Newly added</h2>
        {spotlight.length === 0 ? (
          <EmptyState
            title="No titles yet"
            message="Add titles via Add title to see them here with cover images and rankings."
          />
        ) : (
          <div className="title-grid">
            {spotlight.map((title, i) => (
              <TitleCard key={title.id} title={title} rank={i + 1} grid />
            ))}
          </div>
        )}
      </div>
      <div className="sidebar-col">
        <SidebarBlock title="Trending" items={trending} viewMoreLink="/browse?sort=popularity" />
        <SidebarBlock title="Top by score" items={top} viewMoreLink="/browse?sort=score" />
        <SidebarBlock title="Recently added" items={recent} viewMoreLink="/browse?sort=release-newest" />
      </div>
    </div>
  );
}
