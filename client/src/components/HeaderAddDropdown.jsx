import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function HeaderAddDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onPointer = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const menuId = 'header-add-menu-panel';

  return (
    <div className="header-add-menu" ref={wrapRef}>
      <button
        type="button"
        className="site-header__add header-add-menu__trigger"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        Add
        <span
          className={`header-add-menu__chevron${open ? ' header-add-menu__chevron--open' : ''}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={menuId} className="header-add-menu__panel" role="menu" aria-label="Add to site">
          <Link
            to="/add"
            className="header-add-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="header-add-menu__item-title">Add to watchlist</span>
            <span className="header-add-menu__item-desc">Movie, show, game, or book</span>
          </Link>
          <Link
            to="/add-bookmark"
            className="header-add-menu__item"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <span className="header-add-menu__item-title">Add bookmark</span>
            <span className="header-add-menu__item-desc">Save a link in your collection</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
