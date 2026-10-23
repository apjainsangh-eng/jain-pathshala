import { getCollection } from '../db';
import { notifyNewPending } from '../telegram';
import { canActAs, formatTime, formatDate, todayIST, exactCI } from '../helpers';
import { ObjectId } from 'mongodb';

export const getAttendance = async (req, res) => {
  try {
    const attendance = await getCollection('attendance');
    if (!attendance) return res.json([]);
    
    const records = await attendance
      .find({ username: req.user.username })
      .sort({ date: -1 })
      .toArray();
      
    res.json(records);
  } catch (error) {
    res.json([]);
  }
};

export const markAttendance = async (req, res) => {
  try {
    const today = todayIST();
    const now = new Date();
    
    const attendance = await getCollection('attendance');
    const pendingAttendance = await getCollection('pending_attendance');
    
    if (!attendance || !pendingAttendance) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const existing = await attendance.findOne({
      username: req.user.username,
      date: today
    });

    if (existing) {
      return res.status(400).json({ error: 'Already marked for today' });
    }

    const pendingExisting = await pendingAttendance.findOne({
      username: req.user.username,
      date: today,
      status: 'pending'
    });

    if (pendingExisting) {
      return res.status(400).json({ error: 'Already pending approval' });
    }

    const inserted = await pendingAttendance.insertOne({
      username: req.user.username,
      student_name: req.user.name || req.user.username,
      date: today,
      status: 'pending',
      created_at: now.toISOString(),
      request_time: formatTime(now.toISOString()),
      request_date: formatDate(now.toISOString())
    });
    // Tell the pathshala's linked Telegram chats (Approve / Reject buttons)
    await notifyNewPending('attendance', inserted.insertedId);

    res.json({ message: 'Pending approval' });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const markAttendanceFor = async (req, res) => {
  try {
    const { forUsername } = req.body;
    const targetUser = forUsername || req.user.username;

    if (targetUser !== req.user.username) {
      const canAct = await canActAs(req.user.username, targetUser);
      if (!canAct) {
        return res.status(403).json({ error: 'You cannot mark attendance for this user' });
      }
    }

    const today = todayIST();
    const now = new Date();
    
    const attendance = await getCollection('attendance');
    const pendingAttendance = await getCollection('pending_attendance');
    
    if (!attendance || !pendingAttendance) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const usersCol = await getCollection('users');
    const targetDbUser = usersCol ? await usersCol.findOne({ username: { $regex: exactCI(targetUser) } }) : null;
    const targetInfo = { name: targetDbUser?.name || targetUser, username: targetUser };

    const existing = await attendance.findOne({
      username: targetUser,
      date: today
    });

    if (existing) {
      return res.status(400).json({ error: 'Already marked for today' });
    }

    const pendingExisting = await pendingAttendance.findOne({
      username: targetUser,
      date: today,
      status: 'pending'
    });

    if (pendingExisting) {
      return res.status(400).json({ error: 'Already pending approval' });
    }

    const inserted = await pendingAttendance.insertOne({
      username: targetUser,
      student_name: targetInfo.name,
      date: today,
      status: 'pending',
      created_at: now.toISOString(),
      request_time: formatTime(now.toISOString()),
      request_date: formatDate(now.toISOString()),
      marked_by: req.user.username
    });
    // Tell the pathshala's linked Telegram chats (Approve / Reject buttons)
    await notifyNewPending('attendance', inserted.insertedId);

    res.json({ message: 'Pending approval for ' + targetInfo.name });
  } catch (error) {
    console.error('Mark attendance for error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const deletePendingAttendance = async (req, res) => {
  try {
    const pendingAttendance = await getCollection('pending_attendance');
    if (!pendingAttendance) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await pendingAttendance.deleteOne({
      _id: new ObjectId(req.params.id),
      username: req.user.username,
      status: 'pending'
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Pending attendance not found or already approved' });
    }

    res.json({ message: 'Attendance request cancelled' });
  } catch (error) {
    console.error('Delete pending attendance error:', error);
    res.status(500).json({ error: 'Failed to cancel' });
  }
};
