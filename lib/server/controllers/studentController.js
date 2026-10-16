import { getCollection } from '../db';
import { canActAs, getFamily, calculateStreaks, formatTime, formatDate, todayIST, exactCI } from '../helpers';

export const getFamilyMembers = async (req, res) => {
  try {
    // Family = students sharing this login's mobile number + any admin-made family group
    const family = await getFamily(req.user.username);
    if (family.members.length < 2) {
      return res.json({ familyMembers: [], groupName: null });
    }

    res.json({
      familyMembers: family.members.map((m) => ({ ...m, isCurrent: m.username === req.user.username })),
      groupName: family.groupName
    });
  } catch (error) {
    console.error('Get family members error:', error);
    res.json({ familyMembers: [], groupName: null });
  }
};

// Whether the logged-in student, or a family member they're viewing, is active.
// The dashboard uses it to explain why attendance/gatha can't be added.
export const getStatus = async (req, res) => {
  const username = String(req.query.username || req.user.username);
  if (username !== req.user.username && !(await canActAs(req.user.username, username))) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  const users = await getCollection('users');
  const u = await users.findOne({ username });
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ username, isActive: u.isActive !== false });
};

// The student dashboard's Pending page and "pending today" badges read this.
// The old backend never implemented it, so those were always empty.
export const getPendingStatus = async (req, res) => {
  try {
    const pendingAttendance = await getCollection('pending_attendance');
    const pendingGatha = await getCollection('pending_gatha');

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const query = {
      username: req.user.username,
      $or: [{ status: 'pending' }, { status: 'rejected', reviewed_at: { $gte: since } }]
    };
    const withId = (doc) => ({ ...doc, id: doc._id.toString() });

    const [attendance, gatha] = await Promise.all([
      pendingAttendance ? pendingAttendance.find(query).sort({ created_at: -1 }).toArray() : [],
      pendingGatha ? pendingGatha.find(query).sort({ created_at: -1 }).toArray() : []
    ]);

    res.json({ attendance: attendance.map(withId), gatha: gatha.map(withId) });
  } catch (error) {
    console.error('Get pending status error:', error);
    res.status(500).json({ error: 'Failed to load pending items' });
  }
};

