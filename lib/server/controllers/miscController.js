import { getCollection, getGlobalCollection } from '../db';
import { getCurrentMonthRange } from '../helpers';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { memberPasswordMatches } from '../accounts';

export const getLeaderboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const monthRange = getCurrentMonthRange();
    const start = startDate || monthRange.start;
    const end = endDate || monthRange.end;

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');

    let attendanceLeaders = [], gathaLeaders = [];

    if (attendance) {
      const attAgg = await attendance.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        { $group: { _id: '$username', totalAttendance: { $sum: 1 } } },
        { $sort: { totalAttendance: -1 } },
        { $limit: 10 }
      ]).toArray();

      attendanceLeaders = attAgg.map((item, index) => ({
        rank: index + 1, userId: item._id, username: item._id, name: item._id,
        totalAttendance: item.totalAttendance, count: item.totalAttendance
      }));
    }

    if (gatha) {
      const gathaAgg = await gatha.aggregate([
        { $match: { date: { $gte: start, $lte: end }, type: 'new' } },
        { $group: { _id: '$username', totalGathas: { $sum: '$total_gatha' } } },
        { $sort: { totalGathas: -1 } },
        { $limit: 10 }
      ]).toArray();

      gathaLeaders = gathaAgg.map((item, index) => ({
        rank: index + 1, userId: item._id, username: item._id, name: item._id,
        totalGathas: item.totalGathas, count: item.totalGathas
      }));
    }

    res.json({ attendanceLeaders, gathaLeaders, dateRange: { start, end } });
  } catch (error) {
    res.json({ attendanceLeaders: [], gathaLeaders: [], dateRange: {} });
  }
};

export const getKidsLeaderboard = async (req, res) => {
  // Kids dashboard removed — return same as regular leaderboard
  return getLeaderboard(req, res);
};

