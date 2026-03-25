/**
 * Optional daily Telegram backup: sends the same JSON as /api/backup/export via sendDocument.
 * Enabled only when TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
 */
import cron from 'node-cron';

function buildSendDocumentMultipart(chatId, filename, jsonString, boundary) {
  const crlf = '\r\n';
  const safeName = String(filename).replace(/["\r\n]/g, '_');
  const head = `--${boundary}${crlf}Content-Disposition: form-data; name="chat_id"${crlf}${crlf}${chatId}${crlf}--${boundary}${crlf}Content-Disposition: form-data; name="document"; filename="${safeName}"${crlf}Content-Type: application/json${crlf}${crlf}`;
  const tail = `${crlf}--${boundary}--${crlf}`;
  return Buffer.concat([Buffer.from(head, 'utf8'), Buffer.from(jsonString, 'utf8'), Buffer.from(tail, 'utf8')]);
}

/**
 * @param {() => Promise<object>} exportBackup
 * @returns {Promise<{ ok: boolean, error?: string, filename?: string }>}
 */
export async function runTelegramBackupNow(exportBackup) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return { ok: false, error: 'not_configured' };
  try {
    const backup = await exportBackup();
    const json = JSON.stringify(backup, null, 2);
    const name = `watchlist-backup-${String(backup.exportedAt).slice(0, 10)}.json`;
    const boundary = `watchlist_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    const body = buildSendDocumentMultipart(chatId, name, json, boundary);
    const url = `https://api.telegram.org/bot${token}/sendDocument`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!data.ok) {
      const err = data.description || `HTTP ${res.status}`;
      console.error('[telegram-backup]', err);
      return { ok: false, error: err };
    }
    console.log('[telegram-backup] Sent', name);
    return { ok: true, filename: name };
  } catch (e) {
    const msg = e?.message || String(e);
    console.error('[telegram-backup]', msg);
    return { ok: false, error: msg };
  }
}

/**
 * Registers daily cron + optional one-shot send after HTTP server is listening (localhost ready).
 * @param {() => Promise<object>} exportBackup same as server exportBackup()
 * @returns {{ onListen?: () => void }} Call `onListen` inside `listen()` callback when TELEGRAM_BACKUP_ON_START=1.
 */
export function setupTelegramBackup(exportBackup) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return {};

  const schedule = process.env.TELEGRAM_BACKUP_CRON?.trim() || '0 4 * * *';
  const tz = process.env.TELEGRAM_BACKUP_TIMEZONE?.trim() || undefined;

  try {
    const opts = tz ? { timezone: tz } : {};
    cron.schedule(schedule, () => void runTelegramBackupNow(exportBackup), opts);
    console.log('[telegram-backup] Scheduled:', schedule, tz ? `(timezone ${tz})` : '(server clock)');
  } catch (e) {
    console.error('[telegram-backup] Invalid TELEGRAM_BACKUP_CRON:', e?.message || e);
    return {};
  }

  const onStart = /^1|true|yes$/i.test(String(process.env.TELEGRAM_BACKUP_ON_START || '').trim());
  return {
    onListen: onStart
      ? () => {
          void runTelegramBackupNow(exportBackup);
        }
      : undefined,
  };
}
