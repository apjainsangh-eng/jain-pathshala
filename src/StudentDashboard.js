import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Edit2,
  Heart,
  LogOut,
  Plus,
  Trash2,
  Trophy,
  User,
  X as CloseIcon,
  AlertTriangle,
  TrendingUp,
  Loader,
  AlertCircle,
  Flame,
  Star,
  Target,
  Award,
  Zap,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Activity,
  CalendarDays,
  BookMarked,
  Medal,
  Gift,
  Rocket,
  Shield,
  CheckCircle,
  Users,
} from 'lucide-react';

// -------------------------------------
// Helper utilities
// -------------------------------------
const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';
const DEFAULT_DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };

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

const getDateRangePreset = (preset) => {
  const today = new Date();
  
  switch (preset) {
    case 'today':
      return {
        start: formatLocalDateString(today),
        end: formatLocalDateString(today),
      };
    case 'week':
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      return {
        start: formatLocalDateString(startOfWeek),
        end: formatLocalDateString(today),
      };
    case 'month':
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: formatLocalDateString(startOfMonth),
        end: formatLocalDateString(endOfMonth),
      };
    case 'year':
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      return {
        start: formatLocalDateString(startOfYear),
        end: formatLocalDateString(today),
      };
    case 'all':
      return {
        start: '2020-01-01',
        end: '2099-12-31',
      };
    default:
      return getDateRangePreset('month');
  }
};

const PAGES = {
  HOME: 'home',
  ACTIVITY: 'activity',
  STATS: 'stats',
  HISTORY: 'history',
};

// Motivational quotes
const QUOTES = [
  { text: "अहिंसा परमो धर्मः", meaning: "Non-violence is the supreme religion", emoji: "🙏" },
  { text: "क्षमा वीरस्य भूषणम्", meaning: "Forgiveness is the ornament of the brave", emoji: "💪" },
  { text: "जीवो जीवस्य जीवनम्", meaning: "Live and let live", emoji: "🌱" },
  { text: "परस्परोपग्रहो जीवानाम्", meaning: "Souls render service to one another", emoji: "🤝" },
];

// Get greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', emoji: '☀️' };
  return { text: 'Good Evening', emoji: '🌙' };
};

// Get performance level
const getPerformanceLevel = (attendance, gathas) => {
  const total = (attendance || 0) + (gathas || 0);
  if (total >= 100) return { label: 'Legend', color: 'from-yellow-400 to-orange-500', icon: '👑', tier: 5 };
  if (total >= 50) return { label: 'Champion', color: 'from-purple-400 to-pink-500', icon: '🏆', tier: 4 };
  if (total >= 25) return { label: 'Star', color: 'from-blue-400 to-indigo-500', icon: '⭐', tier: 3 };
  if (total >= 10) return { label: 'Rising', color: 'from-green-400 to-emerald-500', icon: '🚀', tier: 2 };
  if (total >= 1) return { label: 'Beginner', color: 'from-cyan-400 to-blue-500', icon: '✨', tier: 1 };
  return { label: 'New', color: 'from-gray-400 to-gray-500', icon: '🌱', tier: 0 };
};

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first_step', title: 'First Step', description: 'Mark your first attendance', icon: Star, requirement: { type: 'attendance', count: 1 }, color: 'bronze' },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Attend 7 days', icon: Flame, requirement: { type: 'attendance', count: 7 }, color: 'bronze' },
  { id: 'dedicated', title: 'Dedicated', description: 'Attend 15 days', icon: Target, requirement: { type: 'attendance', count: 15 }, color: 'silver' },
  { id: 'month_master', title: 'Month Master', description: 'Attend 30 days', icon: Trophy, requirement: { type: 'attendance', count: 30 }, color: 'gold' },
  { id: 'gatha_starter', title: 'Gatha Starter', description: 'Learn 5 gathas', icon: BookOpen, requirement: { type: 'gatha', count: 5 }, color: 'bronze' },
  { id: 'gatha_learner', title: 'Gatha Learner', description: 'Learn 25 gathas', icon: BookMarked, requirement: { type: 'gatha', count: 25 }, color: 'silver' },
  { id: 'gatha_master', title: 'Gatha Master', description: 'Learn 50 gathas', icon: Award, requirement: { type: 'gatha', count: 50 }, color: 'gold' },
  { id: 'gatha_guru', title: 'Gatha Guru', description: 'Learn 100 gathas', icon: Crown, requirement: { type: 'gatha', count: 100 }, color: 'diamond' },
  { id: 'streak_3', title: 'Hot Streak', description: '3 day streak', icon: Zap, requirement: { type: 'streak', count: 3 }, color: 'bronze' },
  { id: 'streak_7', title: 'On Fire', description: '7 day streak', icon: Flame, requirement: { type: 'streak', count: 7 }, color: 'silver' },
  { id: 'streak_14', title: 'Unstoppable', description: '14 day streak', icon: Rocket, requirement: { type: 'streak', count: 14 }, color: 'gold' },
  { id: 'combo', title: 'All Rounder', description: '10+ attendance & 10+ gathas', icon: Shield, requirement: { type: 'combo', attendance: 10, gatha: 10 }, color: 'gold' },
];

