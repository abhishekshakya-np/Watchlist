import { Link } from 'react-router-dom';
import { MEDIA_LABELS, RELATION_TYPES } from '../constants.js';
import DetailRow from './DetailRow.jsx';

export default function TitleDetailMainColumn({ title, related }) {
  const ts = title.type_specific || {};
  const genres = Array.isArray(title.genres) ? title.genres : (title.genres ? [title.genres] : []);
  const tags = Array.isArray(title.tags) ? title.tags : (title.tags ? [title.tags] : []);

  const relatedByType = RELATION_TYPES.map(({ value, label }) => ({
    value,
    label,
    items: related.filter((r) => r.relation_type === value),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="detail-main">
      <section className="detail-section">
        <h3>Identity</h3>
        <DetailRow label="Name" value={title.name || title.title} />
        <DetailRow label="English Title" value={title.title} />
        <DetailRow label="Native Title" value={title.native_title || title.alternate_title} />
        <DetailRow label="Romaji" value={title.romaji} />
        <DetailRow label="Note" value={title.note} />
      </section>
      <section className="detail-section">
        <h3>Description / Summary</h3>
        <p className="detail-description">{title.description_short || title.description || 'No description.'}</p>
        <DetailRow label="Source Credit" value={title.source_credit} />
        <DetailRow label="Source Type" value={title.source_type} />
      </section>
      <section className="detail-section">
        <h3>📊 Publication Details</h3>
        <DetailRow label="Format" value={title.format} />
        <DetailRow
          label="Chapters"
          value={title.chapters != null ? title.chapters : (ts.chapters != null ? ts.chapters : null)}
        />
        <DetailRow
          label="Status"
          value={title.release_status ? title.release_status.replace(/_/g, ' ') : null}
        />
        <DetailRow label="Start Date" value={title.release_date} />
        <DetailRow label="End Date" value={title.release_date_end} />
      </section>
      <section className="detail-section">
        <h3>📈 Statistics</h3>
        <DetailRow
          label="Average Score"
          value={title.average_score != null ? Number(title.average_score).toFixed(1) : null}
        />
        <DetailRow
          label="Mean Score"
          value={title.mean_score != null ? Number(title.mean_score).toFixed(1) : null}
        />
        <DetailRow
          label="Popularity Rank"
          value={title.popularity_rank != null ? title.popularity_rank : (title.popularity != null ? title.popularity : null)}
        />
        <DetailRow label="Popularity" value={title.popularity != null ? title.popularity : null} />
      </section>
      {(genres.length > 0 || tags.length > 0) && (
        <section className="detail-section">
          <h3>🎭 Genres</h3>
          <div className="detail-chips">
            {genres.map((g, i) => (
              <span key={`${g}-${i}`} className="chip">{g}</span>
            ))}
          </div>
          <h3 className="detail-subsection">🏷 Tags</h3>
          <div className="detail-chips">
            {tags.map((t, i) => (
              <span key={`${t}-${i}`} className="chip tag">{t}</span>
            ))}
          </div>
        </section>
      )}
      {title.media_type === 'series' && (ts.episodes || ts.studio) && (
        <section className="detail-section">
          <h3>Series info</h3>
          <p>
            {ts.episodes && `${ts.episodes} episodes`}
            {ts.studio && ` · ${ts.studio}`}
          </p>
        </section>
      )}
      {title.media_type === 'movie' && (ts.runtime || ts.director) && (
        <section className="detail-section">
          <h3>Movie info</h3>
          <p>
            {ts.runtime && `${ts.runtime} min`}
            {ts.director && ` · ${ts.director}`}
          </p>
        </section>
      )}
      {title.media_type === 'book' && (ts.author || ts.pages) && (
        <section className="detail-section">
          <h3>Book info</h3>
          <p>
            {ts.author && `Author: ${ts.author}`}
            {ts.pages && ` · ${ts.pages} pp`}
          </p>
        </section>
      )}
      {title.media_type === 'game' && (ts.platforms || ts.developer) && (
        <section className="detail-section">
          <h3>Game info</h3>
          <p>
            {Array.isArray(ts.platforms) ? ts.platforms.join(', ') : ts.platforms}
            {ts.developer && ` · ${ts.developer}`}
          </p>
        </section>
      )}
      <section className="detail-section">
        <h3>🔗 Related</h3>
        <p className="detail-hint">Seasons, parts, remakes, remasters, or other linked titles.</p>
        {relatedByType.length > 0 ? (
          <div className="related-list">
            {relatedByType.map(({ value, label, items }) => (
              <div key={value} className="related-group">
                <h4 className="related-group-title">{label}s</h4>
                <ul className="related-items">
                  {items.map((r) => (
                    <li key={r.related_title_id} className="related-item">
                      <Link to={`/title/${r.title.slug}`} className="related-link">
                        {r.title.cover_image && (
                          <span
                            className="related-poster"
                            style={{ backgroundImage: `url(${r.title.cover_image})` }}
                          />
                        )}
                        <span className="related-info">
                          <strong>{r.title.title}</strong>
                          {r.title.release_date && (
                            <span className="related-meta">
                              {r.title.release_date.slice(0, 4)} · {MEDIA_LABELS[r.title.media_type] || r.title.media_type}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="detail-empty">
            No related titles yet. Use &quot;Add related title&quot; in the sidebar to link seasons, parts, remakes, remasters, or other titles.
          </p>
        )}
      </section>
    </div>
  );
}