export const getAnalyticsLeaderboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate || `${new Date().getFullYear()}-01-01`;
    const end = endDate || `${new Date().getFullYear()}-12-31`;

    let result = { attendanceLeader: null, gathaStats: { totalPathshalaGathas: 0, totalAttendance: 0, gathaLeader: null }, attendanceLeaders: [], gathaLeaders: [] };

    const attendance = await getCollection('attendance');
    const gatha = await getCollection('gatha');

    if (attendance) {
      result.gathaStats.totalAttendance = await attendance.countDocuments({ date: { $gte: start, $lte: end } });
      const attLeaders = await attendance.aggregate([{ $match: { date: { $gte: start, $lte: end } } }, { $group: { _id: '$username', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray();

      if (attLeaders.length > 0) {
        result.attendanceLeaders = attLeaders.map((item, index) => ({
          rank: index + 1, userId: item._id, username: item._id, name: item._id, totalAttendance: item.count, count: item.count
        }));
        const topAtt = attLeaders[0];
        result.attendanceLeader = { name: topAtt._id, username: topAtt._id, attendance_count: topAtt.count };
      }
    }

    if (gatha) {
      const totalGathas = await gatha.aggregate([{ $match: { date: { $gte: start, $lte: end } } }, { $group: { _id: null, total: { $sum: '$total_gatha' } } }]).toArray();
      result.gathaStats.totalPathshalaGathas = totalGathas[0]?.total || 0;

      const gathaLeaders = await gatha.aggregate([{ $match: { date: { $gte: start, $lte: end }, type: 'new' } }, { $group: { _id: '$username', count: { $sum: '$total_gatha' } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray();

      if (gathaLeaders.length > 0) {
        result.gathaLeaders = gathaLeaders.map((item, index) => ({
          rank: index + 1, userId: item._id, username: item._id, name: item._id, totalGathas: item.count, count: item.count
        }));
        const topGatha = gathaLeaders[0];
        result.gathaStats.gathaLeader = { name: topGatha._id, username: topGatha._id, count: topGatha.count };
      }
    }

    res.json(result);
  } catch (error) {
    res.json({ attendanceLeader: null, gathaStats: { totalPathshalaGathas: 0, totalAttendance: 0, gathaLeader: null }, attendanceLeaders: [], gathaLeaders: [] });
  }
};

export const getAchievements = async (req, res) => {
  try {
    const achievements = await getCollection('achievements');
    if (!achievements) return res.json({ unlocked: [], xp: 0 });
    const userAchievements = await achievements.find({ username: req.user.username }).toArray();
    const totalXP = userAchievements.reduce((sum, a) => sum + (a.xp || 0), 0);
    res.json({ unlocked: userAchievements, xp: totalXP });
  } catch (error) { res.json({ unlocked: [], xp: 0 }); }
};

export const unlockAchievement = async (req, res) => {
  try {
    const { achievementId, xp } = req.body;
    if (!achievementId) return res.status(400).json({ error: 'Achievement ID required' });
    const achievements = await getCollection('achievements');
    if (!achievements) return res.status(500).json({ error: 'Database not available' });

    const existing = await achievements.findOne({ username: req.user.username, achievementId: achievementId });
    if (existing) return res.json({ message: 'Already unlocked', alreadyUnlocked: true });

    await achievements.insertOne({ username: req.user.username, achievementId: achievementId, xp: xp || 0, unlockedAt: new Date().toISOString() });
    res.json({ message: 'Achievement unlocked!', achievementId, xp });
  } catch (error) { res.status(500).json({ error: 'Failed to unlock achievement' }); }
};

export const getProfile = async (req, res) => {
  try {
    const profiles = await getCollection('profiles');
    let profile = null;
    if (profiles) profile = await profiles.findOne({ username: req.user.username });
    res.json({ username: req.user.username, name: req.user.name, ...profile, joinedDate: profile?.joinedDate || null });
  } catch (error) { res.json({ username: req.user.username, name: req.user.name }); }
};

export const updateProfile = async (req, res) => {
  try {
    const { showTips, theme, language } = req.body;
    const profiles = await getCollection('profiles');
    if (!profiles) return res.status(500).json({ error: 'Database not available' });

    await profiles.updateOne(
      { username: req.user.username },
      { $set: { showTips, theme, language, updatedAt: new Date().toISOString() }, $setOnInsert: { username: req.user.username, joinedDate: new Date().toISOString() } },
      { upsert: true }
    );
    res.json({ message: 'Profile updated' });
  } catch (error) { res.status(500).json({ error: 'Failed to update profile' }); }
};

// Students change their family account's password (shared by everyone on that mobile number).
// Admins change their own password.
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Min 6 chars' });

    const isAdmin = req.user.role === 'admin';
    const col = await getGlobalCollection(isAdmin ? 'admins' : 'accounts');
    if (!col) return res.status(500).json({ error: 'Database not available' });

    const record = isAdmin
      ? (ObjectId.isValid(req.user.id) ? await col.findOne({ _id: new ObjectId(req.user.id), role: 'admin' }) : null)
      : await col.findOne({ mobile: req.user.mobile, pathshalaId: req.user.pathshalaId });
    if (!record) return res.status(404).json({ error: 'Not found' });

    if (!(await bcrypt.compare(currentPassword, record.password_hash || ''))) {
      // A family member can also log in with their own password; changing it updates just theirs
      if (!isAdmin) {
        const users = await getCollection('users');
        const passwords = await getCollection('passwords');
        const me = await users.findOne({ username: req.user.username });
        if (me && await memberPasswordMatches(me, currentPassword, passwords)) {
          await users.updateOne(
            { _id: me._id },
            { $set: { password_hash: await bcrypt.hash(newPassword, 10), password_updated_at: new Date().toISOString() }, $unset: { password: '' } }
          );
          if (passwords) await passwords.deleteOne({ username: me.username });
          return res.json({ message: 'Success' });
        }
      }
      return res.status(401).json({ error: 'Incorrect' });
    }

    await col.updateOne(
      { _id: record._id },
      { $set: { password_hash: await bcrypt.hash(newPassword, 10), updated_at: new Date().toISOString() } }
    );
    res.json({ message: 'Success' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};