// -------------------------------------
// Confirmation Modal Component
// -------------------------------------
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
  if (!title) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        </div>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl active:scale-[0.98]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------
// Pending Status Badge Component
// -------------------------------------
const PendingBadge = ({ status }) => {
  const badges = {
    pending: { className: 'text-yellow-700 bg-yellow-100', icon: Clock, label: 'Pending' },
    approved: { className: 'text-green-700 bg-green-100', icon: Check, label: 'Approved' },
    rejected: { className: 'text-red-700 bg-red-100', icon: CloseIcon, label: 'Rejected' },
  };

  const badge = badges[status];
  if (!badge) return null;
  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${badge.className}`}>
      <Icon className={`w-3 h-3 ${status === 'pending' ? 'animate-pulse' : ''}`} />
      {badge.label}
    </span>
  );
};

// -------------------------------------
// Achievement Card Component
// -------------------------------------
const AchievementCard = ({ achievement, unlocked, progress, onClick }) => {
  const Icon = achievement.icon;
  
  const colorMap = {
    bronze: { bg: 'from-orange-300 to-orange-500', border: 'border-orange-300' },
    silver: { bg: 'from-gray-300 to-gray-500', border: 'border-gray-300' },
    gold: { bg: 'from-yellow-300 to-yellow-500', border: 'border-yellow-300' },
    diamond: { bg: 'from-cyan-300 to-blue-500', border: 'border-cyan-300' },
  };
  
  const colors = colorMap[achievement.color] || colorMap.bronze;

  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-xl border-2 transition-all active:scale-[0.98] ${
        unlocked 
          ? `${colors.border} bg-gradient-to-br from-white to-gray-50 shadow-md` 
          : 'border-gray-200 bg-gray-50 opacity-60'
      }`}
    >
      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
        unlocked ? `bg-gradient-to-br ${colors.bg}` : 'bg-gray-200'
      }`}>
        <Icon className={`w-6 h-6 ${unlocked ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <p className={`text-xs font-bold text-center ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>
        {achievement.title}
      </p>
      <p className="text-xs text-gray-500 text-center mt-0.5">{achievement.description}</p>
      
      {!unlocked && progress !== undefined && (
        <div className="mt-2">
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
      
      {unlocked && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
};

// -------------------------------------
// Streak Display Component
// -------------------------------------
const StreakDisplay = ({ streak, maxStreak }) => {
  const getStreakInfo = (s) => {
    if (s >= 30) return { label: 'Legendary!', color: 'from-yellow-400 to-orange-500', emoji: '🔥' };
    if (s >= 14) return { label: 'Amazing!', color: 'from-purple-400 to-pink-500', emoji: '⚡' };
    if (s >= 7) return { label: 'Great!', color: 'from-blue-400 to-indigo-500', emoji: '✨' };
    if (s >= 3) return { label: 'Good!', color: 'from-green-400 to-emerald-500', emoji: '🌟' };
    if (s >= 1) return { label: 'Started!', color: 'from-cyan-400 to-blue-500', emoji: '🚀' };
    return { label: 'Start today!', color: 'from-gray-400 to-gray-500', emoji: '💪' };
  };

  const info = getStreakInfo(streak);

  return (
    <div className={`bg-gradient-to-r ${info.color} rounded-2xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6" />
          <span className="font-bold">Current Streak</span>
        </div>
        <span className="text-2xl">{info.emoji}</span>
      </div>
      <div className="flex items-end gap-3">
        <div>
          <p className="text-4xl font-bold">{streak}</p>
          <p className="text-sm opacity-80">{streak === 1 ? 'day' : 'days'}</p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-lg font-bold">{info.label}</p>
          <p className="text-xs opacity-80">Best: {maxStreak} days</p>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------
// Gatha Entry Modal
// -------------------------------------
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

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              <div>
                <h3 className="text-lg font-bold">{editData ? 'Edit Gatha' : 'Add Gatha'}</h3>
                <p className="text-xs text-purple-100">Record your progress</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full">
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        {!editData && (
          <div className="flex p-2 bg-gray-100">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'new' ? 'bg-purple-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4" /> New Gatha
            </button>
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'revision' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-600'
              }`}
            >
              <RefreshCw className="w-4 h-4" /> Revision
            </button>
          </div>
        )}

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">📖 Sutra Name</label>
            <input
              type="text"
              value={form.sutraName}
              onChange={(e) => setForm({ ...form, sutraName: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm"
              placeholder="Enter sutra name"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">📝 Which Gatha</label>
            <input
              type="text"
              value={form.whichGatha}
              onChange={(e) => setForm({ ...form, whichGatha: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm"
              placeholder="e.g., Gatha 1, 2, 3"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 mb-2 block">#️⃣ Total Count</label>
            <input
              type="number"
              value={form.totalGatha}
              onChange={(e) => setForm({ ...form, totalGatha: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none text-sm"
              placeholder="Enter total count"
              min="1"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isValid}
              className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 ${
                activeTab === 'new'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              {editData ? 'Save' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------
// History Page Component
// -------------------------------------
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

  const presentDays = useMemo(() => {
    return Object.entries(activityData)
      .filter(([_, activity]) => activity?.present === true)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [activityData]);

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

  // Calendar rendering
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  const renderCalendar = () => {
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activity = activityData[dateStr];
      const isPresent = activity?.present === true;
      const isToday = dateStr === todayIso;
      const hasGathas = (activity?.gathas?.new || 0) + (activity?.gathas?.revision || 0) > 0;
      
      days.push(
        <button
          key={day}
          onClick={() => isPresent && setSelectedDay({ dateStr, activity })}
          disabled={!isPresent}
          className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
            isPresent
              ? 'bg-green-500 text-white shadow-md hover:scale-110 active:scale-95'
              : isToday
              ? 'bg-orange-100 text-orange-600 border-2 border-orange-400'
              : 'text-gray-300'
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
      {/* Month Navigation */}
      <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-3 rounded-xl bg-orange-50 active:scale-95"
          >
            <ChevronLeft size={24} className="text-orange-600" />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-gray-500">Tap green days for details</p>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()}
            className="p-3 rounded-xl bg-orange-50 active:scale-95 disabled:opacity-40"
          >
            <ChevronRight size={24} className="text-orange-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="mt-4 text-gray-600 text-sm">Loading...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {/* Calendar */}
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

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 text-xs mb-4">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-gray-600">Present ({monthlySummary.presentDays})</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                <span className="text-gray-600">Has Gathas</span>
              </div>
            </div>

            {/* Monthly Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-3 text-center">
                <Calendar className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{monthlySummary.presentDays}</p>
                <p className="text-xs text-gray-500">Days</p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center">
                <Plus className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">{monthlySummary.newGathas}</p>
                <p className="text-xs text-gray-500">New</p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center">
                <RefreshCw className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{monthlySummary.revisionGathas}</p>
                <p className="text-xs text-gray-500">Revision</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">
                    {formatDateIn(selectedDay.dateStr, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </h3>
                  <PendingBadge status="approved" />
                </div>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-2 bg-gray-100 rounded-full">
                <CloseIcon size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* New Gathas */}
              <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                  <Plus size={18} /> New: {selectedDay.activity.gathas?.new || 0}
                </h4>
                {(selectedDay.activity.details || []).filter(d => d.type === 'new').length === 0 ? (
                  <p className="text-sm text-purple-600 bg-white/50 px-3 py-2 rounded-lg">No new gathas</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedDay.activity.details || []).filter(d => d.type === 'new').map((entry, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-3 border border-purple-200">
                        <p className="text-sm"><strong>Sutra:</strong> {entry.sutra_name}</p>
                        <p className="text-sm"><strong>Gatha:</strong> {entry.which_gatha}</p>
                        <p className="text-sm font-bold text-purple-700">Count: {entry.total_gatha}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Revisions */}
              <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <RefreshCw size={18} /> Revisions: {selectedDay.activity.gathas?.revision || 0}
                </h4>
                {(selectedDay.activity.details || []).filter(d => d.type === 'revision').length === 0 ? (
                  <p className="text-sm text-blue-600 bg-white/50 px-3 py-2 rounded-lg">No revisions</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedDay.activity.details || []).filter(d => d.type === 'revision').map((entry, idx) => (
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
              className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// -------------------------------------
// Main Student Dashboard Component
// -------------------------------------
export default function StudentDashboard({ user, onLogout }) {
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  
  // Data states
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [gathaEntries, setGathaEntries] = useState([]);
  const [pendingStatus, setPendingStatus] = useState({ attendance: [], gatha: [] });
  const [analyticsData, setAnalyticsData] = useState({ attendanceLeader: null, gathaStats: null });
  
  // Stats
  const [userYearlyAttendance, setUserYearlyAttendance] = useState(0);
  const [userTotalGathas, setUserTotalGathas] = useState(0);
  const [attendanceStreak, setAttendanceStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [datePreset, setDatePreset] = useState('month');
  const [dateRange, setDateRange] = useState(getDateRangePreset('month'));
  
  // Gatha modal
  const [showGathaModal, setShowGathaModal] = useState(false);
  const [editingGatha, setEditingGatha] = useState(null);
  
  // Achievement modal
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  const todayIso = formatLocalDateString(new Date());
  const greeting = getGreeting();
  const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Derived data
  const todayAttendanceMarked = useMemo(() => 
    attendanceHistory.some(r => formatLocalDateString(r.date) === todayIso),
    [attendanceHistory, todayIso]
  );

  const todayPendingAttendance = useMemo(() =>
    pendingStatus.attendance?.find(p => formatLocalDateString(p.date) === todayIso && p.status === 'pending'),
    [pendingStatus.attendance, todayIso]
  );

  const todayAttendanceStatus = useMemo(() => {
    if (todayAttendanceMarked) return 'approved';
    if (todayPendingAttendance) return 'pending';
    return 'not_marked';
  }, [todayAttendanceMarked, todayPendingAttendance]);

  const todaysApprovedGathas = useMemo(() =>
    gathaEntries.filter(e => e.created_at && formatLocalDateString(e.created_at) === todayIso),
    [gathaEntries, todayIso]
  );

  const todaysPendingGathas = useMemo(() =>
    pendingStatus.gatha?.filter(p => formatLocalDateString(p.date) === todayIso && p.status === 'pending') || [],
    [pendingStatus.gatha, todayIso]
  );

  const totalPendingCount = useMemo(() => {
    const att = pendingStatus.attendance?.filter(p => p.status === 'pending').length || 0;
    const gatha = pendingStatus.gatha?.filter(p => p.status === 'pending').length || 0;
    return att + gatha;
  }, [pendingStatus]);

  const performanceLevel = useMemo(() => 
    getPerformanceLevel(userYearlyAttendance, userTotalGathas),
    [userYearlyAttendance, userTotalGathas]
  );

  // Calculate achievements
  const achievements = useMemo(() => {
    return ACHIEVEMENT_DEFINITIONS.map(ach => {
      let unlocked = false;
      let progress = 0;

      switch (ach.requirement.type) {
        case 'attendance':
          unlocked = userYearlyAttendance >= ach.requirement.count;
          progress = userYearlyAttendance / ach.requirement.count;
          break;
        case 'gatha':
          unlocked = userTotalGathas >= ach.requirement.count;
          progress = userTotalGathas / ach.requirement.count;
          break;
        case 'streak':
          unlocked = maxStreak >= ach.requirement.count;
          progress = maxStreak / ach.requirement.count;
          break;
        case 'combo':
          unlocked = userYearlyAttendance >= ach.requirement.attendance && userTotalGathas >= ach.requirement.gatha;
          progress = Math.min(userYearlyAttendance / ach.requirement.attendance, userTotalGathas / ach.requirement.gatha);
          break;
      }

      return { ...ach, unlocked, progress };
    });
  }, [userYearlyAttendance, userTotalGathas, maxStreak]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

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

  const calculateStreak = (history) => {
    const sortedDates = history
      .map(r => formatLocalDateString(r.date))
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
        headers: { Authorization: `Bearer ${token}` }
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
        const streakData = calculateStreak(data);
        setAttendanceStreak(streakData.current);
        setMaxStreak(streakData.max);
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
        setUserTotalGathas(entries.reduce((sum, e) => sum + (e.total_gatha || 0), 0));
      }
    } catch (error) {
      console.error('Error fetching gathas:', error);
    }
  }, []);

  const fetchYearlyStats = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/stats/yearly`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUserYearlyAttendance(data.totalDaysPresent ?? 0);
      }
    } catch (error) {
      console.error('Error fetching yearly stats:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        `${API_BASE}/analytics/leaderboard?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setAnalyticsData(await res.json());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [dateRange]);

  // Initial fetch
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchAttendance(),
        fetchGathas(),
        fetchPendingStatus(),
        fetchYearlyStats(),
      ]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  useEffect(() => {
    if (datePreset !== 'custom') {
      setDateRange(getDateRangePreset(datePreset));
    }
  }, [datePreset]);

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
      showSuccess('✅ Attendance submitted for approval!');
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
      const url = editingGatha 
        ? `${API_BASE}/gatha/pending/${editingGatha.id}`
        : `${API_BASE}/gatha`;
      
      const res = await fetch(url, {
        method: editingGatha ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit gatha');
      }

      showSuccess(editingGatha ? '✅ Gatha updated!' : '✅ Gatha submitted for approval!');
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
      showSuccess('🗑️ Entry deleted');
      await Promise.all([fetchPendingStatus(), fetchGathas()]);
    } catch (error) {
      setGlobalError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  const renderHome = () => (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{greeting.emoji}</span>
              <span className="text-orange-100 text-sm font-medium">{greeting.text}</span>
            </div>
            <h1 className="text-2xl font-bold">{user?.name || user?.username}</h1>
          </div>
          <div className={`w-14 h-14 bg-gradient-to-br ${performanceLevel.color} rounded-full flex items-center justify-center shadow-lg text-2xl`}>
            {performanceLevel.icon}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur text-sm font-bold`}>
            {performanceLevel.icon} {performanceLevel.label}
          </span>
          <span className="text-orange-100 text-sm">
            • {unlockedCount}/{achievements.length} achievements
          </span>
        </div>
      </div>

      {/* Streak Card */}
      <StreakDisplay streak={attendanceStreak} maxStreak={maxStreak} />

      {/* Today's Quick Actions */}
      <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            Today's Goals
          </h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Attendance Button */}
          <button
            onClick={markAttendance}
            disabled={todayAttendanceStatus !== 'not_marked' || isSubmitting}
            className={`p-4 rounded-xl transition-all active:scale-[0.98] ${
              todayAttendanceStatus === 'approved'
                ? 'bg-green-100 border-2 border-green-300'
                : todayAttendanceStatus === 'pending'
                ? 'bg-yellow-100 border-2 border-yellow-300'
                : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg'
            }`}
          >
            {todayAttendanceStatus === 'approved' ? (
              <>
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="font-bold text-green-700">Present ✓</p>
                <p className="text-xs text-green-600">Approved</p>
              </>
            ) : todayAttendanceStatus === 'pending' ? (
              <>
                <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-600 animate-pulse" />
                <p className="font-bold text-yellow-700">Pending...</p>
                <p className="text-xs text-yellow-600">Awaiting approval</p>
              </>
            ) : (
              <>
                <Calendar className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">Mark Present</p>
                <p className="text-xs opacity-80">Tap to mark</p>
              </>
            )}
          </button>

          {/* Gatha Button */}
          <button
            onClick={() => { setEditingGatha(null); setShowGathaModal(true); }}
            className="relative p-4 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg active:scale-[0.98]"
          >
            <BookOpen className="w-8 h-8 mx-auto mb-2" />
            <p className="font-bold">Add Gatha</p>
            <p className="text-xs opacity-80">Record progress</p>
            {(todaysApprovedGathas.length + todaysPendingGathas.length) > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold shadow">
                {todaysApprovedGathas.length + todaysPendingGathas.length}
              </span>
            )}
          </button>
        </div>

        {/* Today's Entries */}
        {(todaysApprovedGathas.length > 0 || todaysPendingGathas.length > 0) && (
          <div className="mt-4 pt-4 border-t-2 border-gray-100">
            <p className="text-sm font-bold text-gray-700 mb-2">Today's Gathas:</p>
            <div className="space-y-2">
              {[...todaysApprovedGathas.map(e => ({ ...e, status: 'approved' })), 
                ...todaysPendingGathas.map(e => ({ ...e, status: 'pending' }))].map((entry) => (
                <div key={entry.id} className={`flex items-center justify-between p-3 rounded-xl ${
                  entry.status === 'approved' ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      entry.type === 'new' ? 'bg-purple-200' : 'bg-blue-200'
                    }`}>
                      {entry.type === 'new' ? <Plus className="w-4 h-4 text-purple-700" /> : <RefreshCw className="w-4 h-4 text-blue-700" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{entry.sutra_name}</p>
                      <p className="text-xs text-gray-500">{entry.total_gatha} gathas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <PendingBadge status={entry.status} />
                    {entry.status === 'pending' && (
                      <>
                        <button
                          onClick={() => { setEditingGatha(entry); setShowGathaModal(true); }}
                          className="p-2 bg-blue-100 rounded-lg text-blue-600"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmAction({
                            title: 'Delete Gatha',
                            message: 'Are you sure you want to delete this entry?',
                            handler: () => deletePendingGatha(entry.id),
                          })}
                          className="p-2 bg-red-100 rounded-lg text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
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
        <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <CalendarDays className="w-8 h-8 text-green-500" />
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
              This Year
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{userYearlyAttendance}</p>
          <p className="text-xs text-gray-500 mt-1">Days Present</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <BookMarked className="w-8 h-8 text-purple-500" />
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
              Lifetime
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{userTotalGathas}</p>
          <p className="text-xs text-gray-500 mt-1">Total Gathas</p>
        </div>
      </div>

      {/* Daily Quote */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{dailyQuote.emoji}</span>
          <div>
            <p className="text-lg font-bold">{dailyQuote.text}</p>
            <p className="text-sm text-indigo-100 mt-1">{dailyQuote.meaning}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderActivity = () => {
    const allPending = [
      ...pendingStatus.attendance?.filter(p => p.status === 'pending').map(p => ({ ...p, itemType: 'attendance' })) || [],
      ...pendingStatus.gatha?.filter(p => p.status === 'pending').map(p => ({ ...p, itemType: 'gatha' })) || [],
    ];
    const allRejected = [
      ...pendingStatus.attendance?.filter(p => p.status === 'rejected').map(p => ({ ...p, itemType: 'attendance' })) || [],
      ...pendingStatus.gatha?.filter(p => p.status === 'rejected').map(p => ({ ...p, itemType: 'gatha' })) || [],
    ];

    return (
      <div className="space-y-4">
        {/* Pending Summary */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <span className="font-bold">Pending Approvals</span>
            </div>
            <button
              onClick={fetchPendingStatus}
              className="p-2 bg-white/20 rounded-xl"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <p className="text-4xl font-bold">{totalPendingCount}</p>
          <p className="text-sm text-yellow-100">items awaiting approval</p>
        </div>

        {/* Pending Items */}
        {totalPendingCount === 0 ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-green-200 text-center shadow-sm">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <p className="text-lg font-bold text-gray-800">All Caught Up! 🎉</p>
            <p className="text-sm text-gray-500">No pending approvals</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Awaiting Approval
            </h3>
            <div className="space-y-3">
              {allPending.map((item, index) => (
                <div key={index} className={`p-4 rounded-xl border-2 ${
                  item.itemType === 'attendance' ? 'bg-blue-50 border-blue-200' : 'bg-purple-50 border-purple-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        item.itemType === 'attendance' ? 'bg-blue-200' : 'bg-purple-200'
                      }`}>
                        {item.itemType === 'attendance' 
                          ? <Calendar className="w-5 h-5 text-blue-700" />
                          : <BookOpen className="w-5 h-5 text-purple-700" />
                        }
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {item.itemType === 'attendance' ? 'Attendance' : `Gatha - ${item.type}`}
                        </p>
                        <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                        {item.itemType === 'gatha' && (
                          <p className="text-xs text-gray-500 mt-1">{item.sutra_name} • {item.total_gatha} gathas</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <PendingBadge status="pending" />
                      {item.itemType === 'gatha' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingGatha(item); setShowGathaModal(true); }}
                            className="p-2 bg-blue-100 rounded-lg text-blue-600"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => setConfirmAction({
                              title: 'Delete Gatha',
                              message: 'Are you sure?',
                              handler: () => deletePendingGatha(item.id),
                            })}
                            className="p-2 bg-red-100 rounded-lg text-red-600"
                          >
                            <Trash2 size={12} />
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

        {/* Rejected Items */}
        {allRejected.length > 0 && (
          <div className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Rejected ({allRejected.length})
            </h3>
            <div className="space-y-3">
              {allRejected.map((item, index) => (
                <div key={index} className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                      {item.itemType === 'attendance' 
                        ? <Calendar className="w-5 h-5 text-red-700" />
                        : <BookOpen className="w-5 h-5 text-red-700" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {item.itemType === 'attendance' ? 'Attendance' : `Gatha - ${item.type}`}
                      </p>
                      <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                      {item.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {item.rejection_reason}</p>
                      )}
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

  const renderStats = () => (
    <div className="space-y-4">
      {/* Achievements Section */}
      <div className="bg-white rounded-2xl p-4 border-2 border-yellow-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-500" />
            Achievements
          </h3>
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
            {unlockedCount}/{achievements.length}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {achievements.map((ach) => (
            <AchievementCard
              key={ach.id}
              achievement={ach}
              unlocked={ach.unlocked}
              progress={ach.progress}
              onClick={() => setSelectedAchievement(ach)}
            />
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-2xl p-4 border-2 border-indigo-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Pathshala Leaders
          </h3>
          <button
            onClick={fetchAnalytics}
            className="p-2 bg-indigo-100 rounded-lg"
          >
            <RefreshCw className="w-4 h-4 text-indigo-600" />
          </button>
        </div>

        {/* Date Range */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: 'year', label: 'Year' },
            { key: 'all', label: 'All Time' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => setDatePreset(preset.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold ${
                datePreset === preset.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {/* Attendance Leader */}
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-yellow-800">🏆 Attendance King</p>
                <p className="text-lg font-bold text-gray-800">
                  {analyticsData.attendanceLeader?.username || 'N/A'}
                </p>
                <p className="text-sm text-yellow-700">
                  {analyticsData.attendanceLeader?.attendance_count || 0} days
                </p>
              </div>
            </div>
          </div>

          {/* Gatha Leader */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-800">📚 Gatha Master</p>
                <p className="text-lg font-bold text-gray-800">
                  {analyticsData.gathaStats?.gathaLeader?.username || 'N/A'}
                </p>
                <p className="text-sm text-purple-700">
                  {analyticsData.gathaStats?.gathaLeader?.count || 0} gathas
                </p>
              </div>
            </div>
          </div>

          {/* Total Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-700">
                {analyticsData.gathaStats?.totalAttendance || 0}
              </p>
              <p className="text-xs text-gray-600">Total Attendance</p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center">
              <BookOpen className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-700">
                {analyticsData.gathaStats?.totalPathshalaGathas || 0}
              </p>
              <p className="text-xs text-gray-600">Total Gathas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Your Progress */}
      <div className="bg-white rounded-2xl p-4 border-2 border-green-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-500" />
          Your Progress
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-xl p-4 text-center border-2 border-green-200">
            <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-green-600">{userYearlyAttendance}</p>
            <p className="text-xs text-gray-600">Days This Year</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border-2 border-purple-200">
            <BookOpen className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-purple-600">{userTotalGathas}</p>
            <p className="text-xs text-gray-600">Lifetime Gathas</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center border-2 border-orange-200">
            <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-orange-600">{attendanceStreak}</p>
            <p className="text-xs text-gray-600">Current Streak</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 text-center border-2 border-yellow-200">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-3xl font-bold text-yellow-600">{maxStreak}</p>
            <p className="text-xs text-gray-600">Best Streak</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-orange-200">
          <RefreshCw className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      );
    }

    switch (currentPage) {
      case PAGES.HOME: return renderHome();
      case PAGES.ACTIVITY: return renderActivity();
      case PAGES.STATS: return renderStats();
      case PAGES.HISTORY: return <HistoryPage />;
      default: return renderHome();
    }
  };

  // ==================== MAIN RETURN ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-md px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-sm">જૈન પાઠશાળા</h1>
              <p className="text-xs text-gray-500">Jain Pathshala</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-sm active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            Exit
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Messages */}
        {globalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-4 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{globalError}</p>
            </div>
            <button onClick={() => setGlobalError('')} className="text-red-400">
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl mb-4 flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { key: PAGES.HOME, icon: Activity, label: 'Home' },
            { key: PAGES.ACTIVITY, icon: Clock, label: 'Pending', badge: totalPendingCount },
            { key: PAGES.STATS, icon: Award, label: 'Stats', badge: unlockedCount },
            { key: PAGES.HISTORY, icon: Calendar, label: 'History' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentPage(tab.key)}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-all active:scale-[0.98] ${
                currentPage === tab.key
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'bg-white text-gray-600 border-2 border-orange-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge > 0 && (
                <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                  tab.key === PAGES.ACTIVITY ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderContent()}

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">© 2024 Jain Pathshala • Made with ❤️</p>
        </div>
      </div>

      {/* Modals */}
      <GathaEntryModal
        isOpen={showGathaModal}
        onClose={() => { setShowGathaModal(false); setEditingGatha(null); }}
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

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setSelectedAchievement(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              selectedAchievement.unlocked
                ? `bg-gradient-to-br ${
                    selectedAchievement.color === 'gold' ? 'from-yellow-300 to-yellow-500' :
                    selectedAchievement.color === 'silver' ? 'from-gray-300 to-gray-500' :
                    selectedAchievement.color === 'diamond' ? 'from-cyan-300 to-blue-500' :
                    'from-orange-300 to-orange-500'
                  }`
                : 'bg-gray-200'
            }`}>
              {React.createElement(selectedAchievement.icon, {
                className: `w-10 h-10 ${selectedAchievement.unlocked ? 'text-white' : 'text-gray-400'}`
              })}
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">{selectedAchievement.title}</h3>
            <p className="text-gray-600 mb-4">{selectedAchievement.description}</p>
            
            {selectedAchievement.unlocked ? (
              <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Achievement Unlocked! 🎉
              </div>
            ) : (
              <div>
                <div className="bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(selectedAchievement.progress * 100, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  {Math.round(selectedAchievement.progress * 100)}% complete
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedAchievement(null)}
              className="mt-4 w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
