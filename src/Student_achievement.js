import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  Crown,
  Flame,
  Lock,
  Medal,
  Rocket,
  Star,
  Trophy,
  Zap,
  HelpCircle,
  BookMarked
} from 'lucide-react';

// ============================================
// CONFIGURATION
// ============================================

export const DEFAULT_WORKING_DAYS = 25;

export const XP_VALUES = {
  attendance: 10,
  new_gatha: 2,
  revision_gatha: 0,
};

// ============================================
// MONTHLY ACHIEVEMENTS
// ============================================

export const MONTHLY_ACHIEVEMENTS = [
  // ===== Attendance =====
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
    description: 'Attend 4 days this month',
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
    subtitle: 'All Days Present',
    description: 'Attend all working days this month',
    icon: Crown,
    requirement: { type: 'monthly_attendance', count: 'full' },
    color: 'diamond',
    xp: 150,
  },

  // ===== Gatha =====
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

  // ===== Streak (Monthly Scoped) =====
  {
    id: 'streak_3',
    title: 'Getting Started',
    subtitle: '3 Days Streak',
    description: 'Attend 3 days in a row within this month',
    icon: Zap,
    requirement: { type: 'streak', count: 3 },
    color: 'bronze',
    xp: 20,
  },
  {
    id: 'streak_7',
    title: 'On Fire!',
    subtitle: '7 Days Streak',
    description: 'Attend 7 days in a row within this month',
    icon: Flame,
    requirement: { type: 'streak', count: 7 },
    color: 'silver',
    xp: 50,
  },
  {
    id: 'streak_14',
    title: 'Unstoppable',
    subtitle: '14 Days Streak',
    description: 'Attend 14 days in a row within this month',
    icon: Rocket,
    requirement: { type: 'streak', count: 14 },
    color: 'gold',
    xp: 100,
  },
];

