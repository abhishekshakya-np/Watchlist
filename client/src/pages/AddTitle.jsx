import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createTitle } from '../api.js';
import { INIT_ADD_FORM } from '../constants.js';
import TitleForm from '../components/TitleForm.jsx';

export default function AddTitle() {
  const [successData, setSuccessData] = useState(null);
  const [duplicateExisting, setDuplicateExisting] = useState(null);
  const [duplicateCode, setDuplicateCode] = useState(null);

  const handleSubmit = async (payload) => {
    setDuplicateExisting(null);
    setDuplicateCode(null);
    try {
      const data = await createTitle(payload);
      setSuccessData(data);
      return data;
    } catch (e) {
      if (e.existing) setDuplicateExisting(e.existing);
      if (e.code) setDuplicateCode(e.code);
      throw e;
    }
  };

  if (successData) {
    return (
      <div className="page-content">
        <div className="success-block" role="alert">
          <div className="success-icon" aria-hidden="true">✓</div>
          <h2 className="page-title success-title">Title added</h2>
          <p className="success-message">“{successData.title}” has been added successfully.</p>
          <div className="success-actions">
            <Link to={`/title/${successData.slug}`} className="btn primary">View title</Link>
            <button type="button" className="btn secondary" onClick={() => setSuccessData(null)}>
              Add another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <h2 className="page-title">Add title</h2>
      {(duplicateExisting || duplicateCode) && (
        <div className="form-error duplicate-notice" role="alert">
          {duplicateCode === 'DUPLICATE_SLUG'
            ? 'This URL is already in use. Try a different title or set a custom Slug below.'
            : 'A title with this name, type, and release already exists.'}
          {duplicateExisting && (
            <>
              {' '}
              <Link to={`/title/${duplicateExisting.slug}`}>
                View existing title &quot;{duplicateExisting.title || duplicateExisting.name}&quot;
              </Link>
            </>
          )}
        </div>
      )}
      <TitleForm initial={INIT_ADD_FORM} onSubmit={handleSubmit} submitLabel="Add title" loadingLabel="Adding…" />
    </div>
  );
}
