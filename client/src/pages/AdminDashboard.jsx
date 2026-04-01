import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats } from '../api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

function IconTitles({ className, ...rest }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M4 6.5A2.5 2.5 0 016.5 4h11A2.5 2.5 0 0120 6.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 17.5v-11z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 9h8M8 12.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconList({ className, ...rest }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M8 6h13M8 12h13M8 18h13M4 6h.5M4 12h.5M4 18h.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBookmark({ className, ...rest }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M6 4.5A1.5 1.5 0 017.5 3h9A1.5 1.5 0 0118 4.5V21l-6-3.5L6 21V4.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconBackup({ className, ...rest }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path
        d="M12 4v12m0 0l-4-4m4 4l4-4M5 19h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconPlus({ className, ...rest }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron({ className, ...rest }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...rest}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const MEDIA_LABELS = {
  movie: 'Movies',
  series: 'Series',
  tv: 'TV',
  game: 'Games',
  book: 'Books',
  anime: 'Anime',
  manga: 'Manga',
  other: 'Other',
};

function formatMediaLabel(key) {
  const k = String(key).toLowerCase();
  return MEDIA_LABELS[k] || key.charAt(0).toUpperCase() + key.slice(1);
}

export default function AdminDashboard() {
  const { configured, ok, logout, canMutate, loading: authLoading } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);
    try {
      const s = await getAdminStats();
      setStats(s);
    } catch (e) {
      setStats(null);
      setStatsError(e?.message || 'Could not load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) {
      return undefined;
    }
    if (!canMutate) {
      setStats(null);
      setStatsLoading(false);
      setStatsError(null);
      return undefined;
    }
    let cancelled = false;
    setStatsLoading(true);
    setStatsError(null);
    getAdminStats()
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((e) => {
        if (!cancelled) {
          setStats(null);
          setStatsError(e?.message || 'Could not load stats');
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, canMutate]);

  const handleRefreshStats = () => {
    if (!canMutate || authLoading) return;
    void loadStats();
  };

  const handleLogout = async () => {
    await logout();
  };

  const mediaBreakdown =
    stats?.byMediaType && Object.keys(stats.byMediaType).length > 0
      ? Object.entries(stats.byMediaType)
          .filter(([, n]) => n > 0)
          .sort((a, b) => b[1] - a[1])
      : [];

  const showSignedInBar = configured && ok;
  const showSignInCta = configured && !ok;

  return (
    <div className="page-content page-shell page-shell--admin page-shell--admin--wide admin-dashboard">
      <header className="admin-dashboard__header">
        <div className="admin-dashboard__header-text">
          <p className="admin-dashboard__eyebrow">Control center</p>
          <h1 className="admin-dashboard__title">Admin dashboard</h1>
          <p className="admin-dashboard__subtitle">
            Add titles and bookmarks, run backups, and see how much is in the shared library.
          </p>
        </div>
        {showSignedInBar ? (
          <div className="admin-dashboard__header-actions">
            <span className="admin-dashboard__badge" aria-live="polite">
              <span className="admin-dashboard__badge-dot" aria-hidden="true" />
              Signed in
            </span>
            <button type="button" className="btn secondary admin-dashboard__logout" onClick={() => void handleLogout()}>
              Sign out
            </button>
          </div>
        ) : null}
      </header>

      {!configured ? (
        <div className="admin-dashboard__banner" role="status">
          <p className="admin-dashboard__banner-title">Open mode</p>
          <p className="admin-dashboard__banner-body">
            No <code className="admin-login__code">ADMIN_PASSWORD</code> is set. Anyone can change data. Set it in{' '}
            <code className="admin-login__code">.env</code> to require sign-in.
          </p>
        </div>
      ) : null}

      {showSignInCta ? (
        <div className="admin-dashboard__cta">
          <p className="admin-dashboard__cta-text">Sign in to load live counts and use add / backup actions.</p>
          <Link className="btn primary" to="/admin/login?next=/admin">
            Sign in
          </Link>
        </div>
      ) : null}

      {canMutate ? (
        <section className="admin-dashboard__section" aria-labelledby="admin-stats-heading">
          <div className="admin-dashboard__section-head">
            <h2 id="admin-stats-heading" className="admin-dashboard__section-title">
              Library overview
            </h2>
            <button
              type="button"
              className="btn secondary admin-dashboard__refresh"
              onClick={handleRefreshStats}
              disabled={statsLoading}
            >
              {statsLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {statsError ? (
            <p className="admin-dashboard__error" role="alert">
              {statsError}
            </p>
          ) : null}

          <ul className="admin-dashboard__stats">
            <li className="admin-dashboard__stat">
              <div className="admin-dashboard__stat-icon admin-dashboard__stat-icon--titles" aria-hidden="true">
                <IconTitles className="admin-dashboard__stat-svg" />
              </div>
              <div className="admin-dashboard__stat-body">
                <span className="admin-dashboard__stat-label">Titles in catalog</span>
                <span className="admin-dashboard__stat-value" aria-live="polite">
                  {statsLoading ? '…' : stats != null ? String(stats.titles) : '—'}
                </span>
              </div>
            </li>
            <li className="admin-dashboard__stat">
              <div className="admin-dashboard__stat-icon admin-dashboard__stat-icon--list" aria-hidden="true">
                <IconList className="admin-dashboard__stat-svg" />
              </div>
              <div className="admin-dashboard__stat-body">
                <span className="admin-dashboard__stat-label">List entries</span>
                <span className="admin-dashboard__stat-value" aria-live="polite">
                  {statsLoading ? '…' : stats != null ? String(stats.userList) : '—'}
                </span>
              </div>
            </li>
            <li className="admin-dashboard__stat">
              <div className="admin-dashboard__stat-icon admin-dashboard__stat-icon--bookmark" aria-hidden="true">
                <IconBookmark className="admin-dashboard__stat-svg" />
              </div>
              <div className="admin-dashboard__stat-body">
                <span className="admin-dashboard__stat-label">Bookmarks</span>
                <span className="admin-dashboard__stat-value" aria-live="polite">
                  {statsLoading ? '…' : stats != null ? String(stats.bookmarks) : '—'}
                </span>
              </div>
            </li>
          </ul>

          {!statsLoading && mediaBreakdown.length > 0 ? (
            <div className="admin-dashboard__chips" aria-label="Titles by type">
              {mediaBreakdown.map(([type, n]) => (
                <span key={type} className="admin-dashboard__chip">
                  <span className="admin-dashboard__chip-label">{formatMediaLabel(type)}</span>
                  <span className="admin-dashboard__chip-value">{n}</span>
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="admin-dashboard__section" aria-labelledby="admin-actions-heading">
        <h2 id="admin-actions-heading" className="admin-dashboard__section-title">
          Quick actions
        </h2>
        <ul className="admin-dashboard__actions">
          <li>
            <Link className="admin-dashboard__action" to="/admin/add">
              <IconPlus className="admin-dashboard__action-lead" aria-hidden="true" />
              <span className="admin-dashboard__action-text">
                <span className="admin-dashboard__action-title">Add to watchlist</span>
                <span className="admin-dashboard__action-desc">Movie, series, game, or book — with optional online lookup</span>
              </span>
              <IconChevron className="admin-dashboard__action-chevron" />
            </Link>
          </li>
          <li>
            <Link className="admin-dashboard__action" to="/admin/add-bookmark">
              <IconBookmark className="admin-dashboard__action-lead" aria-hidden="true" />
              <span className="admin-dashboard__action-text">
                <span className="admin-dashboard__action-title">Add bookmark</span>
                <span className="admin-dashboard__action-desc">Save a link with notes, category, and preview image</span>
              </span>
              <IconChevron className="admin-dashboard__action-chevron" />
            </Link>
          </li>
          <li>
            <Link className="admin-dashboard__action" to="/admin/backup">
              <IconBackup className="admin-dashboard__action-lead" aria-hidden="true" />
              <span className="admin-dashboard__action-text">
                <span className="admin-dashboard__action-title">Backup &amp; restore</span>
                <span className="admin-dashboard__action-desc">Download JSON, full restore, or merge from a file</span>
              </span>
              <IconChevron className="admin-dashboard__action-chevron" />
            </Link>
          </li>
          <li>
            <Link className="admin-dashboard__action" to="/browse">
              <IconTitles className="admin-dashboard__action-lead" aria-hidden="true" />
              <span className="admin-dashboard__action-text">
                <span className="admin-dashboard__action-title">Browse catalog</span>
                <span className="admin-dashboard__action-desc">Open the public library to review or edit titles in context</span>
              </span>
              <IconChevron className="admin-dashboard__action-chevron" />
            </Link>
          </li>
        </ul>
      </section>

      {!canMutate && configured ? (
        <p className="admin-dashboard__hint" role="status">
          Public pages stay read-only for changes until you sign in.
        </p>
      ) : null}
    </div>
  );
}
