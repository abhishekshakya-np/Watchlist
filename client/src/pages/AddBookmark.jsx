import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  createBookmark,
  getBookmarkCategories,
  fetchBookmarkLinkPreview,
  BOOKMARK_URL_DUPLICATE_CODE,
} from '../api.js';
import BookmarkFormFields from '../components/BookmarkFormFields.jsx';
import { bookmarkCategoriesList, bookmarkCategoryLabel } from '../constants.js';

function bookmarkSnippetHost(href) {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return href || '';
  }
}

export default function AddBookmark() {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['general']);
  const [customCategoryDraft, setCustomCategoryDraft] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successRow, setSuccessRow] = useState(null);
  const [savedCategoryIds, setSavedCategoryIds] = useState([]);
  const [fetchPreviewPending, setFetchPreviewPending] = useState(false);
  const [fetchPreviewHint, setFetchPreviewHint] = useState(null);
  const [duplicateExisting, setDuplicateExisting] = useState(null);

  const refreshSavedCategories = useCallback(() => {
    getBookmarkCategories().then(setSavedCategoryIds).catch(() => {});
  }, []);

  useEffect(() => {
    refreshSavedCategories();
  }, [refreshSavedCategories]);

  useEffect(() => {
    setFetchPreviewHint(null);
    setDuplicateExisting(null);
  }, [url]);

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
    if (!url.trim()) {
      setFetchPreviewHint('Enter a URL first.');
      return;
    }
    setFetchPreviewPending(true);
    setFetchPreviewHint(null);
    setFormError(null);
    const hadLabel = !label.trim();
    const hadNotes = !notes.trim();
    try {
      const p = await fetchBookmarkLinkPreview(url);
      if (p.image_url) setImageUrl(p.image_url);
      if (p.suggested_title && hadLabel) setLabel(p.suggested_title);
      if (p.suggested_description && hadNotes) setNotes(p.suggested_description);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setDuplicateExisting(null);
    setSaving(true);
    try {
      const cats = selectedCategories.map((c) => String(c).trim()).filter((c) => c.length > 0);
      const categoriesPayload = cats.length > 0 ? cats : ['general'];
      const row = await createBookmark({
        url,
        label: label.trim() || undefined,
        notes: notes.trim() || undefined,
        categories: categoriesPayload,
        category: categoriesPayload[0],
        image_url: imageUrl.trim() || undefined,
      });
      setSuccessRow(row);
      setUrl('');
      setLabel('');
      setNotes('');
      setSelectedCategories(['general']);
      setCustomCategoryDraft('');
      setImageUrl('');
      setDuplicateExisting(null);
      refreshSavedCategories();
    } catch (err) {
      if (err && err.code === BOOKMARK_URL_DUPLICATE_CODE && err.existing) {
        setDuplicateExisting(err.existing);
        setFormError(null);
      } else {
        setDuplicateExisting(null);
        setFormError(err.message || 'Could not save bookmark.');
      }
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
        Save a URL to your bookmark collection — separate from titles on your watchlist. Use{' '}
        <strong>Load title, image, and description from page</strong> under the URL to pull Open Graph data automatically, or fill fields by hand.
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
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          customCategoryDraft={customCategoryDraft}
          setCustomCategoryDraft={setCustomCategoryDraft}
          onAddCustomCategory={handleAddCustomCategory}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          disabled={saving}
          savedCategoryIds={savedCategoryIds}
          onFetchFromPage={handleFetchFromPage}
          fetchFromPagePending={fetchPreviewPending}
          fetchFromPageHint={fetchPreviewHint}
        />
        {formError ? (
          <p className="form-add-bookmark__error" role="alert">
            {formError}
          </p>
        ) : null}
        {duplicateExisting ? (
          <div className="form-add-bookmark__duplicate" role="region" aria-labelledby="add-bookmark-duplicate-heading">
            <h3 id="add-bookmark-duplicate-heading" className="form-add-bookmark__duplicate-heading">
              This link is already saved
            </h3>
            <p className="form-add-bookmark__duplicate-intro">
              You cannot add the same URL twice. To show it under more categories or change details, open Bookmarks and
              use <strong>Edit</strong> on the card below.
            </p>
            <div className="form-add-bookmark__duplicate-card">
              {duplicateExisting.image_url?.trim() ? (
                <div
                  className="form-add-bookmark__duplicate-thumb"
                  style={{ backgroundImage: `url(${duplicateExisting.image_url})` }}
                  aria-hidden="true"
                />
              ) : (
                <div
                  className="form-add-bookmark__duplicate-thumb form-add-bookmark__duplicate-thumb--placeholder"
                  aria-hidden="true"
                />
              )}
              <div className="form-add-bookmark__duplicate-body">
                <span className="form-add-bookmark__duplicate-title">
                  {duplicateExisting.label?.trim() || bookmarkSnippetHost(duplicateExisting.url)}
                </span>
                <a
                  href={duplicateExisting.url}
                  className="form-add-bookmark__duplicate-url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {duplicateExisting.url}
                </a>
                <p className="form-add-bookmark__duplicate-cats">
                  Categories:{' '}
                  {bookmarkCategoriesList(duplicateExisting)
                    .map((id) => bookmarkCategoryLabel(id))
                    .join(', ')}
                </p>
              </div>
            </div>
            <div className="form-add-bookmark__duplicate-actions">
              <Link
                to={`/bookmarks?q=${encodeURIComponent(duplicateExisting.url)}`}
                className="btn primary form-add-bookmark__duplicate-cta"
              >
                Find it in Bookmarks
              </Link>
            </div>
          </div>
        ) : null}
        <button type="submit" className="btn primary form-add-bookmark__submit" disabled={saving}>
          {saving ? 'Saving…' : 'Add bookmark'}
        </button>
      </form>
    </div>
  );
}
