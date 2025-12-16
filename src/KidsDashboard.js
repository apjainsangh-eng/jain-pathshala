import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

// Kids list for reference
const KIDS_LIST = ['aditi', 'ariha', 'ashvi', 'dhanvi', 'moxa', 'satva', 'venya', 'virti', 'vivan','prakhar'];

// Page Navigation
const PAGES = {
  HOME: 'home',
  STATS: 'stats',
  HISTORY: 'history',
  PENDING: 'pending',
};

// Kid-friendly Motivational Quotes
const QUOTES = [
  { text: "You're doing amazing! 🌟", meaning: "Keep up the great work!", emoji: "⭐" },
  { text: "Every day you learn something new!", meaning: "You're getting smarter!", emoji: "🧠" },
  { text: "Practice makes perfect!", meaning: "Keep trying, you'll get there!", emoji: "💪" },
  { text: "You're a superstar! ⭐", meaning: "Believe in yourself!", emoji: "🌟" },
  { text: "Great job coming to Pathshala!", meaning: "Your effort matters!", emoji: "🎉" },
  { text: "Learning is fun!", meaning: "Enjoy every moment!", emoji: "📚" },
  { text: "You make your teachers proud!", meaning: "Keep shining!", emoji: "😊" },
  { text: "One step at a time!", meaning: "Small progress is still progress!", emoji: "🚀" },
];

// Tips icon color classes
const TIP_ICON_COLORS = {
  blue: 'text-blue-500',
  purple: 'text-purple-500',
  yellow: 'text-yellow-500',
  orange: 'text-orange-500',
};

// Tips for kids
const HELPFUL_TIPS = [
  { icon: Calendar, tipText: "Tap the blue button to say 'I'm here!'", color: "blue" },
  { icon: BookOpen, tipText: "Learned a gatha? Tap purple button!", color: "purple" },
  { icon: Trophy, tipText: "See your stars in Stats tab!", color: "yellow" },
  { icon: Clock, tipText: "Waiting for teacher? Check Pending!", color: "orange" },
];

// ============================================
// HELPER UTILITIES
// ============================================

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

const formatLocalDateString = (input = new Date()) => {
  const parsed = coerceToDate(input);
  if (!parsed) return '';
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateIn = (input, options = DEFAULT_DATE_OPTIONS) => {
  const parsed = coerceToDate(input);
  if (!parsed) return '';
  return parsed.toLocaleDateString('en-IN', { ...DEFAULT_DATE_OPTIONS, ...options });
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5) return { text: 'Good Night', emoji: '🌙' };
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  if (hour < 21) return { text: 'Good Evening', emoji: '🌆' };
  return { text: 'Good Night', emoji: '🌙' };
};

const getMotivationalMessage = (streak, attendance, gathas) => {
  if (streak >= 7) return { text: "Wow! You're on fire! 🔥" };
  if (attendance >= 20) return { text: "Super student! ⭐" };
  if (gathas >= 15) return { text: "Gatha champion! 📚" };
  if (streak >= 3) return { text: "Nice streak! Keep it up! 💪" };
  if (attendance >= 5) return { text: "You're doing great! 🎯" };
  return { text: "Let's learn something new today! 🚀" };
};

// ============================================
// REUSABLE COMPONENTS
// ============================================

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Delete" }) => {
  if (!title) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex items-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-yellow-100 flex items-center justify-center mr-4">
            <AlertTriangle className="w-7 h-7 text-yellow-500" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500">Are you sure?</p>
          </div>
        </div>
        <p className="text-gray-600 mb-6 text-sm bg-gray-50 p-3 rounded-xl">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onCancel} 
            className="flex-1 px-4 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-2xl active:scale-[0.98] transition-transform"
          >
            No, Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3.5 bg-red-500 text-white font-bold rounded-2xl active:scale-[0.98] transition-transform shadow-lg"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const PendingBadge = ({ status, size = 'normal' }) => {
  const badges = {
    pending: { className: 'text-yellow-700 bg-yellow-100 border-yellow-200', icon: Clock, label: 'Waiting' },
    approved: { className: 'text-green-700 bg-green-100 border-green-200', icon: Check, label: 'Done!' },
    rejected: { className: 'text-red-700 bg-red-100 border-red-200', icon: CloseIcon, label: 'Try Again' },
  };

  const badge = badges[status];
  if (!badge) return null;
  const Icon = badge.icon;
  const sizeClasses = size === 'small' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full border ${sizeClasses} ${badge.className}`}>
      <Icon className={`${size === 'small' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {badge.label}
    </span>
  );
};

const SuccessToast = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 p-1 hover:bg-white/20 rounded-full">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const ErrorBanner = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-4 flex items-start gap-3 shadow-sm">
      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-red-700 text-sm font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="text-red-400 p-1 hover:bg-red-100 rounded-lg">
        <CloseIcon size={18} />
      </button>
    </div>
  );
};

