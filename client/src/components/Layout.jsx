import { Outlet, NavLink, useSearchParams } from 'react-router-dom';
import { MEDIA_TYPES } from '../constants.js';

export default function Layout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const setType = (type) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'all') next.delete('type');
    else next.set('type', type);
    setSearchParams(next);
  };
  return (
    <div className="app-layout">
      <header className="site-header">
        <div className="site-header-inner">
          <NavLink to="/" className="site-logo">Watchlist</NavLink>
          <nav className="site-nav">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>Browse</NavLink>
            <NavLink to="/search" className={({ isActive }) => (isActive ? 'active' : '')}>Search</NavLink>
            <NavLink to="/lists" className={({ isActive }) => (isActive ? 'active' : '')}>My lists</NavLink>
            <NavLink to="/backup" className={({ isActive }) => (isActive ? 'active' : '')}>Backup</NavLink>
            <NavLink to="/add" className={({ isActive }) => (isActive ? 'active' : '')}>Add title</NavLink>
          </nav>
          <div className="media-tabs media-tabs-header">
            {MEDIA_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={currentType === value ? 'active' : ''}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>
      <main className="app-main">
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-credit">
            By{' '}
            <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">
              Abhishek Shakya
            </a>
            {' · '}
            <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
