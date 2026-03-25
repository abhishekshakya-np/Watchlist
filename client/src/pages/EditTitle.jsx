import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getTitleBySlug, updateTitle } from '../api.js';
import TitleForm from '../components/TitleForm.jsx';

export default function EditTitle() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    setLoading(true);
    setError(null);
    getTitleBySlug(slug).then(setTitle).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (payload) => {
    const data = await updateTitle(title.id, payload);
    navigate(`/title/${data.slug}`);
    return data;
  };

  if (loading) return <p className="loading">Loading…</p>;
  if (error || !title) return <p className="error">{error || 'Title not found'}</p>;

  const initial = {
    title: title.title || '',
    slug: title.slug || '',
    media_type: title.media_type || 'series',
    format: title.format || '',
    release_status: title.release_status || 'finished',
    release_date: title.release_date ? title.release_date.slice(0, 10) : '',
    release_date_end: title.release_date_end ? title.release_date_end.slice(0, 10) : '',
    description: title.description || '',
    description_short: title.description_short || '',
    cover_image: title.cover_image || '',
    banner_image: title.banner_image || '',
    alternate_title: title.alternate_title || '',
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Edit title</h2>
      <p className="form-description">
        <Link to={`/title/${title.slug}`}>← Back to {title.title}</Link>
      </p>
      <TitleForm key={slug} initial={initial} onSubmit={handleSubmit} submitLabel="Save changes" loadingLabel="Saving…" />
    </div>
  );
}
