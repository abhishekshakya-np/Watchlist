import { useState } from 'react';
import { API } from '../api.js';

export default function Backup() {
  const [error, setError] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [mergeOnly, setMergeOnly] = useState(false);
  const [restoreFileLabel, setRestoreFileLabel] = useState('No file chosen');

  const downloadBackup = async () => {
    setError(null);
    setSuccess(null);
    try {
      const r = await fetch(`${API}/backup/export`);
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const name = r.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'watchlist-backup.json';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
      setSuccess('Backup downloaded.');
    } catch (e) {
      setError(
        e.message === 'Failed to fetch'
          ? 'Could not reach the server. Make sure the server is running (npm start) and try again.'
          : e.message,
      );
    }
  };

  const restoreBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setRestoreLoading(true);
    setRestoreFileLabel(file.name);
    try {
      const text = await file.text();
      let backup;
      try {
        backup = JSON.parse(text);
      } catch (_) {
        throw new Error('Invalid JSON in backup file.');
      }
      if (!backup?.tables?.titles) throw new Error('Invalid backup format (missing tables.titles).');
      const endpoint = mergeOnly ? `${API}/backup/merge` : `${API}/backup/restore`;
      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || r.statusText);
      e.target.value = '';
      setRestoreFileLabel('No file chosen');
      setSuccess(
        mergeOnly
          ? 'Merge complete. Only titles not already in your list were added. Refresh or go to Home to see data.'
          : 'Backup restored successfully. Refresh the page or go to Home to see your data.',
      );
    } catch (err) {
      const msg =
        err.message === 'Failed to fetch'
          ? 'Could not reach the server. Make sure the server is running (npm start) and try again.'
          : err.message;
      setError(msg);
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Backup &amp; restore</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
        Download full JSON backup or restore from file. Use <strong>Merge</strong> to add only titles that are not already in your list.
      </p>

      <div className="backup-actions">
        <div className="backup-action-block">
          <label className="backup-label">Download backup</label>
          <p className="backup-hint">Save all titles and list data to a JSON file.</p>
          <button type="button" className="btn primary" onClick={downloadBackup}>
            Download backup
          </button>
        </div>

        <div className="backup-action-block">
          <label className="backup-label">Restore from file</label>
          <p className="backup-hint">Choose a backup JSON file. Replace all data or merge (add only missing titles).</p>
          <label className="backup-checkbox">
            <input type="checkbox" checked={mergeOnly} onChange={(e) => setMergeOnly(e.target.checked)} />
            <span>Merge only (add titles that are not already in the list; do not replace existing)</span>
          </label>
          <div className="backup-file-row">
            <label className="btn secondary backup-choose-btn">
              Choose file
              <input type="file" accept=".json" onChange={restoreBackup} disabled={restoreLoading} className="backup-file-input" />
            </label>
            <span className="backup-file-name">{restoreFileLabel}</span>
          </div>
          {restoreLoading && <span className="backup-loading">Restoring…</span>}
        </div>
      </div>

      {success && <p className="backup-success" style={{ marginTop: 'var(--space-lg)' }}>{success}</p>}
      {error && <p className="form-error" style={{ marginTop: 'var(--space-lg)' }}>{error}</p>}
    </div>
  );
}
