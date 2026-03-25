/**
 * One-off helper: after you message your bot in Telegram, run from server/: npm run telegram-chat-id
 * Prints TELEGRAM_CHAT_ID=... to paste into server/.env
 */
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '.env') });

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error('Set TELEGRAM_BOT_TOKEN in server/.env (or root .env) first.');
  process.exit(1);
}

const base = `https://api.telegram.org/bot${token}`;
const hookRes = await fetch(`${base}/getWebhookInfo`);
const hook = await hookRes.json().catch(() => ({}));
if (hook?.result?.url) {
  console.log('Removing webhook so getUpdates works (was:', hook.result.url + ')');
  const del = await fetch(`${base}/deleteWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ drop_pending_updates: false }),
  });
  const delJ = await del.json().catch(() => ({}));
  if (!delJ.ok) console.error('deleteWebhook:', delJ.description || delJ);
}

const r = await fetch(`${base}/getUpdates`);
const j = await r.json();
if (!j.ok) {
  console.error('Telegram API:', j.description || JSON.stringify(j));
  process.exit(1);
}

let lastId = null;
for (const u of j.result || []) {
  const m = u.message || u.edited_message || u.channel_post;
  if (m?.chat?.id != null) lastId = m.chat.id;
}

const botNumericId = token.includes(':') ? token.split(':')[0] : null;
if (lastId != null && botNumericId && String(lastId) === botNumericId) {
  console.error(
    'The id from updates matches your bot id (the number before ":" in the token). That is wrong for TELEGRAM_CHAT_ID.\n' +
      'Message this bot from your personal Telegram account, then run again — you need YOUR user id, not the bot’s.',
  );
  process.exit(1);
}

if (lastId == null) {
  console.log(
    'No updates for this bot yet.\n' +
      'In Telegram, open YOUR bot (same token as TELEGRAM_BOT_TOKEN, e.g. @userinfokeepbot) and send /start from your personal account.\n' +
      'Run this command again.\n' +
      'Or set TELEGRAM_CHAT_ID manually using t.me/userinfobot (your user id, not the bot’s).',
  );
  process.exit(1);
}

console.log(`Paste into server/.env:\n\nTELEGRAM_CHAT_ID=${lastId}\n`);
