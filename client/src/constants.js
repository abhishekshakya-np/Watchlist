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

export const STATUS_LABELS = {
  planning: 'Planning',
  current: 'Current',
  completed: 'Completed',
  paused: 'Paused',
  dropped: 'Dropped',
};

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
