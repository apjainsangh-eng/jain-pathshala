import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Award,
  BookMarked,
  BookOpen,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit2,
  Flame,
  HelpCircle,
  Home,
  Info,
  Loader,
  LogOut,
  Medal,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  Trophy,
  TrendingUp,
  Users,
  X as CloseIcon,
  Zap,
  Sparkles,
  UserCircle,
  ChevronUp,
  TrendingDown,
  BarChart3,
  ArrowRight,
  XCircle,
  Eye,
} from 'lucide-react';

// Import Achievement Components
import StudentAchievementPage, {
  calculateAchievementProgress,
  calculateTotalXP,
  getUserLevel,
  MONTHLY_ACHIEVEMENTS,
  XP_VALUES,
  DEFAULT_WORKING_DAYS,
  AchievementDetailModal,
  ACHIEVEMENT_COLORS,
  LEVELS,
} from './Student_achievement';

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';
const DEFAULT_DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };

// Page Navigation
const PAGES = {
  HOME: 'home',
  STATS: 'stats',
  HISTORY: 'history',
  PENDING: 'pending',
};

// Motivational Quotes
const QUOTES = [
  { text: "અહિંસા પરમો ધર્મઃ", meaning: "Non-violence is the supreme religion", emoji: "🙏", lang: "Sanskrit" },
  { text: "ક્ષમા વીરસ્ય ભૂષણમ્", meaning: "Forgiveness is the ornament of the brave", emoji: "💪", lang: "Sanskrit" },
  { text: "જીવો જીવસ્ય જીવનમ્", meaning: "Live and let live", emoji: "🌱", lang: "Sanskrit" },
  { text: "પરસ્પરોપગ્રહો જીવાનામ્", meaning: "Souls render service to one another", emoji: "🤝", lang: "Sanskrit" },
  { text: "ધર્મ એ જ શ્રેષ્ઠ મિત્ર છે", meaning: "Dharma is the best friend", emoji: "🙏", lang: "Gujarati" },
  { text: "સત્ય બોલો, પ્રિય બોલો", meaning: "Speak truth, speak pleasantly", emoji: "💬", lang: "Gujarati" },
  { text: "જ્ઞાન જ શક્તિ છે", meaning: "Knowledge is power", emoji: "📚", lang: "Gujarati" },
  { text: "મહેનત નો કોઈ વિકલ્પ નથી", meaning: "There is no substitute for hard work", emoji: "⭐", lang: "Gujarati" },
];

// Tips icon color classes
const TIP_ICON_COLORS = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
};

// Tips for new users
const HELPFUL_TIPS = [
  { icon: Calendar, tipText: "Tap the blue button to mark your attendance daily", color: "blue" },
  { icon: BookOpen, tipText: "Record your gatha learning with the purple button", color: "purple" },
  { icon: Trophy, tipText: "Check Stats to see your achievements and progress", color: "yellow" },
  { icon: Clock, tipText: "Pending tab shows items waiting for teacher approval", color: "orange" },
];

// ============================================
// HELPER UTILITIES
// ============================================

