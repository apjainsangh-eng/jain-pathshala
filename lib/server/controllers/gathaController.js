import { getCollection } from '../db';
import { notifyNewPending } from '../telegram';
import { canActAs, formatTime, formatDate, todayIST, exactCI } from '../helpers';
import { ObjectId } from 'mongodb';

function deriveStorageType(activityTypeName) {
  if (!activityTypeName) return 'new';
  const lower = activityTypeName.toLowerCase().trim();
  if (lower === 'new learning' || lower === 'new') return 'new';
  if (lower === 'revision') return 'revision';
  return lower.replace(/\s+/g, '_');
}

export const getGatha = async (req, res) => {
  try {
    const gatha = await getCollection('gatha');
    if (!gatha) return res.json([]);
    
    const records = await gatha
      .find({ username: req.user.username })
      .sort({ created_at: -1 })
      .toArray();
      
    res.json(records);
  } catch (error) {
    res.json([]);
  }
};

export const addGatha = async (req, res) => {
  try {
    const { type, sutra_name, which_gatha, total_gatha, activityTypeId, activityTypeName, customActivityDescription, xpPoints } = req.body || {};

    const resolvedTypeName = activityTypeName || (type === 'new' ? 'New Learning' : type === 'revision' ? 'Revision' : type);
    const resolvedType = deriveStorageType(resolvedTypeName);
    const isNewOrRevision = resolvedType === 'new' || resolvedType === 'revision';

    if (isNewOrRevision && (!sutra_name || !which_gatha || !total_gatha)) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!isNewOrRevision && resolvedTypeName === 'Other' && !customActivityDescription) {
      return res.status(400).json({ error: 'Description required for Other activity type' });
    }

    const today = todayIST();
    const now = new Date();
    const pendingGatha = await getCollection('pending_gatha');

    if (!pendingGatha) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Prevent duplicate named Other-type activities on the same day
    if (!isNewOrRevision && resolvedTypeName !== 'Other') {
      const gathaCol = await getCollection('gatha');
      const [alreadyApproved, alreadyPending] = await Promise.all([
        gathaCol ? gathaCol.findOne({ username: req.user.username, date: today, activityTypeName: resolvedTypeName }) : null,
        pendingGatha.findOne({ username: req.user.username, date: today, activityTypeName: resolvedTypeName, status: 'pending' }),
      ]);
      if (alreadyApproved || alreadyPending) {
        return res.status(400).json({ error: `${resolvedTypeName} already submitted for today` });
      }
    }

    const inserted = await pendingGatha.insertOne({
      username: req.user.username,
      student_name: req.user.name || req.user.username,
      type: resolvedType,
      activityTypeId: activityTypeId || null,
      activityTypeName: resolvedTypeName,
      customActivityDescription: resolvedTypeName === 'Other' ? (customActivityDescription || null) : null,
      xpPoints: (resolvedType === 'new' || resolvedType === 'revision') ? 0 : (parseInt(xpPoints) || 0),
      sutra_name,
      which_gatha,
      total_gatha: parseInt(total_gatha),
      date: today,
      status: 'pending',
      created_at: now.toISOString(),
      request_time: formatTime(now.toISOString()),
      request_date: formatDate(now.toISOString())
    });
    // Tell the pathshala's linked Telegram chats (Approve / Reject buttons)
    await notifyNewPending('gatha', inserted.insertedId);

    res.json({ message: 'Pending approval' });
  } catch (error) {
    console.error('Create gatha error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const addGathaFor = async (req, res) => {
  try {
    const { forUsername, type, sutra_name, which_gatha, total_gatha, activityTypeId, activityTypeName, customActivityDescription, xpPoints } = req.body || {};
    const targetUser = forUsername || req.user.username;

    if (targetUser !== req.user.username) {
      const canAct = await canActAs(req.user.username, targetUser);
      if (!canAct) {
        return res.status(403).json({ error: 'You cannot add gatha for this user' });
      }
    }

    const resolvedTypeName = activityTypeName || (type === 'new' ? 'New Learning' : type === 'revision' ? 'Revision' : type);
    const resolvedType = deriveStorageType(resolvedTypeName);
    const isNewOrRevision = resolvedType === 'new' || resolvedType === 'revision';

    if (isNewOrRevision && (!sutra_name || !which_gatha || !total_gatha)) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (!isNewOrRevision && resolvedTypeName === 'Other' && !customActivityDescription) {
      return res.status(400).json({ error: 'Description required for Other activity type' });
    }

    const today = todayIST();
    const now = new Date();
    const pendingGatha = await getCollection('pending_gatha');

    if (!pendingGatha) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Prevent duplicate named Other-type activities on the same day
    if (!isNewOrRevision && resolvedTypeName !== 'Other') {
      const gathaCol = await getCollection('gatha');
      const [alreadyApproved, alreadyPending] = await Promise.all([
        gathaCol ? gathaCol.findOne({ username: targetUser, date: today, activityTypeName: resolvedTypeName }) : null,
        pendingGatha.findOne({ username: targetUser, date: today, activityTypeName: resolvedTypeName, status: 'pending' }),
      ]);
      if (alreadyApproved || alreadyPending) {
        return res.status(400).json({ error: `${resolvedTypeName} already submitted for today` });
      }
    }

    const usersCol = await getCollection('users');
    const targetDbUser = usersCol ? await usersCol.findOne({ username: { $regex: exactCI(targetUser) } }) : null;
    const targetInfo = { name: targetDbUser?.name || targetUser, username: targetUser };

    const inserted = await pendingGatha.insertOne({
      username: targetUser,
      student_name: targetInfo.name,
      type: resolvedType,
      activityTypeId: activityTypeId || null,
      activityTypeName: resolvedTypeName,
      customActivityDescription: resolvedTypeName === 'Other' ? (customActivityDescription || null) : null,
      xpPoints: (resolvedType === 'new' || resolvedType === 'revision') ? 0 : (parseInt(xpPoints) || 0),
      sutra_name,
      which_gatha,
      total_gatha: parseInt(total_gatha),
      date: today,
      status: 'pending',
      created_at: now.toISOString(),
      request_time: formatTime(now.toISOString()),
      request_date: formatDate(now.toISOString()),
      added_by: req.user.username
    });
    // Tell the pathshala's linked Telegram chats (Approve / Reject buttons)
    await notifyNewPending('gatha', inserted.insertedId);

    res.json({ message: 'Pending approval for ' + targetInfo.name });
  } catch (error) {
    console.error('Create gatha for error:', error);
    res.status(500).json({ error: 'Failed' });
  }
};

export const editPendingGatha = async (req, res) => {
  try {
    const { sutra_name, which_gatha, total_gatha } = req.body || {};

    if (!sutra_name || !which_gatha || !total_gatha) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const pendingGatha = await getCollection('pending_gatha');
    if (!pendingGatha) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await pendingGatha.updateOne(
      {
        _id: new ObjectId(req.params.id),
        username: req.user.username,
        status: 'pending'
      },
      {
        $set: {
          sutra_name,
          which_gatha,
          total_gatha: parseInt(total_gatha),
          updated_at: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Pending gatha not found or already approved' });
    }

    res.json({ message: 'Gatha updated successfully' });
  } catch (error) {
    console.error('Edit pending gatha error:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
};

export const deletePendingGatha = async (req, res) => {
  try {
    const pendingGatha = await getCollection('pending_gatha');
    if (!pendingGatha) {
      return res.status(500).json({ error: 'Database not available' });
    }

    const result = await pendingGatha.deleteOne({
      _id: new ObjectId(req.params.id),
      username: req.user.username,
      status: 'pending'
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Pending gatha not found or already approved' });
    }

    res.json({ message: 'Gatha request cancelled' });
  } catch (error) {
    console.error('Delete pending gatha error:', error);
    res.status(500).json({ error: 'Failed to cancel' });
  }
};
