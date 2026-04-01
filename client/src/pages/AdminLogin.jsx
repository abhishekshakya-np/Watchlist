import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminLogin } from '../api.js';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

/** Ensures the submit button recovers if any step hangs (see handleSubmit). */
const ADMIN_SIGNIN_WATCHDOG_MS = 35_000;

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { ok, configured, loading } = useAdminAuth();

  const nextPath = searchParams.get('next') || '/admin';

  useEffect(() => {
    if (loading) return;
    if (configured && ok) {
      navigate(nextPath.startsWith('/') ? nextPath : '/admin', { replace: true });
    }
  }, [loading, configured, ok, navigate, nextPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    const target = nextPath.startsWith('/') ? nextPath : '/admin';
    // If any await hangs, `finally` never runs — this always clears the button state.
    const watchdog = window.setTimeout(() => {
      setPending(false);
      setError(
        (prev) =>
          prev ||
          'No response from the server. From the repo root run npm run dev (one URL on 3001) or npm run dev:split (API + Vite 5173), or check VITE_API_URL.',
      );
    }, ADMIN_SIGNIN_WATCHDOG_MS);
    try {
      await adminLogin(password);
      setPassword('');
      // Full load picks up Set-Cookie reliably; avoids a stuck `await refresh()` leaving pending true forever.
      window.location.assign(target);
    } catch (err) {
      setError(err.message || 'Sign-in failed');
    } finally {
      window.clearTimeout(watchdog);
      setPending(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content page-shell page-shell--admin">
        <p className="loading">Loading…</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="page-content page-shell page-shell--admin admin-login">
        <h2 className="page-title">Admin sign-in</h2>
        <p className="page-shell__intro">
          The server does not have <code className="admin-login__code">ADMIN_PASSWORD</code> set. Anyone can use the site as before.
          To lock down changes, set <strong>ADMIN_PASSWORD</strong> (and optionally <strong>ADMIN_SESSION_SECRET</strong>) in your root or{' '}
          <code className="admin-login__code">server/.env</code>, then restart the server.
        </p>
        <p className="admin-login__back">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="page-content page-shell page-shell--admin admin-login">
      <h2 className="page-title">Admin sign-in</h2>
      <p className="page-shell__intro">Enter the admin password to manage the watchlist, bookmarks, and backups.</p>
      <form className="admin-login__form" onSubmit={handleSubmit}>
        <label className="admin-login__label" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          className="admin-login__input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
          required
        />
        {error ? (
          <p className="admin-login__error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn primary admin-login__submit" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="admin-login__back">
        <Link to="/">Back to home</Link>
      </p>
    </div>
  );
}
