import { ACTIVE_STUDENTS } from '../helpers';
import { getCollection } from '../db';
import { formatTime, formatDate, todayIST, exactCI } from '../helpers';
import { ObjectId } from 'mongodb';
import { currentPathshalaId, forgetStudentStatus } from '../tenant';
import { normalizeMobile, ensureAccount, removeAccountIfUnused, existingStudentHash, AccountError } from '../accounts';

export const getStats = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const today = todayIST();

    const [attendanceCol, pendingAttendanceCol, pendingGathaCol, usersCollection] = await Promise.all([
      getCollection('attendance'),
      getCollection('pending_attendance'),
      getCollection('pending_gatha'),
      getCollection('users')
    ]);

    const [totalStudents, todayAtt, pendingAtt, pendingG] = await Promise.all([
      usersCollection ? usersCollection.countDocuments(ACTIVE_STUDENTS) : Promise.resolve(0),
      attendanceCol ? attendanceCol.countDocuments({ date: today }) : Promise.resolve(0),
      pendingAttendanceCol ? pendingAttendanceCol.countDocuments({ status: 'pending' }) : Promise.resolve(0),
      pendingGathaCol ? pendingGathaCol.countDocuments({ status: 'pending' }) : Promise.resolve(0)
    ]);

    res.json({
      total_students: totalStudents,
      today_attendance: todayAtt,
      pending_attendance: pendingAtt,
      pending_gatha: pendingG
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.json({ pending_attendance: 0, pending_gatha: 0, total_students: 34, today_attendance: 0 });
  }
};

export const getPending = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingAttendance = await getCollection('pending_attendance');
    const pendingGatha = await getCollection('pending_gatha');

    let attendance = [], gatha = [];
    
    if (pendingAttendance) {
      const rawAttendance = await pendingAttendance.find({ status: 'pending' }).sort({ created_at: -1 }).toArray();
      attendance = rawAttendance.map(item => ({
        ...item,
        id: item._id.toString(),
        student_name: item.student_name || item.username || 'Unknown',
        display_name: item.student_name || item.username || 'Unknown',
        formatted_time: item.request_time || formatTime(item.created_at),
        formatted_date: item.request_date || formatDate(item.created_at) || item.date
      }));
    }

    if (pendingGatha) {
      const rawGatha = await pendingGatha.find({ status: 'pending' }).sort({ created_at: -1 }).toArray();
      gatha = rawGatha.map(item => ({
        ...item,
        id: item._id.toString(),
        student_name: item.student_name || item.username || 'Unknown',
        display_name: item.student_name || item.username || 'Unknown',
        formatted_time: item.request_time || formatTime(item.created_at),
        formatted_date: item.request_date || formatDate(item.created_at) || item.date
      }));
    }

    res.json({ attendance, gatha, totalPending: attendance.length + gatha.length });
  } catch (error) {
    console.error('Admin pending error:', error);
    res.json({ attendance: [], gatha: [], totalPending: 0 });
  }
};

