/**
 * Watchlist — single React file: API helpers, Layout, all components & pages, Router.
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, NavLink, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';

const API = '/api';
const MEDIA_TYPES = [{ value: 'all', label: 'All' }, { value: 'series', label: 'Series' }, { value: 'movie', label: 'Movies' }, { value: 'game', label: 'Games' }, { value: 'book', label: 'Books' }];
const RELEASE_STATUSES = [{ value: '', label: 'Any status' }, { value: 'releasing', label: 'Releasing' }, { value: 'finished', label: 'Finished' }, { value: 'not_yet_released', label: 'Not yet released' }, { value: 'cancelled', label: 'Cancelled' }];
const SORT_OPTIONS = [{ value: 'popularity', label: 'Popularity' }, { value: 'release-newest', label: 'Release (newest)' }, { value: 'release-oldest', label: 'Release (oldest)' }, { value: 'score', label: 'Score (high)' }, { value: 'score-low', label: 'Score (low)' }, { value: 'title', label: 'Title A–Z' }];
const MEDIA_LABELS = { series: 'Series', movie: 'Movie', game: 'Game', book: 'Book' };

async function getTitles(params = {}) { const r = await fetch(`${API}/titles?${new URLSearchParams(params)}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function getTitleBySlug(slug) { const r = await fetch(`${API}/titles/slug/${encodeURIComponent(slug)}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function getFeedTrending(type, limit = 8) { const r = await fetch(`${API}/titles/feed/trending?type=${type}&limit=${limit}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function getFeedTop(type, limit = 8) { const r = await fetch(`${API}/titles/feed/top?type=${type}&limit=${limit}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function getFeedRecent(type, limit = 8) { const r = await fetch(`${API}/titles/feed/recent?type=${type}&limit=${limit}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function getUserList() { const r = await fetch(`${API}/user/list`); if (!r.ok) throw new Error(await r.text()); return r.json(); }
async function addToList(titleId, opts = {}) { const r = await fetch(`${API}/user/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title_id: titleId, status: 'planning', ...opts }) }); if (!r.ok) throw new Error((await r.json()).error || r.statusText); return r.json(); }
async function updateListEntry(titleId, opts) { const r = await fetch(`${API}/user/list/${titleId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error((await r.json()).error || r.statusText); return r.json(); }
async function removeFromList(titleId) { const r = await fetch(`${API}/user/list/${titleId}`, { method: 'DELETE' }); if (!r.ok) throw new Error((await r.json()).error || r.statusText); }
async function getListEntry(titleId) { const r = await fetch(`${API}/user/list/entry/${titleId}`); if (!r.ok) throw new Error(await r.text()); return r.json(); }

function TitleCard({ title, rank, showDescription = true, compact = false, grid = false }) {
  const slug = title.slug || title.id;
  const typeLabel = MEDIA_LABELS[title.media_type] || title.media_type;
  const score = title.average_score != null ? Number(title.average_score).toFixed(1) : '—';
  const pop = title.popularity != null ? (title.popularity >= 1000 ? `${(title.popularity / 1000).toFixed(1)}k` : title.popularity) : '—';
  const desc = (title.description_short || title.description || '').slice(0, 120);
  const date = title.release_date ? title.release_date.slice(0, 4) : '—';
  if (grid) {
    return (
      <Link to={`/title/${slug}`} className="title-card-grid">
        <div className="title-card-grid-poster-wrap">
          <div className="title-card-grid-poster" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
          {rank != null && <span className="title-card-grid-badge">#{rank}</span>}
        </div>
        <span className="title-card-grid-title">{title.name || title.title}</span>
      </Link>
    );
  }
  if (compact) {
    return (
      <Link to={`/title/${slug}`} className="title-card compact">
        <div className="title-card-cover" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
        <div className="title-card-meta">
          <span className="title-card-name">{title.title}</span>
          <span className="title-card-stat">{score} · {pop}</span>
        </div>
      </Link>
    );
  }
  return (
    <article className="title-card">
      <Link to={`/title/${slug}`} className="title-card-cover-wrap">
        <div className="title-card-cover" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
      </Link>
      <div className="title-card-body">
        {rank != null && <span className="title-card-rank">{rank}</span>}
        <h3 className="title-card-title"><Link to={`/title/${slug}`}>{title.title}</Link></h3>
        <div className="title-card-badges">
          <span className="badge media">{typeLabel}</span>
          {title.format && <span className="badge format">{title.format}</span>}
        </div>
        <div className="title-card-meta-line">{date} · {score} · {pop} users</div>
        {showDescription && desc && <p className="title-card-desc">{desc}{desc.length >= 120 ? '…' : ''}</p>}
        <div className="title-card-actions"><Link to={`/title/${slug}`} className="btn primary">View details</Link></div>
      </div>
    </article>
  );
}

function FilterBar({ resultCount }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const set = (key, value) => { const next = new URLSearchParams(searchParams); if (value === '' || value === 'all') next.delete(key); else next.set(key, value); setSearchParams(next); };
  const hasFilters = type !== 'all' || status || sort !== 'popularity';
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Type</label>
        <select value={type} onChange={(e) => set('type', e.target.value)}>{MEDIA_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      <div className="filter-group">
        <label className="filter-label">Status</label>
        <select value={status} onChange={(e) => set('status', e.target.value)}>{RELEASE_STATUSES.map(({ value, label }) => <option key={value || 'any'} value={value}>{label}</option>)}</select>
      </div>
      <div className="filter-group">
        <label className="filter-label">Sort</label>
        <select value={sort} onChange={(e) => set('sort', e.target.value)}>{SORT_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
      </div>
      {resultCount != null && <span className="filter-result-count">{resultCount} title{resultCount !== 1 ? 's' : ''}</span>}
      {hasFilters && <button type="button" className="btn-clear" onClick={() => setSearchParams({})}>Clear all</button>}
    </div>
  );
}

function SidebarBlock({ title, items, viewMoreLink, viewMoreLabel = 'View more' }) {
  if (!items?.length) return null;
  return (
    <aside className="sidebar-block">
      <h3 className="sidebar-block-title">{title}</h3>
      <ul className="sidebar-block-list">
        {items.map((item) => <li key={item.id}><TitleCard title={item} compact /></li>)}
      </ul>
      {viewMoreLink && <Link to={viewMoreLink} className="sidebar-block-more">{viewMoreLabel}</Link>}
    </aside>
  );
}

function DetailHero({ title }) {
  const typeLabel = MEDIA_LABELS[title.media_type] || title.media_type;
  return (
    <div className="detail-hero">
      <div className="detail-hero-banner" style={{ backgroundImage: title.banner_image ? `url(${title.banner_image})` : undefined }} />
      <div className="detail-hero-content">
        <div className="detail-hero-cover" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
        <div className="detail-hero-text">
          <h1 className="detail-hero-title">{title.title}</h1>
          {title.alternate_title && <p className="detail-hero-alt">{title.alternate_title}</p>}
          <div className="detail-hero-badges">
            <span className="badge media">{typeLabel}</span>
            {title.format && <span className="badge format">{title.format}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStatsRow({ title }) {
  const ts = title.type_specific || {};
  const score = title.average_score != null ? Number(title.average_score).toFixed(1) : '—';
  const date = title.release_date ? title.release_date.slice(0, 10) : '—';
  const status = (title.release_status || '').replace(/_/g, ' ');
  let typeStat = '—';
  if (title.media_type === 'series') typeStat = ts.episodes ? `${ts.episodes} ep` : '—';
  else if (title.media_type === 'movie') typeStat = ts.runtime ? `${ts.runtime} min` : '—';
  else if (title.media_type === 'book') typeStat = ts.pages ? `${ts.pages} pp` : '—';
  else if (title.media_type === 'game') typeStat = ts.playtime || (Array.isArray(ts.platforms) ? ts.platforms.join(', ') : '') || '—';
  return (
    <div className="detail-stats-row">
      <span>{date}</span><span>{status}</span><span>{typeStat}</span><span>{score} avg</span><span>{title.popularity ?? 0} users</span>
    </div>
  );
}

const STATUS_OPTIONS = [{ value: 'planning', label: 'Planning' }, { value: 'current', label: 'Current' }, { value: 'completed', label: 'Completed' }, { value: 'paused', label: 'Paused' }, { value: 'dropped', label: 'Dropped' }];
function ListScoreWidget({ titleId, entry, onUpdate }) {
  const [status, setStatus] = useState(entry?.status || 'planning');
  const [score, setScore] = useState(entry?.score ?? '');
  const [progress, setProgress] = useState(entry?.progress ?? '');
  const [loading, setLoading] = useState(false);
  const save = async (updates) => { setLoading(true); try { if (entry) await updateListEntry(titleId, updates); else await addToList(titleId, updates); onUpdate?.(); } finally { setLoading(false); } };
  const handleRemove = async () => { setLoading(true); try { await removeFromList(titleId); onUpdate?.(); } finally { setLoading(false); } };
  return (
    <div className="list-score-widget">
      <h3 className="widget-title">Your list</h3>
      {entry ? (
        <>
          <label className="widget-label">Status</label>
          <select value={status} onChange={(e) => { const v = e.target.value; setStatus(v); save({ status: v, score: score || undefined, progress: progress || undefined }); }} disabled={loading}>{STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select>
          <label className="widget-label">Score (1–10)</label>
          <input type="number" min={1} max={10} value={score} onChange={(e) => setScore(e.target.value === '' ? '' : Math.min(10, Math.max(1, Number(e.target.value))))} onBlur={() => save({ status, score: score === '' ? undefined : score, progress: progress || undefined })} disabled={loading} />
          <label className="widget-label">Progress</label>
          <input type="text" placeholder="e.g. 5/12 eps" value={progress} onChange={(e) => setProgress(e.target.value)} onBlur={() => save({ status, score: score || undefined, progress: progress || undefined })} disabled={loading} />
          <button type="button" className="btn-remove" onClick={handleRemove} disabled={loading}>Remove from list</button>
        </>
      ) : (
        <button type="button" className="btn primary" onClick={() => save({ status: 'planning' })} disabled={loading}>Add to list</button>
      )}
    </div>
  );
}

function EmptyState({ title, message }) {
  return <div className="empty-state"><h3>{title}</h3><p>{message}</p></div>;
}

function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const setType = (type) => { const next = new URLSearchParams(searchParams); if (type === 'all') next.delete('type'); else next.set('type', type); setSearchParams(next); };
  return (
    <div className="app-layout">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/" className="site-logo">Watchlist</NavLink>
          <nav className="site-nav">
            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Home</NavLink>
            <NavLink to="/browse" className={({ isActive }) => isActive ? 'active' : ''}>Browse</NavLink>
            <NavLink to="/search" className={({ isActive }) => isActive ? 'active' : ''}>Search</NavLink>
            <NavLink to="/lists" className={({ isActive }) => isActive ? 'active' : ''}>My lists</NavLink>
            <NavLink to="/backup" className={({ isActive }) => isActive ? 'active' : ''}>Backup</NavLink>
            <NavLink to="/add" className={({ isActive }) => isActive ? 'active' : ''}>Add title</NavLink>
          </nav>
          <div className="media-tabs media-tabs-header">
            {MEDIA_TYPES.map(({ value, label }) => <button key={value} type="button" className={currentType === value ? 'active' : ''} onClick={() => setType(value)}>{label}</button>)}
          </div>
        </div>
      </header>
      <main className="app-main"><Outlet /></main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-credit">
            By <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">Abhishek Shakya</a> · <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">GitHub</a>
          </p>
          <p className="site-footer-repos">Repositories: <a href="https://github.com/abhishekshakya-np/Watchlist" target="_blank" rel="noopener noreferrer">Watchlist</a> · <a href="https://github.com/abhishekshakya-np/Notes" target="_blank" rel="noopener noreferrer">Notes</a> · <a href="https://github.com/abhishekshakya-np/Job-Board" target="_blank" rel="noopener noreferrer">Job-Board</a> · <a href="https://github.com/abhishekshakya-np/Travel---life" target="_blank" rel="noopener noreferrer">Travel---life</a> · <a href="https://github.com/abhishekshakya-np/only-using-html-css" target="_blank" rel="noopener noreferrer">only-using-html-css</a> · <a href="https://github.com/abhishekshakya-np/abhishekshakya-np.github.io" target="_blank" rel="noopener noreferrer">abhishekshakya-np.github.io</a></p>
        </div>
      </footer>
    </div>
  );
}

function Home() {
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
    Promise.all([getTitles({ type: t, sort: 'newest' }).then(setSpotlight), getFeedTrending(t, 8).then(setTrending), getFeedTop(t, 8).then(setTop), getFeedRecent(t, 8).then(setRecent)]).finally(() => setLoading(false));
  }, [type]);
  if (loading) return <p className="loading">Loading…</p>;
  return (
    <div className="two-col">
      <div>
        <h2 className="page-title">Spotlight — Newly added</h2>
        {spotlight.length === 0 ? <EmptyState title="No titles yet" message="Add titles via Add title to see them here with cover images and rankings." /> : (
          <div className="title-grid">
            {spotlight.map((title, i) => <TitleCard key={title.id} title={title} rank={i + 1} grid />)}
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

function Browse() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const [titles, setTitles] = useState([]);
  const [sidebar, setSidebar] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); getTitles({ type: type === 'all' ? '' : type, status, sort }).then(setTitles).finally(() => setLoading(false)); }, [type, status, sort]);
  useEffect(() => { getFeedTop(type === 'all' ? 'all' : type, 6).then(setSidebar); }, [type]);
  return (
    <div className="two-col">
      <div>
        <h2 className="page-title">Browse</h2>
        <FilterBar resultCount={titles.length} />
        {loading ? <p className="loading">Loading…</p> : titles.length === 0 ? <EmptyState title="No titles match" message="Try changing filters or clear all." /> : (
          <ul className="title-list">{titles.map((title, i) => <li key={title.id}><TitleCard title={title} rank={i + 1} /></li>)}</ul>
        )}
      </div>
      <div className="sidebar-col"><SidebarBlock title="Top by score" items={sidebar} viewMoreLink={`/browse?type=${type}&sort=score`} /></div>
    </div>
  );
}

function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'popularity';
  const [titles, setTitles] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setLoading(true); getTitles({ q: q.trim(), type: type === 'all' ? '' : type, status, sort }).then(setTitles).finally(() => setLoading(false)); }, [q, type, status, sort]);
  return (
    <div>
      <h2 className="page-title">Search</h2>
      <div className="search-input-wrap">
        <input type="search" placeholder="Search titles…" value={q} onChange={(e) => { const next = new URLSearchParams(searchParams); if (e.target.value) next.set('q', e.target.value); else next.delete('q'); setSearchParams(next); }} className="search-input" />
      </div>
      <FilterBar resultCount={titles.length} />
      {loading ? <p className="loading">Loading…</p> : !q.trim() ? <EmptyState title="Enter a search" message="Type above and use filters." /> : titles.length === 0 ? <EmptyState title="No results" message={`No titles match "${q}".`} /> : (
        <ul className="title-list">{titles.map((title, i) => <li key={title.id}><TitleCard title={title} rank={i + 1} /></li>)}</ul>
      )}
    </div>
  );
}

function TitleDetail() {
  const { slug } = useParams();
  const [title, setTitle] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshEntry = () => { if (title?.id) getListEntry(title.id).then(setEntry); };
  useEffect(() => {
    setLoading(true); setError(null);
    getTitleBySlug(slug).then((t) => { setTitle(t); return getListEntry(t.id); }).then(setEntry).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [slug]);
  if (loading) return <p className="loading">Loading…</p>;
  if (error || !title) return <p className="error">{error || 'Not found'}</p>;
  const ts = title.type_specific || {};
  const genres = Array.isArray(title.genres) ? title.genres : (title.genres ? [title.genres] : []);
  const tags = Array.isArray(title.tags) ? title.tags : (title.tags ? [title.tags] : []);
  const D = ({ label, value }) => (value != null && value !== '' ? <div className="detail-row"><span className="detail-label">{label}</span><span className="detail-value">{value}</span></div> : null);
  return (
    <div className="detail-page">
      <DetailHero title={title} />
      <DetailStatsRow title={title} />
      <div className="two-col detail-cols">
        <div className="detail-main">
          <section className="detail-section">
            <h3>Identity</h3>
            <D label="Name" value={title.name || title.title} />
            <D label="English Title" value={title.title} />
            <D label="Native Title" value={title.native_title || title.alternate_title} />
            <D label="Romaji" value={title.romaji} />
            <D label="Note" value={title.note} />
          </section>
          <section className="detail-section">
            <h3>Description / Summary</h3>
            <p className="detail-description">{title.description_short || title.description || 'No description.'}</p>
            <D label="Source Credit" value={title.source_credit} />
            <D label="Source Type" value={title.source_type} />
          </section>
          <section className="detail-section">
            <h3>📊 Publication Details</h3>
            <D label="Format" value={title.format} />
            <D label="Chapters" value={title.chapters != null ? title.chapters : (ts.chapters != null ? ts.chapters : null)} />
            <D label="Status" value={title.release_status ? title.release_status.replace(/_/g, ' ') : null} />
            <D label="Start Date" value={title.release_date} />
            <D label="End Date" value={title.release_date_end} />
          </section>
          <section className="detail-section">
            <h3>📈 Statistics</h3>
            <D label="Average Score" value={title.average_score != null ? Number(title.average_score).toFixed(1) : null} />
            <D label="Mean Score" value={title.mean_score != null ? Number(title.mean_score).toFixed(1) : null} />
            <D label="Popularity Rank" value={title.popularity_rank != null ? title.popularity_rank : (title.popularity != null ? title.popularity : null)} />
            <D label="Popularity" value={title.popularity != null ? title.popularity : null} />
          </section>
          {(genres.length > 0 || tags.length > 0) && (
            <section className="detail-section">
              <h3>🎭 Genres</h3>
              <div className="detail-chips">{genres.map((g, i) => <span key={i} className="chip">{g}</span>)}</div>
              <h3 className="detail-subsection">🏷 Tags</h3>
              <div className="detail-chips">{tags.map((t, i) => <span key={i} className="chip tag">{t}</span>)}</div>
            </section>
          )}
          {title.media_type === 'series' && (ts.episodes || ts.studio) && <section className="detail-section"><h3>Series info</h3><p>{ts.episodes && `${ts.episodes} episodes`} {ts.studio && ` · ${ts.studio}`}</p></section>}
          {title.media_type === 'movie' && (ts.runtime || ts.director) && <section className="detail-section"><h3>Movie info</h3><p>{ts.runtime && `${ts.runtime} min`} {ts.director && ` · ${ts.director}`}</p></section>}
          {title.media_type === 'book' && (ts.author || ts.pages) && <section className="detail-section"><h3>Book info</h3><p>{ts.author && `Author: ${ts.author}`} {ts.pages && ` · ${ts.pages} pp`}</p></section>}
          {title.media_type === 'game' && (ts.platforms || ts.developer) && <section className="detail-section"><h3>Game info</h3><p>{Array.isArray(ts.platforms) ? ts.platforms.join(', ') : ts.platforms}{ts.developer && ` · ${ts.developer}`}</p></section>}
        </div>
        <div className="detail-sidebar"><ListScoreWidget titleId={title.id} entry={entry} onUpdate={refreshEntry} /></div>
      </div>
    </div>
  );
}

const STATUS_LABELS = { planning: 'Planning', current: 'Current', completed: 'Completed', paused: 'Paused', dropped: 'Dropped' };
function MyLists() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getUserList().then(setItems).finally(() => setLoading(false)); }, []);
  if (loading) return <p className="loading">Loading…</p>;
  const byStatus = items.reduce((acc, item) => { const s = item.status || 'planning'; if (!acc[s]) acc[s] = []; acc[s].push(item); return acc; }, {});
  const order = ['current', 'planning', 'completed', 'paused', 'dropped'];
  return (
    <div>
      <h2 className="page-title">My lists</h2>
      {items.length === 0 ? <EmptyState title="Your list is empty" message='Add titles from their detail page with "Add to list".' /> : (
        <div className="my-lists">
          {order.map((status) => {
            const list = byStatus[status] || [];
            if (list.length === 0) return null;
            return (
              <section key={status} className="list-section">
                <h3 className="list-section-title">{STATUS_LABELS[status]} ({list.length})</h3>
                <ul className="list-section-items">
                  {list.map((item) => (
                    <li key={item.id} className="list-item">
                      <Link to={`/title/${item.slug}`} className="list-item-cover" style={{ backgroundImage: item.cover_image ? `url(${item.cover_image})` : undefined }} />
                      <div className="list-item-body">
                        <Link to={`/title/${item.slug}`} className="list-item-title">{item.title}</Link>
                        <span className="list-item-meta">{item.media_type} · {item.score != null ? `Score ${item.score}` : '—'}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Backup() {
  const [error, setError] = useState(null);
  const downloadBackup = async () => { setError(null); try { const r = await fetch(`${API}/backup/export`); if (!r.ok) throw new Error(await r.text()); const blob = await r.blob(); const name = r.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'watchlist-backup.json'; const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href); } catch (e) { setError(e.message); } };
  const restoreBackup = async (e) => { const file = e.target.files?.[0]; if (!file) return; setError(null); try { const backup = JSON.parse(await file.text()); const r = await fetch(`${API}/backup/restore`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(backup) }); const data = await r.json(); if (!r.ok) throw new Error(data.error || r.statusText); e.target.value = ''; } catch (err) { setError(err.message); } };
  return (
    <div>
      <h2 className="page-title">Backup &amp; restore</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>Download full JSON backup or restore from file.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', alignItems: 'center' }}>
        <button type="button" className="primary" onClick={downloadBackup}>Download backup</button>
        <label>Restore: <input type="file" accept=".json" onChange={restoreBackup} /></label>
      </div>
      {error && <p className="error" style={{ marginTop: 'var(--space-lg)' }}>{error}</p>}
    </div>
  );
}

function AddTitle() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', slug: '', media_type: 'series', format: '', release_status: 'finished', release_date: '', description: '', cover_image: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API}/titles`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title.trim(), slug: form.slug.trim() || undefined, media_type: form.media_type, format: form.format.trim() || undefined, release_status: form.release_status, release_date: form.release_date || undefined, description: form.description.trim() || undefined, cover_image: form.cover_image.trim() || undefined }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || r.statusText);
      navigate(`/title/${data.slug}`);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  return (
    <div>
      <h2 className="page-title">Add title</h2>
      <form onSubmit={handleSubmit} className="form-add-title">
        <label className="form-label">Title *</label>
        <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Primary title" required />
        <label className="form-label">Slug (optional)</label>
        <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="url-slug" />
        <label className="form-label">Media type</label>
        <select value={form.media_type} onChange={(e) => setForm((f) => ({ ...f, media_type: e.target.value }))}><option value="series">Series</option><option value="movie">Movie</option><option value="game">Game</option><option value="book">Book</option></select>
        <label className="form-label">Format (optional)</label>
        <input value={form.format} onChange={(e) => setForm((f) => ({ ...f, format: e.target.value }))} placeholder="e.g. TV, RPG" />
        <label className="form-label">Release status</label>
        <select value={form.release_status} onChange={(e) => setForm((f) => ({ ...f, release_status: e.target.value }))}><option value="releasing">Releasing</option><option value="finished">Finished</option><option value="not_yet_released">Not yet released</option><option value="cancelled">Cancelled</option></select>
        <label className="form-label">Release date (optional)</label>
        <input type="date" value={form.release_date} onChange={(e) => setForm((f) => ({ ...f, release_date: e.target.value }))} />
        <label className="form-label">Cover image URL (optional)</label>
        <input type="url" value={form.cover_image} onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))} placeholder="https://…" />
        <label className="form-label">Description (optional)</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" rows={3} style={{ width: '100%', resize: 'vertical' }} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="primary" disabled={loading}>{loading ? 'Adding…' : 'Add title'}</button>
      </form>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="search" element={<Search />} />
          <Route path="title/:slug" element={<TitleDetail />} />
          <Route path="lists" element={<MyLists />} />
          <Route path="backup" element={<Backup />} />
          <Route path="add" element={<AddTitle />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
