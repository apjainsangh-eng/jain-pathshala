import React, { useState, useMemo } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Crown,
  Flame,
  Lock,
  Medal,
  Rocket,
  Star,
  Trophy,
  Zap,
  HelpCircle,
  Info,
  BookMarked,
} from 'lucide-react';

// ============================================
// CONFIGURATION
// ============================================

// Default working days per month (excluding Sundays)
// Admin can change this from settings
export const DEFAULT_WORKING_DAYS = 25;

// ============================================
// MONTHLY ACHIEVEMENTS
// All achievements reset each month
// ============================================

export const MONTHLY_ACHIEVEMENTS = [
  // ===== Attendance Achievements =====
  {
    id: 'attendance_1',
    title: 'First Step',
    subtitle: '1 Day Present',
    description: 'Mark your attendance for 1 day this month',
    icon: Star,
    requirement: { type: 'monthly_attendance', count: 1 },
    color: 'bronze',
    xp: 5,
  },
  {
    id: 'attendance_4',
    title: 'Week Regular',
    subtitle: '4 Days Present',
    description: 'Attend 4 days this month (1 week)',
    icon: Calendar,
    requirement: { type: 'monthly_attendance', count: 4 },
    color: 'bronze',
    xp: 15,
  },
  {
    id: 'attendance_10',
    title: 'Dedicated Student',
    subtitle: '10 Days Present',
    description: 'Attend 10 days this month',
    icon: Medal,
    requirement: { type: 'monthly_attendance', count: 10 },
    color: 'silver',
    xp: 30,
  },
  {
    id: 'attendance_20',
    title: 'Star Student',
    subtitle: '20 Days Present',
    description: 'Attend 20 days this month',
    icon: Trophy,
    requirement: { type: 'monthly_attendance', count: 20 },
    color: 'gold',
    xp: 75,
  },
  {
    id: 'attendance_full',
    title: 'Perfect Month!',
    subtitle: 'All 25 Days Present',
    description: 'Attend all working days this month (25 days)',
    icon: Crown,
    requirement: { type: 'monthly_attendance', count: 'full' },
    color: 'diamond',
    xp: 150,
  },

  // ===== Gatha Achievements (New Gathas Only) =====
  {
    id: 'gatha_5',
    title: 'Gatha Starter',
    subtitle: '5 New Gathas',
    description: 'Learn 5 new gathas this month',
    icon: BookOpen,
    requirement: { type: 'monthly_gatha', count: 5 },
    color: 'bronze',
    xp: 10,
  },
  {
    id: 'gatha_15',
    title: 'Gatha Learner',
    subtitle: '15 New Gathas',
    description: 'Learn 15 new gathas this month',
    icon: BookMarked,
    requirement: { type: 'monthly_gatha', count: 15 },
    color: 'silver',
    xp: 35,
  },
  {
    id: 'gatha_30',
    title: 'Gatha Expert',
    subtitle: '30 New Gathas',
    description: 'Learn 30 new gathas this month',
    icon: Award,
    requirement: { type: 'monthly_gatha', count: 30 },
    color: 'gold',
    xp: 80,
  },
  {
    id: 'gatha_50',
    title: 'Gatha Master',
    subtitle: '50 New Gathas',
    description: 'Learn 50 new gathas this month',
    icon: Crown,
    requirement: { type: 'monthly_gatha', count: 50 },
    color: 'diamond',
    xp: 150,
  },

  // ===== Streak Achievements =====
  {
    id: 'streak_3',
    title: 'Getting Started',
    subtitle: '3 Days Streak',
    description: 'Attend 3 days in a row',
    icon: Zap,
    requirement: { type: 'streak', count: 3 },
    color: 'bronze',
    xp: 20,
  },
  {
    id: 'streak_7',
    title: 'On Fire!',
    subtitle: '7 Days Streak',
    description: 'Attend 7 days in a row',
    icon: Flame,
    requirement: { type: 'streak', count: 7 },
    color: 'silver',
    xp: 50,
  },
  {
    id: 'streak_14',
    title: 'Unstoppable',
    subtitle: '14 Days Streak',
    description: 'Attend 14 days in a row',
    icon: Rocket,
    requirement: { type: 'streak', count: 14 },
    color: 'gold',
    xp: 100,
  },
];

