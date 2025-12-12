import React, { useState, useMemo, useEffect } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Gift,
  Heart,
  Lock,
  Medal,
  Rocket,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
  X as CloseIcon,
  TrendingUp,
  BookMarked,
  CalendarDays,
  Sun,
  Moon,
  PartyPopper,
  Gem,
  RefreshCw,
} from 'lucide-react';

// ============================================
// ACHIEVEMENT DEFINITIONS
// ============================================

// 🏆 Lifetime Achievements - Never Reset
export const LIFETIME_ACHIEVEMENTS = [
  // Attendance Milestones
  {
    id: 'first_step',
    title: 'First Step',
    description: 'Mark your first attendance',
    icon: Star,
    requirement: { type: 'attendance', count: 1 },
    color: 'bronze',
    category: 'lifetime',
    xp: 10,
  },
  {
    id: 'week_warrior',
    title: 'Week Warrior',
    description: 'Attend 7 days total',
    icon: Shield,
    requirement: { type: 'attendance', count: 7 },
    color: 'bronze',
    category: 'lifetime',
    xp: 25,
  },
  {
    id: 'dedicated_learner',
    title: 'Dedicated Learner',
    description: 'Attend 30 days total',
    icon: Medal,
    requirement: { type: 'attendance', count: 30 },
    color: 'silver',
    category: 'lifetime',
    xp: 50,
  },
  {
    id: 'pathshala_regular',
    title: 'Pathshala Regular',
    description: 'Attend 100 days total',
    icon: Trophy,
    requirement: { type: 'attendance', count: 100 },
    color: 'gold',
    category: 'lifetime',
    xp: 100,
  },
  {
    id: 'attendance_legend',
    title: 'Attendance Legend',
    description: 'Attend 365 days total',
    icon: Crown,
    requirement: { type: 'attendance', count: 365 },
    color: 'diamond',
    category: 'lifetime',
    xp: 500,
  },

  // Gatha Milestones
  {
    id: 'gatha_beginner',
    title: 'Gatha Beginner',
    description: 'Learn 5 gathas',
    icon: BookOpen,
    requirement: { type: 'gatha', count: 5 },
    color: 'bronze',
    category: 'lifetime',
    xp: 15,
  },
  {
    id: 'gatha_learner',
    title: 'Gatha Learner',
    description: 'Learn 25 gathas',
    icon: BookMarked,
    requirement: { type: 'gatha', count: 25 },
    color: 'silver',
    category: 'lifetime',
    xp: 40,
  },
  {
    id: 'gatha_scholar',
    title: 'Gatha Scholar',
    description: 'Learn 50 gathas',
    icon: Award,
    requirement: { type: 'gatha', count: 50 },
    color: 'silver',
    category: 'lifetime',
    xp: 75,
  },
  {
    id: 'gatha_master',
    title: 'Gatha Master',
    description: 'Learn 100 gathas',
    icon: Trophy,
    requirement: { type: 'gatha', count: 100 },
    color: 'gold',
    category: 'lifetime',
    xp: 150,
  },
  {
    id: 'gatha_guru',
    title: 'Gatha Guru',
    description: 'Learn 500 gathas',
    icon: Crown,
    requirement: { type: 'gatha', count: 500 },
    color: 'diamond',
    category: 'lifetime',
    xp: 500,
  },

  // Streak Achievements
  {
    id: 'streak_starter',
    title: 'Streak Starter',
    description: 'Achieve 3-day streak',
    icon: Zap,
    requirement: { type: 'streak', count: 3 },
    color: 'bronze',
    category: 'lifetime',
    xp: 20,
  },
  {
    id: 'on_fire',
    title: 'On Fire!',
    description: 'Achieve 7-day streak',
    icon: Flame,
    requirement: { type: 'streak', count: 7 },
    color: 'silver',
    category: 'lifetime',
    xp: 50,
  },
  {
    id: 'unstoppable',
    title: 'Unstoppable',
    description: 'Achieve 14-day streak',
    icon: Rocket,
    requirement: { type: 'streak', count: 14 },
    color: 'gold',
    category: 'lifetime',
    xp: 100,
  },
  {
    id: 'streak_legend',
    title: 'Streak Legend',
    description: 'Achieve 30-day streak',
    icon: Crown,
    requirement: { type: 'streak', count: 30 },
    color: 'diamond',
    category: 'lifetime',
    xp: 250,
  },

  // Combo Achievements
  {
    id: 'balanced_start',
    title: 'Balanced Start',
    description: '10+ attendance & 10+ gathas',
    icon: Target,
    requirement: { type: 'combo', attendance: 10, gatha: 10 },
    color: 'silver',
    category: 'lifetime',
    xp: 60,
  },
  {
    id: 'all_rounder',
    title: 'All Rounder',
    description: '50+ attendance & 50+ gathas',
    icon: Shield,
    requirement: { type: 'combo', attendance: 50, gatha: 50 },
    color: 'gold',
    category: 'lifetime',
    xp: 200,
  },
  {
    id: 'complete_devotee',
    title: 'Complete Devotee',
    description: '100+ attendance & 100+ gathas',
    icon: Gem,
    requirement: { type: 'combo', attendance: 100, gatha: 100 },
    color: 'diamond',
    category: 'lifetime',
    xp: 500,
  },
];

