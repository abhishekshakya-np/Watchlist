import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createBookmark } from '../api.js';
import BookmarkFormFields from '../components/BookmarkFormFields.jsx';

function effectiveCategoryId(category, categoryCustom) {
  if (category === 'custom') {
    const t = categoryCustom.trim();
    return t || 'general';
  }
  return category || 'general';
}

export default function AddBookmark() {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('general');
  const [categoryCustom, setCategoryCustom] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successRow, setSuccessRow] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const cat = effectiveCategoryId(category, categoryCustom);
    try {
      const row = await createBookmark({
        url,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
        category: cat,
        image_url: imageUrl.trim() || undefined,
      });
      setSuccessRow(row);
      setUrl('');
      setLabel('');
      setNotes('');
      setCategory('general');
      setCategoryCustom('');
      setImageUrl('');
    } catch (err) {
      setFormError(err.message || 'Could not save bookmark.');
    } finally {
      setSaving(false);
    }
  };

  const resetSuccess = () => {
    setSuccessRow(null);
  };

  if (successRow) {
    const displayLabel = successRow.label?.trim() || successRow.url;
    return (
      <div className="page-content page-shell page-shell--add">
        <div className="success-block" role="alert">
          <div className="success-icon" aria-hidden="true">
            ✓
          </div>
          <h2 className="page-title success-title">Bookmark added</h2>
          <p className="success-message">
            “{displayLabel}” has been saved to your bookmark collection.
          </p>
          <div className="success-actions">
            <Link to="/bookmarks" className="btn primary">
              View bookmarks
            </Link>
            <button type="button" className="btn secondary" onClick={resetSuccess}>
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content page-shell page-shell--add">
      <h2 className="page-title">Add bookmark</h2>
      <p className="page-shell__intro">
        Save a URL to your bookmark collection — separate from titles on your watchlist. Optional title, category, image, and notes.
      </p>
      <form className="form-add-bookmark bookmarks-form" onSubmit={handleSubmit}>
        <BookmarkFormFields
          idPrefix="add-bookmark-"
          url={url}
          setUrl={setUrl}
          label={label}
          setLabel={setLabel}
          notes={notes}
          setNotes={setNotes}
          category={category}
          setCategory={setCategory}
          categoryCustom={categoryCustom}
          setCategoryCustom={setCategoryCustom}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          disabled={saving}
        />
        {formError ? (
          <p className="form-add-bookmark__error" role="alert">
            {formError}
          </p>
        ) : null}
        <button type="submit" className="btn primary form-add-bookmark__submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add bookmark'}
        </button>
      </form>
    </div>
  );
}
