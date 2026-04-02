import { Link } from 'react-router-dom';
import { MEDIA_LABELS, RELEASE_STATUSES } from '../constants.js';

function titleGenreLine(title) {
  const raw = Array.isArray(title.genres) ? title.genres : title.genres ? [title.genres] : [];
  const labels = raw
    .map((g) => (g != null && typeof g === 'object' && g.name != null ? g.name : String(g)))
    .filter(Boolean);
  return labels.length ? labels.join(', ') : '';
}

function formatCardReleaseDate(iso) {
  if (!iso) return '—';
  const s = String(iso).trim();
  if (s.length >= 10) return s.slice(0, 10);
  if (s.length >= 4) return s.slice(0, 4);
  return s || '—';
}

function releaseStatusLabel(status) {
  if (!status) return '—';
  const row = RELEASE_STATUSES.find((o) => o.value === status);
  return row ? row.label : status;
}

export default function TitleCard({ title, showDescription = false, compact = false, grid = false }) {
  const slug = title.slug || title.id;
  const typeLabel = MEDIA_LABELS[title.media_type] || title.media_type;
  const score = title.average_score != null ? Number(title.average_score).toFixed(1) : '—';
  const pop = title.popularity != null ? (title.popularity >= 1000 ? `${(title.popularity / 1000).toFixed(1)}k` : title.popularity) : '—';
  const desc = (title.description_short || title.description || '').slice(0, 120);
  const cardDate = formatCardReleaseDate(title.release_date);
  const statusLabel = releaseStatusLabel(title.release_status);
  const formatLabel = title.format && String(title.format).trim() ? String(title.format).trim() : '—';
  const genresLine = titleGenreLine(title);
  const avgLabel = score === '—' ? '— avg' : `${score} avg`;
  const usersLabel = `${pop} users`;

  if (grid) {
    return (
      <Link to={`/title/${slug}`} className="title-card-grid">
        <div className="title-card-grid-poster-wrap">
          <div className="title-card-grid-poster" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
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
          <span className="title-card-stat">
            {score} · {pop}
          </span>
        </div>
      </Link>
    );
  }
  return (
    <Link to={`/title/${slug}`} className="title-card">
      <div className="title-card__layout">
        <div className="title-card__top">
          <div className="title-card-cover-wrap" aria-hidden="true">
            <div className="title-card-cover" style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }} />
          </div>
          <dl className="title-card__meta-stack">
            <div className="title-card__meta-row">
              <dt className="visually-hidden">Release date</dt>
              <dd className="title-card__meta-value">{cardDate}</dd>
            </div>
            <div className="title-card__meta-row">
              <dt className="visually-hidden">Release status</dt>
              <dd className="title-card__meta-value">{statusLabel}</dd>
            </div>
            <div className="title-card__meta-row">
              <dt className="visually-hidden">Format</dt>
              <dd className="title-card__meta-value">{formatLabel}</dd>
            </div>
            <div className="title-card__meta-row">
              <dt className="visually-hidden">Average score</dt>
              <dd className="title-card__meta-value">{avgLabel}</dd>
            </div>
            <div className="title-card__meta-row">
              <dt className="visually-hidden">Popularity</dt>
              <dd className="title-card__meta-value">{usersLabel}</dd>
            </div>
          </dl>
        </div>
        <h3 className="title-card__title">{title.title}</h3>
        {showDescription && desc ? (
          <p className="title-card__desc">
            {desc}
            {desc.length >= 120 ? '…' : ''}
          </p>
        ) : null}
        <div className="title-card__tags">
          <span className="title-card__tag">{typeLabel}</span>
          <span className="title-card__tag title-card__tag--genres" title={genresLine || undefined}>
            {genresLine || '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}
