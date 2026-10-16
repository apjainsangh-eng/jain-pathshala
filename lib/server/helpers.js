import { getCollection } from './db';

function formatTime(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true, 
      timeZone: 'Asia/Kolkata' 
    });
  } catch (e) {
    return '';
  }
}

function formatDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  } catch (e) {
    return '';
  }
}

// The pathshala runs on Indian time; the server (Vercel) runs on UTC.
// Using UTC dates meant entries made between 00:00 and 05:30 IST landed on the previous day.
function todayIST() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

// Case-insensitive exact match for a user-supplied string (escaped so it can't act as a pattern)
function exactCI(value) {
  const escaped = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^' + escaped + '$', 'i');
}

function getCurrentMonthRange() {
  const [year, month] = todayIST().split('-').map(Number);
  const pm = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();

  return {
    start: `${year}-${pm}-01`,
    end: `${year}-${pm}-${String(lastDay).padStart(2, '0')}`
  };
}

// Students who currently attend. Inactive students (isActive: false) keep all their data
// but are left out of lists, counts, family switching and login until reactivated.
const ACTIVE_STUDENTS = { role: 'student', isActive: { $ne: false } };

// A student's family: everyone sharing their mobile number, plus their admin-made family group.
// Returns { groupName, members: [{ username, name }] } (always includes the student).
async function getFamily(username) {
  const users = await getCollection('users');
  const groups = await getCollection('family_groups');

  const me = await users.findOne({ username });
  const siblings = me?.mobile ? await users.find({ mobile: me.mobile }).toArray() : (me ? [me] : []);
  const group = groups ? await groups.findOne({ members: username }) : null;

  const usernames = [...new Set([username, ...siblings.map((s) => s.username), ...(group?.members || [])])];
  // Inactive students are included (they can log in and see their history) but flagged;
  // adding attendance or gatha for them is blocked in the API route
  const docs = await users.find({ username: { $in: usernames } }).toArray();
  const names = Object.fromEntries(docs.map((d) => [d.username, d.name || d.username]));
  const active = Object.fromEntries(docs.map((d) => [d.username, d.isActive !== false]));

  return {
    groupName: group?.groupName || null,
    members: usernames.filter((u) => names[u]).map((u) => ({ username: u, name: names[u], isActive: active[u] })),
  };
}

async function canActAs(currentUsername, targetUsername) {
  try {
    const family = await getFamily(currentUsername);
    return family.members.some((m) => m.username === targetUsername);
  } catch (e) {
    return false;
  }
}

function calculateStreaks(dates) {
  if (!dates || dates.length === 0) return { current: 0, max: 0 };
  
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b) - new Date(a));
  
  if (uniqueDates.length === 0) return { current: 0, max: 0 };
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 1;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mostRecentDate = new Date(uniqueDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  const daysSinceLastAttendance = Math.floor((today - mostRecentDate) / (1000 * 60 * 60 * 24));
  
  if (daysSinceLastAttendance > 1) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        d1.setHours(0, 0, 0, 0);
        const d2 = new Date(uniqueDates[i+1]);
        d2.setHours(0, 0, 0, 0);
        
        const diff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
            currentStreak++;
            tempStreak++;
        } else if (diff === 0) {
            continue;
        } else {
            break;
        }
    }
  }

  tempStreak = 1;
  maxStreak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i]);
      d1.setHours(0, 0, 0, 0);
      const d2 = new Date(uniqueDates[i+1]);
      d2.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
          tempStreak++;
          maxStreak = Math.max(maxStreak, tempStreak);
      } else if (diff === 0) {
          continue;
      } else {
          tempStreak = 1;
      }
  }

  return { current: currentStreak, max: Math.max(maxStreak, currentStreak) };
}

export {
  formatTime,
  formatDate,
  getCurrentMonthRange,
  canActAs,
  getFamily,
  ACTIVE_STUDENTS,
  calculateStreaks,
  todayIST,
  exactCI
};