const StreakDisplay = ({ streak, maxStreak }) => {
  const getStreakInfo = (s) => {
    if (s >= 14) return { label: 'AMAZING! 🏆', color: 'from-yellow-400 to-orange-500', emoji: '🔥' };
    if (s >= 7) return { label: 'Super Cool!', color: 'from-purple-400 to-pink-500', emoji: '⚡' };
    if (s >= 3) return { label: 'Nice!', color: 'from-green-400 to-emerald-500', emoji: '🌟' };
    if (s >= 1) return { label: 'Good Start!', color: 'from-cyan-400 to-blue-500', emoji: '🚀' };
    return { label: 'Start Today!', color: 'from-gray-400 to-gray-500', emoji: '💪' };
  };

  const info = getStreakInfo(streak);

  return (
    <div className={`bg-gradient-to-r ${info.color} rounded-2xl p-4 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6" />
            <span className="font-bold">My Streak</span>
          </div>
          <span className="text-4xl">{info.emoji}</span>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <p className="text-5xl font-bold">{streak}</p>
            <p className="text-sm opacity-80">{streak === 1 ? 'day' : 'days'} in a row!</p>
          </div>
          <div className="flex-1 text-right">
            <p className="text-lg font-bold">{info.label}</p>
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
    <div className={`rounded-2xl p-4 border-2 ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-7 h-7" />
        {sublabel && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 font-bold">
            {sublabel}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
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
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-white bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                {userLevel.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">Your Level! 🎮</h3>
                <p className="text-sm opacity-80">Keep earning XP!</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <CloseIcon size={24} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-600">You are</p>
                <p className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <span className="text-3xl">{userLevel.icon}</span>
                  {userLevel.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total XP</p>
                <p className="text-3xl font-bold text-purple-600">{currentXP}</p>
              </div>
            </div>
            
            {userLevel.nextLevel && (
              <div className="bg-white rounded-xl p-3 border border-purple-200">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Next: {userLevel.nextLevel.name} {userLevel.nextLevel.icon}</span>
                  <span className="font-bold text-purple-600">{userLevel.xpToNextLevel - userLevel.xpInCurrentLevel} XP to go!</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${userLevel.progressToNext * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-b">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              How You Got XP This Month
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Coming to Class</p>
                    <p className="text-xs text-gray-500">{stats?.monthlyAttendance || 0} days × {XP_VALUES.attendance} XP</p>
                  </div>
                </div>
                <p className="font-bold text-green-600">+{(stats?.monthlyAttendance || 0) * XP_VALUES.attendance} XP</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Learning Gathas</p>
                    <p className="text-xs text-gray-500">{stats?.monthlyNewGathas || 0} gathas × {XP_VALUES.new_gatha || 2} XP</p>
                  </div>
                </div>
                <p className="font-bold text-purple-600">+{(stats?.monthlyNewGathas || 0) * (XP_VALUES.new_gatha || 2)} XP</p>
              </div>

              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">Badges!</p>
                    <p className="text-xs text-gray-500">Special rewards</p>
                  </div>
                </div>
                <p className="font-bold text-yellow-600">+{xpBreakdown?.achievements || 0} XP</p>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              All Levels to Unlock!
            </h4>
            <div className="space-y-2">
              {allLevels.map((level, index) => {
                const isCurrentLevel = level.level === userLevel.level;
                const isUnlocked = currentXP >= level.minXP;
                const isNext = !isUnlocked && (index === 0 || currentXP >= allLevels[index - 1].minXP);

                return (
                  <div 
                    key={level.level}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                      isCurrentLevel 
                        ? 'bg-gradient-to-r from-pink-100 to-purple-100 border-purple-400 shadow-md' 
                        : isUnlocked
                        ? 'bg-green-50 border-green-200'
                        : isNext
                        ? 'bg-blue-50 border-blue-300 border-dashed'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        isCurrentLevel ? 'bg-purple-200' : isUnlocked ? 'bg-green-200' : 'bg-gray-200'
                      }`}>
                        {level.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-800">{level.name}</p>
                          {isCurrentLevel && (
                            <span className="text-xs bg-purple-500 text-white px-1.5 py-0.5 rounded">YOU!</span>
                          )}
                          {isNext && (
                            <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">NEXT</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {level.minXP === 0 ? 'Starting level' : `${level.minXP} XP needed`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isUnlocked ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <p className="text-sm font-bold text-gray-400">
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

        <div className="p-4 bg-gray-50 border-t">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-transform shadow-lg"
          >
            Awesome! 🎉
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// KIDS LEADERBOARD COMPONENT
// ============================================

const KidsLeaderboardSection = ({ currentUserId, currentUserName }) => {
  const [activeTab, setActiveTab] = useState('attendance');
  const [leaderboardData, setLeaderboardData] = useState({ attendanceLeaders: [], gathaLeaders: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setIsLoading(true);
    setError(null);
    
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      let res = await fetch(
        `${API_BASE}/leaderboard/kids?startDate=${formatLocalDateString(startOfMonth)}&endDate=${formatLocalDateString(endOfMonth)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      } else {
        res = await fetch(
          `${API_BASE}/leaderboard?startDate=${formatLocalDateString(startOfMonth)}&endDate=${formatLocalDateString(endOfMonth)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.ok) {
          const data = await res.json();
          
          const filteredAttendance = (data.attendanceLeaders || [])
  .filter(leader => KIDS_LIST.includes(leader.username?.toLowerCase()) || KIDS_LIST.includes(leader.name?.toLowerCase()))
  // 👉 ADD .sort() HERE (before .map)
  .map((leader, index) => ({ ...leader, rank: index + 1 }));

const filteredGatha = (data.gathaLeaders || [])
  .filter(leader => KIDS_LIST.includes(leader.username?.toLowerCase()) || KIDS_LIST.includes(leader.name?.toLowerCase()))
  // 👉 ADD .sort() HERE (before .map)
  .map((leader, index) => ({ ...leader, rank: index + 1 }));
          
          setLeaderboardData({
            attendanceLeaders: filteredAttendance,
            gathaLeaders: filteredGatha,
          });
        } else {
          throw new Error('Could not load leaderboard');
        }
      }
    } catch (err) {
      console.error('Error fetching kids leaderboard:', err);
      setError('Unable to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank, isCurrentUser) => {
    if (isCurrentUser) return 'bg-gradient-to-r from-pink-100 to-purple-100 border-pink-400';
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
      default: return '⭐';
    }
  };

  const attendanceLeaders = leaderboardData?.attendanceLeaders || [];
  const gathaLeaders = leaderboardData?.gathaLeaders || [];

  return (
    <div className="bg-white rounded-2xl border-2 border-pink-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h3 className="text-lg font-bold">🏆 Kids Leaderboard</h3>
          </div>
          <button
            onClick={fetchLeaderboard}
            disabled={isLoading}
            className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-sm opacity-80 mt-1">See how you compare to other kids! 🌟</p>
      </div>

      <div className="flex p-2 bg-gray-100 gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'attendance' ? 'bg-green-500 text-white shadow-lg' : 'text-gray-600 bg-white'
          }`}
        >
          <Calendar className="w-4 h-4" /> Days
        </button>
        <button
          onClick={() => setActiveTab('gatha')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'gatha' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-600 bg-white'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Gathas
        </button>
      </div>

      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <RefreshCw className="w-10 h-10 animate-spin text-pink-500 mb-3" />
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="mt-3 px-4 py-2 bg-pink-100 text-pink-700 rounded-xl font-medium text-sm"
            >
              Try Again
            </button>
          </div>
        ) : activeTab === 'attendance' ? (
          attendanceLeaders.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No one yet this month!</p>
              <p className="text-gray-400 text-sm mt-1">Be the first! 🚀</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendanceLeaders.slice(0, 9).map((user, index) => {
                const odometer = user.userId || user._id || user.id;
                const isCurrentUser = odometer === currentUserId || 
                  user.name?.toLowerCase() === currentUserName?.toLowerCase() || 
                  user.username?.toLowerCase() === currentUserName?.toLowerCase();
                const rank = index + 1;
                
                return (
                  <div 
                    key={odometer || index}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${getRankBg(rank, isCurrentUser)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getRankIcon(rank)}
                        <span className="text-lg">{getRankEmoji(rank)}</span>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                          {user.name || user.username}
                          {isCurrentUser && (
                            <span className="text-xs bg-pink-500 text-white px-1.5 py-0.5 rounded animate-pulse">Me!</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.totalAttendance || user.count || 0} days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">{user.totalAttendance || user.count || 0}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          gathaLeaders.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">No gathas yet!</p>
              <p className="text-gray-400 text-sm mt-1">Start learning! 📚</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gathaLeaders.slice(0, 9).map((user, index) => {
                const odometer = user.userId || user._id || user.id;
                const isCurrentUser = odometer === currentUserId || 
                  user.name?.toLowerCase() === currentUserName?.toLowerCase() || 
                  user.username?.toLowerCase() === currentUserName?.toLowerCase();
                const rank = index + 1;
                
                return (
                  <div 
                    key={odometer || index}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${getRankBg(rank, isCurrentUser)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {getRankIcon(rank)}
                        <span className="text-lg">{getRankEmoji(rank)}</span>
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 flex items-center gap-2">
                          {user.name || user.username}
                          {isCurrentUser && (
                            <span className="text-xs bg-pink-500 text-white px-1.5 py-0.5 rounded animate-pulse">Me!</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{user.totalGathas || user.count || 0} gathas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">{user.totalGathas || user.count || 0}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="bg-pink-50 rounded-xl p-3 border border-pink-200">
          <p className="text-xs text-pink-700 text-center">
            <Sparkles className="w-3 h-3 inline mr-1" />
            Only kids are shown here! Keep learning to be #1! 🌟
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// GATHA ENTRY MODAL
// ============================================

const GathaEntryModal = ({ isOpen, onClose, onSubmit, isSubmitting, editData }) => {
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
  const commonSutras = ['નવકાર', 'પંચ પરમેષ્ઠી', 'લોગસ્સ', 'ઉવસગ્ગહરં'];

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`p-5 text-white ${activeTab === 'new' ? 'bg-gradient-to-r from-purple-500 to-pink-600' : 'bg-gradient-to-r from-blue-500 to-cyan-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{editData ? 'Change' : 'I learned!'} 📚</h3>
                <p className="text-sm opacity-80">Tell us what you learned!</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
              <CloseIcon size={24} />
            </button>
          </div>
        </div>

        {!editData && (
          <div className="flex p-2 bg-gray-100 gap-2">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'new' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-600 bg-white'
              }`}
            >
              <Plus className="w-5 h-5" /> New! ✨
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'revision' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600 bg-white'
              }`}
            >
              <RefreshCw className="w-5 h-5" /> Practice 🔄
            </button>
          </div>
        )}

        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              📖 Which Sutra?
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {commonSutras.map((sutra) => (
                <button
                  key={sutra}
                  type="button"
                  onClick={() => setForm({ ...form, sutraName: sutra })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
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
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
              placeholder="Type sutra name..."
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              📝 Which Gatha numbers?
            </label>
            <input
              type="text"
              value={form.whichGatha}
              onChange={(e) => setForm({ ...form, whichGatha: e.target.value })}
              className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
              placeholder="Like: 1-5 or 3,4,5"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">
              #️⃣ How many?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setForm({ ...form, totalGatha: num.toString() })}
                  className={`flex-1 py-3 rounded-xl font-bold text-lg transition-all ${
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
              className="w-full mt-2 px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm font-medium"
              placeholder="Or type a number..."
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-[0.98] transition-transform"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
              className={`flex-1 py-3.5 font-bold rounded-xl text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-600'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-600'
              }`}
            >
              {isSubmitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Check className="w-5 h-5" />
              )}
              Done! ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// HISTORY PAGE COMPONENT
// ============================================

const HistoryPage = () => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const fetchHistory = async (year, month) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const url = `${API_BASE}/history/${year}/${month}`;
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
  };

  useEffect(() => {
    fetchHistory(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

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

  const activityData = historyData?.dailyActivity ?? {};
  const todayIso = formatLocalDateString(today);

  const monthlySummary = useMemo(() => {
    let presentCount = 0, newGathas = 0, revisionGathas = 0;

    Object.entries(activityData).forEach(([, activity]) => {
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

  const renderCalendar = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-11" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activity = activityData[dateStr];
      const isPresent = activity?.present === true;
      const isToday = dateStr === todayIso;
      const hasGathas = (activity?.gathas?.new || 0) + (activity?.gathas?.revision || 0) > 0;
      const isFuture = new Date(dateStr) > today;

      days.push(
        <button
          key={day}
          onClick={() => isPresent && setSelectedDay({ dateStr, activity })}
          disabled={!isPresent || isFuture}
          className={`h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
            isPresent
              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md active:scale-95'
              : isToday
              ? 'bg-pink-100 text-pink-600 border-2 border-pink-400 ring-2 ring-pink-200'
              : isFuture
              ? 'text-gray-200'
              : 'text-gray-400 hover:bg-gray-100'
          }`}
        >
          <div className="relative">
            {day}
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
      <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-pink-800">How to read this! 📅</p>
          <p className="text-xs text-pink-600 mt-1">
            Green = You came to class! Tap green days to see what you learned.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border-2 border-pink-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-3 rounded-xl bg-pink-50 active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} className="text-pink-600" />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()}
            className="p-3 rounded-xl bg-pink-50 active:scale-95 transition-transform disabled:opacity-40"
          >
            <ChevronRight size={24} className="text-pink-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-12 h-12 animate-spin text-pink-500 mx-auto" />
            <p className="mt-4 text-gray-600 font-medium">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
            <button
              onClick={() => fetchHistory(selectedYear, selectedMonth)}
              className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-medium"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="h-8 flex items-center justify-center text-xs font-bold text-gray-400">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-green-400 to-green-600" />
                <span className="text-gray-600">Present! ({monthlySummary.presentDays})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">Has Gathas</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                <Calendar className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{monthlySummary.presentDays}</p>
                <p className="text-xs text-gray-500">Days! 🎉</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
                <Plus className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">{monthlySummary.newGathas}</p>
                <p className="text-xs text-gray-500">New! ✨</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{monthlySummary.revisionGathas}</p>
                <p className="text-xs text-gray-500">Practice 🔄</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {formatDateIn(selectedDay.dateStr, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </h3>
                  <p className="text-green-600 font-medium">You were here! ✓</p>
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 bg-gray-100 rounded-xl">
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Plus size={18} className="text-purple-600" />
                  New Gathas: {selectedDay.activity.gathas?.new || 0}
                </h4>
                {(selectedDay.activity.details || []).filter((d) => d.type === 'new').length === 0 ? (
                  <p className="text-sm text-purple-600 bg-white/50 px-3 py-2 rounded-lg">No new gathas this day</p>
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

              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <RefreshCw size={18} className="text-blue-600" />
                  Practice: {selectedDay.activity.gathas?.revision || 0}
                </h4>
                {(selectedDay.activity.details || []).filter((d) => d.type === 'revision').length === 0 ? (
                  <p className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg">No practice this day</p>
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
              className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
            >
              Close
            </button>
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-yellow-800">What's this? 🤔</p>
          <p className="text-xs text-yellow-700 mt-1">
            When you mark attendance or add gathas, your teacher checks them first.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <span className="font-bold text-lg">Waiting for Teacher</span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isSubmitting}
              className="p-2.5 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isSubmitting ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-5xl font-bold">{totalPendingCount}</p>
          <p className="text-sm opacity-80 mt-1">
            {totalPendingCount === 0 ? 'Nothing waiting! 🎉' : 'items waiting'}
          </p>
        </div>
      </div>

      {totalPendingCount === 0 ? (
        <div className="bg-white rounded-2xl p-8 border-2 border-green-200 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">All Done! 🎉</p>
          <p className="text-sm text-gray-500 mt-2">Nothing is waiting!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Waiting...
          </h3>
          <div className="space-y-3">
            {allPending.map((item, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 ${
                  item.itemType === 'attendance' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        item.itemType === 'attendance' ? 'bg-blue-200' : 'bg-purple-200'
                      }`}
                    >
                      {item.itemType === 'attendance' ? (
                        <Calendar className="w-6 h-6 text-blue-700" />
                      ) : (
                        <BookOpen className="w-6 h-6 text-purple-700" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">
                        {item.itemType === 'attendance' ? 'I was here!' : `Gatha - ${item.type === 'new' ? 'New' : 'Practice'}`}
                      </p>
                      <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                      {item.itemType === 'gatha' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.sutra_name} • {item.total_gatha} gathas
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <PendingBadge status="pending" />
                    {item.itemType === 'gatha' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => onEdit(item)}
                          className="p-2 bg-blue-100 rounded-lg text-blue-600 active:scale-95 transition-transform"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-2 bg-red-100 rounded-lg text-red-600 active:scale-95 transition-transform"
                        >
                          <Trash2 size={14} />
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
        <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Try Again ({allRejected.length})
          </h3>
          <div className="space-y-3">
            {allRejected.map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                    {item.itemType === 'attendance' ? (
                      <Calendar className="w-5 h-5 text-red-700" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-red-700" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800">
                      {item.itemType === 'attendance' ? 'Attendance' : `Gatha - ${item.type}`}
                    </p>
                    <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                  </div>
                  <PendingBadge status="rejected" />
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
      <div className="bg-gray-50 rounded-xl p-6 text-center border-2 border-gray-200">
        <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No badges yet!</p>
        <p className="text-gray-400 text-xs mt-1">Keep learning to earn some! 🌟</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {recentlyUnlocked.map((achievement) => {
        const Icon = achievement.icon;
        const colors = ACHIEVEMENT_COLORS[achievement.color];

        return (
          <button
            key={achievement.id}
            onClick={() => onBadgeClick?.(achievement)}
            className="flex-shrink-0 w-20 p-2 bg-white rounded-xl border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
          >
            <div className={`w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
              <Icon className="w-5 h-5 text-white" />
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
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
      <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
        <Target className="w-5 h-5" />
        Almost There! 🎯
      </h4>
      <div className="space-y-3">
        {nextAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const colors = ACHIEVEMENT_COLORS[achievement.color];

          return (
            <button
              key={achievement.id}
              onClick={() => onBadgeClick?.(achievement)}
              className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-green-200 text-left active:scale-[0.98] transition-transform"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br ${colors.bg}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{achievement.title}</p>
                <p className="text-xs text-gray-500">({achievement.subtitle})</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors.bg} rounded-full`}
                      style={{ width: `${achievement.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-500">
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
// MAIN KIDS DASHBOARD COMPONENT
// ============================================

export default function KidsDashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);

  // Data states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [gathaEntries, setGathaEntries] = useState([]);
  const [pendingStatus, setPendingStatus] = useState({ attendance: [], gatha: [] });
  
  // Online status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Stats (Monthly focused)
  const [monthlyAttendance, setMonthlyAttendance] = useState(0);
  const [monthlyNewGathas, setMonthlyNewGathas] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [workingDays, setWorkingDays] = useState(DEFAULT_WORKING_DAYS);

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [showTips, setShowTips] = useState(true);

  // Modals
  const [showGathaModal, setShowGathaModal] = useState(false);
  const [editingGatha, setEditingGatha] = useState(null);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showLevelModal, setShowLevelModal] = useState(false);

  const todayIso = formatLocalDateString(new Date());
  const greeting = getGreeting();
  const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Derived data
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

  // User stats for achievements
  const userStats = useMemo(() => ({
    monthlyAttendance,
    monthlyNewGathas,
    currentStreak,
    maxStreak,
    workingDays,
  }), [monthlyAttendance, monthlyNewGathas, currentStreak, maxStreak, workingDays]);

  // Calculate XP and level
  const xpBreakdown = useMemo(
    () => calculateTotalXP(userStats, MONTHLY_ACHIEVEMENTS),
    [userStats]
  );

  const userLevel = useMemo(() => getUserLevel(xpBreakdown.total), [xpBreakdown.total]);

  const unlockedBadgesCount = useMemo(
    () => MONTHLY_ACHIEVEMENTS.filter((a) => calculateAchievementProgress(a, userStats).unlocked).length,
    [userStats]
  );

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(currentStreak, monthlyAttendance, monthlyNewGathas),
    [currentStreak, monthlyAttendance, monthlyNewGathas]
  );

  // Helpers
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

  const calculateStreakFromHistory = (history) => {
    const sortedDates = history
      .map((r) => formatLocalDateString(r.date))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => new Date(b) - new Date(a));

    if (sortedDates.length === 0) return { current: 0, max: 0 };

    let current = 0;
    let max = 0;
    let tempStreak = 1;

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const date = new Date(sortedDates[i]);
        const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
          current = 0;
        } else {
          current = 1;
        }
      }

      if (i < sortedDates.length - 1) {
        const currentDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);
        const diffDays = Math.floor((currentDate - nextDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          tempStreak++;
          if (i === 0 || current > 0) current = tempStreak;
        } else {
          max = Math.max(max, tempStreak);
          tempStreak = 1;
        }
      }
    }

    max = Math.max(max, tempStreak, current);
    return { current, max };
  };

  // API calls
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
      const res = await fetch(`${API_BASE}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAttendanceHistory(Array.isArray(data) ? data : []);
        const streakData = calculateStreakFromHistory(data);
        setCurrentStreak(streakData.current);
        setMaxStreak(streakData.max);

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
  }, []);

  const fetchGathas = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/gatha`, { headers: { Authorization: `Bearer ${token}` } });
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

  const fetchMonthlyStats = useCallback(async (year, month) => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/stats/comprehensive?year=${year}&month=${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMonthlyAttendance(data.monthlyAttendance ?? 0);
        setMonthlyNewGathas(data.monthlyNewGathas ?? 0);
        setCurrentStreak(data.currentStreak ?? 0);
        setMaxStreak(data.maxStreak ?? 0);
        setWorkingDays(data.workingDays ?? DEFAULT_WORKING_DAYS);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
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
      const now = new Date();
      await Promise.all([
        fetchAttendance(),
        fetchGathas(),
        fetchPendingStatus(),
        fetchMonthlyStats(now.getFullYear(), now.getMonth() + 1),
      ]);
      setIsLoading(false);
    };
    loadData();

    // Poll every 30 seconds - only if online
    const pollInterval = setInterval(() => {
      if (navigator.onLine) {
        fetchPendingStatus();
        fetchAttendance();
        fetchGathas();
      }
    }, 30000);

    // Refresh when tab becomes visible - only if online
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
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
  }, [fetchAttendance, fetchGathas, fetchPendingStatus, fetchMonthlyStats]);

  const handleStatsMonthChange = (year, month) => {
    fetchMonthlyStats(year, month);
  };

  // Handlers
  const markAttendance = async () => {
    if (todayAttendanceStatus !== 'not_marked') return;

    setGlobalError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark attendance');
      showSuccess('✅ Sent to teacher! Wait for approval.');
      await fetchPendingStatus();
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
      const url = editingGatha ? `${API_BASE}/gatha/pending/${editingGatha.id}` : `${API_BASE}/gatha`;

      const res = await fetch(url, {
        method: editingGatha ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit gatha');
      }

      showSuccess(editingGatha ? '✅ Updated!' : '✅ Sent to teacher!');
      setShowGathaModal(false);
      setEditingGatha(null);
      await Promise.all([fetchPendingStatus(), fetchGathas()]);
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
      showSuccess('🗑️ Deleted!');
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
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-center">
          <p className="text-red-700 text-sm font-medium">📵 You're offline. Some things may not work.</p>
        </div>
      )}

      {/* Welcome Card - CLICKABLE */}
      <button
        onClick={() => setShowLevelModal(true)}
        className="w-full text-left bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden active:scale-[0.99] transition-transform"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{greeting.emoji}</span>
                <span className="text-pink-100 text-sm font-medium">{greeting.text}</span>
              </div>
              <h1 className="text-2xl font-bold">{user?.name || user?.username} 👋</h1>
              <p className="text-pink-100 text-sm mt-1">{motivationalMessage.text}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                {userLevel.icon}
              </div>
              <span className="text-xs mt-1 bg-white/20 px-2 py-0.5 rounded-full font-bold">
                Lv.{userLevel.level}
              </span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur rounded-xl p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-bold">{userLevel.name}</span>
              <span className="text-xs flex items-center gap-1">
                {xpBreakdown.total} XP ⭐
              </span>
            </div>
            {userLevel.nextLevel && (
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${userLevel.progressToNext * 100}%` }}
                />
              </div>
            )}
            <p className="text-xs text-pink-100 mt-1 text-center">Tap to see your level! 🎮</p>
          </div>
        </div>
      </button>

      {/* Tips for kids */}
      {showTips && (
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-pink-500" />
              <span className="font-bold text-pink-800">How to use this app!</span>
            </div>
            <button
              onClick={() => setShowTips(false)}
              className="text-pink-400 p-1"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HELPFUL_TIPS.map((tip, i) => {
              const TipIcon = tip.icon;
              const iconColorClass = TIP_ICON_COLORS[tip.color] || 'text-gray-500';
              return (
                <div key={i} className="flex items-start gap-2 bg-white p-2 rounded-lg">
                  <TipIcon className={`w-4 h-4 ${iconColorClass} flex-shrink-0 mt-0.5`} />
                  <span className="text-xs text-gray-600">{tip.tipText}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Streak Card */}
      <StreakDisplay streak={currentStreak} maxStreak={maxStreak} />

      {/* Today's Quick Actions */}
      <div className="bg-white rounded-2xl p-4 border-2 border-pink-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-pink-500" />
            Today's Goals! 🎯
          </h3>
          <span className="text-xs bg-pink-100 text-pink-700 px-3 py-1 rounded-full font-bold">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={markAttendance}
            disabled={todayAttendanceStatus !== 'not_marked' || isSubmitting}
            className={`p-4 rounded-2xl transition-all active:scale-[0.97] ${
              todayAttendanceStatus === 'approved'
                ? 'bg-green-100 border-2 border-green-300'
                : todayAttendanceStatus === 'pending'
                ? 'bg-yellow-100 border-2 border-yellow-300'
                : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg'
            }`}
          >
            {todayAttendanceStatus === 'approved' ? (
              <>
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-600" />
                <p className="font-bold text-green-700">I'm here! ✓</p>
                <p className="text-xs text-green-600">+{XP_VALUES.attendance} XP!</p>
              </>
            ) : todayAttendanceStatus === 'pending' ? (
              <>
                <Clock className="w-10 h-10 mx-auto mb-2 text-yellow-600 animate-pulse" />
                <p className="font-bold text-yellow-700">Waiting...</p>
                <p className="text-xs text-yellow-600">Teacher will check!</p>
              </>
            ) : (
              <>
                <Calendar className="w-10 h-10 mx-auto mb-2" />
                <p className="font-bold">I'm Here! 🙋</p>
                <p className="text-xs opacity-80">+{XP_VALUES.attendance} XP</p>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setEditingGatha(null);
              setShowGathaModal(true);
            }}
            className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-600 text-white shadow-lg active:scale-[0.97] transition-transform"
          >
            <BookOpen className="w-10 h-10 mx-auto mb-2" />
            <p className="font-bold">I Learned! 📚</p>
            <p className="text-xs opacity-80">Add gatha</p>
            {todaysApprovedGathas.length + todaysPendingGathas.length > 0 && (
              <span className="absolute -top-2 -right-2 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                {todaysApprovedGathas.length + todaysPendingGathas.length}
              </span>
            )}
          </button>
        </div>

        {/* Today's Gathas List */}
        {(todaysApprovedGathas.length > 0 || todaysPendingGathas.length > 0) && (
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              Today's Gathas ({todaysApprovedGathas.length + todaysPendingGathas.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {[
                ...todaysApprovedGathas.map((e) => ({ ...e, status: 'approved' })),
                ...todaysPendingGathas.map((e) => ({ ...e, status: 'pending' })),
              ].map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    entry.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        entry.type === 'new' ? 'bg-purple-200' : 'bg-blue-200'
                      }`}
                    >
                      {entry.type === 'new' ? <Plus className="w-5 h-5 text-purple-700" /> : <RefreshCw className="w-5 h-5 text-blue-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{entry.sutra_name}</p>
                      <p className="text-xs text-gray-500">{entry.total_gatha} gathas • {entry.which_gatha}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PendingBadge status={entry.status} size="small" />
                    {entry.status === 'pending' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingGatha(entry);
                            setShowGathaModal(true);
                          }}
                          className="p-1.5 bg-blue-100 rounded-lg text-blue-600"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() =>
                            setConfirmAction({
                              title: 'Delete?',
                              message: 'Do you want to remove this gatha?',
                              handler: () => deletePendingGatha(entry.id),
                            })
                          }
                          className="p-1.5 bg-red-100 rounded-lg text-red-600"
                        >
                          <Trash2 size={12} />
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <QuickStatCard
          icon={CalendarDays}
          value={monthlyAttendance}
          label="Days I Came! 🎉"
          color="green"
          sublabel="This Month"
        />
        <QuickStatCard
          icon={BookMarked}
          value={monthlyNewGathas}
          label="New Gathas! ✨"
          color="purple"
          sublabel="This Month"
        />
      </div>

      {/* Recent Badges */}
      <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            My Badges! 🏆
          </h3>
          <button
            onClick={() => setCurrentPage(PAGES.STATS)}
            className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-bold flex items-center gap-1"
          >
            See All <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <RecentBadges stats={userStats} onBadgeClick={setSelectedAchievement} />
      </div>

      {/* Next Badges */}
      <NextBadges stats={userStats} onBadgeClick={setSelectedAchievement} />

      {/* Daily Quote */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12" />
        <div className="relative z-10 flex items-start gap-3">
          <span className="text-4xl">{dailyQuote.emoji}</span>
          <div>
            <p className="text-lg font-bold">{dailyQuote.text}</p>
            <p className="text-sm text-pink-100 mt-1">{dailyQuote.meaning}</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDER STATS PAGE ====================
  const renderStats = () => (
    <div className="space-y-4">
      <StudentAchievementPage 
        stats={userStats} 
        onMonthChange={handleStatsMonthChange} 
        workingDays={workingDays} 
      />
      <KidsLeaderboardSection 
        currentUserId={user?._id || user?.id}
        currentUserName={user?.name || user?.username}
      />
    </div>
  );

  // ==================== RENDER CONTENT ====================
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-pink-200 shadow-sm">
          <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-10 h-10 animate-spin text-pink-500" />
          </div>
          <p className="text-gray-600 font-medium text-lg">Loading... ⏳</p>
          <p className="text-gray-400 text-sm mt-2">Just a moment!</p>
        </div>
      );
    }

    switch (currentPage) {
      case PAGES.HOME:
        return renderHome();
      case PAGES.STATS:
        return renderStats();
      case PAGES.HISTORY:
        return <HistoryPage />;
      case PAGES.PENDING:
        return (
          <PendingPage
            pendingStatus={pendingStatus}
            onRefresh={fetchPendingStatus}
            onEdit={(item) => {
              setEditingGatha(item);
              setShowGathaModal(true);
            }}
            onDelete={(item) =>
              setConfirmAction({
                title: 'Delete?',
                message: 'Do you want to remove this?',
                handler: () => deletePendingGatha(item.id),
              })
            }
            isSubmitting={isSubmitting}
          />
        );
      default:
        return renderHome();
    }
  };

  // ==================== MAIN RETURN ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 pb-24">
      <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-md px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">શ્રી સોમચિંતામણી વાસુપૂજ્યસ્વામી જૈન પાઠશાળા 📚</h1>
              <p className="text-xs text-gray-500">Hi, {user?.name || user?.username}! 👋</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-transform border border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Bye!
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        <ErrorBanner message={globalError} onClose={() => setGlobalError('')} />

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { key: PAGES.HOME, label: 'Home', emoji: '🏠' },
            { key: PAGES.STATS, label: 'Stars', badge: unlockedBadgesCount, emoji: '⭐' },
            { key: PAGES.HISTORY, label: 'Days', emoji: '📅' },
            { key: PAGES.PENDING, label: 'Wait', badge: totalPendingCount, badgeColor: 'red', emoji: '⏳' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentPage(tab.key)}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl font-bold text-xs transition-all active:scale-[0.97] ${
                currentPage === tab.key
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-pink-200 shadow-sm'
              }`}
            >
              <span className="text-lg">{tab.emoji}</span>
              {tab.label}
              {tab.badge > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                    tab.badgeColor === 'red'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {renderContent()}

        <div className="mt-8 text-center py-4">
          <p className="text-gray-400 text-xs">Made with ❤️ for kids</p>
        </div>
      </div>

      {/* Modals */}
      <GathaEntryModal
        isOpen={showGathaModal}
        onClose={() => {
          setShowGathaModal(false);
          setEditingGatha(null);
        }}
        onSubmit={submitGatha}
        isSubmitting={isSubmitting}
        editData={editingGatha}
      />

      <ConfirmationModal
        title={confirmAction?.title}
        message={confirmAction?.message}
        onConfirm={confirmAction?.handler}
        onCancel={() => setConfirmAction(null)}
      />

      <AchievementDetailModal
        achievement={selectedAchievement}
        stats={userStats}
        onClose={() => setSelectedAchievement(null)}
      />

      <LevelDetailsModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        currentXP={xpBreakdown.total}
        xpBreakdown={xpBreakdown}
        userLevel={userLevel}
        stats={userStats}
      />
    </div>
  );
}
