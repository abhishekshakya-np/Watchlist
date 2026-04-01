import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getTitleBySlug,
  getListEntry,
  getRelatedTitles,
  deleteTitle,
} from '../api.js';
import DetailHero from '../components/DetailHero.jsx';
import DetailStatsRow from '../components/DetailStatsRow.jsx';
import ListScoreWidget from '../components/ListScoreWidget.jsx';
import AddRelatedModal from '../components/AddRelatedModal.jsx';
import TitleDetailMainColumn from '../components/TitleDetailMainColumn.jsx';

export default function TitleDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [entry, setEntry] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRelated, setShowAddRelated] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const refreshEntry = () => {
    if (title?.id) getListEntry(title.id).then(setEntry);
  };
  const refreshRelated = () => {
    if (title?.id) getRelatedTitles(title.id).then(setRelated);
  };

  const handleDelete = () => {
    if (!title?.id) return;
    if (!window.confirm(`Delete "${title.title || title.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    setDeleteError(null);
    deleteTitle(title.id)
      .then(() => navigate('/'))
      .catch((e) => {
        setDeleteError(e.message);
        setDeleting(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    getTitleBySlug(slug)
      .then((t) => {
        setTitle(t);
        return Promise.all([getListEntry(t.id), getRelatedTitles(t.id)]);
      })
      .then(([entryData, relatedData]) => {
        setEntry(entryData);
        setRelated(relatedData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <p className="loading">Loading…</p>;
  if (error || !title) {
    return (
      <div className="page-content page-shell">
        <h2 className="page-title">Title not found</h2>
        <p className="error">{error || 'This title doesn’t exist or was removed.'}</p>
        <Link to="/" className="btn primary">Go to Home</Link>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <DetailHero title={title} />
      <DetailStatsRow title={title} />
      <div className="two-col detail-cols">
        <TitleDetailMainColumn title={title} related={related} />
        <div className="detail-sidebar">
          <div className="detail-actions">
            <Link to={`/title/${title.slug}/edit`} className="btn secondary">Edit title</Link>
            <button type="button" className="btn secondary" onClick={() => setShowAddRelated(true)}>
              Add related title
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete title'}
            </button>
            {deleteError && <p className="form-error detail-action-error">{deleteError}</p>}
          </div>
          <ListScoreWidget titleId={title.id} entry={entry} onUpdate={refreshEntry} />
        </div>
      </div>
      {showAddRelated && (
        <AddRelatedModal
          titleId={title.id}
          currentTitle={title}
          onClose={() => setShowAddRelated(false)}
          onAdded={() => {
            refreshRelated();
            setShowAddRelated(false);
          }}
        />
      )}
    </div>
  );
}