export const ACHIEVEMENT_COLORS = {
  bronze: { bg: 'from-orange-300 to-orange-500', border: 'border-orange-300', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', light: 'bg-orange-50', icon: '🥉' },
  silver: { bg: 'from-gray-300 to-gray-500', border: 'border-gray-400', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700', light: 'bg-gray-50', icon: '🥈' },
  gold: { bg: 'from-yellow-300 to-yellow-500', border: 'border-yellow-400', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', light: 'bg-yellow-50', icon: '🥇' },
  diamond: { bg: 'from-cyan-300 to-blue-500', border: 'border-cyan-400', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700', light: 'bg-cyan-50', icon: '💎' },
};

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

export const calculateAchievementProgress = (achievement, stats = {}) => {
  const {
    monthlyAttendance = 0,
    monthlyNewGathas = 0,
    maxStreak = 0, // Should be monthly max streak passed from Dashboard
    workingDays = DEFAULT_WORKING_DAYS,
  } = stats;

  let unlocked = false;
  let progress = 0;
  let current = 0;
  let target = 0;

  switch (achievement.requirement.type) {
    case 'monthly_attendance':
      target = achievement.requirement.count === 'full' ? workingDays : achievement.requirement.count;
      current = monthlyAttendance;
      break;
    case 'monthly_gatha':
      target = achievement.requirement.count;
      current = monthlyNewGathas;
      break;
    case 'streak':
      target = achievement.requirement.count;
      // Use maxStreak passed in stats (which must be filtered for that month)
      current = maxStreak; 
      break;
    default:
      break;
  }

  if (target > 0) {
    progress = Math.min(current / target, 1);
    unlocked = current >= target;
  }

  return { unlocked, progress, current, target };
};

export const calculateTotalXP = (stats = {}, achievements = MONTHLY_ACHIEVEMENTS) => {
  const { monthlyAttendance = 0, monthlyNewGathas = 0 } = stats;
  
  // Basic XP from activities
  const attendanceXP = monthlyAttendance * XP_VALUES.attendance;
  const gathaXP = monthlyNewGathas * XP_VALUES.new_gatha;
  
  // Bonus XP from Unlocked Achievements
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

  return { ...currentLevel, nextLevel, xpInCurrentLevel, xpToNextLevel, progressToNext, totalXP: xp };
};

// ============================================
// COMPONENTS
// ============================================

const MonthSelector = ({ selectedMonth, onMonthChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate last 12 months
  const months = useMemo(() => {
    const m = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      m.push({
        value,
        label: d.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
        isCurrent: i === 0
      });
    }
    return m;
  }, []);

  const currentLabel = months.find(m => m.value === selectedMonth)?.label || months[0].label;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white border-2 border-orange-200 rounded-xl px-4 py-3 font-bold text-gray-800 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <span>{currentLabel}</span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-orange-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            {months.map(m => (
              <button
                key={m.value}
                onClick={() => { onMonthChange(m.value); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-50 ${m.value === selectedMonth ? 'bg-orange-100' : ''}`}
              >
                <span className="font-medium text-gray-800">{m.label}</span>
                {m.value === selectedMonth && <Check className="w-5 h-5 text-orange-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

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

const MonthlyStatsSummary = ({ stats, workingDays }) => {
  const {
    monthlyAttendance = 0,
    monthlyNewGathas = 0,
    maxStreak = 0,
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
        <p className="text-2xl font-bold text-orange-700">{maxStreak}</p>
        <p className="text-xs text-gray-500">days streak</p>
        <p className="text-xs text-orange-600 font-medium">Best Streak</p>
      </div>
    </div>
  );
};

const AchievementCard = ({ achievement, stats, onClick }) => {
  const { unlocked, progress, current, target } = calculateAchievementProgress(achievement, stats);
  const Icon = achievement.icon;
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;

  return (
    <button
      onClick={() => onClick?.(achievement)}
      className={`relative rounded-xl border-2 transition-all active:scale-[0.97] w-full p-3 ${
        unlocked ? `${colors.border} bg-gradient-to-br from-white to-gray-50 shadow-md` : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div className="absolute -top-2 -left-2 text-lg">{colors.icon}</div>
      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
        unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'
      }`}>
        <Icon className={`w-6 h-6 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <p className={`text-xs font-bold text-center ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{achievement.title}</p>
      <div className="mt-2 text-center">
        <span className={`text-xs px-2 py-0.5 rounded-full ${unlocked ? colors.badge : 'bg-gray-100 text-gray-500'}`}>
          +{achievement.xp} XP
        </span>
      </div>
      {!unlocked && progress > 0 && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${colors.bg}`} style={{ width: `${progress * 100}%` }} />
          </div>
          <p className="text-xs text-gray-400 text-center mt-1">{current}/{target}</p>
        </div>
      )}
      {!unlocked && progress === 0 && (
        <div className="absolute top-1 right-1"><Lock className="w-4 h-4 text-gray-400" /></div>
      )}
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

const AchievementSection = ({ title, icon: Icon, color, achievements, stats, onAchievementClick }) => {
  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => calculateAchievementProgress(a, stats).unlocked).length;
  }, [achievements, stats]);

  return (
    <div className={`bg-white rounded-2xl border-2 ${color} shadow-sm overflow-hidden`}>
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <span className="text-sm font-bold bg-gray-100 px-2 py-1 rounded-full">
          {unlockedCount}/{achievements.length} unlocked
        </span>
      </div>
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

export const AchievementDetailModal = ({ achievement, stats, onClose }) => {
  if (!achievement) return null;
  const { unlocked, progress, current, target } = calculateAchievementProgress(achievement, stats);
  const colors = ACHIEVEMENT_COLORS[achievement.color] || ACHIEVEMENT_COLORS.bronze;
  const Icon = achievement.icon;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
          unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'
        }`}>
          <Icon className={`w-10 h-10 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">{achievement.title}</h3>
        <p className="text-gray-500 mb-4 text-sm">{achievement.description}</p>
        {unlocked ? (
          <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold mb-4">Badge Unlocked! 🎉</div>
        ) : (
          <div className="mb-4 bg-gray-50 p-3 rounded-xl">
            <p className="text-sm font-bold text-gray-600 mb-1">Progress: {current} / {target}</p>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${colors.bg}`} style={{ width: `${progress * 100}%` }} />
            </div>
          </div>
        )}
        <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl">Close</button>
      </div>
    </div>
  );
};

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function StudentAchievementPage({ stats = {}, onMonthChange, workingDays = DEFAULT_WORKING_DAYS }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    const [y, m] = val.split('-');
    onMonthChange?.(parseInt(y), parseInt(m));
  };

  const statsWithWorkingDays = useMemo(() => ({ ...stats, workingDays }), [stats, workingDays]);
  
  const xpBreakdown = useMemo(() => calculateTotalXP(statsWithWorkingDays), [statsWithWorkingDays]);
  const level = useMemo(() => getUserLevel(xpBreakdown.total), [xpBreakdown.total]);
  const totalUnlocked = useMemo(() => MONTHLY_ACHIEVEMENTS.filter(a => calculateAchievementProgress(a, statsWithWorkingDays).unlocked).length, [statsWithWorkingDays]);

  // Categorize achievements
  const attendanceAchievements = MONTHLY_ACHIEVEMENTS.filter(a => a.requirement.type === 'monthly_attendance');
  const gathaAchievements = MONTHLY_ACHIEVEMENTS.filter(a => a.requirement.type === 'monthly_gatha');
  const streakAchievements = MONTHLY_ACHIEVEMENTS.filter(a => a.requirement.type === 'streak');

  return (
    <div className="space-y-4 pb-6">
      <MonthSelector selectedMonth={selectedMonth} onMonthChange={handleMonthChange} />
      
      <MonthlyStatsSummary stats={statsWithWorkingDays} workingDays={workingDays} />

      <XPBreakdownCard xpBreakdown={xpBreakdown} level={level} />

      <HowToEarnXP />

      <AchievementSection 
        title="📅 Attendance Badges" 
        icon={Calendar} 
        color="border-green-200" 
        achievements={attendanceAchievements} 
        stats={statsWithWorkingDays} 
        onAchievementClick={setSelectedAchievement} 
      />

      <AchievementSection 
        title="📚 Gatha Badges" 
        icon={BookOpen} 
        color="border-purple-200" 
        achievements={gathaAchievements} 
        stats={statsWithWorkingDays} 
        onAchievementClick={setSelectedAchievement} 
      />

      <AchievementSection 
        title="🔥 Streak Badges" 
        icon={Flame} 
        color="border-orange-200" 
        achievements={streakAchievements} 
        stats={statsWithWorkingDays} 
        onAchievementClick={setSelectedAchievement} 
      />

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

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-sm text-blue-800">
        <p>📅 <strong>Monthly Reset:</strong> These badges reset every month. Try to unlock them all!</p>
      </div>

      <AchievementDetailModal achievement={selectedAchievement} stats={statsWithWorkingDays} onClose={() => setSelectedAchievement(null)} />
    </div>
  );
}
