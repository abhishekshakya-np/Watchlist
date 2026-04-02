import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getBookmarks,
  getFeedTrending,
  getFeedTop,
  getFeedRecent,
  getFeedUpcoming,
  getUserList,
} from '../api.js';
import HomeBookmarkCard from '../components/HomeBookmarkCard.jsx';
import HomeTitleCard from '../components/HomeTitleCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { HOME_GENRE_LINKS, MEDIA_LABELS, RELEASE_STATUSES } from '../constants.js';

function listEntryToTitle(entry) {
  return {
    id: entry.title_id,
    slug: entry.slug,
    title: entry.title,
    name: entry.name,
    cover_image: entry.cover_image,
    media_type: entry.media_type,
    release_date: entry.release_date,
    average_score: entry.average_score,
  };
}

function HomeSectionRow({ id, icon, title, viewMoreTo, viewMoreLabel = 'View more', children }) {
  return (
    <section className="home-section" aria-labelledby={id}>
      <div className="home-section__head">
        <h2 id={id} className="home-section__title">
          {icon != null && (
            <span className="home-section__icon" aria-hidden>
              {icon}
            </span>
          )}
          {title}
        </h2>
        <Link to={viewMoreTo} className="home-section__more">
          {viewMoreLabel}
          <span className="home-section__more-chevron" aria-hidden>
            {' '}
            ›
          </span>
        </Link>
      </div>
      {children}
    </section>
  );
}

const releaseStatusLabel = (v) => {
  if (v == null || v === '') return '—';
  return RELEASE_STATUSES.find((x) => x.value === v)?.label || v;
};

