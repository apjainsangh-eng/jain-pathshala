import { handleTelegramUpdate } from '@/lib/server/controllers/telegramController';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Telegram sends bot updates here (set up with scripts/telegram-setup.mjs).
// The secret header proves the request really comes from Telegram.
export async function POST(request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }
  // Always 200 so Telegram doesn't keep retrying the same update
  return Response.json({ ok: true });
}
