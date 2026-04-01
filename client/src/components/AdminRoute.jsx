import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

/** When ADMIN_PASSWORD is set, requires a valid admin session. Otherwise allows (legacy open mode). */
export default function AdminRoute() {
  const { loading, ok, configured } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="page-content page-shell page-shell--admin">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  if (!configured || ok) {
    return <Outlet />;
  }

  const next = `${location.pathname}${location.search}`;
  return <Navigate to={`/admin/login?next=${encodeURIComponent(next)}`} replace />;
}
