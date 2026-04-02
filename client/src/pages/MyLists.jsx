import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserList } from '../api.js';
import { STATUS_LABELS, formatListScore } from '../constants.js';
import EmptyState from '../components/EmptyState.jsx';

const STATUS_ORDER = ['current', 'planning', 'completed', 'paused', 'dropped'];

export default function MyLists() {
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoadError(null);
    getUserList()
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        setItems([]);
        setLoadError(e.message || 'Could not load your list.');
      })
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="loading">Loading…</p>;
  const byStatus = items.reduce((acc, item) => {
    const s = item.status || 'planning';
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {});
  const extraStatuses = Object.keys(byStatus)
    .filter((k) => !STATUS_ORDER.includes(k))
    .sort();
  const sectionKeys = [...STATUS_ORDER.filter((s) => (byStatus[s] || []).length > 0), ...extraStatuses];
  return (
    <div className="page-shell page-shell--lists">
      <h2 className="page-title">My lists</h2>
      {loadError && (
        <p className="error" role="alert">
          {loadError} Check that the server is running and try again.
        </p>
      )}
      {items.length === 0 && !loadError ? (
        <EmptyState title="Your list is empty" message='Add titles from their detail page with "Add to list".' />
      ) : items.length === 0 ? null : (
        <div className="my-lists">
          {sectionKeys.map((status) => {
            const list = byStatus[status] || [];
            if (list.length === 0) return null;
            const label = STATUS_LABELS[status] || status;
            return (
              <section key={status} className="list-section">
                <h3 className="list-section-title">
                  {label} ({list.length})
                </h3>
                <ul className="list-section-items">
                  {list.map((item) => (
                    <li key={item.title_id ?? item.id} className="list-item">
                      <Link
                        to={`/title/${item.slug}`}
                        className="list-item-cover"
                        style={{ backgroundImage: item.cover_image ? `url(${item.cover_image})` : undefined }}
                      />
                      <div className="list-item-body">
                        <Link to={`/title/${item.slug}`} className="list-item-title">{item.title}</Link>
                        <span className="list-item-meta">
                          {item.media_type} ·{' '}
                          {formatListScore(item.score) ?? '—'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

