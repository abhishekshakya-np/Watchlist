import { useState } from 'react';
import { Link } from 'react-router-dom';
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
      const r = await fetch(`${API}/backup/export`, { credentials: 'include' });
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
        credentials: 'include',
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || r.statusText);
      e.target.value = '';
      setRestoreFileLabel('No file chosen');
      setSuccess(
        mergeOnly
          ? 'Merge complete. New titles and bookmarks (by URL) were added where missing. Refresh or open Home / Bookmarks to see data.'
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
    <div className="page-content page-shell page-shell--backup">
      <p className="admin-backup-crumb">
        <Link to="/admin">← Admin dashboard</Link>
      </p>
      <h2 className="page-title">Backup and restore</h2>
      <p className="page-shell__intro">
        Download full JSON backup or restore from file. Exports include titles, your list, and bookmarks. Use <strong>Merge</strong> to add only titles and bookmark URLs that are not already present (older backup files without bookmarks leave bookmarks unchanged).
      </p>

      <div className="backup-actions">
        <div className="backup-action-block">
          <label className="backup-label">Download backup</label>
          <p className="backup-hint">Save titles, list entries, and bookmarks to a JSON file.</p>
          <button type="button" className="btn primary" onClick={downloadBackup}>
            Download backup
          </button>
        </div>

        <div className="backup-action-block">
          <label className="backup-label">Restore from file</label>
          <p className="backup-hint">Choose a backup JSON file. Replace all data or merge (add only missing titles and bookmark URLs).</p>
          <label className="backup-checkbox">
            <input type="checkbox" checked={mergeOnly} onChange={(e) => setMergeOnly(e.target.checked)} />
            <span>Merge only (add titles and bookmarks not already present; do not replace existing rows)</span>
          </label>
          <div
            className={`backup-file-picker${restoreLoading ? ' backup-file-picker--loading' : ''}`}
            aria-busy={restoreLoading}
          >
            <div className="backup-file-picker__row">
              <div className="backup-file-picker__control">
                <input
                  id="backup-restore-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={restoreBackup}
                  disabled={restoreLoading}
                  className="backup-file-picker__input"
                  aria-label="Choose JSON backup file to restore or merge"
                  aria-describedby="backup-file-hint"
                />
                <label
                  htmlFor="backup-restore-file"
                  className={`backup-file-picker__trigger btn secondary${restoreLoading ? ' backup-file-picker__trigger--disabled' : ''}`}
                >
                  <span className="backup-file-picker__trigger-icon" aria-hidden="true" />
                  <span className="backup-file-picker__trigger-text">Select JSON file</span>
                </label>
              </div>
              <div className="backup-file-picker__file-info" id="backup-file-hint">
                <p
                  className={`backup-file-picker__filename${restoreFileLabel === 'No file chosen' ? ' backup-file-picker__filename--empty' : ''}`}
                >
                  {restoreFileLabel === 'No file chosen' ? 'No file selected' : restoreFileLabel}
                </p>
                <p className="backup-file-picker__meta">Only .json exports from this app are supported.</p>
              </div>
            </div>
            {restoreLoading && (
              <p className="backup-file-picker__loading" role="status">
                Restoring backup…
              </p>
            )}
          </div>
        </div>
      </div>

      {success && <p className="backup-success page-shell__feedback">{success}</p>}
      {error && <p className="form-error page-shell__feedback">{error}</p>}
    </div>
  );
}
