import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { addToList, updateListEntry, removeFromList } from '../api.js';
import { LIST_SCORE_OPTIONS, STATUS_OPTIONS, formatListScore, listProgressPlaceholder } from '../constants.js';
import ConfirmDialog from './ConfirmDialog.jsx';

function statusLabel(value) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label || value;
}

export default function ListScoreWidget({
  titleId,
  entry,
  onUpdate,
  canEdit = true,
  mediaType,
  titleLabel = '',
}) {
  const location = useLocation();
  const progressPlaceholder = listProgressPlaceholder(mediaType);
  const [status, setStatus] = useState(entry?.status || 'planning');
  const [score, setScore] = useState(() => {
    const raw = entry?.score;
    const n = raw !== '' && raw != null ? Number(raw) : NaN;
    return Number.isInteger(n) && n >= 1 && n <= 4 ? String(n) : '';
  });
  const [progress, setProgress] = useState(entry?.progress ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!entry) setRemoveConfirmOpen(false);
  }, [entry]);

  useEffect(() => {
    setStatus(entry?.status || 'planning');
    const raw = entry?.score;
    const n = raw !== '' && raw != null ? Number(raw) : NaN;
    setScore(Number.isInteger(n) && n >= 1 && n <= 4 ? String(n) : '');
    setProgress(entry?.progress ?? '');
  }, [entry?.status, entry?.score, entry?.progress]);

  const save = async (updates) => {
    setLoading(true);
    setSaved(false);
    try {
      if (entry) await updateListEntry(titleId, updates);
      else await addToList(titleId, updates);
      onUpdate?.();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () =>
    save({ status, progress: progress || undefined, score: score === '' ? null : Number(score) });

  const handleRemoveClick = () => setRemoveConfirmOpen(true);

  const handleRemoveCancel = () => {
    if (loading) return;
    setRemoveConfirmOpen(false);
  };

  const handleRemoveConfirm = async () => {
    setLoading(true);
    try {
      await removeFromList(titleId);
      onUpdate?.();
      setRemoveConfirmOpen(false);
    } catch {
      /* request failed; keep dialog open */
    } finally {
      setLoading(false);
    }
  };

  if (!canEdit) {
    if (entry) {
      return (
        <div className="list-score-widget list-score-widget--readonly">
          <h3 className="widget-title">On the list</h3>
          <dl className="list-score-widget__readonly">
            <div className="list-score-widget__readonly-row">
              <dt>Status</dt>
              <dd>{statusLabel(entry.status)}</dd>
            </div>
            {formatListScore(entry.score) ? (
              <div className="list-score-widget__readonly-row">
                <dt>Your rating</dt>
                <dd>{formatListScore(entry.score)}</dd>
              </div>
            ) : entry?.score != null && entry.score !== '' ? (
              <div className="list-score-widget__readonly-row">
                <dt>Your rating</dt>
                <dd>
                  Older rating saved as <strong>{entry.score}</strong>. An admin can update it to 1–4.
                </dd>
              </div>
            ) : null}
            {entry.progress ? (
              <div className="list-score-widget__readonly-row">
                <dt>Progress</dt>
                <dd>{entry.progress}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      );
    }
    return (
      <div className="list-score-widget list-score-widget--readonly">
        <h3 className="widget-title">Your list</h3>
        <p className="list-score-widget__readonly-note">
          This title is not on the shared list. An admin can add it after{' '}
          <Link to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`}>signing in</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="list-score-widget">
      <h3 className="widget-title">Your list</h3>
      {entry ? (
        <>
          <label className="widget-label">Status</label>
          <select
            className="native-select"
            value={status}
            onChange={(e) => {
              const v = e.target.value;
              setStatus(v);
              save({ status: v, progress: progress || undefined, score: score === '' ? null : Number(score) });
            }}
            disabled={loading}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="widget-label" htmlFor="list-score-select">
            Your rating (optional)
          </label>
          <select
            id="list-score-select"
            className="native-select"
            value={score}
            onChange={(e) => {
              const v = e.target.value;
              setScore(v);
              save({ score: v === '' ? null : Number(v) });
            }}
            disabled={loading}
          >
            <option value="">No rating</option>
            {LIST_SCORE_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {entry?.score != null &&
          entry.score !== '' &&
          (!Number.isInteger(Number(entry.score)) || Number(entry.score) < 1 || Number(entry.score) > 4) ? (
            <p className="list-score-widget__legacy" role="note">
              Older rating saved as <strong>{entry.score}</strong>. Pick 1–4 above to replace it.
            </p>
          ) : null}
          <label className="widget-label" htmlFor="list-progress-input">
            Progress
          </label>
          <input
            id="list-progress-input"
            type="text"
            placeholder={progressPlaceholder}
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            onBlur={() => save({ progress: progress || undefined })}
            disabled={loading}
          />
          <div className="list-score-widget__save-block">
            <button type="button" className="btn primary btn-save-list" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
            {saved ? (
              <p className="list-score-widget__saved-status" role="status" aria-live="polite">
                Saved
              </p>
            ) : null}
          </div>
          <button type="button" className="btn-remove" onClick={handleRemoveClick} disabled={loading}>
            Remove from list
          </button>
          <ConfirmDialog
            open={removeConfirmOpen}
            title="Remove from list?"
            description={
              titleLabel.trim()
                ? `Remove “${titleLabel.trim()}” from your list? Your status, rating, and progress for this title will be cleared.`
                : 'Remove this title from your list? Your status, rating, and progress will be cleared.'
            }
            confirmLabel={loading ? 'Removing…' : 'Remove from list'}
            cancelLabel="Cancel"
            danger
            confirmDisabled={loading}
            onConfirm={handleRemoveConfirm}
            onCancel={handleRemoveCancel}
          />
        </>
      ) : (
        <button type="button" className="btn primary" onClick={() => save({ status: 'planning' })} disabled={loading}>
          Add to list
        </button>
      )}
    </div>
  );
}