export const approveAttendance = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingAttendance = await getCollection('pending_attendance');
    const attendance = await getCollection('attendance');

    if (!pendingAttendance || !attendance) return res.status(500).json({ error: 'Database not available' });

    const pending = await pendingAttendance.findOne({ _id: new ObjectId(req.params.id), status: 'pending' });
    if (!pending) return res.status(404).json({ error: 'Not found' });

    await attendance.insertOne({
      username: pending.username,
      student_name: pending.student_name || pending.username,
      date: pending.date,
      created_at: new Date().toISOString(),
      approved_by: req.user.username,
      approved_at: new Date().toISOString()
    });

    await pendingAttendance.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: req.user.username } }
    );

    res.json({ message: 'Approved' });
  } catch (error) {
    console.error('Approve attendance error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const rejectAttendance = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingAttendance = await getCollection('pending_attendance');
    if (!pendingAttendance) return res.status(500).json({ error: 'Database not available' });

    await pendingAttendance.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: req.user.username } }
    );

    res.json({ message: 'Rejected' });
  } catch (error) {
    console.error('Reject attendance error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const approveGatha = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingGatha = await getCollection('pending_gatha');
    const gatha = await getCollection('gatha');

    if (!pendingGatha || !gatha) return res.status(500).json({ error: 'Database not available' });

    const pending = await pendingGatha.findOne({ _id: new ObjectId(req.params.id), status: 'pending' });
    if (!pending) return res.status(404).json({ error: 'Not found' });

    await gatha.insertOne({
      username: pending.username,
      student_name: pending.student_name || pending.username,
      type: pending.type,
      activityTypeId: pending.activityTypeId || null,
      activityTypeName: pending.activityTypeName || (pending.type === 'new' ? 'New Learning' : pending.type === 'revision' ? 'Revision' : pending.type),
      customActivityDescription: pending.customActivityDescription || null,
      xpPoints: pending.xpPoints || 0,
      sutra_name: pending.sutra_name,
      which_gatha: pending.which_gatha,
      total_gatha: pending.total_gatha,
      date: pending.date,
      created_at: new Date().toISOString(),
      approved_by: req.user.username,
      approved_at: new Date().toISOString()
    });

    await pendingGatha.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: req.user.username } }
    );

    res.json({ message: 'Approved' });
  } catch (error) {
    console.error('Approve gatha error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const rejectGatha = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingGatha = await getCollection('pending_gatha');
    if (!pendingGatha) return res.status(500).json({ error: 'Database not available' });

    await pendingGatha.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: req.user.username } }
    );

    res.json({ message: 'Rejected' });
  } catch (error) {
    console.error('Reject gatha error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const addGathaForStudent = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { username, date, sutraName, whichGatha, totalGatha, type, activityTypeName, customActivityDescription, xpPoints } = req.body || {};
    if (!username) return res.status(400).json({ error: 'Username required' });

    const gatha = await getCollection('gatha');
    if (!gatha) return res.status(500).json({ error: 'Database not available' });

    const resolvedTypeName = activityTypeName || (type === 'new' ? 'New Learning' : type === 'revision' ? 'Revision' : 'New Learning');
    const lower = resolvedTypeName.toLowerCase().trim();
    const resolvedType = lower === 'new learning' || lower === 'new' ? 'new' : lower === 'revision' ? 'revision' : lower.replace(/\s+/g, '_');
    const isNewOrRevision = resolvedType === 'new' || resolvedType === 'revision';

    if (isNewOrRevision && (!sutraName || !totalGatha)) {
      return res.status(400).json({ error: 'Sutra name and count required for New/Revision type' });
    }

    const now = new Date().toISOString();
    await gatha.insertOne({
      username,
      student_name: username,
      type: resolvedType,
      activityTypeName: resolvedTypeName,
      customActivityDescription: !isNewOrRevision && resolvedTypeName === 'Other' ? (customActivityDescription || null) : null,
      xpPoints: isNewOrRevision ? 0 : (parseInt(xpPoints) || 0),
      sutra_name: sutraName || '',
      which_gatha: whichGatha || '',
      total_gatha: isNewOrRevision ? (parseInt(totalGatha) || 1) : 0,
      date: date || now.split('T')[0],
      created_at: now,
      approved_by: req.user.username || req.user.name,
      approved_at: now,
      added_by_admin: true,
    });

    res.json({ message: 'Gatha added' });
  } catch (error) {
    console.error('Admin add gatha error:', error);
    res.status(500).json({ error: 'Failed to add gatha' });
  }
};

export const addAttendanceForStudent = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { username, date } = req.body || {};
    if (!username || !date) return res.status(400).json({ error: 'Username and date required' });

    const attendance = await getCollection('attendance');
    if (!attendance) return res.status(500).json({ error: 'Database not available' });

    const existing = await attendance.findOne({ username, date });
    if (existing) return res.status(400).json({ error: 'Attendance already marked for this date' });

    const now = new Date().toISOString();
    await attendance.insertOne({
      username,
      date,
      created_at: now,
      approved_by: req.user.username || req.user.name,
      approved_at: now,
      added_by_admin: true,
    });

    res.json({ message: 'Attendance added' });
  } catch (error) {
    console.error('Admin add attendance error:', error);
    res.status(500).json({ error: 'Failed to add attendance' });
  }
};

