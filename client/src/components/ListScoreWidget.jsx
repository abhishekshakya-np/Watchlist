import { useState, useEffect } from 'react';
import { addToList, updateListEntry, removeFromList } from '../api.js';
import { STATUS_OPTIONS } from '../constants.js';

export default function ListScoreWidget({ titleId, entry, onUpdate }) {
  const [status, setStatus] = useState(entry?.status || 'planning');
  const [score, setScore] = useState(entry?.score ?? '');
  const [progress, setProgress] = useState(entry?.progress ?? '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setStatus(entry?.status || 'planning');
    setScore(entry?.score ?? '');
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
  const handleSave = () => save({ status, score: score === '' ? undefined : score, progress: progress || undefined });
  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeFromList(titleId);
      onUpdate?.();
    } finally {
      setLoading(false);
    }
  };
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
              save({ status: v, score: score === '' ? undefined : score, progress: progress || undefined });
            }}
            disabled={loading}
          >
            {STATUS_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <label className="widget-label">Score (1–10)</label>
          <input
            type="number"
            min={1}
            max={10}
            value={score}
            onChange={(e) => setScore(e.target.value === '' ? '' : Math.min(10, Math.max(1, Number(e.target.value))))}
            onBlur={() => save({ status, score: score === '' ? undefined : score, progress: progress || undefined })}
            disabled={loading}
          />
          <label className="widget-label">Progress</label>
          <input
            type="text"
            placeholder="e.g. 5/12 eps"
            value={progress}
            onChange={(e) => setProgress(e.target.value)}
            onBlur={() => save({ status, score: score === '' ? undefined : score, progress: progress || undefined })}
            disabled={loading}
          />
          <button type="button" className="btn primary btn-save-list" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
          {saved && <span className="list-score-saved">Saved</span>}
          <button type="button" className="btn-remove" onClick={handleRemove} disabled={loading}>
            Remove from list
          </button>
        </>
      ) : (
        <button type="button" className="btn primary" onClick={() => save({ status: 'planning' })} disabled={loading}>
          Add to list
        </button>
      )}
    </div>
  );
}