/** Count non-Sunday weekdays between two dates (inclusive) */
const countWeekdaysExcludingSundays = (startDate, endDate) => {
  let count = 0;
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  while (d <= end) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

/** Calculate days since last visit, excluding Sundays */
const daysSinceLastVisit = (attendanceHistory) => {
  if (!attendanceHistory || attendanceHistory.length === 0) return null;
  const sortedDates = attendanceHistory
    .map(r => r.date)
    .sort((a, b) => new Date(b) - new Date(a));
  const lastDate = new Date(sortedDates[0]);
  lastDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (lastDate.getTime() === today.getTime()) return 0;
  let count = 0;
  const d = new Date(lastDate);
  d.setDate(d.getDate() + 1);
  while (d <= today) {
    if (d.getDay() !== 0) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
};

/** Get absence message based on count */
const getAbsenceMessage = (absentDays) => {
  if (absentDays === 0) return { text: 'Perfect attendance this month! 🌟', tone: 'positive' };
  if (absentDays <= 2) return { text: 'Great job! Just a few days missed. Keep it up! 💪', tone: 'good' };
  if (absentDays <= 5) return { text: `You missed ${absentDays} days. Let's get back on track! 🎯`, tone: 'warning' };
  if (absentDays <= 10) return { text: `${absentDays} days absent! Your classmates are ahead. Come back! 🚀`, tone: 'urgent' };
  return { text: `${absentDays} days missed! Don't fall behind — every day matters! 🙏`, tone: 'critical' };
};

const coerceToDate = (input) => {
  if (input instanceof Date) return new Date(input.getTime());
  if (typeof input === 'number') return new Date(input);
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const isoLike = trimmed.length <= 10 ? `${trimmed}T00:00:00` : trimmed;
    const parsed = new Date(isoLike);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const formatLocalDateString = (input = new Date()) => {
  const parsed = coerceToDate(input);
  if (!parsed) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateIn = (input, options = DEFAULT_DATE_OPTIONS) => {
  const parsed = coerceToDate(input);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-IN', { ...DEFAULT_DATE_OPTIONS, ...options });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Good Night', emoji: '🌙', period: 'night' };
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅', period: 'morning' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️', period: 'afternoon' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌆', period: 'evening' };
  return { text: 'Good Night', emoji: '🌙', period: 'night' };
};

const getMotivationalMessage = (streak, attendance, gathas) => {
  if (streak >= 7) return { text: "You're on fire! Keep the streak going! 🔥", type: "streak" };
  if (attendance >= 50) return { text: "Amazing dedication! You're a star! ⭐", type: "attendance" };
  if (gathas >= 25) return { text: "Great gatha progress! Keep learning! 📚", type: "gatha" };
  if (streak >= 3) return { text: "Nice streak! Don't break the chain! 💪", type: "streak" };
  if (attendance >= 10) return { text: "You're doing great! Stay consistent! 🎯", type: "attendance" };
  return { text: "Every journey begins with a single step! 🚀", type: "motivation" };
};

// ============================================
// USER SWITCHER COMPONENT
// ============================================

const UserSwitcher = ({ groupMembers, activeUser, loggedInUser, onSwitch, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!groupMembers || groupMembers.length <= 1) {
    return null;
  }

  const activeUserData = groupMembers.find(m => m._id === activeUser?._id || m.id === activeUser?.id || m.username === activeUser?.username) || activeUser;
  const isViewingOther = (activeUser?.username || activeUser?.name) !== (loggedInUser?.username || loggedInUser?.name);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full flex items-center justify-between gap-2 p-3 rounded-2xl border-2 transition-all ${
          isViewingOther
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300'
            : 'bg-white border-orange-200'
        } shadow-sm active:scale-[0.99]`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
            isViewingOther
              ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
              : 'bg-gradient-to-br from-orange-400 to-amber-500'
          }`}>
            {(activeUserData?.name || activeUserData?.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-800 text-sm truncate">
                {activeUserData?.name || activeUserData?.username}
              </p>
              {isViewingOther && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full animate-pulse flex-shrink-0">
                  Viewing
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {groupMembers.length} members in group • Tap to switch
            </p>
          </div>
        </div>
        <div className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isOpen ? 'bg-orange-100' : 'bg-gray-100'}`}>
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-600" />
          )}
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border-2 border-orange-200 shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-2 bg-orange-50 border-b border-orange-200">
              <p className="text-xs font-bold text-orange-800 flex items-center gap-2">
                <Users className="w-3 h-3" />
                Switch Account
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {groupMembers.map((member) => {
                const memberUsername = member.username || member.name;
                const activeUsername = activeUser?.username || activeUser?.name;
                const loggedInUsername = loggedInUser?.username || loggedInUser?.name;
                const isActive = memberUsername === activeUsername;
                const isLoggedIn = memberUsername === loggedInUsername;

                return (
                  <button
                    key={memberUsername}
                    onClick={() => {
                      onSwitch(member);
                      setIsOpen(false);
                    }}
                    disabled={isLoading}
                    className={`w-full flex items-center gap-3 p-3 transition-all ${
                      isActive
                        ? 'bg-orange-100'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
                      isActive
                        ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {(member.name || member.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">
                        {member.name || member.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.username}
                        {isLoggedIn && ' • (You)'}
                      </p>
                    </div>
                    {isActive && (
                      <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 You can add gathas and mark attendance for any member
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Delete", confirmColor = "red" }) => {
  if (!title) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-4 sm:p-6 animate-in zoom-in duration-200 my-auto">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-500" />
          </div>
          <div className="min-w-0">
            <h4 className="text-base sm:text-lg font-bold text-gray-800 truncate">{title}</h4>
            <p className="text-xs sm:text-sm text-gray-500">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm bg-gray-50 p-3 rounded-xl">{message}</p>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-3 sm:px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-[0.98] transition-transform text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-3 sm:px-4 py-3 ${confirmColor === 'red' ? 'bg-red-500' : 'bg-orange-500'} text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg text-sm sm:text-base`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessToast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-300 px-4 w-full max-w-sm">
      <div className="bg-green-500 text-white px-4 sm:px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2 sm:gap-3">
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
        <span className="font-medium text-sm sm:text-base flex-1">{message}</span>
        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full flex-shrink-0">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-xl mb-4 flex items-start gap-2 sm:gap-3 shadow-sm animate-in slide-in-from-top duration-200">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-red-700 text-sm font-medium break-words">{message}</p>
      </div>
      <button onClick={onClose} className="text-red-400 p-1 hover:bg-red-100 rounded-lg flex-shrink-0">
        <CloseIcon size={18} />
      </button>
    </div>
  );
};

const StreakDisplay = ({ streak, maxStreak }) => {
  const getStreakInfo = (s) => {
    if (s >= 30) return { label: 'Legendary!', color: 'from-yellow-400 to-orange-500', emoji: '🔥', tier: 'diamond' };
    if (s >= 14) return { label: 'Amazing!', color: 'from-purple-400 to-pink-500', emoji: '⚡', tier: 'gold' };
    if (s >= 7) return { label: 'Great!', color: 'from-blue-400 to-indigo-500', emoji: '✨', tier: 'silver' };
    if (s >= 3) return { label: 'Good!', color: 'from-green-400 to-emerald-500', emoji: '🌟', tier: 'bronze' };
    if (s >= 1) return { label: 'Started!', color: 'from-cyan-400 to-blue-500', emoji: '🚀', tier: 'starter' };
    return { label: 'Start today!', color: 'from-gray-400 to-gray-500', emoji: '💪', tier: 'none' };
  };

  const info = getStreakInfo(streak);

  return (
    <div className={`bg-gradient-to-r ${info.color} rounded-2xl p-4 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="font-bold text-sm sm:text-base">Current Streak</span>
          </div>
          <span className="text-2xl sm:text-3xl">{info.emoji}</span>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <p className="text-4xl sm:text-5xl font-bold">{streak}</p>
            <p className="text-xs sm:text-sm opacity-80">{streak === 1 ? 'day' : 'days'}</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-base sm:text-lg font-bold">{info.label}</p>
            <p className="text-xs opacity-80 flex items-center justify-end gap-1">
              <Trophy className="w-3 h-3" /> Best: {maxStreak} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStatCard = ({ icon: Icon, value, label, color, sublabel }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
  };

  return (
    <div className={`rounded-2xl p-3 sm:p-4 border-2 ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        {sublabel && (
          <span className={`text-xs px-2 py-0.5 rounded-full bg-white/80 font-bold`}>
            {sublabel}
          </span>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
};

const HelpTooltip = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
          </div>
        </>
      )}
    </div>
  );
};

// ============================================
// ABSENCE AWARENESS CARD
// ============================================

const AbsenceAwarenessCard = ({ attendanceHistory, todayMarked }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const todayDate = new Date(currentYear, currentMonth, now.getDate());
  const totalWeekdays = countWeekdaysExcludingSundays(monthStart, todayDate);
  const presentDates = new Set(
    attendanceHistory
      .filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .map(r => r.date)
  );
  let presentCount = presentDates.size;
  const adjustedWeekdays = todayMarked ? totalWeekdays : Math.max(totalWeekdays - (now.getDay() !== 0 ? 1 : 0), 0);
  const absentDays = Math.max(adjustedWeekdays - presentCount, 0);
  const absenceInfo = getAbsenceMessage(absentDays);
  const attendancePercentage = adjustedWeekdays > 0 ? Math.round((presentCount / adjustedWeekdays) * 100) : 100;
  const getBgGradient = () => {
    if (absentDays === 0) return 'from-green-400 to-emerald-500';
    if (absentDays <= 2) return 'from-blue-400 to-cyan-500';
    if (absentDays <= 5) return 'from-amber-400 to-orange-500';
    return 'from-red-400 to-rose-500';
  };

  return (
    <div className={`bg-gradient-to-r ${getBgGradient()} rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden card-animate card-animate-3 ${absentDays > 5 ? 'btn-glow-urgent' : ''}`}>
      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {absentDays === 0 ? (
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
            )}
            <span className="font-bold text-sm sm:text-base">Attendance Tracker</span>
          </div>
          <span className="text-2xl sm:text-3xl">{absentDays === 0 ? '🌟' : absentDays <= 2 ? '👍' : absentDays <= 5 ? '⚠️' : '🚨'}</span>
        </div>
        <div className="flex items-end gap-4 mb-3">
          <div>
            <p className="text-4xl sm:text-5xl font-bold number-pop">{absentDays}</p>
            <p className="text-xs sm:text-sm opacity-90">days absent</p>
          </div>
          <div className="flex-1">
            <div className="bg-white/20 rounded-full p-1 mb-1">
              <div className="flex items-center justify-between text-xs px-1">
                <span>{presentCount} present</span>
                <span>{adjustedWeekdays} working days</span>
              </div>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full progress-animate"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
            <p className="text-xs opacity-80 mt-1 text-right">{attendancePercentage}% attendance</p>
          </div>
        </div>
        <div className="bg-white/15 backdrop-blur rounded-xl p-2 sm:p-3">
          <p className="text-xs sm:text-sm font-medium">{absenceInfo.text}</p>
          <p className="text-xs opacity-70 mt-1">* Sundays excluded from count</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MONTHLY WEEK STRIP
// ============================================

const MonthlyWeekStrip = ({ attendanceHistory, todayIso }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const stripRef = useRef(null);
  const presentDates = useMemo(() => {
    const set = new Set();
    attendanceHistory.forEach(r => {
      const d = new Date(r.date);
      if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
        set.add(r.date);
      }
    });
    return set;
  }, [attendanceHistory, currentYear, currentMonth]);
  useEffect(() => {
    if (stripRef.current) {
      const todayEl = stripRef.current.querySelector('[data-today="true"]');
      if (todayEl) {
        todayEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentYear, currentMonth, day);
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSunday = date.getDay() === 0;
    const isToday = dateStr === todayIso;
    const isFuture = date > now;
    const isPresent = presentDates.has(dateStr);
    const isAbsent = !isSunday && !isFuture && !isPresent && day <= now.getDate();
    days.push({ day, dateStr, isSunday, isToday, isFuture, isPresent, isAbsent, dayName: dayNames[date.getDay()] });
  }

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          This Month at a Glance
        </h3>
        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
          {new Date().toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
        </span>
      </div>
      <div ref={stripRef} className="flex gap-1.5 overflow-x-auto pb-2 week-strip-scroll">
        {days.map(d => (
          <div
            key={d.day}
            data-today={d.isToday ? "true" : "false"}
            className={`day-cell flex-shrink-0 w-9 sm:w-10 flex flex-col items-center rounded-lg p-1 sm:p-1.5 text-center cursor-default
              ${d.isToday ? 'ring-2 ring-orange-400 ring-offset-1' : ''}
              ${d.isPresent ? 'bg-gradient-to-b from-green-400 to-green-500 text-white shadow-md' : ''}
              ${d.isAbsent ? 'bg-gradient-to-b from-red-100 to-red-200 text-red-600' : ''}
              ${d.isSunday ? 'bg-gray-100 text-gray-400' : ''}
              ${d.isFuture && !d.isSunday ? 'bg-gray-50 text-gray-300' : ''}
              ${!d.isPresent && !d.isAbsent && !d.isSunday && !d.isFuture ? 'bg-gray-50 text-gray-400' : ''}
            `}
          >
            <span className="text-[9px] sm:text-[10px] font-medium leading-tight">{d.dayName}</span>
            <span className="text-xs sm:text-sm font-bold leading-tight">{d.day}</span>
            <span className="text-[10px] leading-tight">
              {d.isPresent ? '✓' : d.isAbsent ? '✗' : d.isSunday ? '—' : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-2 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gradient-to-b from-green-400 to-green-500" />
          <span className="text-gray-500">Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gradient-to-b from-red-100 to-red-200" />
          <span className="text-gray-500">Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-100" />
          <span className="text-gray-500">Sunday</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LAST VISIT / ACTIVITY SUMMARY CARD
// ============================================

const LastVisitCard = ({ attendanceHistory, gathaEntries, currentStreak, statsForCurrentMonth, onGoToStats }) => {
  const daysSince = daysSinceLastVisit(attendanceHistory);
  const lastVisitInfo = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return null;
    const sorted = [...attendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastDate = sorted[0]?.date;
    if (!lastDate) return null;
    const dayGathas = gathaEntries.filter(g => {
      const gDate = g.created_at ? new Date(g.created_at).toISOString().split('T')[0] : null;
      return gDate === lastDate;
    });
    const totalGathasOnDay = dayGathas.reduce((sum, g) => sum + (g.total_gatha || 0), 0);
    return { date: lastDate, gathaCount: totalGathasOnDay, gathaDetails: dayGathas };
  }, [attendanceHistory, gathaEntries]);
  const nextMilestone = useMemo(() => {
    const monthlyAtt = statsForCurrentMonth?.monthlyAttendance || 0;
    const milestones = [4, 10, 20, 25];
    for (const m of milestones) {
      if (monthlyAtt < m) return { target: m, remaining: m - monthlyAtt, label: m === 4 ? 'Week Regular' : m === 10 ? 'Dedicated Student' : m === 20 ? 'Star Student' : 'Perfect Month' };
    }
    return null;
  }, [statsForCurrentMonth]);

  if (!lastVisitInfo) return null;

  return (
    <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-indigo-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
          Your Activity
        </h3>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3 border border-indigo-200">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-700" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-sm">Last visited</p>
            <p className="text-xs text-gray-500">
              {new Date(lastVisitInfo.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              {daysSince !== null && daysSince > 0 && (
                <span className={`ml-2 font-bold ${daysSince > 3 ? 'text-red-500' : 'text-orange-500'}`}>
                  ({daysSince} {daysSince === 1 ? 'day' : 'days'} ago)
                </span>
              )}
              {daysSince === 0 && <span className="ml-2 font-bold text-green-500">(Today! ✓)</span>}
            </p>
          </div>
          {lastVisitInfo.gathaCount > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold text-purple-600">{lastVisitInfo.gathaCount}</p>
              <p className="text-xs text-gray-400">gathas</p>
            </div>
          )}
        </div>
        {nextMilestone && (
          <button
            onClick={onGoToStats}
            className="w-full flex items-center gap-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border border-green-200 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-bold text-gray-800 text-sm">Next badge: {nextMilestone.label}</p>
              <p className="text-xs text-green-600">
                Just <span className="font-bold">{nextMilestone.remaining} more {nextMilestone.remaining === 1 ? 'day' : 'days'}</span> to unlock!
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-green-500 flex-shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

const PageTransitionWrapper = ({ pageKey, children }) => {
  const [animClass, setAnimClass] = useState('page-enter');
  const prevKeyRef = useRef(pageKey);
  useEffect(() => {
    if (prevKeyRef.current !== pageKey) {
      setAnimClass('page-enter');
      prevKeyRef.current = pageKey;
    }
  }, [pageKey]);
  return (
    <div key={pageKey} className={animClass}>
      {children}
    </div>
  );
};

// ============================================
// LEVEL DETAILS MODAL
// ============================================

const LevelDetailsModal = ({ isOpen, onClose, currentXP, xpBreakdown, userLevel, stats }) => {
  if (!isOpen) return null;

  const allLevels = LEVELS || [
    { level: 1, name: 'Beginner', minXP: 0, icon: '🌱' },
    { level: 2, name: 'Learner', minXP: 50, icon: '📚' },
    { level: 3, name: 'Student', minXP: 150, icon: '✨' },
    { level: 4, name: 'Scholar', minXP: 300, icon: '⭐' },
    { level: 5, name: 'Expert', minXP: 500, icon: '🏆' },
    { level: 6, name: 'Master', minXP: 800, icon: '👑' },
    { level: 7, name: 'Guru', minXP: 1200, icon: '🔱' },
    { level: 8, name: 'Legend', minXP: 2000, icon: '💎' },
  ];

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 sm:p-5 text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
                  {userLevel.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold">Level Progress</h3>
                  <p className="text-sm opacity-80">Your XP Journey</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <CloseIcon size={24} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl">{userLevel.icon}</span>
                    {userLevel.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total XP</p>
                  <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{currentXP}</p>
                </div>
              </div>

              {userLevel.nextLevel && (
                <div className="bg-white rounded-xl p-3 border border-indigo-200">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Next: {userLevel.nextLevel.name} {userLevel.nextLevel.icon}</span>
                    <span className="font-bold text-indigo-600">{userLevel.xpToNextLevel - userLevel.xpInCurrentLevel} XP needed</span>
                  </div>
                  <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${userLevel.progressToNext * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-b">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                How You Earned XP This Month
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm">Attendance</p>
                      <p className="text-xs text-gray-500">{stats?.monthlyAttendance || 0} days × {XP_VALUES.attendance} XP</p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600 text-sm flex-shrink-0">+{(stats?.monthlyAttendance || 0) * XP_VALUES.attendance} XP</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm">New Gathas</p>
                      <p className="text-xs text-gray-500">{stats?.monthlyNewGathas || 0} × {XP_VALUES.new_gatha || 2} XP</p>
                    </div>
                  </div>
                  <p className="font-bold text-purple-600 text-sm flex-shrink-0">+{(stats?.monthlyNewGathas || 0) * (XP_VALUES.new_gatha || 2)} XP</p>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-yellow-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm">Achievements</p>
                      <p className="text-xs text-gray-500">Badges unlocked</p>
                    </div>
                  </div>
                  <p className="font-bold text-yellow-600 text-sm flex-shrink-0">+{xpBreakdown?.achievements || 0} XP</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0" />
                All Levels
              </h4>
              <div className="space-y-2">
                {allLevels.map((level, index) => {
                  const isCurrentLevel = level.level === userLevel.level;
                  const isUnlocked = currentXP >= level.minXP;
                  const isNext = !isUnlocked && (index === 0 || currentXP >= allLevels[index - 1].minXP);

                  return (
                    <div
                      key={level.level}
                      className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border-2 transition-all ${
                        isCurrentLevel
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-400 shadow-md'
                          : isUnlocked
                          ? 'bg-green-50 border-green-200'
                          : isNext
                          ? 'bg-blue-50 border-blue-300 border-dashed'
                          : 'bg-gray-50 border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ${
                          isCurrentLevel ? 'bg-indigo-200' : isUnlocked ? 'bg-green-200' : 'bg-gray-200'
                        }`}>
                          {level.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <p className="font-bold text-gray-800 text-sm">Lv.{level.level} {level.name}</p>
                            {isCurrentLevel && (
                              <span className="text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded">YOU</span>
                            )}
                            {isNext && (
                              <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">NEXT</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {level.minXP === 0 ? 'Starting level' : `${level.minXP} XP required`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isUnlocked ? (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                        ) : (
                          <p className="text-xs sm:text-sm font-bold text-gray-400">
                            {level.minXP - currentXP} XP
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t rounded-b-3xl">
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 sm:py-3.5 rounded-xl active:scale-[0.98] transition-transform shadow-lg text-sm sm:text-base"
            >
              Got it! 💪
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// LEADERBOARD COMPONENT (WITH YEAR/MONTH PROPS)
// ============================================

const LeaderboardSection = ({ currentUserId, currentUserName, year, month }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [leaderboardData, setLeaderboardData] = useState({ attendanceLeaders: [], gathaLeaders: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setIsLoading(true);
    setError(null);

    try {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0);

      let res = await fetch(
        `${API_BASE}/leaderboard?startDate=${formatLocalDateString(startOfMonth)}&endDate=${formatLocalDateString(endOfMonth)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      } else {
        res = await fetch(
          `${API_BASE}/analytics/leaderboard?startDate=${formatLocalDateString(startOfMonth)}&endDate=${formatLocalDateString(endOfMonth)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.ok) {
          const data = await res.json();
          setLeaderboardData({
            attendanceLeaders: data.attendanceLeaders || data.topAttendance || [],
            gathaLeaders: data.gathaLeaders || data.topGathas || [],
          });
        } else {
          throw new Error('Could not load leaderboard data');
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />;
      case 2: return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />;
      case 3: return <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />;
      default: return <span className="w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank, isCurrentUser) => {
    if (isCurrentUser) return 'bg-gradient-to-r from-orange-100 to-amber-100 border-orange-400';
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300';
      case 2: return 'bg-gray-50 border-gray-300';
      case 3: return 'bg-amber-50 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const attendanceLeaders = leaderboardData?.attendanceLeaders || [];
  const gathaLeaders = leaderboardData?.gathaLeaders || [];

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 sm:p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            <h3 className="text-base sm:text-lg font-bold">🏆 Leaderboard</h3>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-xs sm:text-sm opacity-80 mt-1">{monthNames[month - 1]} {year}</p>
      </div>

      <div className="flex p-2 bg-gray-100 gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
            activeTab === 'attendance' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-600 bg-white'
          }`}
        >
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" /> Attendance
        </button>
        <button
          onClick={() => setActiveTab('gatha')}
          className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
            activeTab === 'gatha' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-600 bg-white'
          }`}
        >
          <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" /> New Gathas
        </button>
      </div>

      <div className="p-3 sm:p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-blue-500 mb-3" />
            <p className="text-gray-500 text-sm">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium text-sm"
            >
              Try Again
            </button>
          </div>
        ) : activeTab === 'attendance' ? (
          attendanceLeaders.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">No data for {monthNames[month - 1]} {year}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceLeaders.slice(0, 5).map((user, index) => {
                const odometer = user.userId || user._id || user.id || user.username;
                const isCurrentUser = odometer === currentUserId || user.name === currentUserName || user.username === currentUserId;
                const rank = index + 1;

                return (
                  <div
                    key={odometer || index}
                    className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border-2 transition-all ${getRankBg(rank, isCurrentUser)}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {getRankIcon(rank)}
                        <span className="text-base sm:text-lg">{getRankEmoji(rank)}</span>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 text-sm">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="truncate">{user.name || user.username}</span>
                          {isCurrentUser && (
                            <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded animate-pulse flex-shrink-0">You</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.totalAttendance || user.count || 0} days present</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-green-600">{user.totalAttendance || user.count || 0}</p>
                      <p className="text-xs text-gray-400">days</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          gathaLeaders.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium text-sm">No data for {monthNames[month - 1]} {year}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gathaLeaders.slice(0, 5).map((user, index) => {
                const odometer = user.userId || user._id || user.id || user.username;
                const isCurrentUser = odometer === currentUserId || user.name === currentUserName || user.username === currentUserId;
                const rank = index + 1;

                return (
                  <div
                    key={odometer || index}
                    className={`flex items-center justify-between p-2 sm:p-3 rounded-xl border-2 transition-all ${getRankBg(rank, isCurrentUser)}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {getRankIcon(rank)}
                        <span className="text-base sm:text-lg">{getRankEmoji(rank)}</span>
                      </div>
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0 text-sm">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-800 text-sm flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="truncate">{user.name || user.username}</span>
                          {isCurrentUser && (
                            <span className="text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded animate-pulse flex-shrink-0">You</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.totalGathas || user.count || 0} new gathas</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl sm:text-2xl font-bold text-purple-600">{user.totalGathas || user.count || 0}</p>
                      <p className="text-xs text-gray-400">gathas</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="bg-blue-50 rounded-xl p-2 sm:p-3 border border-blue-200">
          <p className="text-xs text-blue-700 text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Leaderboard updates when you change month/year 🌟
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// GATHA ENTRY MODAL
// ============================================

const GathaEntryModal = ({ isOpen, onClose, onSubmit, isSubmitting, editData, activeUserName }) => {
  const [activeTab, setActiveTab] = useState(editData?.type || 'new');
  const [form, setForm] = useState({
    sutraName: editData?.sutra_name || '',
    whichGatha: editData?.which_gatha || '',
    totalGatha: editData?.total_gatha?.toString() || '',
  });

  useEffect(() => {
    if (editData) {
      setActiveTab(editData.type || 'new');
      setForm({
        sutraName: editData.sutra_name || '',
        whichGatha: editData.which_gatha || '',
        totalGatha: editData.total_gatha?.toString() || '',
      });
    } else {
      setForm({ sutraName: '', whichGatha: '', totalGatha: '' });
    }
  }, [editData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit({
      type: activeTab,
      sutra_name: form.sutraName,
      which_gatha: form.whichGatha,
      total_gatha: Number(form.totalGatha),
    });
  };

  const isValid = form.sutraName && form.whichGatha && form.totalGatha;
  const commonSutras = ['નવકાર', 'પંચ પરમેષ્ઠી', 'લોગસ્સ', 'ઉવસગ્ગહરં', 'ભક્તામર'];

  return (
    <div
      className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4 py-8">
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`p-4 sm:p-5 text-white rounded-t-3xl ${activeTab === 'new' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' : 'bg-gradient-to-r from-blue-500 to-cyan-600'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold">{editData ? 'Edit Entry' : 'Add Gatha'}</h3>
                  <p className="text-xs sm:text-sm opacity-80">
                    {activeUserName ? `For: ${activeUserName}` : 'Record your learning progress'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors flex-shrink-0"
              >
                <CloseIcon size={24} />
              </button>
            </div>
          </div>

          {!editData && (
            <div className="flex p-2 bg-gray-100 gap-2">
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'new' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-600 bg-white'
                }`}
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> New Learning
              </button>
              <button
                onClick={() => setActiveTab('revision')}
                className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'revision' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 bg-white'
                }`}
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" /> Revision
              </button>
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto p-4 sm:p-5 space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                📖 Sutra Name
                <HelpTooltip text="Enter the name of the sutra you learned or revised" />
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {commonSutras.map((sutra) => (
                  <button
                    key={sutra}
                    type="button"
                    onClick={() => setForm({ ...form, sutraName: sutra })}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      form.sutraName === sutra
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sutra}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={form.sutraName}
                onChange={(e) => setForm({ ...form, sutraName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
                placeholder="Enter sutra name or select above"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                📝 Which Gatha
                <HelpTooltip text="Enter the gatha numbers you completed (e.g., 1-5 or 3,4,5)" />
              </label>
              <input
                type="text"
                value={form.whichGatha}
                onChange={(e) => setForm({ ...form, whichGatha: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
                placeholder="e.g., Gatha 1-5 or 3,4,5"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block flex items-center gap-2">
                #️⃣ Total Count
                <HelpTooltip text="How many gathas did you complete in total?" />
              </label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setForm({ ...form, totalGatha: num.toString() })}
                    className={`flex-1 py-2.5 sm:py-3 rounded-xl font-bold text-sm transition-all ${
                      form.totalGatha === num.toString()
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={form.totalGatha}
                onChange={(e) => setForm({ ...form, totalGatha: e.target.value })}
                className="w-full mt-2 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
                placeholder="Or enter custom count"
                min="1"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t bg-gray-50 rounded-b-3xl">
            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-[0.98] transition-transform text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !isValid}
                className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform text-sm ${
                  activeTab === 'new'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <Loader className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {editData ? 'Save' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HISTORY PAGE COMPONENT
// ============================================

const HistoryPage = ({ activeUserId }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const fetchHistory = useCallback(async (year, month) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const userParam = activeUserId ? `?studentId=${activeUserId}` : '';
      const url = `${API_BASE}/history/${year}/${month}${userParam}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) throw new Error('Failed to load history.');
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
      setHistoryData(null);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchHistory(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchHistory]);

  const handleMonthChange = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) { newMonth = 1; newYear += 1; }
    else if (newMonth < 1) { newMonth = 12; newYear -= 1; }

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) return;

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  const activityData = useMemo(() => historyData?.dailyActivity ?? {}, [historyData?.dailyActivity]);
  const todayIso = formatLocalDateString(today);

  const monthlySummary = useMemo(() => {
    let presentCount = 0, newGathas = 0, revisionGathas = 0;

    Object.entries(activityData).forEach(([_, activity]) => {
      const normalized = activity || {};
      const gathas = normalized.gathas || { new: 0, revision: 0 };
      if (normalized.present) presentCount += 1;
      newGathas += Number(gathas.new || 0);
      revisionGathas += Number(gathas.revision || 0);
    });

    return { presentDays: presentCount, newGathas, revisionGathas };
  }, [activityData]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  // Count absent weekdays
  const absentWeekdays = useMemo(() => {
    const todayNow = new Date();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedYear, selectedMonth - 1, day);
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (date <= todayNow && date.getDay() !== 0) {
        const activity = activityData[dateStr];
        if (!activity?.present) count++;
      }
    }
    return count;
  }, [activityData, daysInMonth, selectedYear, selectedMonth]);

  const renderCalendar = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 sm:h-11" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activity = activityData[dateStr];
      const isPresent = activity?.present === true;
      const isToday = dateStr === todayIso;
      const hasGathas = (activity?.gathas?.new || 0) + (activity?.gathas?.revision || 0) > 0;
      const isFuture = new Date(dateStr) > today;
      const isSunday = new Date(dateStr).getDay() === 0;
      const isPastWeekday = !isFuture && !isSunday && new Date(dateStr) <= today;
      const isAbsentWeekday = isPastWeekday && !isPresent;

      days.push(
        <button
          key={day}
          onClick={() => isPresent && setSelectedDay({ dateStr, activity })}
          disabled={!isPresent || isFuture}
          className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
            isPresent
              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md active:scale-95'
              : isToday && !isPresent
              ? 'bg-orange-100 text-orange-600 border-2 border-orange-400 ring-2 ring-orange-200'
              : isSunday
              ? 'bg-red-50 text-red-300'
              : isAbsentWeekday
              ? 'bg-red-100 text-red-500 border border-red-300'
              : isFuture
              ? 'text-gray-200'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          <div className="relative">
            {isAbsentWeekday ? <span className="text-red-400">✗</span> : day}
            {hasGathas && isPresent && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-purple-500 rounded-full" />
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">
            {activeUserId ? `Viewing ${activeUserId}'s History` : "My Personal History"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Green = Present • Red tint = Sunday (Holiday) • Tap green days for details
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-2 sm:p-3 rounded-xl bg-orange-50 active:scale-95 transition-transform"
          >
            <ChevronLeft size={20} className="text-orange-600 sm:w-6 sm:h-6" />
          </button>
          <div className="text-center">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">{monthNames[selectedMonth - 1]} {selectedYear}</h3>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()}
            className="p-2 sm:p-3 rounded-xl bg-orange-50 active:scale-95 transition-transform disabled:opacity-40"
          >
            <ChevronRight size={20} className="text-orange-600 sm:w-6 sm:h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-orange-500 mx-auto" />
            <p className="mt-4 text-gray-600 font-medium text-sm sm:text-base">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 sm:p-6 text-center">
            <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium text-sm">{error}</p>
            <button
              onClick={() => fetchHistory(selectedYear, selectedMonth)}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium text-sm"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-2 sm:p-3 mb-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className={`h-6 sm:h-8 flex items-center justify-center text-xs font-bold ${i === 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-green-400 to-green-600" />
                <span className="text-gray-600">Present ({monthlySummary.presentDays})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-red-100 border border-red-300" />
                <span className="text-gray-600">Absent ({absentWeekdays})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-red-50 border border-red-200" />
                <span className="text-gray-600">Sunday</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-2 sm:p-3 text-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-green-600">{monthlySummary.presentDays}</p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-2 sm:p-3 text-center">
                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-red-500">{absentWeekdays}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-2 sm:p-3 text-center">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{monthlySummary.newGathas}</p>
                <p className="text-xs text-gray-500">New Gathas</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-2 sm:p-3 text-center">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{monthlySummary.revisionGathas}</p>
                <p className="text-xs text-gray-500">Revisions</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div
          className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 overflow-y-auto"
          onClick={() => setSelectedDay(null)}
        >
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <div
              className="bg-white rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Check className="w-6 h-6 sm:w-7 sm:h-7 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 text-base sm:text-lg">
                      {formatDateIn(selectedDay.dateStr, { weekday: 'short', day: 'numeric', month: 'short' })}
                    </h3>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Present ✓</span>
                  </div>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 bg-gray-100 rounded-xl flex-shrink-0">
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                <div className="bg-purple-50 rounded-xl p-3 sm:p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Plus size={18} className="text-purple-600 flex-shrink-0" />
                    New Gathas: {selectedDay.activity.gathas?.new || 0}
                  </h4>
                  {(selectedDay.activity.details || []).filter((d) => d.type === 'new').length === 0 ? (
                    <p className="text-sm text-purple-600 bg-white/50 px-3 py-2 rounded-lg">No new gathas recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedDay.activity.details || []).filter((d) => d.type === 'new').map((entry, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                          <p className="text-sm"><strong>Sutra:</strong> {entry.sutra_name}</p>
                          <p className="text-sm"><strong>Gatha:</strong> {entry.which_gatha}</p>
                          <p className="text-sm font-bold text-purple-700">Count: {entry.total_gatha}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 rounded-xl p-3 sm:p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <RefreshCw size={18} className="text-blue-600 flex-shrink-0" />
                    Revisions: {selectedDay.activity.gathas?.revision || 0}
                  </h4>
                  {(selectedDay.activity.details || []).filter((d) => d.type === 'revision').length === 0 ? (
                    <p className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg">No revisions recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {(selectedDay.activity.details || []).filter((d) => d.type === 'revision').map((entry, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 border border-blue-200">
                          <p className="text-sm"><strong>Sutra:</strong> {entry.sutra_name}</p>
                          <p className="text-sm"><strong>Gatha:</strong> {entry.which_gatha}</p>
                          <p className="text-sm font-bold text-blue-700">Count: {entry.total_gatha}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setSelectedDay(null)}
                className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl active:scale-[0.98] transition-transform text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// PENDING PAGE COMPONENT
// ============================================

const PendingPage = ({ pendingStatus, onRefresh, onEdit, onDelete, isSubmitting }) => {
  const PendingBadge = ({ status }) => {
    const badges = {
      pending: { className: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: Clock, label: 'Pending' },
      approved: { className: 'text-green-700 bg-green-100 border-green-200', icon: Check, label: 'Approved' },
      rejected: { className: 'text-red-700 bg-red-100 border-red-200', icon: CloseIcon, label: 'Rejected' },
    };
    const badge = badges[status];
    if (!badge) return null;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full border text-xs px-2 py-0.5 ${badge.className}`}>
        <Icon className={`w-3 h-3 ${status === 'pending' ? 'animate-pulse' : ''}`} />
        {badge.label}
      </span>
    );
  };

  const allPending = [
    ...(pendingStatus.attendance?.filter((p) => p.status === 'pending').map((p) => ({ ...p, itemType: 'attendance' })) || []),
    ...(pendingStatus.gatha?.filter((p) => p.status === 'pending').map((p) => ({ ...p, itemType: 'gatha' })) || []),
  ];

  const allRejected = [
    ...(pendingStatus.attendance?.filter((p) => p.status === 'rejected').map((p) => ({ ...p, itemType: 'attendance' })) || []),
    ...(pendingStatus.gatha?.filter((p) => p.status === 'rejected').map((p) => ({ ...p, itemType: 'gatha' })) || []),
  ];

  const totalPendingCount = allPending.length;

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-yellow-800">What is Pending?</p>
          <p className="text-xs text-yellow-700 mt-1">
            After you mark attendance or add gathas, your teacher needs to approve them.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-bold text-base sm:text-lg">Pending Approvals</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isSubmitting}
              className="p-2 sm:p-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-4xl sm:text-5xl font-bold">{totalPendingCount}</p>
          <p className="text-xs sm:text-sm opacity-80 mt-1">
            {totalPendingCount === 0 ? 'All caught up!' : 'items awaiting approval'}
          </p>
        </div>
      </div>

      {totalPendingCount === 0 ? (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-green-200 text-center shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-gray-800">All Caught Up! 🎉</p>
          <p className="text-sm text-gray-500 mt-2">No pending approvals</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-yellow-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            Awaiting Approval
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {allPending.map((item, index) => (
              <div
                key={index}
                className={`p-3 sm:p-4 rounded-xl border-2 ${
                  item.itemType === 'attendance' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      item.itemType === 'attendance' ? 'bg-blue-200' : 'bg-purple-200'
                    }`}>
                      {item.itemType === 'attendance' ? (
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-700" />
                      ) : (
                        <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm">
                        {item.itemType === 'attendance' ? 'Attendance' : `Gatha - ${item.type === 'new' ? 'New' : 'Revision'}`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">{formatDateIn(item.date)}</p>
                      {item.itemType === 'gatha' && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {item.sutra_name} • {item.total_gatha} gathas
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <PendingBadge status="pending" />
                    {item.itemType === 'gatha' && onEdit && onDelete && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 sm:p-2 bg-blue-100 rounded-lg text-blue-600 active:scale-95 transition-transform"
                        >
                          <Edit2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 sm:p-2 bg-red-100 rounded-lg text-red-600 active:scale-95 transition-transform"
                        >
                          <Trash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {allRejected.length > 0 && (
        <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-red-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            Rejected ({allRejected.length})
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {allRejected.map((item, index) => (
              <div key={index} className="p-3 sm:p-4 rounded-xl bg-red-50 border-2 border-red-200">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.itemType === 'attendance' ? (
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                    ) : (
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-sm">
                      {item.itemType === 'attendance' ? 'Attendance' : `Gatha - ${item.type}`}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">{formatDateIn(item.date)}</p>
                    {item.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1 bg-red-100 px-2 py-1 rounded truncate">
                        Reason: {item.rejection_reason}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 font-bold rounded-full border text-xs px-2 py-0.5 text-red-700 bg-red-100 border-red-200">
                    <CloseIcon className="w-3 h-3" />
                    Rejected
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// RECENT BADGES COMPONENT
// ============================================

const RecentBadges = ({ stats, onBadgeClick }) => {
  const recentlyUnlocked = useMemo(() => {
    return MONTHLY_ACHIEVEMENTS
      .filter((a) => calculateAchievementProgress(a, stats).unlocked)
      .slice(0, 4);
  }, [stats]);

  if (recentlyUnlocked.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center border-2 border-gray-200">
        <Award className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No badges yet this month</p>
        <p className="text-gray-400 text-xs mt-1">Keep learning to unlock!</p>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2">
      {recentlyUnlocked.map((achievement) => {
        const Icon = achievement.icon;
        const colors = ACHIEVEMENT_COLORS[achievement.color];

        return (
          <button
            key={achievement.id}
            onClick={() => onBadgeClick?.(achievement)}
            className="flex-shrink-0 w-16 sm:w-20 p-2 bg-white rounded-xl border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
          >
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full mx-auto mb-1 flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-800 text-center truncate">{achievement.title}</p>
            <p className="text-xs text-center">{colors.icon}</p>
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// NEXT BADGES COMPONENT
// ============================================

const NextBadges = ({ stats, onBadgeClick }) => {
  const nextAchievements = useMemo(() => {
    return MONTHLY_ACHIEVEMENTS
      .map((a) => ({ ...a, ...calculateAchievementProgress(a, stats) }))
      .filter((a) => !a.unlocked && a.progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 2);
  }, [stats]);

  if (nextAchievements.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 sm:p-4 border-2 border-green-200">
      <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2 text-sm sm:text-base">
        <Target className="w-4 h-4 sm:w-5 sm:h-5" />
        Almost There! Keep Going!
      </h4>
      <div className="space-y-2 sm:space-y-3">
        {nextAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const colors = ACHIEVEMENT_COLORS[achievement.color];

          return (
            <button
              key={achievement.id}
              onClick={() => onBadgeClick?.(achievement)}
              className="w-full flex items-center gap-2 sm:gap-3 bg-white rounded-xl p-2 sm:p-3 border border-green-200 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.bg} flex-shrink-0`}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{achievement.title}</p>
                <p className="text-xs text-gray-500 truncate">({achievement.subtitle})</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                      style={{ width: `${achievement.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500 flex-shrink-0">
                    {achievement.current}/{achievement.target}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN STUDENT DASHBOARD COMPONENT
// ============================================

export default function StudentDashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);

  // Group/Account Switching States
  const [groupMembers, setGroupMembers] = useState([]);
  const [activeUser, setActiveUser] = useState(user);
  const [isLoadingSwitch, setIsLoadingSwitch] = useState(false);
  const activeUserRef = useRef(activeUser);

  useEffect(() => {
    activeUserRef.current = activeUser;
  }, [activeUser]);

  // Data states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [gathaEntries, setGathaEntries] = useState([]);
  const [pendingStatus, setPendingStatus] = useState({ attendance: [], gatha: [] });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Stats
  const [monthlyAttendance, setMonthlyAttendance] = useState(0);
  const [monthlyNewGathas, setMonthlyNewGathas] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // Global
  const [maxStreak, setMaxStreak] = useState(0); // Global
  const [workingDays] = useState(DEFAULT_WORKING_DAYS);

  // Selected period for stats
  const [statsMonth, setStatsMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [showTips, setShowTips] = useState(true);
  const [showGathaModal, setShowGathaModal] = useState(false);
  const [editingGatha, setEditingGatha] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const todayIso = formatLocalDateString(new Date());
  const greeting = getGreeting();
  const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  const activeUsername = activeUser?.username || activeUser?.name;
  const loggedInUsername = user?.username || user?.name;
  const isViewingOther = activeUsername !== loggedInUsername;

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const normalizeEntry = (entry) => ({
    id: entry.id ?? entry._id ?? null,
    type: entry.type,
    sutra_name: entry.sutra_name ?? entry.sutraName ?? '',
    which_gatha: entry.which_gatha ?? entry.whichGatha ?? '',
    total_gatha: Number(entry.total_gatha ?? entry.totalGatha ?? 0),
    created_at: entry.created_at ?? entry.date ?? null,
  });

  // ============================================
  // FIXED STREAK CALCULATION (SUNDAY-SAFE)
  // ============================================
  const calculateStreak = useCallback((history) => {
    const sortedDates = history
      .map((r) => formatLocalDateString(r.date))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) return { current: 0, max: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let max = 0;
    let tempStreak = 1;
    let streakBroken = false;

    // Check if streak is still active from today
    const lastDate = new Date(sortedDates[0]);
    lastDate.setHours(0, 0, 0, 0);
    const diffFromToday = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    if (diffFromToday === 0) {
      streakBroken = false;
    } else if (diffFromToday === 1) {
      streakBroken = false;
    } else if (diffFromToday === 2) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (yesterday.getDay() === 0) {
        streakBroken = false; 
      } else {
        streakBroken = true;
      }
    } else {
      streakBroken = true;
    }

    // Count the streak
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
        if (!streakBroken) current = 1;
        continue;
      }

      const currentDate = new Date(sortedDates[i - 1]);
      const prevDate = new Date(sortedDates[i]);
      const diff = Math.floor((currentDate - prevDate) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        tempStreak++;
        if (!streakBroken) current = tempStreak;
      } else if (diff === 2) {
        const gapDay = new Date(prevDate);
        gapDay.setDate(gapDay.getDate() + 1);
        if (gapDay.getDay() === 0) {
          tempStreak++;
          if (!streakBroken) current = tempStreak;
        } else {
          max = Math.max(max, tempStreak);
          tempStreak = 1;
          streakBroken = true;
        }
      } else {
        max = Math.max(max, tempStreak);
        tempStreak = 1;
        streakBroken = true;
      }
    }

    max = Math.max(max, tempStreak);
    if (streakBroken) current = 0;

    return { current, max };
  }, []);

  // NEW: Calculate streak ONLY within a specific month
  const calculateMonthlyStats = useCallback((year, month, history, gathas) => {
    // 1. Filter dates for this month
    const monthDates = history
      .map(r => new Date(r.date))
      .filter(d => d.getFullYear() === year && d.getMonth() + 1 === month)
      .map(d => d.getDate())
      .sort((a, b) => b - a); // Descending

    const monthlyAttendance = monthDates.length;

    // 2. Calculate max streak within this month
    let maxMonthStreak = 0;
    let tempMonthStreak = 0;
    
    if (monthDates.length > 0) {
        tempMonthStreak = 1;
        maxMonthStreak = 1;
        for (let i = 0; i < monthDates.length - 1; i++) {
            const currentDay = monthDates[i];
            const nextDay = monthDates[i+1]; // Note: iterating backwards effectively
            const diff = currentDay - nextDay;
            
            if (diff === 1) {
                tempMonthStreak++;
            } else if (diff === 2) {
               // Check if gap was Sunday
               // Need full date for Sunday check
               const d = new Date(year, month - 1, currentDay - 1);
               if (d.getDay() === 0) {
                   tempMonthStreak++;
               } else {
                   maxMonthStreak = Math.max(maxMonthStreak, tempMonthStreak);
                   tempMonthStreak = 1;
               }
            } else {
                maxMonthStreak = Math.max(maxMonthStreak, tempMonthStreak);
                tempMonthStreak = 1;
            }
        }
        maxMonthStreak = Math.max(maxMonthStreak, tempMonthStreak);
    }

    // 3. Filter gathas
    const monthlyNewGathas = gathaEntries
      .filter(e => {
        const d = new Date(e.created_at);
        return d.getFullYear() === year && d.getMonth() + 1 === month && e.type === 'new';
      })
      .reduce((sum, e) => sum + (e.total_gatha || 0), 0);

    return {
        monthlyAttendance,
        monthlyNewGathas,
        maxStreak: maxMonthStreak // This is monthly scoped!
    };
  }, [gathaEntries]);

  // ============================================
  // API CALLS
  // ============================================

  const fetchGroupMembers = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/family-members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const members = data.familyMembers || [];
        if (members.length > 0) {
          const formattedMembers = members.map(m => ({
            _id: m.username,
            id: m.username,
            username: m.username,
            name: m.name || m.username,
            isCurrent: m.isCurrent
          }));
          setGroupMembers(formattedMembers);
        } else {
          setGroupMembers([]);
        }
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  }, []);

  const fetchPendingStatus = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/student/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPendingStatus(await res.json());
    } catch (error) {
      console.error('Error fetching pending:', error);
    }
  }, []);

  const fetchAttendance = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(Array.isArray(data) ? data : []);
        // Global streak calculation
        const streakData = calculateStreak(data);
        setCurrentStreak(streakData.current);
        setMaxStreak(streakData.max);

        // Initial monthly stats for current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyCount = data.filter((r) => {
          const date = new Date(r.date);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        setMonthlyAttendance(monthlyCount);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [calculateStreak]);

  const fetchGathas = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/gatha`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const entries = Array.isArray(data) ? data.map(normalizeEntry) : [];
        setGathaEntries(entries);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyNew = entries
          .filter((e) => {
            const date = new Date(e.created_at);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear && e.type === 'new';
          })
          .reduce((sum, e) => sum + (e.total_gatha || 0), 0);
        setMonthlyNewGathas(monthlyNew);
      }
    } catch (error) {
      console.error('Error fetching gathas:', error);
    }
  }, []);

  // const fetchMonthlyStats = useCallback(async (year, month) => {
  //   // We rely on local calculation now for accuracy on switch
  // }, []);

  const loadUserData = useCallback(async (username) => {
    setIsLoadingSwitch(true);
    setGlobalError('');
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(`${API_BASE}/family-member/${username}/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load data (${res.status})`);
      }

      const data = await res.json();
      const recentAttendance = data.recentAttendance || [];
      const recentGathas = (data.recentGathas || []).map(normalizeEntry);

      setAttendanceHistory(recentAttendance);
      setGathaEntries(recentGathas);
      setPendingStatus({
        attendance: data.pendingAttendance || [],
        gatha: data.pendingGathas || []
      });

      // Recalculate everything locally
      const streakData = calculateStreak(recentAttendance);
      setCurrentStreak(streakData.current);
      setMaxStreak(streakData.max);
      
      return true;
    } catch (error) {
      console.error('Error loading user data:', error);
      setGlobalError(`Failed to load data: ${error.message}`);
      return false;
    } finally {
      setIsLoadingSwitch(false);
    }
  }, [calculateStreak]);

  const handleUserSwitch = useCallback(async (newUser) => {
    const newUsername = newUser.username || newUser.name;
    const currentActiveUsername = activeUserRef.current?.username || activeUserRef.current?.name;

    if (newUsername === currentActiveUsername) return;

    setActiveUser(newUser);

    if (newUsername === loggedInUsername) {
      setIsLoadingSwitch(true);
      try {
        await Promise.all([
          fetchAttendance(),
          fetchGathas(),
          fetchPendingStatus(),
        ]);
        showSuccess('Switched back to your dashboard');
      } finally {
        setIsLoadingSwitch(false);
      }
    } else {
      const success = await loadUserData(newUsername);
      if (success) {
        showSuccess(`Switched to ${newUser.name || newUsername}'s dashboard`);
      } else {
        setActiveUser(activeUserRef.current);
      }
    }
  }, [loggedInUsername, loadUserData, fetchAttendance, fetchGathas, fetchPendingStatus]);

  const handleStatsMonthChange = useCallback((year, month) => {
    setStatsMonth({ year, month });
  }, []);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchGroupMembers(),
        fetchAttendance(),
        fetchGathas(),
        fetchPendingStatus(),
      ]);
      setIsLoading(false);
    };
    loadData();

    const pollInterval = setInterval(() => {
      if (navigator.onLine && !isViewingOther) {
        fetchPendingStatus();
        fetchAttendance();
        fetchGathas();
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && !isViewingOther) {
        fetchPendingStatus();
        fetchAttendance();
        fetchGathas();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAttendance, fetchGathas, fetchPendingStatus, fetchGroupMembers, isViewingOther]);

  useEffect(() => {
    setActiveUser(user);
  }, [user]);

  // ============================================
  // DERIVED DATA
  // ============================================

  // Calculate monthly specific stats for the Achievements Page
  const statsForSelectedMonth = useMemo(() => {
    const { year, month } = statsMonth;
    return {
        ...calculateMonthlyStats(year, month, attendanceHistory, gathaEntries),
        workingDays
    };
  }, [statsMonth, attendanceHistory, gathaEntries, workingDays, calculateMonthlyStats]);

  // For homepage display (current month)
  const statsForCurrentMonth = useMemo(() => {
    const now = new Date();
    return {
        ...calculateMonthlyStats(now.getFullYear(), now.getMonth() + 1, attendanceHistory, gathaEntries),
        workingDays,
        currentStreak, // Global current streak for flame icon
        maxStreak      // Global max streak
    };
  }, [attendanceHistory, gathaEntries, workingDays, currentStreak, maxStreak, calculateMonthlyStats]);

  const todayAttendanceMarked = useMemo(
    () => attendanceHistory.some((r) => formatLocalDateString(r.date) === todayIso),
    [attendanceHistory, todayIso]
  );

  const todayPendingAttendance = useMemo(
    () => pendingStatus.attendance?.find((p) => formatLocalDateString(p.date) === todayIso && p.status === 'pending'),
    [pendingStatus.attendance, todayIso]
  );

  const todayAttendanceStatus = useMemo(() => {
    if (todayAttendanceMarked) return 'approved';
    if (todayPendingAttendance) return 'pending';
    return 'not_marked';
  }, [todayAttendanceMarked, todayPendingAttendance]);

  const todaysApprovedGathas = useMemo(
    () => gathaEntries.filter((e) => e.created_at && formatLocalDateString(e.created_at) === todayIso),
    [gathaEntries, todayIso]
  );

  const todaysPendingGathas = useMemo(
    () => pendingStatus.gatha?.filter((p) => formatLocalDateString(p.date) === todayIso && p.status === 'pending') || [],
    [pendingStatus.gatha, todayIso]
  );

  const totalPendingCount = useMemo(() => {
    const att = pendingStatus.attendance?.filter((p) => p.status === 'pending').length || 0;
    const gatha = pendingStatus.gatha?.filter((p) => p.status === 'pending').length || 0;
    return att + gatha;
  }, [pendingStatus]);

  const xpBreakdown = useMemo(
    () => calculateTotalXP(statsForCurrentMonth, MONTHLY_ACHIEVEMENTS),
    [statsForCurrentMonth]
  );

  const userLevel = useMemo(() => getUserLevel(xpBreakdown.total), [xpBreakdown.total]);

  const unlockedBadgesCount = useMemo(
    () => MONTHLY_ACHIEVEMENTS.filter((a) => calculateAchievementProgress(a, statsForCurrentMonth).unlocked).length,
    [statsForCurrentMonth]
  );

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(currentStreak, statsForCurrentMonth.monthlyAttendance, statsForCurrentMonth.monthlyNewGathas),
    [currentStreak, statsForCurrentMonth]
  );

  // ============================================
  // HANDLERS
  // ============================================

  const markAttendance = async () => {
    if (todayAttendanceStatus !== 'not_marked') return;

    setGlobalError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const endpoint = isViewingOther
        ? `${API_BASE}/attendance/mark-for`
        : `${API_BASE}/attendance/mark`;

      const body = isViewingOther
        ? { forUsername: activeUsername }
        : {};

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');

      showSuccess(data.message || '✅ Attendance submitted! Waiting for approval.');

      if (isViewingOther) {
        await loadUserData(activeUsername);
      } else {
        await fetchPendingStatus();
        await fetchAttendance();
      }
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGatha = async (formData) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setIsSubmitting(true);
    setGlobalError('');

    try {
      let url, bodyData;

      if (editingGatha) {
        url = `${API_BASE}/gatha/pending/${editingGatha.id}`;
        bodyData = formData;
      } else if (isViewingOther) {
        url = `${API_BASE}/gatha-for`;
        bodyData = { ...formData, forUsername: activeUsername };
      } else {
        url = `${API_BASE}/gatha`;
        bodyData = formData;
      }

      const res = await fetch(url, {
        method: editingGatha ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit gatha');
      }

      const data = await res.json();
      showSuccess(data.message || (editingGatha ? '✅ Gatha updated!' : '✅ Gatha submitted!'));
      setShowGathaModal(false);
      setEditingGatha(null);

      if (isViewingOther) {
        await loadUserData(activeUsername);
      } else {
        await Promise.all([fetchPendingStatus(), fetchGathas()]);
      }
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletePendingGatha = async (id) => {
    setConfirmAction(null);
    const token = localStorage.getItem('jainPathshalaToken');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/gatha/pending/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      showSuccess('🗑️ Entry deleted successfully');
      await Promise.all([fetchPendingStatus(), fetchGathas()]);
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER HOME PAGE ====================
  const renderHome = () => (
    <div className="space-y-4">
      {!isOnline && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-center">
          <p className="text-red-700 text-sm font-medium">📵 You are offline. Some features may not work.</p>
        </div>
      )}

      {groupMembers.length > 1 && (
        <UserSwitcher
          groupMembers={groupMembers}
          activeUser={activeUser}
          loggedInUser={user}
          onSwitch={handleUserSwitch}
          isLoading={isLoadingSwitch}
        />
      )}

      {isViewingOther && (
        <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-bold">
              {(activeUser?.name || activeUsername || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
                            <p className="font-bold text-blue-800 text-sm">
                Viewing: {activeUser?.name || activeUsername}
              </p>
              <p className="text-xs text-blue-600">
                Actions will be performed for this user
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUserSwitch(user)}
            className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-xl"
          >
            Back to Me
          </button>
        </div>
      )}

      {isLoadingSwitch && (
        <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Loading {activeUser?.name || activeUsername}'s data...</p>
        </div>
      )}

      {/* Welcome Card */}
      <button
        onClick={() => setShowLevelModal(true)}
        className="w-full text-left bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 rounded-3xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/10 rounded-full -mr-16 sm:-mr-20 -mt-16 sm:-mt-20" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/10 rounded-full -ml-12 sm:-ml-16 -mb-12 sm:-mb-16" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl sm:text-3xl">{greeting.emoji}</span>
                <span className="text-orange-100 text-xs sm:text-sm font-medium">{greeting.text}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {activeUser?.name || activeUsername}
                {isViewingOther && <span className="text-sm opacity-80 ml-2">(Viewing)</span>}
              </h1>
              <p className="text-orange-100 text-xs sm:text-sm mt-1">{motivationalMessage.text}</p>
            </div>
            <div className="flex flex-col items-center flex-shrink-0 ml-2">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-lg">
                {userLevel.icon}
              </div>
              <span className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Lv.{userLevel.level}
              </span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-xl p-2 sm:p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-bold">{userLevel.name}</span>
              <span className="text-xs flex items-center gap-1">
                {xpBreakdown.total} XP
                <Info className="w-3 h-3 opacity-60" />
              </span>
            </div>
            {userLevel.nextLevel && (
              <div className="h-1.5 sm:h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${userLevel.progressToNext * 100}%` }}
                />
              </div>
            )}
            <p className="text-xs text-orange-100 mt-1 text-center">Tap to see level details & XP breakdown</p>
          </div>
        </div>
      </button>

      {showTips && !isViewingOther && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              <span className="font-bold text-blue-800 text-sm sm:text-base">Quick Tips</span>
            </div>
            <button onClick={() => setShowTips(false)} className="text-blue-400 p-1">
              <CloseIcon size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HELPFUL_TIPS.map((tip, i) => {
              const TipIcon = tip.icon;
              const iconColorClass = TIP_ICON_COLORS[tip.color] || 'text-gray-500';
              return (
                <div key={i} className="flex items-start gap-2 bg-white p-2 rounded-lg">
                  <TipIcon className={`w-3 h-3 sm:w-4 sm:h-4 ${iconColorClass} flex-shrink-0 mt-0.5`} />
                  <span className="text-xs text-gray-600">{tip.tipText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Absence Awareness Card */}
      <AbsenceAwarenessCard
        attendanceHistory={attendanceHistory}
        todayMarked={todayAttendanceMarked}
      />

      {/* Monthly Week Strip */}
      <div className="card-animate card-animate-4">
        <MonthlyWeekStrip
          attendanceHistory={attendanceHistory}
          todayIso={todayIso}
        />
      </div>

      {/* Global Streak Display */}
      <div className="card-animate card-animate-5">
        <StreakDisplay streak={currentStreak} maxStreak={maxStreak} />
      </div>

      {/* Today's Quick Actions */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm card-animate card-animate-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            Today's Goals
            {isViewingOther && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                For {(activeUser?.name || activeUsername)?.split(' ')[0]}
              </span>
            )}
          </h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full font-bold">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            onClick={markAttendance}
            disabled={todayAttendanceStatus !== 'not_marked' || isSubmitting}
            className={`p-3 sm:p-4 rounded-2xl transition-all active:scale-[0.97] ${
              todayAttendanceStatus === 'approved'
                ? 'bg-green-100 border-2 border-green-300'
                : todayAttendanceStatus === 'pending'
                ? 'bg-yellow-100 border-2 border-yellow-300'
                : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg btn-glow-blue'
            }`}
          >
            {todayAttendanceStatus === 'approved' ? (
              <>
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 text-green-600" />
                <p className="font-bold text-green-700 text-sm">Present ✓</p>
                <p className="text-xs text-green-600">+{XP_VALUES.attendance} XP earned!</p>
              </>
            ) : todayAttendanceStatus === 'pending' ? (
              <>
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2 text-yellow-600 animate-pulse" />
                <p className="font-bold text-yellow-700 text-sm">Pending...</p>
                <p className="text-xs text-yellow-600">Waiting for approval</p>
              </>
            ) : (
              <>
                <Calendar className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2" />
                <p className="font-bold text-sm">Mark Present</p>
                <p className="text-xs opacity-80">+{XP_VALUES.attendance} XP</p>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setEditingGatha(null);
              setShowGathaModal(true);
            }}
            className="relative p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg active:scale-[0.97] transition-transform btn-glow-purple"
          >
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 sm:mb-2" />
            <p className="font-bold text-sm">Add Gatha</p>
            <p className="text-xs opacity-80">Record learning</p>
            {todaysApprovedGathas.length + todaysPendingGathas.length > 0 && (
              <span className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                {todaysApprovedGathas.length + todaysPendingGathas.length}
              </span>
            )}
          </button>
        </div>

        {(todaysApprovedGathas.length > 0 || todaysPendingGathas.length > 0) && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-100">
            <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
              <BookMarked className="w-3 h-3 sm:w-4 sm:h-4" />
              Today's Gathas ({todaysApprovedGathas.length + todaysPendingGathas.length})
            </p>
            <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto">
              {[
                ...todaysApprovedGathas.map((e) => ({ ...e, status: 'approved' })),
                ...todaysPendingGathas.map((e) => ({ ...e, status: 'pending' })),
              ].map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2 sm:p-3 rounded-xl ${
                    entry.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${entry.type === 'new' ? 'bg-purple-200' : 'bg-blue-200'}`}>
                      {entry.type === 'new' ? <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-700" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-800 truncate">{entry.sutra_name}</p>
                      <p className="text-xs text-gray-500 truncate">{entry.total_gatha} gathas • {entry.which_gatha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 font-bold rounded-full border text-xs px-2 py-0.5 ${
                      entry.status === 'approved' 
                        ? 'text-green-700 bg-green-100 border-green-200' 
                        : 'text-yellow-700 bg-yellow-100 border-yellow-200'
                    }`}>
                      {entry.status === 'approved' ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3 animate-pulse" />}
                      {entry.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                    {entry.status === 'pending' && !isViewingOther && (
                      <div className="flex gap-1">
                        <button onClick={() => { setEditingGatha(entry); setShowGathaModal(true); }} className="p-1 sm:p-1.5 bg-blue-100 rounded-lg text-blue-600">
                          <Edit2 size={10} className="sm:w-3 sm:h-3" />
                        </button>
                        <button onClick={() => setConfirmAction({ title: 'Delete Gatha', message: 'Are you sure you want to delete this entry?', handler: () => deletePendingGatha(entry.id) })} className="p-1 sm:p-1.5 bg-red-100 rounded-lg text-red-600">
                          <Trash2 size={10} className="sm:w-3 sm:h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 card-animate card-animate-7">
        <QuickStatCard icon={CalendarDays} value={monthlyAttendance} label="Days Present" color="green" sublabel="This Month" />
        <QuickStatCard icon={BookMarked} value={monthlyNewGathas} label="New Gathas" color="purple" sublabel="This Month" />
      </div>

      {/* Last Visit Card */}
      <div className="card-animate card-animate-8">
        <LastVisitCard
          attendanceHistory={attendanceHistory}
          gathaEntries={gathaEntries}
          currentStreak={currentStreak}
          statsForCurrentMonth={statsForCurrentMonth}
          onGoToStats={() => setCurrentPage(PAGES.STATS)}
        />
      </div>

      <div className="bg-white rounded-2xl p-3 sm:p-4 border-2 border-yellow-200 shadow-sm card-animate card-animate-9">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm sm:text-base">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            {isViewingOther ? `${(activeUser?.name || activeUsername)?.split(' ')[0]}'s Badges` : 'Your Badges'}
          </h3>
          <button onClick={() => setCurrentPage(PAGES.STATS)} className="text-xs bg-yellow-100 text-yellow-700 px-2 sm:px-3 py-1 rounded-full font-bold flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <RecentBadges stats={statsForCurrentMonth} onBadgeClick={setSelectedAchievement} />
      </div>

      <NextBadges stats={statsForCurrentMonth} onBadgeClick={setSelectedAchievement} />

      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-3 sm:p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 sm:w-24 h-20 sm:h-24 bg-white/10 rounded-full -mr-10 sm:-mr-12 -mt-10 sm:-mt-12" />
        <div className="relative z-10 flex items-start gap-2 sm:gap-3">
          <span className="text-3xl sm:text-4xl flex-shrink-0">{dailyQuote.emoji}</span>
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold">{dailyQuote.text}</p>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1">{dailyQuote.meaning}</p>
            <p className="text-xs text-indigo-200 mt-2">— {dailyQuote.lang} Proverb</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER STATS PAGE ====================
  const renderStats = () => (
    <div className="space-y-4">
      {!isOnline && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-center">
          <p className="text-red-700 text-sm font-medium">📵 You are offline.</p>
        </div>
      )}

      {isViewingOther && (
        <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-3 flex items-center gap-3">
          <UserCircle className="w-8 h-8 text-blue-600" />
          <div className="flex-1">
            <p className="font-bold text-blue-800 text-sm">
              Viewing stats for: {activeUser?.name || activeUsername}
            </p>
            <p className="text-xs text-blue-600">
              Change month to see different periods
            </p>
          </div>
        </div>
      )}

      <StudentAchievementPage
        stats={statsForSelectedMonth}
        onMonthChange={handleStatsMonthChange}
        workingDays={workingDays}
        key={`stats-${activeUsername}-${statsMonth.year}-${statsMonth.month}`}
      />

      <LeaderboardSection
        currentUserId={activeUsername}
        currentUserName={activeUser?.name || activeUsername}
        year={statsMonth.year}
        month={statsMonth.month}
      />
    </div>
  );

  // ==================== RENDER CONTENT ====================
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-2xl p-12 sm:p-16 text-center border-2 border-orange-200 shadow-sm">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-orange-500" />
          </div>
          <p className="text-gray-600 font-medium text-base sm:text-lg">Loading your dashboard...</p>
        </div>
      );
    }

    let pageContent;
    switch (currentPage) {
      case PAGES.HOME:
        pageContent = renderHome();
        break;
      case PAGES.STATS:
        pageContent = renderStats();
        break;
      case PAGES.HISTORY:
        pageContent = <HistoryPage activeUserId={isViewingOther ? activeUsername : null} />;
        break;
      case PAGES.PENDING:
        pageContent = (
          <PendingPage
            pendingStatus={pendingStatus}
            onRefresh={fetchPendingStatus}
            onEdit={(item) => { setEditingGatha(item); setShowGathaModal(true); }}
            onDelete={(item) => setConfirmAction({ title: 'Delete Gatha', message: 'Are you sure you want to delete this entry?', handler: () => deletePendingGatha(item.id) })}
            isSubmitting={isSubmitting}
          />
        );
        break;
      default:
        pageContent = renderHome();
    }
    
    return (
      <PageTransitionWrapper pageKey={currentPage}>
        {pageContent}
      </PageTransitionWrapper>
    );
  };

  // ==================== MAIN RETURN ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-24">
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-md px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-800 text-xs sm:text-sm truncate">શ્રી સોમચીન્તામણી વાસુપૂજ્યસ્વામી જૈન પાઠશાળા</h1>
              {isViewingOther && (
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <UserCircle className="w-3 h-3" />
                  Viewing: {(activeUser?.name || activeUsername)?.split(' ')[0]}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 sm:gap-2 bg-red-50 text-red-600 px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm active:scale-[0.98] transition-transform border border-red-200 flex-shrink-0"
          >
            <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <ErrorBanner message={globalError} onClose={() => setGlobalError('')} />

        <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3 sm:mb-4">
          {[
            { key: PAGES.HOME, icon: Home, label: 'Home' },
            { key: PAGES.STATS, icon: Award, label: 'Stats', badge: unlockedBadgesCount },
            { key: PAGES.HISTORY, icon: Calendar, label: 'History' },
            { key: PAGES.PENDING, icon: Clock, label: 'Pending', badge: totalPendingCount, badgeColor: 'red' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentPage(tab.key)}
              className={`relative flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-xl sm:rounded-2xl font-bold text-xs transition-all active:scale-[0.97] ${
                currentPage === tab.key
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-orange-200 shadow-sm'
              }`}
            >
              <tab.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs">{tab.label}</span>
              {tab.badge > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs font-bold shadow ${tab.badgeColor === 'red' ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500 text-white'}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {renderContent()}

        <div className="mt-6 sm:mt-8 text-center py-4">
          <p className="text-gray-400 text-xs">© 2025 Aadinath Parshwanth Jain Sangh</p>
        </div>
      </div>

      <GathaEntryModal
        isOpen={showGathaModal}
        onClose={() => { setShowGathaModal(false); setEditingGatha(null); }}
        onSubmit={submitGatha}
        isSubmitting={isSubmitting}
        editData={editingGatha}
        activeUserName={isViewingOther ? (activeUser?.name || activeUsername) : null}
      />

      <ConfirmationModal
        title={confirmAction?.title}
        message={confirmAction?.message}
        onConfirm={confirmAction?.handler}
        onCancel={() => setConfirmAction(null)}
      />

      <AchievementDetailModal
        achievement={selectedAchievement}
        stats={statsForCurrentMonth}
        onClose={() => setSelectedAchievement(null)}
      />

      <LevelDetailsModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentXP={xpBreakdown.total}
        xpBreakdown={xpBreakdown}
        userLevel={userLevel}
        stats={statsForCurrentMonth}
      />
    </div>
  );
}
