import { getCollection } from '../db';
import { canActAs } from '../helpers';
import { normalizeMobile } from '../accounts';

// A student's own basic details (stored on their users record under `profile`).
// The family login can view/edit any member it can act for.

export const PROFILE_FIELDS = ['dateOfBirth', 'gender', 'guardianName', 'alternateMobile', 'email', 'school', 'standard', 'address'];
const GENDERS = ['male', 'female'];

export function publicProfile(u) {
  const p = u.profile || {};
  return Object.fromEntries(PROFILE_FIELDS.map((f) => [f, p[f] || '']));
}

async function resolveTarget(req, res) {
  const username = String(req.query.username || req.body?.username || req.user.username);
  if (username !== req.user.username && !(await canActAs(req.user.username, username))) {
    res.status(403).json({ error: 'Not allowed' });
    return null;
  }
  const users = await getCollection('users');
  const u = await users.findOne({ username });
  if (!u) {
    res.status(404).json({ error: 'Student not found' });
    return null;
  }
  return { users, u };
}

// GET /student/profile?username=
export const getStudentOwnProfile = async (req, res) => {
  try {
    const found = await resolveTarget(req, res);
    if (!found) return;
    const { u } = found;
    const groups = await getCollection('family_groups');
    const group = groups ? await groups.findOne({ members: u.username }) : null;

    res.json({
      username: u.username,
      name: u.name || u.username,
      mobile: u.mobile || null,
      // The number the family logs in with (this member's own, or the one they're using now)
      loginMobile: req.user.mobile || u.mobile || null,
      familyGroup: group ? group.groupName : null,
      isActive: u.isActive !== false,
      ...publicProfile(u),
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

// PUT /student/profile  { username?, name, dateOfBirth, gender, guardianName, alternateMobile, email, school, standard, address }
export const updateStudentOwnProfile = async (req, res) => {
  try {
    const found = await resolveTarget(req, res);
    if (!found) return;
    const { users, u } = found;
    const body = req.body || {};
    const clean = (v, max) => String(v ?? '').trim().slice(0, max);

    const name = clean(body.name, 60);
    if (name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });

    const profile = {
      dateOfBirth: clean(body.dateOfBirth, 10),
      gender: GENDERS.includes(body.gender) ? body.gender : '',
      guardianName: clean(body.guardianName, 60),
      alternateMobile: '',
      email: clean(body.email, 80).toLowerCase(),
      school: clean(body.school, 80),
      standard: clean(body.standard, 20),
      address: clean(body.address, 250),
    };

    if (profile.dateOfBirth) {
      const d = new Date(`${profile.dateOfBirth}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth) || Number.isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1920) {
        return res.status(400).json({ error: 'Enter a valid date of birth' });
      }
    }
    if (body.alternateMobile) {
      const m = normalizeMobile(body.alternateMobile);
      if (!m) return res.status(400).json({ error: 'Enter a valid 10-digit alternate mobile number' });
      profile.alternateMobile = m;
    }
    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    await users.updateOne(
      { _id: u._id },
      { $set: { name, profile, profile_updated_at: new Date().toISOString() } }
    );
    res.json({ message: 'Profile saved', name, ...profile });
  } catch (error) {
    console.error('Update student profile error:', error);
    res.status(500).json({ error: 'Failed to save profile' });
  }
};