export const approveAll = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const pendingAttendance = await getCollection('pending_attendance');
    const pendingGatha = await getCollection('pending_gatha');
    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');

    let aa = 0, ag = 0;
    const now = new Date().toISOString();

    if (pendingAttendance && attendance) {
      const pendingAtt = await pendingAttendance.find({ status: 'pending' }).toArray();
      for (const p of pendingAtt) {
        await attendance.insertOne({
          username: p.username,
          student_name: p.student_name || p.username,
          date: p.date,
          created_at: now,
          approved_by: req.user.username,
          approved_at: now
        });
        await pendingAttendance.updateOne(
          { _id: p._id },
          { $set: { status: 'approved', reviewed_at: now, reviewed_by: req.user.username } }
        );
        aa++;
      }
    }

    if (pendingGatha && gatha) {
      const pendingG = await pendingGatha.find({ status: 'pending' }).toArray();
      for (const p of pendingG) {
        await gatha.insertOne({
          username: p.username,
          student_name: p.student_name || p.username,
          type: p.type,
          activityTypeId: p.activityTypeId || null,
          activityTypeName: p.activityTypeName || (p.type === 'new' ? 'New Learning' : p.type === 'revision' ? 'Revision' : p.type),
          customActivityDescription: p.customActivityDescription || null,
          xpPoints: p.xpPoints || 0,
          sutra_name: p.sutra_name,
          which_gatha: p.which_gatha,
          total_gatha: p.total_gatha,
          date: p.date,
          created_at: now,
          approved_by: req.user.username,
          approved_at: now
        });
        await pendingGatha.updateOne(
          { _id: p._id },
          { $set: { status: 'approved', reviewed_at: now, reviewed_by: req.user.username } }
        );
        ag++;
      }
    }

    res.json({ approved: { attendance: aa, gatha: ag } });
  } catch (error) {
    console.error('Approve all error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const getStudents = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { startDate, endDate } = req.query;
    const start = startDate || '2020-01-01';
    const end = endDate || '2099-12-31';

    const [attendanceCol, gathaCol, usersCol] = await Promise.all([
      getCollection('attendance'),
      getCollection('gatha'),
      getCollection('users')
    ]);
    if (!usersCol) return res.json([]);

    // Fetch students + bulk aggregate stats in parallel (3 queries total, not 66)
    const [allStudents, attAgg, gathaAgg] = await Promise.all([
      usersCol.find(ACTIVE_STUDENTS).toArray(),
      attendanceCol ? attendanceCol.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$username', count: { $sum: 1 } } }
      ]).toArray() : [],
      gathaCol ? gathaCol.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: { username: '$username', type: '$type' }, total: { $sum: '$total_gatha' } } }
      ]).toArray() : []
    ]);

    const attMap = {};
    attAgg.forEach(a => { attMap[a._id] = a.count; });

    const gathaMap = {};
    gathaAgg.forEach(g => {
      const u = g._id.username;
      if (!gathaMap[u]) gathaMap[u] = { new: 0, revision: 0 };
      gathaMap[u][g._id.type] = (gathaMap[u][g._id.type] || 0) + (g.total || 0);
    });

    const studentsWithStats = allStudents.map(student => {
      const att = attMap[student.username] || 0;
      const g = gathaMap[student.username] || { new: 0, revision: 0 };
      return {
        id: student.username,
        username: student.username,
        name: student.name || student.username,
        attendance_count: att,
        total_gathas: g.new + g.revision,
        new_gathas: g.new,
        revision_gathas: g.revision
      };
    });

    studentsWithStats.sort((a, b) => a.name.localeCompare(b.name));
    res.json(studentsWithStats);
  } catch (error) {
    console.error('Admin students error:', error);
    res.json([]);
  }
};

export const getTopStudents = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { startDate, endDate, limit = 5 } = req.query;
    const start = startDate || '2020-01-01';
    const end = endDate || '2099-12-31';
    const n = parseInt(limit) || 5;

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');
    const usersCol = await getCollection('users');

    let topAttendance = [], topGatha = [];

    if (attendance && usersCol) {
      const attAgg = await attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$username', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: n }
      ]).toArray();

      const usernames = attAgg.map(a => a._id);
      const users = await usersCol.find({ username: { $in: usernames } }).toArray();
      const nameMap = {};
      users.forEach(u => { nameMap[u.username] = u.name || u.username; });

      topAttendance = attAgg.map((a, i) => ({
        rank: i + 1,
        username: a._id,
        name: nameMap[a._id] || a._id,
        count: a.count
      }));
    }

    if (gatha && usersCol) {
      const gathaAgg = await gatha.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: 'new' } },
        { $group: { _id: '$username', count: { $sum: '$total_gatha' } } },
        { $sort: { count: -1 } },
        { $limit: n }
      ]).toArray();

      const usernames = gathaAgg.map(g => g._id);
      const users = await usersCol.find({ username: { $in: usernames } }).toArray();
      const nameMap = {};
      users.forEach(u => { nameMap[u.username] = u.name || u.username; });

      topGatha = gathaAgg.map((g, i) => ({
        rank: i + 1,
        username: g._id,
        name: nameMap[g._id] || g._id,
        count: g.count
      }));
    }

    res.json({ topAttendance, topGatha });
  } catch (error) {
    console.error('Top students error:', error);
    res.json({ topAttendance: [], topGatha: [] });
  }
};

