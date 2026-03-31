import { Link } from 'react-router-dom';
import { MEDIA_LABELS } from '../constants.js';

export default function HomeTitleCard({ title, className = '' }) {
  const slug = title.slug || title.id;
  const typeLabel = MEDIA_LABELS[title.media_type] || title.media_type;
  const year = title.release_date ? String(title.release_date).slice(0, 4) : '—';
  const displayName = title.name || title.title;
  return (
    <Link to={`/title/${slug}`} className={`home-card ${className}`.trim()}>
      <div className="home-card__poster-wrap">
        <div
          className="home-card__poster"
          style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }}
          role="img"
          aria-hidden={!title.cover_image}
        />
      </div>
      <div className="home-card__bar">
        <span className="home-card__name">{displayName}</span>
        <span className="home-card__meta">
          <span className="home-card__meta-item">{year}</span>
          <span className="home-card__meta-item">{typeLabel}</span>
        </span>
      </div>
    </Link>
  );
}