export default function Home() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'all';
  const t = type === 'all' ? 'all' : type;
  const [continueWatching, setContinueWatching] = useState([]);
  const [bookmarksRow, setBookmarksRow] = useState([]);
  const [latest, setLatest] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [trending, setTrending] = useState([]);
  const [top, setTop] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [topTab, setTopTab] = useState('today');
  const [genresExpanded, setGenresExpanded] = useState(false);
  const loadGenRef = useRef(0);

  useEffect(() => {
    const loadId = ++loadGenRef.current;
    setLoading(true);
    const ok = (result) => (result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : []);
    Promise.allSettled([
      getUserList(),
      getFeedRecent(t, 12),
      getFeedUpcoming(t, 12),
      getFeedTrending(t, 5),
      getFeedTop(t, 5),
      getFeedRecent(t, 5),
      getBookmarks(),
    ])
      .then((results) => {
        if (loadId !== loadGenRef.current) return;
        const list = ok(results[0]);
        const recentFeed = ok(results[1]);
        const upcomingFeed = ok(results[2]);
        const tr = ok(results[3]);
        const tp = ok(results[4]);
        const rc = ok(results[5]);
        const bookmarksRaw = ok(results[6]);
        const current = list.filter((e) => e.status === 'current').map(listEntryToTitle);
        setContinueWatching(current.slice(0, 12));
        const bookmarksSorted = [...bookmarksRaw].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 12);
        setBookmarksRow(bookmarksSorted);
        setLatest(recentFeed);
        setUpcoming(upcomingFeed);
        setTrending(tr);
        setTop(tp);
        setRecent(rc);
      })
      .finally(() => {
        if (loadId === loadGenRef.current) setLoading(false);
      });
  }, [type]);

  const topFiveItems =
    topTab === 'today' ? trending : topTab === 'week' ? top : recent;

  if (loading) return <p className="loading home-loading">Loading…</p>;

  const typeQuery = type !== 'all' ? `?type=${encodeURIComponent(type)}` : '';

  return (
    <div className="home-page">
      <div className="home-page__cols">
        <div className="home-page__main">
          <HomeSectionRow
            id="home-bookmarks"
            icon="🔖"
            title="Bookmarks"
            viewMoreTo="/bookmarks"
            viewMoreLabel="View all"
          >
            {bookmarksRow.length === 0 ? (
              <EmptyState
                title="No bookmarks yet"
                message="Save links on the Bookmarks page — they’ll show up here for quick access."
              />
            ) : (
              <div className="home-grid">
                {bookmarksRow.map((b) => (
                  <HomeBookmarkCard key={b.id} bookmark={b} />
                ))}
              </div>
            )}
          </HomeSectionRow>

          <HomeSectionRow
            id="home-latest"
            icon="📺"
            title="Latest releases"
            viewMoreTo={`/browse${typeQuery}${typeQuery ? '&' : '?'}sort=release-newest`}
            viewMoreLabel="View more"
          >
            {latest.length === 0 ? (
              <EmptyState title="No releases yet" message="Add titles with release dates to fill this row." />
            ) : (
              <div className="home-grid">
                {latest.map((title) => (
                  <HomeTitleCard key={title.id} title={title} />
                ))}
              </div>
            )}
          </HomeSectionRow>

          <HomeSectionRow
            id="home-continue"
            icon="⏱"
            title="Continue watching"
            viewMoreTo={`/lists${typeQuery}`}
            viewMoreLabel="View more"
          >
            {continueWatching.length === 0 ? (
              <EmptyState
                title="Nothing in progress"
                message="Mark titles as Current on your list or open a title to track progress."
              />
            ) : (
              <div className="home-grid">
                {continueWatching.map((title) => (
                  <HomeTitleCard key={title.id} title={title} />
                ))}
              </div>
            )}
          </HomeSectionRow>

          <HomeSectionRow
            id="home-upcoming"
            icon="📅"
            title="Top upcoming"
            viewMoreTo={`/browse${typeQuery}${typeQuery ? '&' : '?'}status=not_yet_released&sort=release-oldest`}
            viewMoreLabel="View more"
          >
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming titles"
                message="Add titles with status “Not yet released” to see them here."
              />
            ) : (
              <div className="home-grid">
                {upcoming.map((title) => (
                  <HomeTitleCard key={title.id} title={title} />
                ))}
              </div>
            )}
          </HomeSectionRow>
        </div>

        <aside className="home-page__sidebar" aria-label="Discover">
          <div className="home-widget home-widget--genres">
            <h3 className="home-widget__title">Genres</h3>
            <ul className={`home-genres${genresExpanded ? ' home-genres--expanded' : ''}`}>
              {HOME_GENRE_LINKS.map((g) => {
                const qs = new URLSearchParams();
                if (type !== 'all') qs.set('type', type);
                qs.set('genre', g);
                return (
                  <li key={g}>
                    <Link to={`/browse?${qs.toString()}`} className="home-genres__link">
                      {g}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              className="home-genres__toggle"
              onClick={() => setGenresExpanded((v) => !v)}
            >
              {genresExpanded ? 'Show less' : 'Show more'}
            </button>
          </div>

          <div className="home-widget home-widget--top5">
            <div className="home-top5__head">
              <h3 className="home-widget__title home-widget__title--inline">Top 5</h3>
              <div className="home-top5__tabs" role="tablist" aria-label="Top list period">
                <button
                  type="button"
                  role="tab"
                  aria-selected={topTab === 'today'}
                  className={`home-top5__tab${topTab === 'today' ? ' home-top5__tab--active' : ''}`}
                  onClick={() => setTopTab('today')}
                >
                  Today
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={topTab === 'week'}
                  className={`home-top5__tab${topTab === 'week' ? ' home-top5__tab--active' : ''}`}
                  onClick={() => setTopTab('week')}
                >
                  Week
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={topTab === 'month'}
                  className={`home-top5__tab${topTab === 'month' ? ' home-top5__tab--active' : ''}`}
                  onClick={() => setTopTab('month')}
                >
                  Month
                </button>
              </div>
            </div>
            {topFiveItems.length === 0 ? (
              <p className="home-top5__empty">No titles yet.</p>
            ) : (
              <ol className="home-top5__list">
                {topFiveItems.map((item, i) => {
                  const slug = item.slug || item.id;
                  const name = item.name || item.title;
                  const typeLabel = MEDIA_LABELS[item.media_type] || item.media_type;
                  const score =
                    item.average_score != null ? Number(item.average_score).toFixed(1) : '—';
                  const rel = releaseStatusLabel(item.release_status ?? '');
                  return (
                    <li key={item.id}>
                      <Link to={`/title/${slug}`} className="home-top5__row">
                        <span className="home-top5__rank">0{i + 1}</span>
                        <div
                          className="home-top5__thumb"
                          style={{
                            backgroundImage: item.cover_image ? `url(${item.cover_image})` : undefined,
                          }}
                        />
                        <span className="home-top5__body">
                          <span className="home-top5__name">{name}</span>
                          <span className="home-top5__badges">
                            <span className="home-top5__badge home-top5__badge--green">{typeLabel}</span>
                            <span className="home-top5__badge home-top5__badge--blue">{score}</span>
                            <span className="home-top5__badge home-top5__badge--muted">{rel}</span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
