/** Shell UI themes (Browse/Home/… light layout) — persisted in localStorage */
/** Browse page: list density (1 / 2 / 4 cards per row) */
export const BROWSE_LAYOUT_STORAGE_KEY = 'watchlist-browse-layout';

export const BROWSE_LAYOUT_OPTIONS = [
  { id: '1', label: 'One card per row', shortLabel: '1' },
  { id: '2', label: 'Two cards per row', shortLabel: '2' },
  { id: '4', label: 'Four cards per row', shortLabel: '4' },
];

export const SHELL_THEME_STORAGE_KEY = 'watchlist-shell-theme';

export const SHELL_THEMES = [
  { id: 'lavender', label: 'Lavender' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'warm', label: 'Warm' },
  { id: 'midnight', label: 'Midnight' },
];

/** Bookmark collection (separate from media watchlist) — preset category ids stored in DB */
export const BOOKMARK_CATEGORY_PRESETS = [
  { id: 'general', label: 'General' },
  { id: 'design_library', label: 'Design library' },
  { id: 'design_tools', label: 'Design tools' },
  { id: 'ai_tools', label: 'AI tools' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'mockups', label: 'Mockups & assets' },
  { id: 'learning', label: 'Learning & career' },
  { id: 'community', label: 'Community' },
  { id: 'news', label: 'News & blogs' },
];

export function bookmarkCategoryLabel(id) {
  const key = id == null || String(id).trim() === '' ? 'general' : String(id).trim();
  const preset = BOOKMARK_CATEGORY_PRESETS.find((p) => p.id === key);
  if (preset) return preset.label;
  return key.replace(/_/g, ' ');
}

/** Bookmarks page filter bar — same UX as Browse “Sort” */
export const BOOKMARK_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title_az', label: 'Title A–Z' },
  { value: 'title_za', label: 'Title Z–A' },
];

/** Shared UI / form constants */
export const MEDIA_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'series', label: 'Series' },
  { value: 'movie', label: 'Movies' },
  { value: 'game', label: 'Games' },
  { value: 'book', label: 'Books' },
];

export const RELEASE_STATUSES = [
  { value: '', label: 'Any status' },
  { value: 'releasing', label: 'Releasing' },
  { value: 'finished', label: 'Finished' },
  { value: 'not_yet_released', label: 'Not yet released' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity' },
  { value: 'release-newest', label: 'Release (newest)' },
  { value: 'release-oldest', label: 'Release (oldest)' },
  { value: 'score', label: 'Score (high)' },
  { value: 'score-low', label: 'Score (low)' },
  { value: 'title', label: 'Title A–Z' },
];

export const MEDIA_LABELS = { series: 'Series', movie: 'Movie', game: 'Game', book: 'Book' };

export const RELATION_TYPES = [
  { value: 'season', label: 'Season' },
  { value: 'part', label: 'Part' },
  { value: 'remake', label: 'Remake' },
  { value: 'remaster', label: 'Remaster' },
  { value: 'other', label: 'Other' },
];

export const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'current', label: 'Current' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'dropped', label: 'Dropped' },
];

/** Personal list rating (stored in user_list.score) — not the same as TMDB-style title averages */
export const LIST_SCORE_OPTIONS = [
  { value: '1', label: '1 — Bad' },
  { value: '2', label: '2 — Good' },
  { value: '3', label: '3 — Best' },
  { value: '4', label: '4 — Masterpiece' },
];

export const LIST_SCORE_LABELS = {
  1: 'Bad',
  2: 'Good',
  3: 'Best',
  4: 'Masterpiece',
};

/** Short label for lists; legacy values outside 1–4 show as “Old scale: n”. */
export function formatListScore(score) {
  if (score == null || score === '') return null;
  const n = Number(score);
  if (!Number.isInteger(n)) return null;
  if (n >= 1 && n <= 4) return LIST_SCORE_LABELS[n] ?? String(n);
  return `Old scale: ${n}`;
}

export const STATUS_LABELS = {
  planning: 'Planning',
  current: 'Current',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
};

/** Sidebar on home — links use Browse `?genre=` (JSON substring match on stored genres) */
export const HOME_GENRE_LINKS = [
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Action',
  'Thriller',
  'Game',
  'Kids',
  'Mecha',
  'Music',
  'Sports',
  'Supernatural',
];

export const INIT_ADD_FORM = {
  title: '',
  slug: '',
  media_type: 'series',
  format: '',
  release_status: 'finished',
  release_date: '',
  description: '',
  description_short: '',
  cover_image: '',
  banner_image: '',
  alternate_title: '',
};
