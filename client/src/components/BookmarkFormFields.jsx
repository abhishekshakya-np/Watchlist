import { useMemo } from 'react';
import { BOOKMARK_CATEGORY_PRESETS, bookmarkCategoryLabel } from '../constants.js';

const PRESET_IDS = new Set(BOOKMARK_CATEGORY_PRESETS.map((p) => p.id));

export default function BookmarkFormFields({
  idPrefix = '',
  url,
  setUrl,
  label,
  setLabel,
  notes,
  setNotes,
  selectedCategories,
  onToggleCategory,
  customCategoryDraft,
  setCustomCategoryDraft,
  onAddCustomCategory,
  imageUrl,
  setImageUrl,
  disabled = false,
  savedCategoryIds = [],
  onFetchFromPage,
  fetchFromPagePending = false,
  fetchFromPageHint = null,
}) {
  const extraCategoryIds = useMemo(() => {
    const seen = new Set(PRESET_IDS);
    const fromSaved = [...new Set(savedCategoryIds.map((id) => String(id).trim()).filter(Boolean))].filter(
      (id) => !seen.has(id),
    );
    const fromSelected = selectedCategories.filter((id) => !seen.has(id));
    return [...new Set([...fromSaved, ...fromSelected])].sort((a, b) =>
      bookmarkCategoryLabel(a).localeCompare(bookmarkCategoryLabel(b), undefined, { sensitivity: 'base' }),
    );
  }, [savedCategoryIds, selectedCategories]);

  const handleAddCustom = () => {
    onAddCustomCategory();
  };

  const handleCustomKeyDown = (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      onAddCustomCategory();
    }
  };

  return (
    <>
      <div className="bookmarks-form__row">
        <label htmlFor={`${idPrefix}bookmark-url`} className="bookmarks-form__label bookmark-directory__label">
          URL
        </label>
        <input
          id={`${idPrefix}bookmark-url`}
          type="text"
          inputMode="url"
          autoComplete="url"
          className="bookmarks-form__input bookmark-directory__input"
          placeholder="https://… or example.com (https added automatically)"
          value={url}
          onChange={(ev) => setUrl(ev.target.value)}
          required
          disabled={disabled}
        />
        {onFetchFromPage ? (
          <div className="bookmarks-form__preview">
            <button
              type="button"
              className="btn secondary bookmarks-form__preview-btn"
              onClick={onFetchFromPage}
              disabled={disabled || fetchFromPagePending || !String(url).trim()}
            >
              {fetchFromPagePending ? 'Loading preview…' : 'Load title, image, and description from page'}
            </button>
            {fetchFromPageHint ? (
              <p className="bookmarks-form__preview-hint" role="status">
                {fetchFromPageHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="bookmarks-form__row">
        <label htmlFor={`${idPrefix}bookmark-label`} className="bookmarks-form__label bookmark-directory__label">
          Title <span className="bookmarks-form__optional">(optional)</span>
        </label>
        <input
          id={`${idPrefix}bookmark-label`}
          type="text"
          className="bookmarks-form__input bookmark-directory__input"
          placeholder="Shown on the card"
          value={label}
          onChange={(ev) => setLabel(ev.target.value)}
          disabled={disabled}
        />
      </div>
      <fieldset className="bookmarks-form__fieldset">
        <legend className="bookmarks-form__label bookmark-directory__label">Categories</legend>
        <p className="bookmarks-form__hint">
          Choose one or more — the same link can appear under several groups on the Bookmarks page.
        </p>
        <div className="bookmarks-form__checkbox-grid">
          {BOOKMARK_CATEGORY_PRESETS.map((p) => {
            const checked = selectedCategories.includes(p.id);
            return (
              <label key={p.id} className="bookmarks-form__check">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleCategory(p.id)}
                  disabled={disabled}
                />
                <span>{p.label}</span>
              </label>
            );
          })}
        </div>
        {extraCategoryIds.length > 0 ? (
          <div className="bookmarks-form__checkbox-grid bookmarks-form__checkbox-grid--extra">
            <span className="bookmarks-form__sublegend">Also used before</span>
            {extraCategoryIds.map((id) => {
              const checked = selectedCategories.includes(id);
              return (
                <label key={id} className="bookmarks-form__check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCategory(id)}
                    disabled={disabled}
                  />
                  <span>{bookmarkCategoryLabel(id)}</span>
                </label>
              );
            })}
          </div>
        ) : null}
        <div className="bookmarks-form__add-custom">
          <label htmlFor={`${idPrefix}bookmark-category-custom`} className="visually-hidden">
            Add custom category
          </label>
          <input
            id={`${idPrefix}bookmark-category-custom`}
            type="text"
            className="bookmarks-form__input bookmark-directory__input"
            placeholder="Add another category (name or id)"
            value={customCategoryDraft}
            onChange={(ev) => setCustomCategoryDraft(ev.target.value)}
            onKeyDown={handleCustomKeyDown}
            disabled={disabled}
            maxLength={80}
          />
          <button
            type="button"
            className="btn secondary bookmarks-form__add-custom-btn"
            onClick={handleAddCustom}
            disabled={disabled || !String(customCategoryDraft).trim()}
          >
            Add
          </button>
        </div>
      </fieldset>
      <div className="bookmarks-form__row">
        <label htmlFor={`${idPrefix}bookmark-image`} className="bookmarks-form__label bookmark-directory__label">
          Image URL <span className="bookmarks-form__optional">(optional)</span>
        </label>
        <input
          id={`${idPrefix}bookmark-image`}
          type="text"
          inputMode="text"
          className="bookmarks-form__input bookmark-directory__input"
          placeholder="https://…, .svg / .webp URL, or data:image/svg+xml… / data:image/webp…"
          value={imageUrl}
          onChange={(ev) => setImageUrl(ev.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="bookmarks-form__row">
        <label htmlFor={`${idPrefix}bookmark-notes`} className="bookmarks-form__label bookmark-directory__label">
          Description <span className="bookmarks-form__optional">(optional)</span>
        </label>
        <textarea
          id={`${idPrefix}bookmark-notes`}
          className="bookmarks-form__textarea bookmark-directory__textarea"
          rows={2}
          placeholder="Short note — shows under the title on the card"
          value={notes}
          onChange={(ev) => setNotes(ev.target.value)}
          disabled={disabled}
        />
      </div>
    </>
  );
}
