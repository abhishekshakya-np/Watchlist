import { useEffect } from 'react';
import { API } from '../api.js';

export default function TelegramBackupOnBrowserOpen() {
  useEffect(() => {
    fetch(`${API}/backup/trigger-telegram`, { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  }, []);
  return null;
}
