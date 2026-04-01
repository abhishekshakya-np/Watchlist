import { BOOKMARK_CATEGORY_PRESETS } from '../constants.js';

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
}) {
  const showCustom = category === 'custom';

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
          className="bookmarks-form__input bookmark-directory__input bookmark-directory__select"
          value={showCustom ? 'custom' : category}
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
          <option value="custom">Custom…</option>
        </select>
        {showCustom && (
          <input
            id={`${idPrefix}bookmark-category-custom`}
            type="text"
            className="bookmarks-form__input bookmark-directory__input bookmark-directory__input--mt"
            placeholder="Your category name"
            value={categoryCustom}
            onChange={(ev) => setCategoryCustom(ev.target.value)}
            disabled={disabled}
            aria-label="Custom category name"
          />
        )}
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
