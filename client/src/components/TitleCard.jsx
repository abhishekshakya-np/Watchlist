import { Link } from 'react-router-dom';
import { MEDIA_LABELS } from '../constants.js';

export default function TitleCard({ title, rank, showDescription = true, compact = false, grid = false }) {
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