// 📅 Monthly Achievements - Reset Each Month
export const MONTHLY_ACHIEVEMENTS = [
  {
    id: 'monthly_starter',
    title: 'Monthly Starter',
    description: 'Attend 1 day this month',
    icon: Calendar,
    requirement: { type: 'monthly_attendance', count: 1 },
    color: 'bronze',
    category: 'monthly',
    xp: 5,
  },
  {
    id: 'weekly_regular',
    title: 'Weekly Regular',
    description: 'Attend 4 days this month',
    icon: CalendarDays,
    requirement: { type: 'monthly_attendance', count: 4 },
    color: 'bronze',
    category: 'monthly',
    xp: 15,
  },
  {
    id: 'monthly_dedicated',
    title: 'Monthly Dedicated',
    description: 'Attend 10 days this month',
    icon: Medal,
    requirement: { type: 'monthly_attendance', count: 10 },
    color: 'silver',
    category: 'monthly',
    xp: 30,
  },
  {
    id: 'monthly_champion',
    title: 'Monthly Champion',
    description: 'Attend 20 days this month',
    icon: Trophy,
    requirement: { type: 'monthly_attendance', count: 20 },
    color: 'gold',
    category: 'monthly',
    xp: 75,
  },
  {
    id: 'perfect_month',
    title: 'Perfect Month',
    description: 'Full attendance this month',
    icon: Crown,
    requirement: { type: 'monthly_attendance', count: 'full' },
    color: 'diamond',
    category: 'monthly',
    xp: 150,
  },
  {
    id: 'monthly_gatha_5',
    title: 'Gatha Explorer',
    description: 'Learn 5 gathas this month',
    icon: BookOpen,
    requirement: { type: 'monthly_gatha', count: 5 },
    color: 'bronze',
    category: 'monthly',
    xp: 10,
  },
  {
    id: 'monthly_gatha_15',
    title: 'Gatha Enthusiast',
    description: 'Learn 15 gathas this month',
    icon: BookMarked,
    requirement: { type: 'monthly_gatha', count: 15 },
    color: 'silver',
    category: 'monthly',
    xp: 35,
  },
  {
    id: 'monthly_gatha_30',
    title: 'Gatha Champion',
    description: 'Learn 30 gathas this month',
    icon: Award,
    requirement: { type: 'monthly_gatha', count: 30 },
    color: 'gold',
    category: 'monthly',
    xp: 80,
  },
];

// ⭐ Special Achievements - Events & Milestones
export const SPECIAL_ACHIEVEMENTS = [
  {
    id: 'early_bird',
    title: 'Early Bird',
    description: 'Mark attendance before 7 AM',
    icon: Sun,
    requirement: { type: 'special', condition: 'early_attendance' },
    color: 'special',
    category: 'special',
    xp: 25,
  },
  {
    id: 'night_owl',
    title: 'Night Learner',
    description: 'Add gatha after 8 PM',
    icon: Moon,
    requirement: { type: 'special', condition: 'night_gatha' },
    color: 'special',
    category: 'special',
    xp: 25,
  },
  {
    id: 'weekend_warrior',
    title: 'Weekend Warrior',
    description: 'Attend on both Saturday & Sunday',
    icon: Shield,
    requirement: { type: 'special', condition: 'weekend_attendance' },
    color: 'special',
    category: 'special',
    xp: 30,
  },
  {
    id: 'first_of_month',
    title: 'Fresh Start',
    description: 'Attend on 1st of the month',
    icon: Sparkles,
    requirement: { type: 'special', condition: 'first_day' },
    color: 'special',
    category: 'special',
    xp: 20,
  },
  {
    id: 'helping_hand',
    title: 'Helping Hand',
    description: 'Help a fellow student',
    icon: Heart,
    requirement: { type: 'special', condition: 'helped_other' },
    color: 'special',
    category: 'special',
    xp: 50,
    manual: true,
  },
  {
    id: 'community_star',
    title: 'Community Star',
    description: 'Recognized by teacher',
    icon: Star,
    requirement: { type: 'special', condition: 'teacher_recognition' },
    color: 'special',
    category: 'special',
    xp: 100,
    manual: true,
  },
  {
    id: 'paryushan_special',
    title: 'Paryushan Devotee',
    description: 'Full attendance during Paryushan',
    icon: PartyPopper,
    requirement: { type: 'special', condition: 'paryushan' },
    color: 'diamond',
    category: 'special',
    xp: 200,
    event: true,
  },
  {
    id: 'new_year_start',
    title: 'New Year Resolution',
    description: 'Attend on Bestu Varas',
    icon: Gift,
    requirement: { type: 'special', condition: 'new_year' },
    color: 'gold',
    category: 'special',
    xp: 50,
    event: true,
  },
];

