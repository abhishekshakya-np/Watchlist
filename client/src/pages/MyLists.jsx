import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserList } from '../api.js';
import { STATUS_LABELS } from '../constants.js';
import EmptyState from '../components/EmptyState.jsx';

const STATUS_ORDER = ['current', 'planning', 'completed', 'paused', 'dropped'];

export default function MyLists() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getUserList().then(setItems).finally(() => setLoading(false));
  }, []);
  if (loading) return <p className="loading">Loading…</p>;
  const byStatus = items.reduce((acc, item) => {
    const s = item.status || 'planning';
    if (!acc[s]) acc[s] = [];
    acc[s].push(item);
    return acc;
  }, {});
  return (
    <div>
      <h2 className="page-title">My lists</h2>
      {items.length === 0 ? (
        <EmptyState title="Your list is empty" message='Add titles from their detail page with "Add to list".' />
      ) : (
        <div className="my-lists">
          {STATUS_ORDER.map((status) => {
            const list = byStatus[status] || [];
            if (list.length === 0) return null;
            return (
              <section key={status} className="list-section">
                <h3 className="list-section-title">
                  {STATUS_LABELS[status]} ({list.length})
                </h3>
                <ul className="list-section-items">
                  {list.map((item) => (
                    <li key={item.id} className="list-item">
                      <Link
                        to={`/title/${item.slug}`}
                        className="list-item-cover"
                        style={{ backgroundImage: item.cover_image ? `url(${item.cover_image})` : undefined }}
                      />
                      <div className="list-item-body">
                        <Link to={`/title/${item.slug}`} className="list-item-title">{item.title}</Link>
                        <span className="list-item-meta">
                          {item.media_type} · {item.score != null ? `Score ${item.score}` : '—'}
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
