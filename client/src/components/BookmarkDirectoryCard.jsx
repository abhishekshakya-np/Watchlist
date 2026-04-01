import { bookmarkCategoryLabel } from '../constants.js';

function hostFromUrl(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

export default function BookmarkDirectoryCard({ bookmark, onEdit, onDelete }) {
  const displayTitle = bookmark.label?.trim() || hostFromUrl(bookmark.url);
  const catKey = bookmark.category?.trim() || 'general';
  const catDisplay = bookmarkCategoryLabel(catKey);
  const blurb = bookmark.notes?.trim() || hostFromUrl(bookmark.url);
  const hasImage = Boolean(bookmark.image_url?.trim());

  return (
    <article className="bookmark-dir-card">
      <a
        href={bookmark.url}
        className="bookmark-dir-card__media"
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Open ${displayTitle}`}
      >
        <div
          className={`bookmark-dir-card__thumb${hasImage ? '' : ' bookmark-dir-card__thumb--placeholder'}`}
          style={hasImage ? { backgroundImage: `url(${bookmark.image_url})` } : undefined}
        />
      </a>
      <div className="bookmark-dir-card__body">
        <span className="bookmark-dir-card__cat">{catDisplay}</span>
        <a
          href={bookmark.url}
          className="bookmark-dir-card__title"
          target="_blank"
          rel="noopener noreferrer"
        >
          {displayTitle}
        </a>
        <p className="bookmark-dir-card__desc">{blurb}</p>
        <div className="bookmark-dir-card__actions">
          <button type="button" className="bookmark-dir-card__btn bookmark-dir-card__btn--ghost" onClick={() => onEdit(bookmark)}>
            Edit
          </button>
          <button type="button" className="bookmark-dir-card__btn bookmark-dir-card__btn--danger" onClick={() => onDelete(bookmark.id)}>
            Remove
          </button>
        </div>
      </div>
    </article>
  );
}
