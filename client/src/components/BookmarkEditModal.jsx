import { useState, useEffect } from 'react';
import { updateBookmark, getBookmarkCategories } from '../api.js';
import BookmarkFormFields from './BookmarkFormFields.jsx';
import { BOOKMARK_CATEGORY_PRESETS } from '../constants.js';

const PRESET_IDS = new Set(BOOKMARK_CATEGORY_PRESETS.map((p) => p.id));

function effectiveCategoryId(category, categoryCustom) {
  if (category === 'custom') {
    const t = categoryCustom.trim();
    return t || 'general';
  }
  return category || 'general';
}

export default function BookmarkEditModal({ bookmark, onClose, onSaved }) {
  const storedCat = bookmark.category?.trim() || 'general';
  const [savedCategoryIds, setSavedCategoryIds] = useState([]);

  const [editUrl, setEditUrl] = useState(bookmark.url);
  const [editLabel, setEditLabel] = useState(bookmark.label ?? '');
  const [editNotes, setEditNotes] = useState(bookmark.notes ?? '');
  const [editCategory, setEditCategory] = useState(() => (PRESET_IDS.has(storedCat) ? storedCat : 'custom'));
  const [editCategoryCustom, setEditCategoryCustom] = useState(() => (PRESET_IDS.has(storedCat) ? '' : storedCat));
  const [editImageUrl, setEditImageUrl] = useState(bookmark.image_url ?? '');
  const [editError, setEditError] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    getBookmarkCategories().then(setSavedCategoryIds).catch(() => {});
  }, [bookmark.id]);

  useEffect(() => {
    if (savedCategoryIds.length === 0) return;
    if (PRESET_IDS.has(storedCat)) return;
    if (
      savedCategoryIds.includes(storedCat) &&
      editCategory === 'custom' &&
      editCategoryCustom === storedCat
    ) {
      setEditCategory(storedCat);
      setEditCategoryCustom('');
    }
  }, [savedCategoryIds, storedCat, editCategory, editCategoryCustom]);

  const handleSave = (e) => {
    e.preventDefault();
    setEditError(null);
    setEditSaving(true);
    const cat = effectiveCategoryId(editCategory, editCategoryCustom);
    updateBookmark(bookmark.id, {
      url: editUrl,
      label: editLabel.trim() || null,
      notes: editNotes.trim() || null,
      category: cat,
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
        <div className="modal-header">
          <h3 id="bookmark-edit-modal-title">Edit bookmark</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <form className="bookmarks-form" onSubmit={handleSave}>
            <BookmarkFormFields
              idPrefix="modal-edit-"
              url={editUrl}
              setUrl={setEditUrl}
              label={editLabel}
              setLabel={setEditLabel}
              notes={editNotes}
              setNotes={setEditNotes}
              category={editCategory}
              setCategory={setEditCategory}
              categoryCustom={editCategoryCustom}
              setCategoryCustom={setEditCategoryCustom}
              imageUrl={editImageUrl}
              setImageUrl={setEditImageUrl}
              disabled={editSaving}
              savedCategoryIds={savedCategoryIds}
            />
            {editError ? (
              <p className="bookmark-directory__form-error" role="alert">
                {editError}
              </p>
            ) : null}
            <div className="bookmark-edit-modal__actions">
              <button type="submit" className="btn primary" disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn secondary" onClick={onClose} disabled={editSaving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
