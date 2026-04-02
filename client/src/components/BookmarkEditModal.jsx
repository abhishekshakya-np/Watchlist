import { useState, useEffect, useRef } from 'react';
import { updateBookmark, getBookmarkCategories, fetchBookmarkLinkPreview } from '../api.js';
import BookmarkFormFields from './BookmarkFormFields.jsx';
import { bookmarkCategoriesList } from '../constants.js';

export default function BookmarkEditModal({ bookmark, onClose, onSaved }) {
  const [savedCategoryIds, setSavedCategoryIds] = useState([]);

  const [editUrl, setEditUrl] = useState(bookmark.url);
  const [editLabel, setEditLabel] = useState(bookmark.label ?? '');
  const [editNotes, setEditNotes] = useState(bookmark.notes ?? '');
  const [selectedCategories, setSelectedCategories] = useState(() => bookmarkCategoriesList(bookmark));
  const [customCategoryDraft, setCustomCategoryDraft] = useState('');
  const [editImageUrl, setEditImageUrl] = useState(bookmark.image_url ?? '');
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [fetchPreviewPending, setFetchPreviewPending] = useState(false);
  const [fetchPreviewHint, setFetchPreviewHint] = useState(null);

  const selectedCategoriesRef = useRef(selectedCategories);
  useEffect(() => {
    selectedCategoriesRef.current = selectedCategories;
  }, [selectedCategories]);

  useEffect(() => {
    getBookmarkCategories().then(setSavedCategoryIds).catch(() => {});
  }, [bookmark.id]);

  useEffect(() => {
    setFetchPreviewHint(null);
  }, [editUrl]);

  const handleToggleCategory = (id) => {
    setSelectedCategories((prev) => {
      const set = new Set(prev);
      if (set.has(id)) {
        if (set.size <= 1) return prev;
        set.delete(id);
      } else {
        set.add(id);
      }
      return [...set];
    });
  };

  const handleAddCustomCategory = () => {
    const t = customCategoryDraft.trim().slice(0, 80);
    if (!t) return;
    setSelectedCategories((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setCustomCategoryDraft('');
  };

  const handleFetchFromPage = async () => {
    if (!editUrl.trim()) {
      setFetchPreviewHint('Enter a URL first.');
      return;
    }
    setFetchPreviewPending(true);
    setFetchPreviewHint(null);
    setEditError(null);
    const hadLabel = !editLabel.trim();
    const hadNotes = !editNotes.trim();
    try {
      const p = await fetchBookmarkLinkPreview(editUrl);
      if (p.image_url) setEditImageUrl(p.image_url);
      if (p.suggested_title && hadLabel) setEditLabel(p.suggested_title);
      if (p.suggested_description && hadNotes) setEditNotes(p.suggested_description);

      const appliedLabels = [];
      if (p.image_url) appliedLabels.push('image');
      if (p.suggested_title && hadLabel) appliedLabels.push('title');
      if (p.suggested_description && hadNotes) appliedLabels.push('description');

      if (!p.image_url && !p.suggested_title && !p.suggested_description) {
        setFetchPreviewHint(
          'No Open Graph data on that page (some sites only expose it to search crawlers). Paste an image URL manually if you need a thumbnail.',
        );
      } else if (appliedLabels.length === 0) {
        setFetchPreviewHint(
          'The page had text hints but your title and description are already filled, and no image URL was found. Clear those fields and try again if you want to replace them.',
        );
      } else {
        const nice = appliedLabels.map((k) =>
          k === 'image' ? 'image' : k === 'title' ? 'title' : 'description',
        );
        const kept = [];
        if (!hadLabel && p.suggested_title) kept.push('title');
        if (!hadNotes && p.suggested_description) kept.push('description');
        const keptMsg =
          kept.length > 0 ? ` Left your existing ${kept.join(' and ')} as-is.` : '';
        setFetchPreviewHint(`Loaded ${nice.join(', ')} from the page.${keptMsg}`);
      }
    } catch (err) {
      setFetchPreviewHint(err.message || 'Could not load preview.');
    } finally {
      setFetchPreviewPending(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setEditError(null);
    setEditSaving(true);
    const cats = (selectedCategoriesRef.current || [])
      .map((c) => String(c).trim())
      .filter((c) => c.length > 0);
    const categoriesPayload = cats.length > 0 ? cats : ['general'];
    const categoryPrimary = categoriesPayload[0];
    updateBookmark(Number(bookmark.id), {
      url: editUrl,
      label: editLabel.trim() || null,
      notes: editNotes.trim() || null,
      categories: categoriesPayload,
      category: categoryPrimary,
      image_url: editImageUrl.trim() || null,
    })
      .then((row) => {
        onSaved(row);
        onClose();
      })
      .catch((err) => setEditError(err.message || 'Could not update bookmark.'))
      .finally(() => setEditSaving(false));
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="modal bookmark-edit-modal"
        onClick={(ev) => ev.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bookmark-edit-modal-title"
      >
        <div className="modal-header bookmark-edit-modal__header">
          <h3 id="bookmark-edit-modal-title">Edit bookmark</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <form className="bookmark-edit-modal__form bookmarks-form" onSubmit={handleSave}>
          <div className="bookmark-edit-modal__scroll">
            <BookmarkFormFields
              idPrefix="modal-edit-"
              url={editUrl}
              setUrl={setEditUrl}
              label={editLabel}
              setLabel={setEditLabel}
              notes={editNotes}
              setNotes={setEditNotes}
              selectedCategories={selectedCategories}
              onToggleCategory={handleToggleCategory}
              customCategoryDraft={customCategoryDraft}
              setCustomCategoryDraft={setCustomCategoryDraft}
              onAddCustomCategory={handleAddCustomCategory}
              imageUrl={editImageUrl}
              setImageUrl={setEditImageUrl}
              disabled={editSaving}
              savedCategoryIds={savedCategoryIds}
              onFetchFromPage={handleFetchFromPage}
              fetchFromPagePending={fetchPreviewPending}
              fetchFromPageHint={fetchPreviewHint}
            />
            {editError ? (
              <p className="bookmark-directory__form-error" role="alert">
                {editError}
              </p>
            ) : null}
          </div>
          <div className="bookmark-edit-modal__footer">
            <div className="bookmark-edit-modal__actions">
              <button type="submit" className="btn primary" disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn secondary" onClick={onClose} disabled={editSaving}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