// ============================================
// COLOR SCHEMES
// ============================================

export const ACHIEVEMENT_COLORS = {
  bronze: {
    bg: 'from-orange-300 to-orange-500',
    border: 'border-orange-300',
    text: 'text-orange-700',
    light: 'bg-orange-50',
    badge: 'bg-orange-100 text-orange-700',
    icon: '🥉',
  },
  silver: {
    bg: 'from-gray-300 to-gray-500',
    border: 'border-gray-400',
    text: 'text-gray-700',
    light: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
    icon: '🥈',
  },
  gold: {
    bg: 'from-yellow-300 to-yellow-500',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
    light: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
    icon: '🥇',
  },
  diamond: {
    bg: 'from-cyan-300 to-blue-500',
    border: 'border-cyan-400',
    text: 'text-cyan-700',
    light: 'bg-cyan-50',
    badge: 'bg-cyan-100 text-cyan-700',
    icon: '💎',
  },
};

// ============================================
// XP SYSTEM - How students earn XP
// ============================================

export const XP_VALUES = {
  attendance: 10,      // 10 XP per day present
  new_gatha: 2,        // 2 XP per new gatha learned
  revision_gatha: 0,   // No XP for revision (only new learning counts)
};

// Level definitions - students progress through these
export const LEVELS = [
  { level: 1, name: 'Beginner', minXP: 0, icon: '🌱' },
  { level: 2, name: 'Learner', minXP: 50, icon: '📚' },
  { level: 3, name: 'Student', minXP: 150, icon: '✨' },
  { level: 4, name: 'Scholar', minXP: 300, icon: '⭐' },
  { level: 5, name: 'Expert', minXP: 500, icon: '🏆' },
  { level: 6, name: 'Master', minXP: 800, icon: '👑' },
  { level: 7, name: 'Guru', minXP: 1200, icon: '🔱' },
  { level: 8, name: 'Legend', minXP: 2000, icon: '💎' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate achievement progress based on monthly stats
 */
export const calculateAchievementProgress = (achievement, stats = {}) => {
  const {
    monthlyAttendance = 0,
    monthlyNewGathas = 0,
    currentStreak = 0,
    maxStreak = 0,
    workingDays = DEFAULT_WORKING_DAYS,
  } = stats;

  let unlocked = false;
  let progress = 0;
  let current = 0;
  let target = 0;

  switch (achievement.requirement.type) {
    case 'monthly_attendance':
      if (achievement.requirement.count === 'full') {
        target = workingDays;
        current = monthlyAttendance;
        progress = Math.min(current / target, 1);
        unlocked = current >= target;
      } else {
        target = achievement.requirement.count;
        current = monthlyAttendance;
        progress = Math.min(current / target, 1);
        unlocked = current >= target;
      }
      break;

    case 'monthly_gatha':
      target = achievement.requirement.count;
      current = monthlyNewGathas;
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    case 'streak':
      target = achievement.requirement.count;
      current = Math.max(currentStreak, maxStreak);
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    default:
      break;
  }

  return { unlocked, progress, current, target };
};

/**
 * Calculate total XP from:
 * 1. Daily attendance (10 XP each)
 * 2. New gathas (2 XP each)
 * 3. Unlocked achievements (bonus XP)
 */
export const calculateTotalXP = (stats = {}, achievements = MONTHLY_ACHIEVEMENTS) => {
  const {
    monthlyAttendance = 0,
    monthlyNewGathas = 0,
  } = stats;

  // XP from attendance
  const attendanceXP = monthlyAttendance * XP_VALUES.attendance;

  // XP from new gathas only
  const gathaXP = monthlyNewGathas * XP_VALUES.new_gatha;

  // XP from achievements
  const achievementXP = achievements.reduce((total, ach) => {
    const { unlocked } = calculateAchievementProgress(ach, stats);
    return total + (unlocked ? ach.xp : 0);
  }, 0);

  return {
    attendance: attendanceXP,
    gatha: gathaXP,
    achievements: achievementXP,
    total: attendanceXP + gathaXP + achievementXP,
  };
};

/**
 * Get user level based on total XP
 */
export const getUserLevel = (xp) => {
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || null;
      break;
    }
  }

  const xpInCurrentLevel = xp - currentLevel.minXP;
  const xpToNextLevel = nextLevel ? nextLevel.minXP - currentLevel.minXP : 0;
  const progressToNext = nextLevel ? xpInCurrentLevel / xpToNextLevel : 1;

  return {
    ...currentLevel,
    nextLevel,
    xpInCurrentLevel,
    xpToNextLevel,
    progressToNext,
    totalXP: xp,
  };
};

