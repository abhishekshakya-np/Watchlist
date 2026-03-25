import { MEDIA_LABELS } from '../constants.js';

export default function DetailHero({ title }) {
  const typeLabel = MEDIA_LABELS[title.media_type] || title.media_type;
  return (
    <div className="detail-hero">
      <div
        className="detail-hero-banner"
        style={{ backgroundImage: title.banner_image ? `url(${title.banner_image})` : undefined }}
      />
      <div className="detail-hero-content">
        <div
          className="detail-hero-cover"
          style={{ backgroundImage: title.cover_image ? `url(${title.cover_image})` : undefined }}
        />
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
