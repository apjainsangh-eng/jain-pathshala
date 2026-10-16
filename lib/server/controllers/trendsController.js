import { getCollection } from '../db';
import { todayIST, ACTIVE_STUDENTS } from '../helpers';

// GET /admin/trends?days=30
// Day-by-day attendance and new-gatha totals for the admin overview charts.
export const getTrends = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
    const end = todayIST();
    const startDate = new Date(`${end}T00:00:00Z`);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    const start = startDate.toISOString().slice(0, 10);

    const [attendance, gatha, users] = await Promise.all([
      getCollection('attendance'), getCollection('gatha'), getCollection('users'),
    ]);

    const [attAgg, gathaAgg, activeStudents] = await Promise.all([
      attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$date', students: { $addToSet: '$username' } } },
        { $project: { present: { $size: '$students' } } },
      ]).toArray(),
      gatha.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: 'new' } },
        { $group: { _id: '$date', total: { $sum: { $convert: { input: '$total_gatha', to: 'int', onError: 0, onNull: 0 } } } } },
      ]).toArray(),
      users.countDocuments(ACTIVE_STUDENTS),
    ]);

    const presentBy = Object.fromEntries(attAgg.map((r) => [r._id, r.present]));
    const gathaBy = Object.fromEntries(gathaAgg.map((r) => [r._id, r.total]));

    const series = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const date = d.toISOString().slice(0, 10);
      series.push({ date, present: presentBy[date] || 0, newGathas: gathaBy[date] || 0 });
    }

    const heldDays = series.filter((d) => d.present > 0);
    res.json({
      days,
      activeStudents,
      series,
      summary: {
        heldDays: heldDays.length,
        avgPresent: heldDays.length ? Math.round(heldDays.reduce((s, d) => s + d.present, 0) / heldDays.length) : 0,
        totalNewGathas: series.reduce((s, d) => s + d.newGathas, 0),
      },
    });
  } catch (error) {
    console.error('Trends error:', error);
    res.status(500).json({ error: 'Failed to load trends' });
  }
};
