import { getCollection } from '../db';
import { canActAs } from '../helpers';

// A student's own details (stored on their users record under `profile`), matching the
// pathshala registration form. The family login can view/edit any member it can act for.

export const PROFILE_FIELDS = [
  'firstName', 'lastName', 'email', 'dateOfBirth', 'gender', 'whatsappNumber', 'address',
  'currentStatus', 'studyDetails', 'otherActivities', 'dharmicAbhyas', 'skills',
];
export const STATUSES = ['school', 'college', 'working', 'business', 'homemaker', 'retired', 'other'];
const GENDERS = ['male', 'female'];

// Older records only have a single `name`; split it so the form starts filled in
function splitName(name = '') {
  const parts = String(name).trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
}

export function publicProfile(u) {
  const p = u.profile || {};
  const fromName = splitName(u.name || u.username);
  const out = Object.fromEntries(PROFILE_FIELDS.map((f) => [f, p[f] || '']));
  if (!out.firstName && !out.lastName) Object.assign(out, fromName);
  return out;
}

// Details every student is asked to fill (the "please complete your profile" popup).
// The WhatsApp number isn't included: only the admin can set it.
export const REQUIRED_FIELDS = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'address', 'currentStatus'];

export function missingProfileFields(u) {
  const details = publicProfile(u);
  return REQUIRED_FIELDS.filter((f) => !details[f]);
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
    const loginMobile = req.user.mobile || u.mobile || null;
    const details = publicProfile(u);

    res.json({
      username: u.username,
      name: u.name || u.username,
      mobile: u.mobile || null,
      // The number the family logs in with (this member's own, or the one they're using now)
      loginMobile,
      familyGroup: group ? group.groupName : null,
      isActive: u.isActive !== false,
      ...details,
      // Locked for students (admin sets it); defaults to their login number
      whatsappNumber: details.whatsappNumber || u.mobile || loginMobile || '',
      missingFields: missingProfileFields(u),
    });
  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

// PUT /student/profile  { username?, firstName, lastName, email, dateOfBirth, gender, address,
//                          currentStatus, studyDetails, otherActivities, dharmicAbhyas, skills }
export const updateStudentOwnProfile = async (req, res) => {
  try {
    const found = await resolveTarget(req, res);
    if (!found) return;
    const { users, u } = found;
    const body = req.body || {};
    const clean = (v, max) => String(v ?? '').trim().slice(0, max);

    const profile = {
      firstName: clean(body.firstName, 40),
      lastName: clean(body.lastName, 40),
      email: clean(body.email, 80).toLowerCase(),
      dateOfBirth: clean(body.dateOfBirth, 10),
      gender: GENDERS.includes(body.gender) ? body.gender : '',
      whatsappNumber: '',
      address: clean(body.address, 300),
      currentStatus: STATUSES.includes(body.currentStatus) ? body.currentStatus : '',
      studyDetails: clean(body.studyDetails, 200),
      otherActivities: clean(body.otherActivities, 300),
      dharmicAbhyas: clean(body.dharmicAbhyas, 500),
      skills: clean(body.skills, 300),
    };

    if (profile.firstName.length < 1) return res.status(400).json({ error: 'First name is required' });

    if (profile.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }
    if (profile.dateOfBirth) {
      const d = new Date(`${profile.dateOfBirth}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(profile.dateOfBirth) || Number.isNaN(d.getTime()) || d > new Date() || d.getUTCFullYear() < 1920) {
        return res.status(400).json({ error: 'Enter a valid date of birth' });
      }
    }
    // The WhatsApp number is locked for students: keep what's stored (or their login number).
    // Only the admin can change it (Users → Edit).
    profile.whatsappNumber = u.profile?.whatsappNumber || u.mobile || req.user.mobile || '';

    // Keep the display name the pathshala uses (e.g. "Ritaben") unless the student actually
    // changed their first or last name here
    const before = publicProfile(u);
    const nameEdited = before.firstName !== profile.firstName || before.lastName !== profile.lastName;
    const name = nameEdited ? `${profile.firstName} ${profile.lastName}`.trim() : (u.name || u.username);
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
