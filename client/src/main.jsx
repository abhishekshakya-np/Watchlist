import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.scss';
import { SHELL_THEME_STORAGE_KEY, SHELL_THEMES } from './constants.js';

const shellThemeIds = new Set(SHELL_THEMES.map((t) => t.id));
try {
  const stored = localStorage.getItem(SHELL_THEME_STORAGE_KEY);
  if (stored && shellThemeIds.has(stored)) {
    document.documentElement.dataset.shellTheme = stored;
  }
} catch (_) {
  /* ignore */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
