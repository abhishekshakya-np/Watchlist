import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  getTitleBySlug,
  getListEntry,
  getRelatedTitles,
  deleteTitle,
} from '../api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import DetailHero from '../components/DetailHero.jsx';
import DetailStatsRow from '../components/DetailStatsRow.jsx';
import ListScoreWidget from '../components/ListScoreWidget.jsx';
import AddRelatedModal from '../components/AddRelatedModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import TitleDetailMainColumn from '../components/TitleDetailMainColumn.jsx';

export default function TitleDetail() {
  const { canMutate } = useAdminAuth();
  const { slug } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [entry, setEntry] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddRelated, setShowAddRelated] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const refreshEntry = () => {
    if (title?.id) getListEntry(title.id).then(setEntry);
  };
  const refreshRelated = () => {
    if (title?.id) getRelatedTitles(title.id).then(setRelated);
  };

  const handleDeleteTitleClick = () => setShowDeleteConfirm(true);

  const handleDeleteTitleCancel = () => {
    if (deleting) return;
    setShowDeleteConfirm(false);
  };

  const handleDeleteTitleConfirm = () => {
    if (!title?.id || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    deleteTitle(title.id)
      .then(() => navigate('/'))
      .catch((e) => {
        setDeleteError(e.message);
        setDeleting(false);
        setShowDeleteConfirm(false);
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
          {canMutate ? (
            <div className="detail-actions">
              <Link to={`/title/${title.slug}/edit`} className="btn secondary">
                Edit title
              </Link>
              <button type="button" className="btn secondary" onClick={() => setShowAddRelated(true)}>
                Add related title
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteTitleClick} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete title'}
              </button>
              {deleteError && <p className="form-error detail-action-error">{deleteError}</p>}
            </div>
          ) : null}
          <ListScoreWidget
            titleId={title.id}
            entry={entry}
            onUpdate={refreshEntry}
            canEdit={canMutate}
            mediaType={title.media_type}
            titleLabel={title.title || title.name || ''}
          />
        </div>
      </div>
      {showAddRelated && canMutate ? (
        <AddRelatedModal
          titleId={title.id}
          currentTitle={title}
          onClose={() => setShowAddRelated(false)}
          onAdded={() => {
            refreshRelated();
            setShowAddRelated(false);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete title?"
        description={`Are you sure you want to delete “${title.title || title.name}” from the shared library? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        danger
        confirmDisabled={deleting}
        onConfirm={handleDeleteTitleConfirm}
        onCancel={handleDeleteTitleCancel}
      />
    </div>
  );
}
