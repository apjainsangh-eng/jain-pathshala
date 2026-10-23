import { runDailySummaries } from '@/lib/server/telegramJobs';
import { cronHandler } from '@/lib/server/cronRoute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Midnight summary. vercel.json runs it at 19:00 UTC = 12:30 AM IST (the free plan may run it any
// time in that hour, so 12:30–1:30 AM). Each pathshala gets the day that just ended, once.
const handle = cronHandler(runDailySummaries);
export const GET = handle;
export const POST = handle;
