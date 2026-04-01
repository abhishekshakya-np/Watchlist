import { useState, useEffect, useCallback } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { SHELL_THEMES, SHELL_THEME_STORAGE_KEY } from '../constants.js';

const LIGHT_SHELL_PATHS = new Set([
  '/',
  '/browse',
  '/lists',
  '/bookmarks',
  '/admin',
  '/admin/login',
  '/admin/backup',
  '/admin/add',
  '/admin/add-bookmark',
]);

function isLightShellRoute(pathname) {
  const normalized = pathname.replace(/\/$/, '') || '/';
  if (LIGHT_SHELL_PATHS.has(normalized)) return true;
  /* Title detail + edit use the same shell / theme as Home & Browse */
  return normalized.startsWith('/title/');
}

function readStoredShellTheme() {
  try {
    const s = localStorage.getItem(SHELL_THEME_STORAGE_KEY);
    if (s && SHELL_THEMES.some((t) => t.id === s)) return s;
  } catch (_) {
    /* ignore */
  }
  return SHELL_THEMES[0].id;
}

function applyShellThemeToDocument(themeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.shellTheme = themeId;
}

export default function Layout() {
  const location = useLocation();
  const useLightShell = isLightShellRoute(location.pathname);
  const [shellTheme, setShellTheme] = useState(readStoredShellTheme);

  useEffect(() => {
    applyShellThemeToDocument(shellTheme);
    try {
      localStorage.setItem(SHELL_THEME_STORAGE_KEY, shellTheme);
    } catch (_) {
      /* ignore */
    }
  }, [shellTheme]);

  const handleShellTheme = useCallback((id) => {
    setShellTheme(id);
  }, []);

  return (
    <div className={`app-layout${useLightShell ? ' app-layout--home' : ''}`}>
      <header className={`site-header${useLightShell ? ' site-header--home' : ''}`}>
        <div className="site-header__inner">
          <NavLink to="/" className="site-header__logo">
            Watchlist
          </NavLink>
          <nav className="site-header__nav" aria-label="Main">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? 'active' : '')}>
              Browse
            </NavLink>
            <NavLink to="/lists" className={({ isActive }) => (isActive ? 'active' : '')}>
              My lists
            </NavLink>
            <NavLink to="/bookmarks" className={({ isActive }) => (isActive ? 'active' : '')}>
              Bookmarks
            </NavLink>
          </nav>
          <div className="site-header__actions">
            <NavLink to="/admin" className="site-header__admin">
              Admin
            </NavLink>
          </div>
        </div>
      </header>
      <main className={`app-main${useLightShell ? ' app-main--home' : ''}`}>
        <div className="main-content-inner">
          <Outlet />
        </div>
      </main>
      <footer className={`site-footer${useLightShell ? ' site-footer--home' : ''}`}>
        {useLightShell && (
          <div className="site-footer-home">
            <div className="site-footer-home-inner">
              <div className="site-footer-home__themes">
                <span className="site-footer-home__label" id="footer-theme-label">
                  Site theme
                </span>
                <div
                  className="site-footer-home__theme-btns"
                  role="group"
                  aria-labelledby="footer-theme-label"
                >
                  {SHELL_THEMES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`site-footer-home__theme-btn site-footer-home__theme-btn--${t.id}${shellTheme === t.id ? ' site-footer-home__theme-btn--active' : ''}`}
                      onClick={() => handleShellTheme(t.id)}
                      aria-pressed={shellTheme === t.id}
                      aria-label={`Use ${t.label} theme`}
                      title={t.label}
                    >
                      <span className="visually-hidden">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <nav className="site-footer-home__grid" aria-label="Footer links">
                <div className="site-footer-home__col">
                  <span className="site-footer-home__col-title">Watchlist</span>
                  <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">
                    Project on GitHub
                  </a>
                </div>
                <div className="site-footer-home__col">
                  <span className="site-footer-home__col-title">Discover</span>
                  <NavLink to="/browse">Browse</NavLink>
                  <NavLink to="/bookmarks">Bookmarks</NavLink>
                </div>
                <div className="site-footer-home__col">
                  <span className="site-footer-home__col-title">Connect</span>
                  <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                </div>
                <div className="site-footer-home__col">
                  <span className="site-footer-home__col-title">Info</span>
                  <NavLink to="/admin">Admin</NavLink>
                  <a href="https://github.com/abhishekshakya-np" target="_blank" rel="noopener noreferrer">
                    Contact
                  </a>
                </div>
              </nav>
            </div>
          </div>
        )}
        <div className="site-footer__inner">
          <p className="site-footer__credit">
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
