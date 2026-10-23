import { getCollection } from '../db';
import { calculateStreaks, exactCI, todayIST } from '../helpers';
import { publicProfile } from './profileController';

// GET /admin/student/:username/profile
export const getStudentProfile = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { username } = req.params;

    const usersCollection = await getCollection('users');
    const userRecord = usersCollection
      ? await usersCollection.findOne({ username: { $regex: exactCI(username) } })
      : null;

    const name = userRecord?.name || username;

    // Find group
    const familyGroupsColl = await getCollection('family_groups');
    let group = null;
    if (familyGroupsColl) {
      const g = await familyGroupsColl.findOne({ members: username });
      if (g) group = { id: g._id.toString(), name: g.groupName };
    }

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');
    const pendingAttendance = await getCollection('pending_attendance');
    const pendingGatha = await getCollection('pending_gatha');

    // === Attendance stats ===
    let allAttendanceDates = [];
    let totalPresent = 0;
    let lastAttendanceDate = null;

    if (attendance) {
      const attRecords = await attendance.find({ username }).sort({ date: -1 }).toArray();
      totalPresent = attRecords.length;
      allAttendanceDates = attRecords.map(a => a.date);
      lastAttendanceDate = attRecords.length > 0 ? attRecords[0].date : null;
    }

    // Join date = earliest of account creation, first attendance and first gatha
    // (account creation alone is wrong for students carried over from the old app)
    const firstGatha = gatha ? await gatha.find({ username }).sort({ date: 1 }).limit(1).toArray() : [];
    const joinDate = [
      userRecord?.created_at ? String(userRecord.created_at).slice(0, 10) : null,
      allAttendanceDates.length ? allAttendanceDates[allAttendanceDates.length - 1] : null,
      firstGatha[0]?.date || null,
    ].filter(Boolean).sort()[0] || null;

    const streakData = calculateStreaks(allAttendanceDates);
    const today = new Date();
    const todayStr = todayIST();

    // Pathshala days = days on which anyone in this pathshala had attendance, from the student's
    // first day until today. (Counting every calendar day, from a join date that the move to the new
    // database reset to today, gave results like 11400%.)
    const heldDays = attendance
      ? await attendance.distinct('date', { date: { $gte: joinDate || '0000', $lte: todayStr } })
      : [];
    const presentDays = new Set(allAttendanceDates.filter(d => d >= (joinDate || '0000') && d <= todayStr));
    const totalPossibleDays = Math.max(heldDays.length, presentDays.size);
    const totalAbsent = heldDays.filter(d => !presentDays.has(d)).length;
    const attendancePercent = totalPossibleDays > 0 ? Math.round((presentDays.size / totalPossibleDays) * 100) : 0;

    // === Gatha stats ===
    let totalGathasSubmitted = 0;
    let totalNewGathas = 0;
    let totalRevisionGathas = 0;
    let totalOtherXP = 0;
    let lastGathaDate = null;

    if (gatha) {
      const gathaRecords = await gatha.find({ username }).sort({ date: -1 }).toArray();
      lastGathaDate = gathaRecords.length > 0 ? gathaRecords[0].date : null;

      gathaRecords.forEach(g => {
        const count = parseInt(g.total_gatha) || 0;
        totalGathasSubmitted += count;
        if (g.type === 'new') totalNewGathas += count;
        else if (g.type === 'revision') totalRevisionGathas += count;
        else totalOtherXP += parseInt(g.xpPoints) || 0;
      });
    }

    // Approved gatha count (all in gatha collection are approved)
    const approvedGathas = totalGathasSubmitted;

    // Rejected gathas
    let rejectedGathas = 0;
    if (pendingGatha) {
      rejectedGathas = await pendingGatha.countDocuments({ username, status: 'rejected' });
    }

    // Pending counts
    let pendingAttCount = 0;
    let pendingGathaCount = 0;
    if (pendingAttendance) {
      pendingAttCount = await pendingAttendance.countDocuments({ username, status: 'pending' });
    }
    if (pendingGatha) {
      pendingGathaCount = await pendingGatha.countDocuments({ username, status: 'pending' });
    }

    // === Score ===
    const score = totalPresent + totalNewGathas + totalOtherXP;

    // === Activity status ===
    // The Active/Inactive status the admin sets (students who temporarily stopped coming)
    const isActive = userRecord ? userRecord.isActive !== false : false;

    // === Monthly breakdown (current year) ===
    const currentYear = today.getFullYear();
    const monthlyStats = [];

    for (let m = 0; m < 12; m++) {
      const monthStart = `${currentYear}-${String(m + 1).padStart(2, '0')}-01`;
      const monthEnd = `${currentYear}-${String(m + 1).padStart(2, '0')}-${new Date(currentYear, m + 1, 0).getDate()}`;

      let monthAttendance = 0;
      let monthNewGathas = 0;
      let monthRevisionGathas = 0;

      if (attendance) {
        monthAttendance = await attendance.countDocuments({
          username, date: { $gte: monthStart, $lte: monthEnd }
        });
      }
      if (gatha) {
        const monthGathaStats = await gatha.aggregate([
          { $match: { username, date: { $gte: monthStart, $lte: monthEnd } } },
          { $group: { _id: '$type', total: { $sum: '$total_gatha' } } }
        ]).toArray();

        monthGathaStats.forEach(g => {
          if (g._id === 'new') monthNewGathas = g.total || 0;
          else monthRevisionGathas = g.total || 0;
        });
      }

      monthlyStats.push({
        month: m + 1,
        attendance: monthAttendance,
        newGathas: monthNewGathas,
        revisionGathas: monthRevisionGathas
      });
    }

    // === Recent activity (last 50) ===
    const recentActivity = [];

    if (attendance) {
      const recentAtt = await attendance.find({ username }).sort({ date: -1 }).limit(25).toArray();
      recentAtt.forEach(a => {
        recentActivity.push({
          type: 'attendance',
          date: a.date,
          status: 'approved',
          approvedBy: a.approved_by || 'system',
          createdAt: a.created_at
        });
      });
    }

    if (gatha) {
      const recentGatha = await gatha.find({ username }).sort({ date: -1 }).limit(25).toArray();
      recentGatha.forEach(g => {
        recentActivity.push({
          type: 'gatha',
          date: g.date,
          gathaType: g.type,
          activityTypeName: g.activityTypeName || (g.type === 'new' ? 'New Learning' : g.type === 'revision' ? 'Revision' : g.type),
          customActivityDescription: g.customActivityDescription || null,
          sutraName: g.sutra_name,
          whichGatha: g.which_gatha,
          totalGatha: g.total_gatha,
          status: 'approved',
          approvedBy: g.approved_by || 'system',
          createdAt: g.created_at
        });
      });
    }

    // Sort by date desc
    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    // === Attendance history (full) ===
    let attendanceHistory = [];
    if (attendance) {
      const allAtt = await attendance.find({ username }).sort({ date: -1 }).toArray();
      attendanceHistory = allAtt.map(a => ({
        id: a._id.toString(),
        date: a.date,
        status: 'present',
        approvedBy: a.approved_by || 'system',
        approvedAt: a.approved_at,
        markedBy: a.marked_by || username,
        createdAt: a.created_at
      }));
    }

    // Also get pending/rejected attendance
    let pendingAttendanceHistory = [];
    if (pendingAttendance) {
      const pendAtt = await pendingAttendance.find({ username }).sort({ created_at: -1 }).toArray();
      pendingAttendanceHistory = pendAtt.map(a => ({
        id: a._id.toString(),
        date: a.date,
        status: a.status,
        markedBy: a.marked_by || username,
        reviewedBy: a.reviewed_by,
        reviewedAt: a.reviewed_at,
        createdAt: a.created_at
      }));
    }

    // === Gatha history (full) ===
    let gathaHistory = [];
    if (gatha) {
      const allGatha = await gatha.find({ username }).sort({ date: -1 }).toArray();
      gathaHistory = allGatha.map(g => ({
        id: g._id.toString(),
        date: g.date,
        type: g.type,
        activityTypeName: g.activityTypeName || (g.type === 'new' ? 'New Learning' : g.type === 'revision' ? 'Revision' : g.type),
        customActivityDescription: g.customActivityDescription || null,
        sutraName: g.sutra_name,
        whichGatha: g.which_gatha,
        totalGatha: g.total_gatha,
        status: 'approved',
        approvedBy: g.approved_by || 'system',
        approvedAt: g.approved_at,
        addedBy: g.added_by || username,
        editedBy: g.edited_by || null,
        createdAt: g.created_at
      }));
    }

    // Pending/rejected gatha
    let pendingGathaHistory = [];
    if (pendingGatha) {
      const pendG = await pendingGatha.find({ username }).sort({ created_at: -1 }).toArray();
      pendingGathaHistory = pendG.map(g => ({
        id: g._id.toString(),
        date: g.date,
        type: g.type,
        sutraName: g.sutra_name,
        whichGatha: g.which_gatha,
        totalGatha: g.total_gatha,
        status: g.status,
        reviewedBy: g.reviewed_by,
        reviewedAt: g.reviewed_at,
        addedBy: g.added_by || username,
        createdAt: g.created_at
      }));
    }

    // === Admin notes ===
    let notes = [];
    const notesColl = await getCollection('admin_notes');
    if (notesColl) {
      notes = await notesColl.find({ studentUsername: username }).sort({ created_at: -1 }).toArray();
      notes = notes.map(n => ({
        id: n._id.toString(),
        text: n.text,
        createdBy: n.created_by,
        createdAt: n.created_at
      }));
    }

    res.json({
      student: {
        username,
        name,
        group,
        isActive,
        joinDate,
        lastAttendanceDate,
        lastGathaDate,
        mobile: userRecord?.mobile || null,
        // Details the student fills in on their own profile page
        details: userRecord ? publicProfile(userRecord) : null
      },
      stats: {
        totalPresent,
        totalAbsent,
        attendancePercent,
        currentStreak: streakData.current,
        maxStreak: streakData.max,
        totalGathasSubmitted,
        totalNewGathas,
        totalRevisionGathas,
        totalOtherXP,
        approvedGathas,
        rejectedGathas,
        pendingAttendance: pendingAttCount,
        pendingGatha: pendingGathaCount,
        totalPending: pendingAttCount + pendingGathaCount,
        score
      },
      monthlyStats,
      recentActivity: recentActivity.slice(0, 50),
      attendanceHistory,
      pendingAttendanceHistory,
      gathaHistory,
      pendingGathaHistory,
      notes
    });

  } catch (error) {
    console.error('Student profile error:', error);
    res.status(500).json({ error: 'Failed to load student profile' });
  }
};

// POST /admin/student/:username/notes
export const addStudentNote = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { username } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Note text is required' });
    }

    const notesColl = await getCollection('admin_notes');
    if (!notesColl) return res.status(500).json({ error: 'Database not available' });

    await notesColl.insertOne({
      studentUsername: username,
      text: text.trim(),
      created_by: req.user.username || req.user.name,
      created_at: new Date().toISOString()
    });

    res.json({ message: 'Note added' });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
};

// GET /admin/student/:username/notes
export const getStudentNotes = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { username } = req.params;
    const notesColl = await getCollection('admin_notes');
    if (!notesColl) return res.json([]);

    const notes = await notesColl.find({ studentUsername: username }).sort({ created_at: -1 }).toArray();
    res.json(notes.map(n => ({
      id: n._id.toString(),
      text: n.text,
      createdBy: n.created_by,
      createdAt: n.created_at
    })));
  } catch (error) {
    console.error('Get notes error:', error);
    res.json([]);
  }
};
