import { ObjectId } from 'mongodb';
import { getCollection } from '../db';
import { todayIST } from '../helpers';

// Admin corrections to records that were already approved (approved by mistake, wrong count,
// wrong date). Students can only change their own requests while they are still pending.
// Every change is written to the audit log with the old and new values.

const isDay = (s) => typeof s === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
const toId = (id) => (ObjectId.isValid(id) ? new ObjectId(id) : null);
const actor = (req) => req.user.username || req.user.name;

async function audit(req, action, entryType, record, details) {
  const auditLog = await getCollection('audit_log');
  await auditLog.insertOne({
    action,
    targetUsername: record.username,
    entryType,
    date: record.date,
    performedBy: actor(req),
    details,
    created_at: new Date().toISOString(),
  });
}

const gathaSnapshot = (g) => ({
  date: g.date, type: g.type, activityTypeName: g.activityTypeName || null,
  sutra_name: g.sutra_name || null, which_gatha: g.which_gatha || null, total_gatha: g.total_gatha ?? null,
});

// PUT /admin/gatha/:id  { date?, sutra_name?, which_gatha?, total_gatha? }
// Gatha fields only apply to New Learning / Revision entries; other activities can only change date.
export const editApprovedGatha = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const _id = toId(req.params.id);
  if (!_id) return res.status(404).json({ error: 'Entry not found' });

  try {
    const gatha = await getCollection('gatha');
    const existing = await gatha.findOne({ _id });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });

    const b = req.body || {};
    const set = {};
    if (b.date !== undefined) {
      if (!isDay(b.date)) return res.status(400).json({ error: 'Invalid date' });
      if (b.date > todayIST()) return res.status(400).json({ error: 'Date cannot be in the future' });
      set.date = b.date;
    }
    if (existing.type === 'new' || existing.type === 'revision') {
      for (const key of ['sutra_name', 'which_gatha']) {
        if (b[key] === undefined) continue;
        const v = String(b[key]).trim();
        if (!v || v.length > 100) return res.status(400).json({ error: 'Sutra name and gatha are required (max 100 characters)' });
        set[key] = v;
      }
      if (b.total_gatha !== undefined) {
        const n = Number(b.total_gatha);
        if (!Number.isInteger(n) || n < 1 || n > 1000) return res.status(400).json({ error: 'Gatha count must be a whole number from 1 to 1000' });
        set.total_gatha = n;
      }
    }
    if (Object.keys(set).length === 0) return res.status(400).json({ error: 'Nothing to change' });

    const now = new Date().toISOString();
    await gatha.updateOne({ _id }, { $set: { ...set, edited_by: actor(req), edited_at: now } });
    await audit(req, 'gatha_edit', 'gatha', { ...existing, ...set }, { before: gathaSnapshot(existing), after: gathaSnapshot({ ...existing, ...set }) });
    res.json({ message: 'Updated' });
  } catch (error) {
    console.error('Edit approved gatha error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
};

// DELETE /admin/gatha/:id
export const deleteApprovedGatha = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const _id = toId(req.params.id);
  if (!_id) return res.status(404).json({ error: 'Entry not found' });

  try {
    const gatha = await getCollection('gatha');
    const existing = await gatha.findOneAndDelete({ _id });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    await audit(req, 'gatha_delete', 'gatha', existing, { before: gathaSnapshot(existing) });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete approved gatha error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};

// DELETE /admin/attendance/:id
export const deleteApprovedAttendance = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const _id = toId(req.params.id);
  if (!_id) return res.status(404).json({ error: 'Entry not found' });

  try {
    const attendance = await getCollection('attendance');
    const existing = await attendance.findOneAndDelete({ _id });
    if (!existing) return res.status(404).json({ error: 'Entry not found' });
    await audit(req, 'attendance_delete', 'attendance', existing, {
      before: { date: existing.date, approved_by: existing.approved_by || null, remark: existing.remark || null },
    });
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('Delete approved attendance error:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
};
