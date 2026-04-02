import { bookmarkCategoryLabel } from '../constants.js';

function hostFromUrl(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

function IconEdit() {
  return (
    <svg
      className="bookmark-dir-card__icon-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      className="bookmark-dir-card__icon-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export default function BookmarkDirectoryCard({ bookmark, onEdit, onDelete, canManage = true }) {
  const displayTitle = bookmark.label?.trim() || hostFromUrl(bookmark.url);
  const catKey = bookmark.category?.trim() || 'general';
  const catDisplay = bookmarkCategoryLabel(catKey);
  const blurb = bookmark.notes?.trim() || hostFromUrl(bookmark.url);
  const hasImage = Boolean(bookmark.image_url?.trim());

  return (
    <article className="bookmark-dir-card">
      <div className="bookmark-dir-card__media-wrap">
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
        {canManage ? (
          <div
            className="bookmark-dir-card__actions bookmark-dir-card__actions--overlay"
            role="group"
            aria-label="Bookmark actions"
          >
            <button
              type="button"
              className="bookmark-dir-card__btn bookmark-dir-card__btn--icon bookmark-dir-card__btn--ghost"
              onClick={() => onEdit(bookmark)}
              aria-label={`Edit ${displayTitle}`}
              title="Edit"
            >
              <IconEdit />
            </button>
            <button
              type="button"
              className="bookmark-dir-card__btn bookmark-dir-card__btn--icon bookmark-dir-card__btn--danger"
              onClick={() => onDelete(bookmark.id)}
              aria-label={`Remove ${displayTitle}`}
              title="Remove"
            >
              <IconTrash />
            </button>
          </div>
        ) : null}
      </div>
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
      </div>
    </article>
  );
}