/**
 * Get list of months for dropdown (last 12 months)
 */
const getMonthsList = () => {
  const months = [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Show last 12 months
  for (let i = 0; i < 12; i++) {
    let month = currentMonth - i;
    let year = currentYear;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const date = new Date(year, month - 1, 1);
    const label = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    months.push({
      value: `${year}-${String(month).padStart(2, '0')}`,
      label,
      month,
      year,
      isCurrent: i === 0,
    });
  }

  return months;
};

// ============================================
// COMPONENTS
// ============================================

/**
 * Month Selector Dropdown
 */
const MonthSelector = ({ selectedMonth, onMonthChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const months = useMemo(() => getMonthsList(), []);

  const selectedMonthData = months.find((m) => m.value === selectedMonth) || months[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border-2 border-orange-200 rounded-xl px-4 py-3 font-bold text-gray-800 shadow-sm active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span>{selectedMonthData.label}</span>
          {selectedMonthData.isCurrent && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
              Current
            </span>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {months.map((month) => (
              <button
                key={month.value}
                onClick={() => {
                  onMonthChange(month.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-50 transition-colors ${
                  month.value === selectedMonth ? 'bg-orange-100' : ''
                }`}
              >
                <span className="font-medium text-gray-800">{month.label}</span>
                <div className="flex items-center gap-2">
                  {month.isCurrent && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                  {month.value === selectedMonth && (
                    <Check className="w-5 h-5 text-orange-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * XP Breakdown Card - Shows level and how XP is earned
 */
const XPBreakdownCard = ({ xpBreakdown, level }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
      {/* Level Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl">
            {level.icon}
          </div>
          <div>
            <p className="text-sm text-indigo-100">Level {level.level}</p>
            <p className="text-xl font-bold">{level.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{xpBreakdown.total}</p>
          <p className="text-xs text-indigo-200">Total XP</p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {level.nextLevel && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
            <span>{level.xpInCurrentLevel} XP earned</span>
            <span>{level.xpToNextLevel - level.xpInCurrentLevel} XP to {level.nextLevel.name}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${level.progressToNext * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* XP Breakdown */}
      <div className="bg-white/10 rounded-xl p-3">
        <p className="text-xs text-indigo-200 mb-2 font-bold">📊 This Month's XP Breakdown:</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-lg font-bold">{xpBreakdown.attendance}</p>
            <p className="text-xs opacity-80">Attendance</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-lg font-bold">{xpBreakdown.gatha}</p>
            <p className="text-xs opacity-80">New Gathas</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2">
            <p className="text-lg font-bold">{xpBreakdown.achievements}</p>
            <p className="text-xs opacity-80">Badges</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * How to Earn XP - Expandable Help Section
 */
const HowToEarnXP = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-blue-800">How to Earn XP? (Tap to see)</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-blue-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Attendance XP */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">Come to Pathshala</p>
                <p className="text-sm text-gray-600">Get <span className="font-bold text-green-600">+{XP_VALUES.attendance} XP</span> every day you are present</p>
              </div>
            </div>
          </div>

          {/* Gatha XP */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">Learn New Gathas</p>
                <p className="text-sm text-gray-600">Get <span className="font-bold text-purple-600">+{XP_VALUES.new_gatha} XP</span> for each new gatha you learn</p>
              </div>
            </div>
          </div>

          {/* Badge XP */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">Unlock Badges</p>
                <p className="text-sm text-gray-600">Get <span className="font-bold text-yellow-600">+5 to +150 XP</span> bonus for each badge!</p>
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              💡 <strong>Note:</strong> Revision (पुनरावर्तन) doesn't give XP, but it helps you remember gathas better!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Monthly Stats Summary - Shows current progress
 */
const MonthlyStatsSummary = ({ stats, workingDays }) => {
  const {
    monthlyAttendance = 0,
    monthlyNewGathas = 0,
    currentStreak = 0,
  } = stats;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
        <Calendar className="w-6 h-6 text-green-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-green-700">{monthlyAttendance}</p>
        <p className="text-xs text-gray-500">of {workingDays} days</p>
        <p className="text-xs text-green-600 font-medium">Present</p>
      </div>
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
        <BookOpen className="w-6 h-6 text-purple-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-purple-700">{monthlyNewGathas}</p>
        <p className="text-xs text-gray-500">this month</p>
        <p className="text-xs text-purple-600 font-medium">New Gathas</p>
      </div>
      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-3 text-center">
        <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
        <p className="text-2xl font-bold text-orange-700">{currentStreak}</p>
        <p className="text-xs text-gray-500">days in row</p>
        <p className="text-xs text-orange-600 font-medium">Streak</p>
      </div>
    </div>
  );
};

/**
 * Single Achievement Card
 */
const AchievementCard = ({ achievement, stats, onClick }) => {
  const { unlocked, progress, current, target } = calculateAchievementProgress(achievement, stats);
  const Icon = achievement.icon;
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;

  return (
    <button
      onClick={() => onClick?.(achievement)}
      className={`
        relative rounded-xl border-2 transition-all active:scale-[0.97] w-full p-3
        ${unlocked
          ? `${colors.border} bg-gradient-to-br from-white to-gray-50 shadow-md`
          : 'border-gray-200 bg-gray-50'
        }
      `}
    >
      {/* Badge Icon (Bronze/Silver/Gold/Diamond) */}
      <div className="absolute -top-2 -left-2 text-lg">
        {colors.icon}
      </div>

      {/* Main Icon */}
      <div
        className={`
          w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center
          ${unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'}
        `}
      >
        <Icon className={`w-6 h-6 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
      </div>

      {/* Title */}
      <p className={`text-xs font-bold text-center ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {achievement.title}
      </p>
      
      {/* Subtitle - Clear meaning */}
      <p className={`text-xs text-center mt-0.5 ${unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
        ({achievement.subtitle})
      </p>

      {/* XP Badge */}
      <div className="mt-2 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${unlocked ? colors.badge : 'bg-gray-100 text-gray-500'}`}>
          +{achievement.xp} XP
        </span>
      </div>

      {/* Progress Bar (when not unlocked but has some progress) */}
      {!unlocked && progress > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-500`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">{current}/{target}</p>
        </div>
      )}

      {/* Locked Icon (when no progress) */}
      {!unlocked && progress === 0 && (
        <div className="absolute top-1 right-1">
          <Lock className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Unlocked Checkmark */}
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

/**
 * Achievement Section with Header
 */
const AchievementSection = ({ title, icon: Icon, color, achievements, stats, onAchievementClick }) => {
  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => calculateAchievementProgress(a, stats).unlocked).length;
  }, [achievements, stats]);

  return (
    <div className={`bg-white rounded-2xl border-2 ${color} shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>

      {/* Achievements Grid */}
      <div className="p-4 pt-2">
        <div className="grid grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              stats={stats}
              onClick={onAchievementClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Achievement Detail Modal - Shows when you tap on a badge
 */
export const AchievementDetailModal = ({ achievement, stats, onClose }) => {
  if (!achievement) return null;

  const { unlocked, progress, current, target } = calculateAchievementProgress(achievement, stats);
  const Icon = achievement.icon;
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge Type */}
        <div className="text-4xl mb-2">{colors.icon}</div>

        {/* Icon */}
        <div
          className={`
            w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center
            ${unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'}
            ${unlocked ? 'animate-pulse' : ''}
          `}
        >
          <Icon className={`w-10 h-10 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-gray-800 mb-1">{achievement.title}</h3>
        <p className="text-lg text-gray-600 mb-2">({achievement.subtitle})</p>
        <p className="text-gray-500 mb-4 text-sm">{achievement.description}</p>

        {/* XP Reward */}
        <div className="mb-4">
          <span className={`text-lg font-bold px-4 py-2 rounded-full ${colors.badge}`}>
            +{achievement.xp} XP
          </span>
        </div>

        {/* Status */}
        {unlocked ? (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5" />
            Badge Unlocked! 🎉
          </div>
        ) : (
          <div className="mb-4">
            {/* Progress Bar */}
            <div className="bg-gray-100 rounded-full h-4 mb-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-500`}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold">{current}</span> / {target}
              <span className="text-gray-400 ml-2">({Math.round(progress * 100)}% done)</span>
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`
            w-full py-3 font-bold rounded-xl text-white
            ${unlocked ? `bg-gradient-to-r ${colors.bg}` : 'bg-gray-400'}
          `}
        >
          {unlocked ? 'Great Job! 👏' : 'Keep Going! 💪'}
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT - StudentAchievementPage
// ============================================

export default function StudentAchievementPage({ 
  stats = {}, 
  onMonthChange,
  workingDays = DEFAULT_WORKING_DAYS 
}) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  
  // Get current month as default
  const now = new Date();
  const currentMonthValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);

  // Handle month change
  const handleMonthChange = (monthValue) => {
    setSelectedMonth(monthValue);
    if (onMonthChange) {
      const [year, month] = monthValue.split('-');
      onMonthChange(parseInt(year), parseInt(month));
    }
  };

  // Stats with working days
  const statsWithWorkingDays = useMemo(() => ({
    ...stats,
    workingDays,
  }), [stats, workingDays]);

  // Calculate XP breakdown
  const xpBreakdown = useMemo(
    () => calculateTotalXP(statsWithWorkingDays, MONTHLY_ACHIEVEMENTS),
    [statsWithWorkingDays]
  );

  // Get user level
  const level = useMemo(() => getUserLevel(xpBreakdown.total), [xpBreakdown.total]);

  // Categorize achievements by type
  const attendanceAchievements = MONTHLY_ACHIEVEMENTS.filter(
    (a) => a.requirement.type === 'monthly_attendance'
  );
  const gathaAchievements = MONTHLY_ACHIEVEMENTS.filter(
    (a) => a.requirement.type === 'monthly_gatha'
  );
  const streakAchievements = MONTHLY_ACHIEVEMENTS.filter(
    (a) => a.requirement.type === 'streak'
  );

  // Count total unlocked
  const totalUnlocked = useMemo(() => {
    return MONTHLY_ACHIEVEMENTS.filter(
      (a) => calculateAchievementProgress(a, statsWithWorkingDays).unlocked
    ).length;
  }, [statsWithWorkingDays]);

  return (
    <div className="space-y-4 pb-6">
      {/* Month Selector Dropdown */}
      <MonthSelector
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
      />

      {/* Monthly Stats Summary */}
      <MonthlyStatsSummary stats={stats} workingDays={workingDays} />

      {/* XP & Level Display */}
      <XPBreakdownCard xpBreakdown={xpBreakdown} level={level} />

      {/* How to Earn XP - Expandable Help */}
      <HowToEarnXP />

      {/* Attendance Badges */}
      <AchievementSection
        title="📅 Attendance Badges"
        icon={Calendar}
        color="border-green-200"
        achievements={attendanceAchievements}
        stats={statsWithWorkingDays}
        onAchievementClick={setSelectedAchievement}
      />

      {/* Gatha Badges */}
      <AchievementSection
        title="📚 Gatha Badges (New Only)"
        icon={BookOpen}
        color="border-purple-200"
        achievements={gathaAchievements}
        stats={statsWithWorkingDays}
        onAchievementClick={setSelectedAchievement}
      />

      {/* Streak Badges */}
      <AchievementSection
        title="🔥 Streak Badges"
        icon={Flame}
        color="border-orange-200"
        achievements={streakAchievements}
        stats={statsWithWorkingDays}
        onAchievementClick={setSelectedAchievement}
      />

      {/* Overall Progress Bar */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-orange-800 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Monthly Progress
          </h4>
          <span className="text-sm font-bold text-orange-700">
            {totalUnlocked}/{MONTHLY_ACHIEVEMENTS.length} Badges
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalUnlocked / MONTHLY_ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-orange-700 mt-2 text-center">
          {Math.round((totalUnlocked / MONTHLY_ACHIEVEMENTS.length) * 100)}% Complete - Keep going! 🚀
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-800">📅 Monthly Badges</p>
            <p className="text-xs text-blue-600 mt-1">
              These badges reset every month. Try to unlock all {MONTHLY_ACHIEVEMENTS.length} badges before the month ends!
            </p>
            <p className="text-xs text-blue-500 mt-1">
              You can view previous months using the dropdown above.
            </p>
          </div>
        </div>
      </div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        stats={statsWithWorkingDays}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}