// All achievements combined
export const ALL_ACHIEVEMENTS = [
  ...LIFETIME_ACHIEVEMENTS,
  ...MONTHLY_ACHIEVEMENTS,
  ...SPECIAL_ACHIEVEMENTS,
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
  },
  silver: {
    bg: 'from-gray-300 to-gray-500',
    border: 'border-gray-400',
    text: 'text-gray-700',
    light: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
  },
  gold: {
    bg: 'from-yellow-300 to-yellow-500',
    border: 'border-yellow-400',
    text: 'text-yellow-700',
    light: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  diamond: {
    bg: 'from-cyan-300 to-blue-500',
    border: 'border-cyan-400',
    text: 'text-cyan-700',
    light: 'bg-cyan-50',
    badge: 'bg-cyan-100 text-cyan-700',
  },
  special: {
    bg: 'from-purple-400 to-pink-500',
    border: 'border-purple-400',
    text: 'text-purple-700',
    light: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
  },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate achievement progress based on user stats
 */
export const calculateAchievementProgress = (
  achievement,
  stats = {}
) => {
  const {
    totalAttendance = 0,
    totalGathas = 0,
    currentStreak = 0,
    maxStreak = 0,
    monthlyAttendance = 0,
    monthlyGathas = 0,
    daysInCurrentMonth = 30,
    specialConditions = {},
  } = stats;

  let unlocked = false;
  let progress = 0;
  let current = 0;
  let target = 0;

  switch (achievement.requirement.type) {
    case 'attendance':
      target = achievement.requirement.count;
      current = totalAttendance;
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    case 'gatha':
      target = achievement.requirement.count;
      current = totalGathas;
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    case 'streak':
      target = achievement.requirement.count;
      current = Math.max(currentStreak, maxStreak);
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    case 'combo':
      const attTarget = achievement.requirement.attendance;
      const gathaTarget = achievement.requirement.gatha;
      const attProgress = Math.min(totalAttendance / attTarget, 1);
      const gathaProgress = Math.min(totalGathas / gathaTarget, 1);
      progress = Math.min(attProgress, gathaProgress);
      current = Math.min(totalAttendance, totalGathas);
      target = Math.max(attTarget, gathaTarget);
      unlocked = totalAttendance >= attTarget && totalGathas >= gathaTarget;
      break;

    case 'monthly_attendance':
      if (achievement.requirement.count === 'full') {
        target = daysInCurrentMonth;
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
      current = monthlyGathas;
      progress = Math.min(current / target, 1);
      unlocked = current >= target;
      break;

    case 'special':
      const condition = achievement.requirement.condition;
      unlocked = specialConditions[condition] === true;
      progress = unlocked ? 1 : 0;
      current = unlocked ? 1 : 0;
      target = 1;
      break;

    default:
      break;
  }

  return { unlocked, progress, current, target };
};

/**
 * Calculate total XP from unlocked achievements
 */
export const calculateTotalXP = (achievements, stats) => {
  return achievements.reduce((total, ach) => {
    const { unlocked } = calculateAchievementProgress(ach, stats);
    return total + (unlocked ? ach.xp : 0);
  }, 0);
};

/**
 * Get user level based on XP
 */
export const getUserLevel = (xp) => {
  const levels = [
    { level: 1, name: 'Beginner', minXP: 0, icon: '🌱' },
    { level: 2, name: 'Learner', minXP: 50, icon: '📚' },
    { level: 3, name: 'Student', minXP: 150, icon: '✨' },
    { level: 4, name: 'Scholar', minXP: 300, icon: '⭐' },
    { level: 5, name: 'Expert', minXP: 500, icon: '🏆' },
    { level: 6, name: 'Master', minXP: 800, icon: '👑' },
    { level: 7, name: 'Guru', minXP: 1200, icon: '🔱' },
    { level: 8, name: 'Legend', minXP: 2000, icon: '💎' },
  ];

  let currentLevel = levels[0];
  let nextLevel = levels[1];

  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].minXP) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
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

// ============================================
// COMPONENTS
// ============================================

/**
 * Single Achievement Card
 */
export const AchievementCard = ({
  achievement,
  stats,
  onClick,
  size = 'normal', // 'small', 'normal', 'large'
}) => {
  const { unlocked, progress } = calculateAchievementProgress(achievement, stats);
  const Icon = achievement.icon;
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;

  const sizeClasses = {
    small: 'p-2',
    normal: 'p-3',
    large: 'p-4',
  };

  const iconSizes = {
    small: 'w-8 h-8',
    normal: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  const iconInnerSizes = {
    small: 'w-4 h-4',
    normal: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <button
      onClick={() => onClick?.(achievement)}
      className={`
        relative rounded-xl border-2 transition-all active:scale-[0.97] w-full
        ${sizeClasses[size]}
        ${unlocked
          ? `${colors.border} bg-gradient-to-br from-white to-gray-50 shadow-md`
          : 'border-gray-200 bg-gray-50 opacity-70'
        }
      `}
    >
      {/* Icon */}
      <div
        className={`
          ${iconSizes[size]} rounded-full mx-auto mb-2 flex items-center justify-center
          ${unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'}
        `}
      >
        <Icon className={`${iconInnerSizes[size]} ${unlocked ? 'text-white' : 'text-gray-400'}`} />
      </div>

      {/* Title */}
      <p className={`text-xs font-bold text-center ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {achievement.title}
      </p>

      {/* XP Badge */}
      <div className={`mt-1 text-center`}>
        <span className={`text-xs px-2 py-0.5 rounded-full ${unlocked ? colors.badge : 'bg-gray-100 text-gray-500'}`}>
          +{achievement.xp} XP
        </span>
      </div>

      {/* Progress Bar (when not unlocked) */}
      {!unlocked && progress > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-500`}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Locked Icon */}
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

      {/* Category Badge */}
      {achievement.category === 'special' && (
        <div className="absolute -top-1 -left-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
          <Star className="w-3 h-3 text-white" />
        </div>
      )}
      {achievement.category === 'monthly' && (
        <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
          <Calendar className="w-3 h-3 text-white" />
        </div>
      )}
    </button>
  );
};

/**
 * Achievement Detail Modal
 */
export const AchievementDetailModal = ({ achievement, stats, onClose }) => {
  if (!achievement) return null;

  const { unlocked, progress, current, target } = calculateAchievementProgress(achievement, stats);
  const Icon = achievement.icon;
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'lifetime': return '🏆 Lifetime Achievement';
      case 'monthly': return '📅 Monthly Achievement';
      case 'special': return '⭐ Special Achievement';
      default: return 'Achievement';
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Category Badge */}
        <div className="mb-4">
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}>
            {getCategoryLabel(achievement.category)}
          </span>
        </div>

        {/* Icon */}
        <div
          className={`
            w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center
            ${unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'}
            ${unlocked ? 'animate-pulse' : ''}
          `}
        >
          <Icon className={`w-12 h-12 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-gray-800 mb-2">{achievement.title}</h3>
        <p className="text-gray-600 mb-4">{achievement.description}</p>

        {/* XP */}
        <div className="mb-4">
          <span className={`text-lg font-bold px-4 py-2 rounded-full ${colors.badge}`}>
            +{achievement.xp} XP
          </span>
        </div>

        {/* Status */}
        {unlocked ? (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5" />
            Achievement Unlocked! 🎉
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
              <span className="text-gray-400 ml-2">({Math.round(progress * 100)}%)</span>
            </p>
          </div>
        )}

        {/* Tips */}
        {!unlocked && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-left">
            <p className="text-xs font-bold text-blue-700 mb-1">💡 Tip</p>
            <p className="text-xs text-blue-600">
              {achievement.category === 'monthly'
                ? 'Keep going this month! Monthly achievements reset on the 1st.'
                : 'Stay consistent and you\'ll unlock this achievement soon!'}
            </p>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`
            w-full py-3 font-bold rounded-xl text-white
            ${unlocked
              ? `bg-gradient-to-r ${colors.bg}`
              : 'bg-gray-400'
            }
          `}
        >
          {unlocked ? 'Awesome!' : 'Keep Going!'}
        </button>
      </div>
    </div>
  );
};

/**
 * XP & Level Display Component
 */
export const XPLevelDisplay = ({ stats }) => {
  const totalXP = calculateTotalXP(ALL_ACHIEVEMENTS, stats);
  const level = getUserLevel(totalXP);

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
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
          <p className="text-2xl font-bold">{totalXP}</p>
          <p className="text-xs text-indigo-200">Total XP</p>
        </div>
      </div>

      {/* Progress to Next Level */}
      {level.nextLevel && (
        <div>
          <div className="flex items-center justify-between text-xs text-indigo-200 mb-1">
            <span>{level.xpInCurrentLevel} XP</span>
            <span>{level.xpToNextLevel} XP to {level.nextLevel.name}</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${level.progressToNext * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Achievement Summary Stats
 */
export const AchievementSummary = ({ stats }) => {
  const lifetimeProgress = useMemo(() => {
    const unlocked = LIFETIME_ACHIEVEMENTS.filter(
      (a) => calculateAchievementProgress(a, stats).unlocked
    ).length;
    return { unlocked, total: LIFETIME_ACHIEVEMENTS.length };
  }, [stats]);

  const monthlyProgress = useMemo(() => {
    const unlocked = MONTHLY_ACHIEVEMENTS.filter(
      (a) => calculateAchievementProgress(a, stats).unlocked
    ).length;
    return { unlocked, total: MONTHLY_ACHIEVEMENTS.length };
  }, [stats]);

  const specialProgress = useMemo(() => {
    const unlocked = SPECIAL_ACHIEVEMENTS.filter(
      (a) => calculateAchievementProgress(a, stats).unlocked
    ).length;
    return { unlocked, total: SPECIAL_ACHIEVEMENTS.length };
  }, [stats]);

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 text-center">
        <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-yellow-700">
          {lifetimeProgress.unlocked}/{lifetimeProgress.total}
        </p>
        <p className="text-xs text-gray-600">Lifetime</p>
      </div>
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
        <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-blue-700">
          {monthlyProgress.unlocked}/{monthlyProgress.total}
        </p>
        <p className="text-xs text-gray-600">Monthly</p>
      </div>
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
        <Star className="w-6 h-6 text-purple-500 mx-auto mb-1" />
        <p className="text-lg font-bold text-purple-700">
          {specialProgress.unlocked}/{specialProgress.total}
        </p>
        <p className="text-xs text-gray-600">Special</p>
      </div>
    </div>
  );
};

/**
 * Achievement Category Section
 */
export const AchievementCategory = ({
  title,
  icon: Icon,
  color,
  achievements,
  stats,
  onAchievementClick,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => calculateAchievementProgress(a, stats).unlocked).length;
  }, [achievements, stats]);

  return (
    <div className={`bg-white rounded-2xl border-2 ${color} shadow-sm overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
            {unlockedCount}/{achievements.length}
          </span>
          <ChevronRight
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                stats={stats}
                onClick={onAchievementClick}
                size="small"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Recently Unlocked Achievements
 */
export const RecentAchievements = ({ stats, limit = 3, onAchievementClick }) => {
  // For demo purposes, show most recent unlocked
  const recentlyUnlocked = useMemo(() => {
    return ALL_ACHIEVEMENTS
      .filter((a) => calculateAchievementProgress(a, stats).unlocked)
      .slice(0, limit);
  }, [stats, limit]);

  if (recentlyUnlocked.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-gray-200">
        <Lock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No achievements yet</p>
        <p className="text-gray-400 text-xs mt-1">Keep learning to unlock!</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {recentlyUnlocked.map((achievement) => (
        <div key={achievement.id} className="flex-shrink-0 w-28">
          <AchievementCard
            achievement={achievement}
            stats={stats}
            onClick={onAchievementClick}
            size="small"
          />
        </div>
      ))}
    </div>
  );
};

/**
 * Next Achievements to Unlock
 */
export const NextToUnlock = ({ stats, limit = 3, onAchievementClick }) => {
  const nextAchievements = useMemo(() => {
    return ALL_ACHIEVEMENTS
      .map((a) => ({ ...a, ...calculateAchievementProgress(a, stats) }))
      .filter((a) => !a.unlocked && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, limit);
  }, [stats, limit]);

  if (nextAchievements.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
      <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5" />
        Almost There!
      </h4>
      <div className="space-y-3">
        {nextAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const colors = ACHIEVEMENT_COLORS[achievement.color];

          return (
            <button
              key={achievement.id}
              onClick={() => onAchievementClick?.(achievement)}
              className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-green-200 text-left"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{achievement.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                      style={{ width: `${achievement.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">
                    {Math.round(achievement.progress * 100)}%
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN ACHIEVEMENT PAGE COMPONENT
// ============================================

export default function StudentAchievementPage({ stats = {} }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'lifetime', 'monthly', 'special'

  // Default stats for demo
  const defaultStats = {
    totalAttendance: 25,
    totalGathas: 42,
    currentStreak: 5,
    maxStreak: 12,
    monthlyAttendance: 8,
    monthlyGathas: 15,
    daysInCurrentMonth: 30,
    specialConditions: {
      early_attendance: true,
      weekend_attendance: true,
    },
    ...stats,
  };

  const tabs = [
    { key: 'all', label: 'All', icon: Award },
    { key: 'lifetime', label: 'Lifetime', icon: Trophy },
    { key: 'monthly', label: 'Monthly', icon: Calendar },
    { key: 'special', label: 'Special', icon: Star },
  ];

  const filteredAchievements = useMemo(() => {
    switch (activeTab) {
      case 'lifetime': return LIFETIME_ACHIEVEMENTS;
      case 'monthly': return MONTHLY_ACHIEVEMENTS;
      case 'special': return SPECIAL_ACHIEVEMENTS;
      default: return ALL_ACHIEVEMENTS;
    }
  }, [activeTab]);

  const totalUnlocked = useMemo(() => {
    return ALL_ACHIEVEMENTS.filter(
      (a) => calculateAchievementProgress(a, defaultStats).unlocked
    ).length;
  }, [defaultStats]);

  return (
    <div className="space-y-4 pb-6">
      {/* XP & Level Display */}
      <XPLevelDisplay stats={defaultStats} />

      {/* Achievement Summary */}
      <AchievementSummary stats={defaultStats} />

      {/* Next to Unlock */}
      <NextToUnlock
        stats={defaultStats}
        onAchievementClick={setSelectedAchievement}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap
              transition-all active:scale-[0.97]
              ${activeTab === tab.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-orange-200'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      {activeTab === 'all' ? (
        <div className="space-y-4">
          <AchievementCategory
            title="🏆 Lifetime Achievements"
            icon={Trophy}
            color="border-yellow-200"
            achievements={LIFETIME_ACHIEVEMENTS}
            stats={defaultStats}
            onAchievementClick={setSelectedAchievement}
          />
          <AchievementCategory
            title="📅 Monthly Achievements"
            icon={Calendar}
            color="border-blue-200"
            achievements={MONTHLY_ACHIEVEMENTS}
            stats={defaultStats}
            onAchievementClick={setSelectedAchievement}
          />
          <AchievementCategory
            title="⭐ Special Achievements"
            icon={Star}
            color="border-purple-200"
            achievements={SPECIAL_ACHIEVEMENTS}
            stats={defaultStats}
            onAchievementClick={setSelectedAchievement}
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm">
          <div className="grid grid-cols-3 gap-3">
            {filteredAchievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                stats={defaultStats}
                onClick={setSelectedAchievement}
              />
            ))}
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-orange-800 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Overall Progress
          </h4>
          <span className="text-sm font-bold text-orange-700">
            {totalUnlocked}/{ALL_ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${(totalUnlocked / ALL_ACHIEVEMENTS.length) * 100}%` }}
          />
        </div>
        <p className="text-xs text-orange-700 mt-2 text-center">
          {Math.round((totalUnlocked / ALL_ACHIEVEMENTS.length) * 100)}% Complete
        </p>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm font-bold text-blue-800 mb-2">ℹ️ How Achievements Work</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Lifetime:</strong> Never reset, keep forever!</li>
          <li>• <strong>Monthly:</strong> Reset on 1st of each month</li>
          <li>• <strong>Special:</strong> Unlock during events or milestones</li>
        </ul>
      </div>

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        stats={defaultStats}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
}