export const exportReport = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { startDate, endDate } = req.query;
    const today = new Date();
    const start = startDate || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    const end = endDate || today.toISOString().split('T')[0];

    const [attendanceCol, gathaCol, usersCol] = await Promise.all([
      getCollection('attendance'),
      getCollection('gatha'),
      getCollection('users')
    ]);
    if (!usersCol) return res.status(500).json({ error: 'Database not available' });

    // Bulk aggregate in parallel (3 queries total)
    const [allStudentsList, attAgg, gathaAgg] = await Promise.all([
      usersCol.find(ACTIVE_STUDENTS).toArray(),
      attendanceCol ? attendanceCol.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$username', count: { $sum: 1 } } }
      ]).toArray() : [],
      gathaCol ? gathaCol.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: { username: '$username', type: '$type' }, total: { $sum: '$total_gatha' } } }
      ]).toArray() : []
    ]);

    const attMap = {};
    attAgg.forEach(a => { attMap[a._id] = a.count; });

    const gathaMap = {};
    gathaAgg.forEach(g => {
      const u = g._id.username;
      if (!gathaMap[u]) gathaMap[u] = { new: 0, revision: 0 };
      gathaMap[u][g._id.type] = (gathaMap[u][g._id.type] || 0) + (g.total || 0);
    });

    const studentsData = allStudentsList.map(student => {
      const att = attMap[student.username] || 0;
      const g = gathaMap[student.username] || { new: 0, revision: 0 };
      const newGathas = g.new;
      const revisionGathas = g.revision;
      return {
        username: student.username,
        name: student.name || student.username,
        attendanceCount: att,
        newGathas,
        revisionGathas,
        totalGathas: newGathas + revisionGathas,
        totalScore: att + newGathas
      };
    });

    studentsData.sort((a, b) => a.name.localeCompare(b.name));

    const totalAttendance = studentsData.reduce((s, x) => s + x.attendanceCount, 0);
    const totalNewGathas = studentsData.reduce((s, x) => s + x.newGathas, 0);
    const totalRevisionGathas = studentsData.reduce((s, x) => s + x.revisionGathas, 0);

    const summary = {
      totalStudents: studentsData.length,
      activeStudents: studentsData.filter(s => s.attendanceCount > 0 || s.newGathas > 0).length,
      totalAttendance,
      totalNewGathas,
      totalRevisionGathas,
      totalGathas: totalNewGathas + totalRevisionGathas,
      totalScore: totalAttendance + totalNewGathas,
      dateRange: { start, end }
    };

    const sorted = [...studentsData].sort((a, b) => b.totalScore - a.totalScore);
    const topPerformers = {
      byAttendance: [...studentsData].sort((a, b) => b.attendanceCount - a.attendanceCount).slice(0, 5),
      byGatha: [...studentsData].sort((a, b) => b.newGathas - a.newGathas).slice(0, 5),
      byTotal: sorted.slice(0, 5)
    };

    res.json({ students: studentsData, summary, topPerformers, generatedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// ============================================
// USER MANAGEMENT
// ============================================

const toUserResponse = (u) => ({
  id: u._id.toString(),
  username: u.username,
  name: u.name || u.username,
  mobile: u.mobile || null,
  role: u.role || 'student',
  isActive: u.isActive !== false,
  created_at: u.created_at
});

// Internal id for a new student; students log in with their mobile number, not this
async function generateUsername(usersCollection, name) {
  const base = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 16) || 'student';
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${Math.floor(100 + Math.random() * 900)}`;
    if (!(await usersCollection.findOne({ username: { $regex: exactCI(candidate) } }))) return candidate;
  }
  return `${base}${Date.now()}`;
}

function sendAccountError(res, error, fallback) {
  if (error instanceof AccountError) return res.status(error.status).json({ error: error.message });
  console.error(fallback, error);
  return res.status(500).json({ error: fallback });
}

export const getUsers = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const usersCollection = await getCollection('users');
    if (!usersCollection) return res.status(500).json({ error: 'Database not available' });

    const rawUsers = await usersCollection.find({}).sort({ name: 1 }).toArray();

    // Students without their own number log in through a family member's number
    const groupsColl = await getCollection('family_groups');
    const groups = groupsColl ? await groupsColl.find({}).toArray() : [];
    const byUsername = Object.fromEntries(rawUsers.map(u => [u.username, u]));
    const groupOf = {};
    groups.forEach(g => (g.members || []).forEach(m => { groupOf[m] = g; }));

    res.json(rawUsers.map(u => {
      const group = groupOf[u.username];
      const loginMember = group && (group.members || []).map(m => byUsername[m]).find(m => m?.mobile);
      return {
        ...toUserResponse(u),
        familyGroup: group ? group.groupName : null,
        // Whose number this student logs in with, when they have none of their own
        loginVia: !u.mobile && loginMember ? { name: loginMember.name || loginMember.username, mobile: loginMember.mobile } : null
      };
    }));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Body: { name, mobile, password? }. Password is needed only when the mobile number is new;
// a number already used in this pathshala adds the student to that family.
export const createUser = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { name, password } = req.body || {};
    // Optional: a student without a number logs in through a family member's number
    // (add them to a family group with someone who has one)
    const hasMobile = req.body?.mobile !== undefined && req.body.mobile !== null && req.body.mobile !== '';
    const mobile = hasMobile ? normalizeMobile(req.body.mobile) : null;

    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (hasMobile && !mobile) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

    const usersCollection = await getCollection('users');
    if (!usersCollection) return res.status(500).json({ error: 'Database not available' });

    const created = mobile
      ? (await ensureAccount({ mobile, pathshalaId: currentPathshalaId(), password })).created
      : null;

    await usersCollection.insertOne({
      username: await generateUsername(usersCollection, name),
      name: name.trim(),
      ...(mobile ? { mobile } : {}),
      role: 'student',
      created_at: new Date().toISOString()
    });
    res.json({
      message: !mobile
        ? 'User created. Add them to a family group with a member who has a mobile number so they can log in.'
        : created ? 'User created' : 'User added to the existing family on this number'
    });
  } catch (error) {
    sendAccountError(res, error, 'Failed to create user');
  }
};

// Body: { name?, mobile?, password? }. A password sets the login password for that mobile number,
// which is shared by every student on it.
export const updateUser = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const { name, password } = req.body || {};
    const hasMobile = req.body?.mobile !== undefined && req.body.mobile !== '';
    const mobile = hasMobile ? normalizeMobile(req.body.mobile) : null;
    if (hasMobile && !mobile) return res.status(400).json({ error: 'Enter a valid 10-digit mobile number' });

    const usersCollection = await getCollection('users');
    if (!usersCollection) return res.status(500).json({ error: 'Database not available' });

    const existing = ObjectId.isValid(req.params.id) ? await usersCollection.findOne({ _id: new ObjectId(req.params.id) }) : null;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const targetMobile = mobile || existing.mobile;
    if (!targetMobile && password) {
      return res.status(400).json({ error: 'Add a mobile number first; the password belongs to the mobile number' });
    }

    if (targetMobile && (targetMobile !== existing.mobile || password)) {
      const passwords = await getCollection('passwords');
      await ensureAccount({
        mobile: targetMobile,
        pathshalaId: currentPathshalaId(),
        password,
        // First time this student gets a number: keep their current password
        fallbackHash: await existingStudentHash(existing, passwords)
      });
    }

    const updateFields = { updated_at: new Date().toISOString() };
    if (name && name.trim()) updateFields.name = name.trim();
    if (targetMobile) updateFields.mobile = targetMobile;
    // Temporarily stopped attending: data is kept, but they leave lists and can't log in
    if (typeof req.body?.isActive === 'boolean') {
      updateFields.isActive = req.body.isActive;
      updateFields[req.body.isActive ? 'reactivated_at' : 'deactivated_at'] = new Date().toISOString();
    }

    await usersCollection.updateOne({ _id: existing._id }, { $set: updateFields });
    forgetStudentStatus(existing.username, currentPathshalaId());

    if (existing.mobile && existing.mobile !== targetMobile) {
      await removeAccountIfUnused(existing.mobile, currentPathshalaId(), usersCollection);
    }

    res.json({ message: 'User updated' });
  } catch (error) {
    sendAccountError(res, error, 'Failed to update user');
  }
};

export const deleteUser = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const usersCollection = await getCollection('users');
    if (!usersCollection) return res.status(500).json({ error: 'Database not available' });

    const existing = ObjectId.isValid(req.params.id) ? await usersCollection.findOne({ _id: new ObjectId(req.params.id) }) : null;
    if (!existing) return res.status(404).json({ error: 'User not found' });

    await usersCollection.deleteOne({ _id: existing._id });
    await removeAccountIfUnused(existing.mobile, currentPathshalaId(), usersCollection);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// ============================================
// FAMILY GROUPS MANAGEMENT
// ============================================

export const getFamilyGroups = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const familyGroupsColl = await getCollection('family_groups');
    const usersCollection = await getCollection('users');
    if (!familyGroupsColl) return res.json([]);

    const groups = await familyGroupsColl.find({}).sort({ groupName: 1 }).toArray();
    const allMembers = [...new Set(groups.flatMap(g => g.members || []))];
    const docs = await usersCollection.find({ username: { $in: allMembers } }).toArray();
    const names = Object.fromEntries(docs.map(d => [d.username, d.name || d.username]));

    res.json(groups.map(g => ({
      id: g._id.toString(),
      groupName: g.groupName,
      // Usernames (used by bulk attendance/gatha) plus names for display
      members: g.members || [],
      memberDetails: (g.members || []).map(u => ({ username: u, name: names[u] || u })),
      created_at: g.created_at
    })));
  } catch (error) {
    console.error('Get family groups error:', error);
    res.json([]);
  }
};

// Shared by create and update: name, at least 2 existing students, none of them in another group
// (a student in two groups would only ever see one of them).
async function validateFamilyGroup(body, exceptGroupId) {
  const groupName = String(body?.groupName || '').trim();
  const members = [...new Set((Array.isArray(body?.members) ? body.members : []).map(String))];
  if (!groupName || members.length < 2) {
    return { error: 'Group name and at least 2 members are required' };
  }

  const usersCollection = await getCollection('users');
  const found = await usersCollection.find({ username: { $in: members } }).toArray();
  if (found.length !== members.length) {
    return { error: 'Some selected students no longer exist; refresh and try again' };
  }
  // The family logs in with this number and switches to the other members inside the app
  if (!found.some(u => u.mobile)) {
    return { error: 'At least one member needs a mobile number; the family logs in with it' };
  }

  const familyGroupsColl = await getCollection('family_groups');
  const clash = await familyGroupsColl.findOne({
    members: { $in: members },
    ...(exceptGroupId ? { _id: { $ne: exceptGroupId } } : {})
  });
  if (clash) {
    const taken = members.filter(m => clash.members.includes(m));
    const takenNames = found.filter(u => taken.includes(u.username)).map(u => u.name || u.username);
    return { error: `${takenNames.join(', ')} already in group "${clash.groupName}"` };
  }

  return { groupName, members };
}

export const createFamilyGroup = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const result = await validateFamilyGroup(req.body);
    if (result.error) return res.status(400).json({ error: result.error });

    const familyGroupsColl = await getCollection('family_groups');
    await familyGroupsColl.insertOne({
      groupName: result.groupName,
      members: result.members,
      created_at: new Date().toISOString()
    });
    res.json({ message: 'Family group created' });
  } catch (error) {
    console.error('Create family group error:', error);
    res.status(500).json({ error: 'Failed to create family group' });
  }
};

export const updateFamilyGroup = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const _id = new ObjectId(req.params.id);

    const result = await validateFamilyGroup(req.body, _id);
    if (result.error) return res.status(400).json({ error: result.error });

    const familyGroupsColl = await getCollection('family_groups');
    const update = await familyGroupsColl.updateOne(
      { _id },
      { $set: { groupName: result.groupName, members: result.members, updated_at: new Date().toISOString() } }
    );
    if (update.matchedCount === 0) return res.status(404).json({ error: 'Family group not found' });

    res.json({ message: 'Family group updated' });
  } catch (error) {
    console.error('Update family group error:', error);
    res.status(500).json({ error: 'Failed to update family group' });
  }
};

export const deleteFamilyGroup = async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });

  try {
    const familyGroupsColl = await getCollection('family_groups');
    if (!familyGroupsColl) return res.status(500).json({ error: 'Database not available' });

    await familyGroupsColl.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ message: 'Family group deleted' });
  } catch (error) {
    console.error('Delete family group error:', error);
    res.status(500).json({ error: 'Failed to delete family group' });
  }
};
