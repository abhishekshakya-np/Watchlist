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
  category,
  setCategory,
  categoryCustom,
  setCategoryCustom,
  imageUrl,
  setImageUrl,
  disabled = false,
  savedCategoryIds = [],
}) {
  const extraCategoryIds = useMemo(() => {
    const seen = new Set(PRESET_IDS);
    return [...new Set(savedCategoryIds.map((id) => String(id).trim()).filter(Boolean))]
      .filter((id) => !seen.has(id))
      .sort((a, b) =>
        bookmarkCategoryLabel(a).localeCompare(bookmarkCategoryLabel(b), undefined, { sensitivity: 'base' }),
      );
  }, [savedCategoryIds]);

  const selectableIds = useMemo(() => new Set([...PRESET_IDS, ...extraCategoryIds]), [extraCategoryIds]);

  const isConcretePick = category !== 'custom' && selectableIds.has(category);
  const showCustomField = !isConcretePick;
  const selectDisplayValue = isConcretePick ? category : 'custom';
  const customFieldValue = category === 'custom' ? categoryCustom : isConcretePick ? '' : category;

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
      <div className="bookmarks-form__row">
        <label htmlFor={`${idPrefix}bookmark-category`} className="bookmarks-form__label bookmark-directory__label">
          Category
        </label>
        <select
          id={`${idPrefix}bookmark-category`}
          className="bookmarks-form__input bookmark-directory__input native-select bookmark-directory__select"
          value={selectDisplayValue}
          onChange={(ev) => {
            const v = ev.target.value;
            if (v === 'custom') {
              setCategory('custom');
            } else {
              setCategory(v);
              setCategoryCustom('');
            }
          }}
          disabled={disabled}
        >
          {BOOKMARK_CATEGORY_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
          {extraCategoryIds.length > 0 ? (
            <optgroup label="Saved categories">
              {extraCategoryIds.map((id) => (
                <option key={id} value={id}>
                  {bookmarkCategoryLabel(id)}
                </option>
              ))}
            </optgroup>
          ) : null}
          <option value="custom">Custom…</option>
        </select>
        {showCustomField ? (
          <input
            id={`${idPrefix}bookmark-category-custom`}
            type="text"
            className="bookmarks-form__input bookmark-directory__input bookmark-directory__input--mt"
            placeholder="Your category name"
            value={customFieldValue}
            onChange={(ev) => {
              setCategory('custom');
              setCategoryCustom(ev.target.value);
            }}
            disabled={disabled}
            aria-label="Custom category name"
          />
        ) : null}
      </div>
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
