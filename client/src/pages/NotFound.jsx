import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-content">
      <h2 className="page-title">Page not found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link to="/" className="btn primary">Go to Home</Link>
    </div>
  );
}
