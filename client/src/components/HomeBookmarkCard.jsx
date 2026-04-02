import { bookmarkCategoriesList, bookmarkCategoryLabel } from '../constants.js';

function hostFromUrl(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
}

function IconExternal() {
  return (
    <svg
      className="home-bookmark-card__external-svg"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function HomeBookmarkCard({ bookmark, className = '' }) {
  const displayTitle = bookmark.label?.trim() || hostFromUrl(bookmark.url);
  const host = hostFromUrl(bookmark.url);
  const catLabels = bookmarkCategoriesList(bookmark).map((id) => bookmarkCategoryLabel(id));
  const catDisplay =
    catLabels.length <= 2
      ? catLabels.join(' · ')
      : `${catLabels.slice(0, 2).join(' · ')} · +${catLabels.length - 2}`;
  const hasImage = Boolean(bookmark.image_url?.trim());

  return (
    <a
      href={bookmark.url}
      className={`home-bookmark-card ${className}`.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${displayTitle} (opens in new tab)`}
    >
      <div className="home-bookmark-card__poster-wrap">
        <div
          className={`home-bookmark-card__poster${hasImage ? '' : ' home-bookmark-card__poster--placeholder'}`}
          style={hasImage ? { backgroundImage: `url(${bookmark.image_url})` } : undefined}
          role="img"
          aria-hidden="true"
        />
        <span className="home-bookmark-card__external" aria-hidden="true">
          <IconExternal />
        </span>
      </div>
      <div className="home-bookmark-card__bar">
        <span className="home-bookmark-card__name">{displayTitle}</span>
        <span className="home-bookmark-card__meta">
          <span className="home-bookmark-card__meta-item">{host}</span>
          <span className="home-bookmark-card__meta-item">{catDisplay}</span>
        </span>
      </div>
    </a>
  );
}
