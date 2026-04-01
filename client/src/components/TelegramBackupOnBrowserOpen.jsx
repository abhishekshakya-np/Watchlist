import { useEffect } from 'react';
import { API } from '../api.js';

export default function TelegramBackupOnBrowserOpen() {
  useEffect(() => {
    fetch(`${API}/backup/trigger-telegram`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }, []);
  return null;
}