export const getFamilyMemberData = async (req, res) => {
  try {
    const targetUser = req.params.username;

    if (targetUser !== req.user.username) {
      const canAct = await canActAs(req.user.username, targetUser);
      if (!canAct) {
        return res.status(403).json({ error: 'You cannot view this user\'s data' });
      }
    }

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');
    const pendingAttendance = await getCollection('pending_attendance');
    const pendingGatha = await getCollection('pending_gatha');

    const usersCol = await getCollection('users');
    const targetDbUser = usersCol ? await usersCol.findOne({ username: { $regex: exactCI(targetUser) } }) : null;
    const targetInfo = { name: targetDbUser?.name || targetUser, username: targetUser };

    const today = todayIST();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Date ranges
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`;
    
    let todayAttendance = null;
    let todayPendingAttendance = null;
    
    if (attendance) {
      todayAttendance = await attendance.findOne({ username: targetUser, date: today });
    }
    if (pendingAttendance) {
      todayPendingAttendance = await pendingAttendance.findOne({ 
        username: targetUser, 
        date: today,
        status: 'pending'
      });
    }

    let allAttendance = [];
    let recentAttendance = [];
    let recentGathas = [];
    let pendingGathaList = [];
    let pendingAttendanceList = [];

    if (attendance) {
      allAttendance = await attendance
        .find({ username: targetUser })
        .sort({ date: -1 })
        .toArray();
      
      recentAttendance = allAttendance.slice(0, 60);
    }

    if (gatha) {
      recentGathas = await gatha
        .find({ username: targetUser })
        .sort({ created_at: -1 })
        .limit(60)
        .toArray();
    }

    if (pendingGatha) {
      pendingGathaList = await pendingGatha
        .find({ username: targetUser, status: 'pending' })
        .sort({ created_at: -1 })
        .toArray();
    }

    if (pendingAttendance) {
      pendingAttendanceList = await pendingAttendance
        .find({ username: targetUser, status: 'pending' })
        .sort({ created_at: -1 })
        .toArray();
    }

    const streakData = calculateStreaks(allAttendance.map(a => a.date));

    let yearlyAttendance = 0;
    let yearlyNewGathas = 0;

    if (attendance) {
      yearlyAttendance = await attendance.countDocuments({
        username: targetUser,
        date: { $gte: yearStart, $lte: yearEnd }
      });
    }

    if (gatha) {
      const gathaSum = await gatha.aggregate([
        { 
          $match: { 
            username: targetUser,
            date: { $gte: yearStart, $lte: yearEnd },
            type: 'new'
          } 
        },
        { $group: { _id: null, total: { $sum: '$total_gatha' } } }
      ]).toArray();
      yearlyNewGathas = gathaSum[0]?.total || 0;
    }

    let monthlyAttendance = 0;
    let monthlyNewGathas = 0;
    let monthlyRevisionGathas = 0;

    if (attendance) {
      monthlyAttendance = await attendance.countDocuments({
        username: targetUser,
        date: { $gte: monthStart, $lte: monthEnd }
      });
    }

    if (gatha) {
      const monthlyGathaStats = await gatha.aggregate([
        { 
          $match: { 
            username: targetUser,
            date: { $gte: monthStart, $lte: monthEnd }
          } 
        },
        { $group: { _id: '$type', total: { $sum: '$total_gatha' } } }
      ]).toArray();
      
      monthlyGathaStats.forEach(g => {
        if (g._id === 'new') monthlyNewGathas = g.total || 0;
        else monthlyRevisionGathas = g.total || 0;
      });
    }

    res.json({
      user: {
        username: targetUser,
        name: targetInfo.name
      },
      today: {
        isMarked: !!todayAttendance,
        isPending: !!todayPendingAttendance,
        date: today
      },
      stats: {
        yearlyAttendance,
        yearlyNewGathas,
        monthlyAttendance,
        monthlyNewGathas,
        monthlyRevisionGathas,
        currentStreak: streakData.current,
        maxStreak: streakData.max,
        workingDays: 22
      },
      recentAttendance: recentAttendance.map(a => ({
        ...a,
        id: a._id.toString()
      })),
      recentGathas: recentGathas.map(g => ({
        ...g,
        id: g._id.toString()
      })),
      pendingGathas: pendingGathaList.map(g => ({
        ...g,
        id: g._id.toString()
      })),
      pendingAttendance: pendingAttendanceList.map(a => ({
        ...a,
        id: a._id.toString()
      }))
    });
  } catch (error) {
    console.error('Get family member data error:', error);
    res.status(500).json({ error: 'Failed to get data' });
  }
};

export const getFamilyMemberStats = async (req, res) => {
  try {
    const targetUser = req.params.username;

    if (targetUser !== req.user.username) {
      const canAct = await canActAs(req.user.username, targetUser);
      if (!canAct) {
        return res.status(403).json({ error: 'You cannot view this user\'s stats' });
      }
    }

    const now = new Date();
    const selectedYear = parseInt(req.query.year) || now.getFullYear();
    const selectedMonth = parseInt(req.query.month) || (now.getMonth() + 1);
    
    const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const monthEnd = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${daysInMonth}`;

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');

    let stats = {
      monthlyAttendance: 0,
      monthlyNewGathas: 0,
      monthlyRevisionGathas: 0,
      currentStreak: 0,
      maxStreak: 0,
      workingDays: 22,
      daysInMonth: daysInMonth
    };

    if (attendance) {
      stats.monthlyAttendance = await attendance.countDocuments({
        username: targetUser,
        date: { $gte: monthStart, $lte: monthEnd }
      });

      const allAttendance = await attendance
        .find({ username: targetUser })
        .sort({ date: -1 })
        .toArray();
      
      const streakData = calculateStreaks(allAttendance.map(a => a.date));
      stats.currentStreak = streakData.current;
      stats.maxStreak = streakData.max;
    }

    if (gatha) {
      const monthlyGathaStats = await gatha.aggregate([
        { 
          $match: { 
            username: targetUser,
            date: { $gte: monthStart, $lte: monthEnd }
          } 
        },
        { $group: { _id: '$type', total: { $sum: '$total_gatha' } } }
      ]).toArray();
      
      monthlyGathaStats.forEach(g => {
        if (g._id === 'new') stats.monthlyNewGathas = g.total || 0;
        else stats.monthlyRevisionGathas = g.total || 0;
      });
    }

    res.json(stats);
  } catch (error) {
    console.error('Get family member stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
