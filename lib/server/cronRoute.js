// Shared handler for the Vercel Cron routes. Vercel adds "Authorization: Bearer <CRON_SECRET>" itself.
export function cronHandler(job) {
  return async function handle(request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
      return Response.json({ ok: false }, { status: 401 });
    }
    try {
      return Response.json({ ok: true, ...(await job()) });
    } catch (error) {
      console.error('Telegram cron error:', error);
      return Response.json({ ok: false, error: 'failed' }, { status: 500 });
    }
  };
}
