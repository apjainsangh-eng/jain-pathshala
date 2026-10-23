// One-time Telegram setup: points the bot at this app's webhook.
//
//   node --env-file=.env.local scripts/telegram-setup.mjs https://your-site.vercel.app
//
// Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET (any long random string) in the env.
// Run it again whenever the site's address changes.
const [siteUrl] = process.argv.slice(2);
const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const api = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';

if (!siteUrl || !/^https:\/\//.test(siteUrl) || !token || !secret) {
  console.error('Usage: node --env-file=.env.local scripts/telegram-setup.mjs https://your-site.vercel.app');
  console.error('Needs TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET in .env.local (and the site must be https).');
  process.exit(1);
}

const call = async (method, body) => {
  const res = await fetch(`${api}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  return res.json();
};

const me = await call('getMe');
if (!me.ok) {
  console.error('The bot token was rejected by Telegram:', me.description);
  process.exit(1);
}

const url = `${siteUrl.replace(/\/+$/, '')}/api/telegram/webhook`;
const hook = await call('setWebhook', {
  url,
  secret_token: secret,
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
});
await call('setMyCommands', {
  commands: [
    { command: 'pending', description: 'Requests waiting for approval (with Approve all)' },
    { command: 'today', description: "Today's present, absent and gathas" },
    { command: 'week', description: "Last week's report (Sunday to Saturday)" },
    { command: 'birthday', description: 'Upcoming birthdays (next 30 days)' },
    { command: 'absent', description: 'Students not seen for a while' },
    { command: 'present', description: 'Mark students present: /present Aditi, Ariha' },
    { command: 'help', description: 'What this bot can do' },
    { command: 'stop', description: 'Stop notifications in this chat' },
  ],
});

console.log(hook.ok ? `Webhook set: ${url}` : `setWebhook failed: ${hook.description}`);
console.log(`Bot: @${me.result.username}  (put TELEGRAM_BOT_USERNAME=${me.result.username} in your env)`);
