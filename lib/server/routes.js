import * as auth from './controllers/authController';
import * as student from './controllers/studentController';
import * as attendance from './controllers/attendanceController';
import * as gatha from './controllers/gathaController';
import * as stats from './controllers/statsController';
import * as admin from './controllers/adminController';
import * as profile from './controllers/studentProfileController';
import * as bulk from './controllers/bulkController';
import * as misc from './controllers/miscController';
import * as history from './controllers/historyController';
import * as activityTypes from './controllers/activityTypeController';
import * as exportReport from './controllers/exportController';
import * as superAdmin from './controllers/superAdminController';
import * as adminAccount from './controllers/adminAccountController';
import * as trends from './controllers/trendsController';
import * as telegram from './controllers/telegramController';
import * as studentProfile from './controllers/profileController';
import { getGlobalCollection } from './db';

const health = async (req, res) => {
  const db = await getGlobalCollection('pathshalas');
  res.json({ status: 'ok', database: db ? 'ok' : 'disconnected' });
};

// [method, path (relative to /api), handler, access]
// access: 'user' (default) - logged-in student/admin, data scoped to their pathshala
//         'superadmin' - super admin token, no pathshala scope
//         'public' - no token, no pathshala scope
// Order matters only where a literal segment and a :param could both match (e.g. /gatha/pending/:id before /gatha/:id).
const table = [
  ['GET', '/health', health, 'public'],

  // Super admin
  ['POST', '/superadmin/login', superAdmin.login, 'public'],
  ['GET', '/superadmin/pathshalas', superAdmin.listPathshalas, 'superadmin'],
  ['POST', '/superadmin/pathshalas', superAdmin.createPathshala, 'superadmin'],
  ['PUT', '/superadmin/pathshalas/:id', superAdmin.updatePathshala, 'superadmin'],
  ['GET', '/superadmin/pathshalas/:id/admins', superAdmin.listAdmins, 'superadmin'],
  ['POST', '/superadmin/pathshalas/:id/admins', superAdmin.createAdmin, 'superadmin'],
  ['POST', '/superadmin/pathshalas/:id/open-as-admin', superAdmin.openAsAdmin, 'superadmin'],
  ['PUT', '/superadmin/admins/:adminId', superAdmin.updateAdmin, 'superadmin'],
  ['DELETE', '/superadmin/pathshalas/:id/admins/:adminId', superAdmin.removeAdmin, 'superadmin'],

  // Auth
  ['POST', '/login', auth.login, 'public'],  // mobile number + password; the number decides the pathshala
  ['GET', '/admin/my-pathshalas', adminAccount.getMyPathshalas],
  ['POST', '/admin/switch-pathshala', adminAccount.switchPathshala],

  // Student / family
  ['GET', '/student/pending', student.getPendingStatus],
  ['GET', '/student/status', student.getStatus],
  ['GET', '/student/profile', studentProfile.getStudentOwnProfile],
  ['PUT', '/student/profile', studentProfile.updateStudentOwnProfile],
  ['GET', '/family-members', student.getFamilyMembers],
  ['GET', '/family-member/:username/data', student.getFamilyMemberData],
  ['GET', '/family-member/:username/stats', student.getFamilyMemberStats],

  // Attendance
  ['GET', '/attendance', attendance.getAttendance],
  ['POST', '/attendance/mark', attendance.markAttendance],
  ['POST', '/attendance/mark-for', attendance.markAttendanceFor],
  ['POST', '/attendance/unmark', attendance.unmarkAttendance],
  ['DELETE', '/attendance/pending/:id', attendance.deletePendingAttendance],

  // Gatha
  ['GET', '/gatha', gatha.getGatha],
  ['POST', '/gatha', gatha.addGatha],
  ['POST', '/gatha/for', gatha.addGathaFor],
  ['POST', '/gatha-for', gatha.addGathaFor],
  ['PUT', '/gatha/pending/:id', gatha.editPendingGatha],
  ['DELETE', '/gatha/pending/:id', gatha.deletePendingGatha],
  ['PUT', '/gatha/:id', gatha.editGatha],
  ['DELETE', '/gatha/:id', gatha.deleteGatha],

  // Stats, leaderboards, history
  ['GET', '/stats/yearly', stats.getYearlyStats],
  ['GET', '/stats/comprehensive', stats.getComprehensiveStats],
  ['GET', '/leaderboard', misc.getLeaderboard],
  ['GET', '/leaderboard/kids', misc.getKidsLeaderboard],
  ['GET', '/analytics/leaderboard', misc.getAnalyticsLeaderboard],
  ['GET', '/history/:year/:month', history.getHistoryMonth],
  ['GET', '/history-range', history.getHistoryRange],

  // Achievements, profile
  ['GET', '/achievements', misc.getAchievements],
  ['POST', '/achievements/unlock', misc.unlockAchievement],
  ['GET', '/profile', misc.getProfile],
  ['PUT', '/profile', misc.updateProfile],
  ['POST', '/change-password', misc.changePassword],

  // Activity types (writes are admin-only inside the controller)
  ['GET', '/activity-types', activityTypes.getActivityTypes],
  ['POST', '/activity-types', activityTypes.createActivityType],
  ['PUT', '/activity-types/:id', activityTypes.updateActivityType],
  ['DELETE', '/activity-types/:id', activityTypes.deleteActivityType],

  // Admin: stats & pending
  ['GET', '/admin/stats', admin.getStats],
  ['GET', '/admin/pending', admin.getPending],
  ['POST', '/admin/gatha/add', admin.addGathaForStudent],
  ['POST', '/admin/attendance/add', admin.addAttendanceForStudent],
  ['POST', '/admin/attendance/approve/:id', admin.approveAttendance],
  ['POST', '/admin/attendance/reject/:id', admin.rejectAttendance],
  ['POST', '/admin/gatha/approve/:id', admin.approveGatha],
  ['POST', '/admin/gatha/reject/:id', admin.rejectGatha],
  ['POST', '/admin/approve-all', admin.approveAll],

  // Admin: students
  ['GET', '/admin/students', admin.getStudents],
  ['GET', '/admin/top-students', admin.getTopStudents],
  ['GET', '/admin/export-report', admin.exportReport],
  ['GET', '/admin/export/report', exportReport.getReport],
  ['GET', '/admin/student/:username/profile', profile.getStudentProfile],
  ['GET', '/admin/student/:username/notes', profile.getStudentNotes],
  ['POST', '/admin/student/:username/notes', profile.addStudentNote],

  // Admin: bulk, register, analytics
  ['POST', '/admin/bulk/attendance', bulk.bulkAttendance],
  ['POST', '/admin/bulk/gatha', bulk.bulkGatha],
  ['POST', '/admin/bulk/approve', bulk.bulkApprove],
  ['POST', '/admin/bulk/reject', bulk.bulkReject],
  ['GET', '/admin/attendance-register', bulk.getAttendanceRegister],
  ['GET', '/admin/dashboard-analytics', bulk.getDashboardAnalytics],
  ['GET', '/admin/trends', trends.getTrends],
  ['GET', '/admin/telegram', telegram.getTelegramSettings],
  ['POST', '/admin/telegram/link', telegram.createTelegramLink],
  ['DELETE', '/admin/telegram/chats/:chatId', telegram.removeTelegramChat],
  ['PUT', '/admin/telegram/settings', telegram.updateTelegramSettings],
  ['POST', '/admin/telegram/test-summary', telegram.sendTestSummary],
  ['GET', '/admin/group/:groupId/analytics', bulk.getGroupAnalytics],
  ['GET', '/admin/audit-log', bulk.getAuditLog],

  // Admin: users & family groups
  ['GET', '/admin/users', admin.getUsers],
  ['POST', '/admin/users', admin.createUser],
  ['PUT', '/admin/users/:id', admin.updateUser],
  ['DELETE', '/admin/users/:id', admin.deleteUser],
  ['GET', '/admin/family-groups', admin.getFamilyGroups],
  ['POST', '/admin/family-groups', admin.createFamilyGroup],
  ['PUT', '/admin/family-groups/:id', admin.updateFamilyGroup],
  ['DELETE', '/admin/family-groups/:id', admin.deleteFamilyGroup],
];

// Student actions that add or change attendance/gatha: refused while the student is inactive
const INACTIVE_BLOCKED = new Set([
  'POST /attendance/mark', 'POST /attendance/mark-for',
  'POST /gatha', 'POST /gatha/for', 'POST /gatha-for',
  'PUT /gatha/pending/:id', 'PUT /gatha/:id',
]);

const routes = table.map(([method, path, handler, access = 'user']) => {
  if (typeof handler !== 'function') throw new Error(`No handler for ${method} ${path}`);
  return { method, segments: path.split('/').filter(Boolean), handler, access, blockInactive: INACTIVE_BLOCKED.has(`${method} ${path}`) };
});

export function matchRoute(method, segments) {
  for (const route of routes) {
    if (route.method !== method || route.segments.length !== segments.length) continue;
    const params = {};
    const ok = route.segments.every((seg, i) => {
      if (seg.startsWith(':')) {
        params[seg.slice(1)] = decodeURIComponent(segments[i]);
        return true;
      }
      return seg === segments[i];
    });
    if (ok) return { route, params };
  }
  return null;
}
