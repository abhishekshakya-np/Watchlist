import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getBookmarks, deleteBookmark } from '../api.js';
import {
  BOOKMARK_CATEGORY_PRESETS,
  bookmarkCategoryLabel,
} from '../constants.js';
import EmptyState from '../components/EmptyState.jsx';
import BookmarkDirectoryCard from '../components/BookmarkDirectoryCard.jsx';
import BookmarkFilterBar from '../components/BookmarkFilterBar.jsx';
import BookmarkEditModal from '../components/BookmarkEditModal.jsx';

const PRESET_IDS = new Set(BOOKMARK_CATEGORY_PRESETS.map((p) => p.id));

function bookmarkDisplayTitle(b) {
  try {
    const host = new URL(b.url).hostname.replace(/^www\./, '');
    return b.label?.trim() || host;
  } catch {
    return b.label?.trim() || b.url || '';
  }
}

function sortBookmarks(list, sort) {
  const out = [...list];
  switch (sort) {
    case 'oldest':
      return out.sort((a, b) => a.id - b.id);
    case 'title_az':
      return out.sort((a, b) =>
        bookmarkDisplayTitle(a).localeCompare(bookmarkDisplayTitle(b), undefined, { sensitivity: 'base' }),
      );
    case 'title_za':
      return out.sort((a, b) =>
        bookmarkDisplayTitle(b).localeCompare(bookmarkDisplayTitle(a), undefined, { sensitivity: 'base' }),
      );
    default:
      return out.sort((a, b) => b.id - a.id);
  }
}

export default function Bookmarks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [editingBookmark, setEditingBookmark] = useState(null);

  const load = useCallback(() => {
    setListError(null);
    return getBookmarks()
      .then(setItems)
      .catch((e) => {
        const msg =
          (e instanceof Error && e.message?.trim()) ||
          (typeof e === 'string' && e.trim()) ||
          'Could not load bookmarks.';
        setListError(msg);
      });
  }, []);

  const handleRetryLoad = () => {
    setLoading(true);
    load().finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const categoryOptions = useMemo(() => {
    const opts = [{ value: '', label: 'All' }];
    BOOKMARK_CATEGORY_PRESETS.forEach((p) => opts.push({ value: p.id, label: p.label }));
    const seen = new Set(opts.map((o) => o.value));
    const fromItems = new Set();
    items.forEach((b) => fromItems.add(b.category?.trim() || 'general'));
    const extras = [...fromItems].filter((id) => !seen.has(id)).sort();
    extras.forEach((id) => opts.push({ value: id, label: bookmarkCategoryLabel(id) }));
    return opts;
  }, [items]);

  const filteredSorted = useMemo(() => {
    let list = items;
    if (category) {
      list = list.filter((b) => (b.category?.trim() || 'general') === category);
    }
    const qt = q.trim().toLowerCase();
    if (qt) {
      list = list.filter((b) => {
        const title = (b.label || '').toLowerCase();
        const u = (b.url || '').toLowerCase();
        const n = (b.notes || '').toLowerCase();
        const cat = (b.category || '').toLowerCase();
        return title.includes(qt) || u.includes(qt) || n.includes(qt) || cat.includes(qt);
      });
    }
    return sortBookmarks(list, sort);
  }, [items, category, q, sort]);

  const bookmarkSections = useMemo(() => {
    const by = {};
    for (const b of filteredSorted) {
      const k = b.category?.trim() || 'general';
      if (!by[k]) by[k] = [];
      by[k].push(b);
    }
    const keys = [];
    for (const p of BOOKMARK_CATEGORY_PRESETS) {
      if (by[p.id]?.length) keys.push(p.id);
    }
    const extras = Object.keys(by)
      .filter((k) => !PRESET_IDS.has(k) && by[k].length)
      .sort();
    keys.push(...extras);
    return keys.map((categoryId) => ({
      categoryId,
      label: bookmarkCategoryLabel(categoryId),
      list: by[categoryId],
    }));
  }, [filteredSorted]);

  const totalFilteredCount = filteredSorted.length;

  const handleDelete = (id) => {
    if (!window.confirm('Remove this bookmark?')) return;
    deleteBookmark(id)
      .then(() => setItems((prev) => prev.filter((b) => b.id !== id)))
      .catch(() => {});
  };

  const handleSavedEdit = (row) => {
    setItems((prev) => prev.map((b) => (b.id === row.id ? row : b)));
  };

  if (loading) {
    return (
      <div className="page-content page-shell page-shell--bookmarks bookmark-page">
        <h2 className="page-title">Bookmarks</h2>
        <p className="loading">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page-content page-shell page-shell--bookmarks bookmark-page">
      <h2 className="page-title">Bookmarks</h2>
      <p className="page-shell__intro">
        Your saved links by category — separate from your media watchlist. Add new bookmarks from the header{' '}
        <strong>Add</strong> menu or{' '}
        <Link to="/add-bookmark">Add bookmark</Link>.
      </p>

      {listError ? (
        <div className="error page-shell__feedback" role="alert">
          {listError}{' '}
          <button type="button" className="bookmark-directory__retry" onClick={handleRetryLoad}>
            Retry
          </button>
        </div>
      ) : null}

      <div className="bookmark-directory">
        <div className="search-input-wrap">
          <label htmlFor="bookmark-search-input" className="visually-hidden">
            Search bookmarks
          </label>
          <input
            id="bookmark-search-input"
            type="search"
            placeholder="Search title, URL, description, or category…"
            value={q}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              if (e.target.value.trim()) next.set('q', e.target.value);
              else next.delete('q');
              setSearchParams(next);
            }}
            className="search-input search-input--browse"
            autoComplete="off"
          />
        </div>

        <BookmarkFilterBar categoryOptions={categoryOptions} resultCount={totalFilteredCount} />

        {items.length === 0 ? (
          <EmptyState
            title="No bookmarks yet"
            message="Use Add → Add bookmark in the header, or open Add bookmark from the intro link above."
          />
        ) : bookmarkSections.length === 0 ? (
          <EmptyState
            title="No matches"
            message="Nothing matches your search or filters. Clear all or try different words."
          />
        ) : (
          <div className="my-lists bookmark-directory__sections">
            {bookmarkSections.map(({ categoryId, label: sectionLabel, list }) => (
              <section key={categoryId} className="list-section bookmark-directory__list-section">
                <h3 className="list-section-title">
                  {sectionLabel} ({list.length})
                </h3>
                <ul className="bookmark-directory__grid">
                  {list.map((b) => (
                    <li key={b.id}>
                      <BookmarkDirectoryCard
                        bookmark={b}
                        onEdit={setEditingBookmark}
                        onDelete={handleDelete}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {editingBookmark ? (
        <BookmarkEditModal
          key={editingBookmark.id}
          bookmark={editingBookmark}
          onClose={() => setEditingBookmark(null)}
          onSaved={handleSavedEdit}
        />
      ) : null}
    </div>
  );
}
