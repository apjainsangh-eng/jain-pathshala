import { runWeeklyReports } from '@/lib/server/telegramJobs';
import { cronHandler } from '@/lib/server/cronRoute';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Sunday weekly report. vercel.json runs it Sundays at 06:00 UTC (the free plan may run it any time in
// that hour, so 11:30 AM–12:30 PM IST). Each pathshala gets the Sunday-to-Saturday week, once.
const handle = cronHandler(runWeeklyReports);
export const GET = handle;
export const POST = handle;
