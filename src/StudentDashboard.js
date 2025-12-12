import React, { useEffect, useMemo, useState } from 'react';
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
  Sun,
  Moon,
  Sunrise,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Gift,
  Medal,
  RefreshCw,
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

const getMonthDateRange = () => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return {
    start: formatLocalDateString(startOfMonth),
    end: formatLocalDateString(endOfMonth),
  };
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: Sunrise, emoji: '🌅' };
  if (hour < 17) return { text: 'Good Afternoon', icon: Sun, emoji: '☀️' };
  return { text: 'Good Evening', icon: Moon, emoji: '🌙' };
};

const PAGES = {
  DASHBOARD: 'Dashboard',
  HISTORY: 'History',
  PENDING: 'Pending',
};

// Motivational quotes
const QUOTES = [
  { text: "अहिंसा परमो धर्मः", meaning: "Non-violence is the supreme religion" },
  { text: "क्षमा वीरस्य भूषणम्", meaning: "Forgiveness is the ornament of the brave" },
  { text: "जीवो जीवस्य जीवनम्", meaning: "Live and let live" },
  { text: "परस्परोपग्रहो जीवानाम्", meaning: "Souls render service to one another" },
];

// -------------------------------------
// Animated Counter Component
// -------------------------------------
const AnimatedCounter = ({ value, duration = 1000, className = '' }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) {
      setCount(end);
      return;
    }
    
    const incrementTime = duration / end;
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);
  
  return <span className={className}>{count}</span>;
};

// -------------------------------------
// Circular Progress Component
// -------------------------------------
const CircularProgress = ({ value, max, size = 80, strokeWidth = 8, color = 'orange' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min((value / max) * 100, 100);
  const offset = circumference - (percentage / 100) * circumference;
  
  const colorMap = {
    orange: { stroke: '#f97316', bg: '#fed7aa' },
    green: { stroke: '#22c55e', bg: '#bbf7d0' },
    purple: { stroke: '#a855f7', bg: '#e9d5ff' },
    blue: { stroke: '#3b82f6', bg: '#bfdbfe' },
  };
  
  const colors = colorMap[color] || colorMap.orange;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.bg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-gray-800">{value}</span>
      </div>
    </div>
  );
};

// -------------------------------------
// Progress Bar Component
// -------------------------------------
const ProgressBar = ({ value, max, color = 'orange', showLabel = true, label = '' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  const colorMap = {
    orange: 'from-orange-400 to-orange-600',
    green: 'from-green-400 to-green-600',
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    pink: 'from-pink-400 to-pink-600',
  };
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-gray-600">{label}</span>
          <span className="font-bold text-gray-800">{value}/{max}</span>
        </div>
      )}
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// -------------------------------------
// Streak Badge Component
// -------------------------------------
const StreakBadge = ({ streak }) => {
  if (streak === 0) return null;
  
  const getStreakInfo = (s) => {
    if (s >= 30) return { color: 'from-yellow-400 to-orange-500', icon: Crown, label: 'Champion!' };
    if (s >= 14) return { color: 'from-purple-400 to-pink-500', icon: Star, label: 'Amazing!' };
    if (s >= 7) return { color: 'from-blue-400 to-cyan-500', icon: Zap, label: 'Great!' };
    return { color: 'from-green-400 to-emerald-500', icon: Flame, label: 'Keep going!' };
  };
  
  const info = getStreakInfo(streak);
  const Icon = info.icon;
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${info.color} text-white shadow-lg`}>
      <Icon className="w-5 h-5 animate-pulse" />
      <span className="font-bold">{streak} Day Streak!</span>
      <span className="text-xs opacity-80">{info.label}</span>
    </div>
  );
};

// -------------------------------------
// Quick Stat Card Component
// -------------------------------------
const QuickStatCard = ({ icon: Icon, label, value, subtext, color, onClick }) => {
  const colorMap = {
    orange: 'from-orange-400 to-amber-500 border-orange-200',
    green: 'from-green-400 to-emerald-500 border-green-200',
    purple: 'from-purple-400 to-violet-500 border-purple-200',
    blue: 'from-blue-400 to-cyan-500 border-blue-200',
    pink: 'from-pink-400 to-rose-500 border-pink-200',
    yellow: 'from-yellow-400 to-amber-500 border-yellow-200',
  };
  
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl p-4 border-2 ${colorMap[color].split(' ')[2]} shadow-lg hover:shadow-xl transition-all active:scale-[0.98] text-left w-full`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center mb-3 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-800">
        <AnimatedCounter value={value} />
      </p>
      <p className="text-sm font-semibold text-gray-600">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </button>
  );
};

// -------------------------------------
// Achievement Badge Component
// -------------------------------------
const AchievementBadge = ({ title, description, icon: Icon, unlocked, color }) => {
  const colorMap = {
    gold: 'from-yellow-400 to-amber-500',
    silver: 'from-gray-300 to-gray-400',
    bronze: 'from-orange-400 to-orange-600',
    purple: 'from-purple-400 to-purple-600',
  };
  
  return (
    <div className={`relative p-3 rounded-xl border-2 ${unlocked ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
      <div className={`w-10 h-10 rounded-full ${unlocked ? `bg-gradient-to-br ${colorMap[color]}` : 'bg-gray-300'} flex items-center justify-center mx-auto mb-2`}>
        <Icon className={`w-5 h-5 ${unlocked ? 'text-white' : 'text-gray-500'}`} />
      </div>
      <p className={`text-xs font-bold text-center ${unlocked ? 'text-gray-800' : 'text-gray-500'}`}>{title}</p>
      <p className="text-xs text-gray-500 text-center mt-1">{description}</p>
      {unlocked && (
        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 animate-pulse" />
      )}
    </div>
  );
};

// -------------------------------------
// Confirmation Modal Component
// -------------------------------------
const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmColor = 'red' }) => {
  if (!title) return null;

  const colorClasses = {
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 transform animate-scale-in">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        </div>
        <p className="text-gray-600 mb-6 text-sm pl-16">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 text-white font-bold rounded-xl transition-colors ${colorClasses[confirmColor]}`}
          >
            {confirmText}
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
    pending: {
      className: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      icon: Clock,
      label: 'Pending',
      animate: true,
    },
    approved: {
      className: 'text-green-700 bg-green-100 border-green-300',
      icon: Check,
      label: 'Approved',
      animate: false,
    },
    rejected: {
      className: 'text-red-700 bg-red-100 border-red-300',
      icon: CloseIcon,
      label: 'Rejected',
      animate: false,
    },
  };

  const badge = badges[status];
  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.className}`}>
      <Icon className={`w-3 h-3 ${badge.animate ? 'animate-pulse' : ''}`} />
      {badge.label}
    </span>
  );
};

// -------------------------------------
// Today's Quick Actions Component
// -------------------------------------
const TodaysQuickActions = ({ 
  attendanceStatus, 
  onMarkAttendance, 
  onAddGatha, 
  isSubmitting,
  todaysEntries,
  todaysPendingGatha 
}) => {
  const totalToday = todaysEntries.length + todaysPendingGatha.length;
  
  return (
    <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-5 shadow-2xl text-white mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-orange-100 text-sm font-medium">Today's Progress</p>
          <p className="text-2xl font-bold">{formatDateIn(new Date(), { weekday: 'long', day: 'numeric', month: 'short' })}</p>
        </div>
        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Target className="w-7 h-7" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Attendance Quick Action */}
        <button
          onClick={onMarkAttendance}
          disabled={attendanceStatus !== 'not_marked' || isSubmitting}
          className={`relative p-4 rounded-2xl transition-all active:scale-[0.98] ${
            attendanceStatus === 'approved'
              ? 'bg-green-500 bg-opacity-30 border-2 border-green-300'
              : attendanceStatus === 'pending'
              ? 'bg-yellow-500 bg-opacity-30 border-2 border-yellow-300'
              : 'bg-white bg-opacity-20 hover:bg-opacity-30 border-2 border-white border-opacity-30'
          }`}
        >
          {attendanceStatus === 'approved' ? (
            <>
              <Check className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-bold">Present ✓</p>
            </>
          ) : attendanceStatus === 'pending' ? (
            <>
              <Clock className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              <p className="text-sm font-bold">Pending...</p>
            </>
          ) : (
            <>
              <Calendar className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-bold">Mark Present</p>
            </>
          )}
        </button>
        
        {/* Gatha Quick Action */}
        <button
          onClick={onAddGatha}
          className="relative p-4 rounded-2xl bg-white bg-opacity-20 hover:bg-opacity-30 transition-all active:scale-[0.98] border-2 border-white border-opacity-30"
        >
          <BookOpen className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm font-bold">Add Gatha</p>
          {totalToday > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
              {totalToday}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

// -------------------------------------
// Gatha Entry Mini Card
// -------------------------------------
const GathaEntryCard = ({ entry, status, onEdit, onDelete }) => {
  const isNew = entry.type === 'new';
  const isPending = status === 'pending';
  
  return (
    <div className={`relative p-4 rounded-xl border-2 ${
      isPending 
        ? isNew ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
        : 'bg-green-50 border-green-200'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isNew ? 'bg-purple-200' : 'bg-blue-200'
          }`}>
            {isNew ? <Plus className="w-5 h-5 text-purple-700" /> : <Heart className="w-5 h-5 text-blue-700" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isNew ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {isNew ? 'New' : 'Revision'}
              </span>
              <PendingBadge status={status} />
            </div>
            <p className="text-sm font-bold text-gray-800 truncate">{entry.sutra_name}</p>
            <p className="text-xs text-gray-600">{entry.which_gatha}</p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-bold text-gray-700">{entry.total_gatha}</span> gathas
            </p>
          </div>
        </div>
        
        {isPending && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// -------------------------------------
// Analytics Card Component
// -------------------------------------
const AnalyticsCard = ({ title, icon: Icon, children, color = 'orange', action }) => {
  const [expanded, setExpanded] = useState(true);
  
  const colorMap = {
    orange: 'from-orange-400 to-amber-500 border-orange-200',
    green: 'from-green-400 to-emerald-500 border-green-200',
    purple: 'from-purple-400 to-violet-500 border-purple-200',
    blue: 'from-blue-400 to-cyan-500 border-blue-200',
  };
  
  return (
    <div className={`bg-white rounded-2xl shadow-xl border-2 ${colorMap[color].split(' ')[2]} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color].split(' ').slice(0, 2).join(' ')} flex items-center justify-center shadow-md`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {action}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {expanded && <div className="p-4 pt-0">{children}</div>}
    </div>
  );
};

// -------------------------------------
// Leaderboard Mini Component
// -------------------------------------
const LeaderboardMini = ({ leader, type, color }) => {
  if (!leader) return null;
  
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${
      color === 'gold' ? 'from-yellow-50 to-amber-50 border-2 border-yellow-200' : 
      'from-purple-50 to-pink-50 border-2 border-purple-200'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        color === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 
        'bg-gradient-to-br from-purple-400 to-pink-500'
      }`}>
        {color === 'gold' ? (
          <Trophy className="w-6 h-6 text-white" />
        ) : (
          <Crown className="w-6 h-6 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500">{type}</p>
        <p className="font-bold text-gray-800 truncate">{leader.username}</p>
        <p className="text-sm text-gray-600">{leader.count || leader.attendance_count} {type === 'Attendance' ? 'days' : 'gathas'}</p>
      </div>
      <Medal className={`w-6 h-6 ${color === 'gold' ? 'text-yellow-500' : 'text-purple-500'}`} />
    </div>
  );
};

// -------------------------------------
// History Page Component
// -------------------------------------
const HistoryPage = ({ formatDateIn, formatLocalDateString }) => {
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

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

      if (!res.ok) {
        throw new Error('Failed to load history.');
      }

      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Fetch History Error:', err);
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

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (newYear > currentYear || (newYear === currentYear && newMonth > currentMonth)) {
      return;
    }

    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
  };

  const handleDayClick = (dateStr, activity) => {
    setSelectedDayDetails({ dateStr, activity });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedDayDetails(null);
  };

  const activityData = historyData?.dailyActivity ?? {};

  const presentDays = useMemo(() => {
    return Object.entries(activityData)
      .filter(([_, activity]) => activity?.present === true)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [activityData]);

  const monthlySummary = useMemo(() => {
    let presentCount = 0;
    let newGathas = 0;
    let revisionGathas = 0;

    Object.entries(activityData).forEach(([dateStr, activity]) => {
      const normalized = activity || {};
      const gathas = normalized.gathas || { new: 0, revision: 0 };
      
      if (normalized.present) {
        presentCount += 1;
      }
      
      newGathas += Number(gathas.new || 0);
      revisionGathas += Number(gathas.revision || 0);
    });

    return {
      presentDays: presentCount,
      newGathas,
      revisionGathas,
    };
  }, [activityData]);

  // Calendar days in month
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();

  const renderCalendarView = () => {
    const days = [];
    const todayIso = formatLocalDateString(new Date());
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const activity = activityData[dateStr];
      const isPresent = activity?.present === true;
      const isToday = dateStr === todayIso;
      const hasGathas = (activity?.gathas?.new || 0) + (activity?.gathas?.revision || 0) > 0;
      
      days.push(
        <button
          key={day}
          onClick={() => isPresent && handleDayClick(dateStr, activity)}
          className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
            isPresent
              ? 'bg-green-500 text-white shadow-md hover:scale-110'
              : isToday
              ? 'bg-orange-100 text-orange-600 border-2 border-orange-400'
              : 'text-gray-400'
          }`}
        >
          {isPresent ? (
            <div className="relative">
              {day}
              {hasGathas && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
              )}
            </div>
          ) : (
            day
          )}
        </button>
      );
    }
    
    return (
      <div className="bg-white rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="h-8 flex items-center justify-center text-xs font-bold text-gray-400">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">Present</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span className="text-gray-600">Absent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-600">Has Gathas</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-4 text-white shadow-lg">
        <Calendar className="w-8 h-8 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{monthlySummary.presentDays}</p>
        <p className="text-sm text-green-100">Days Present</p>
      </div>
      
      <div className="bg-gradient-to-br from-purple-400 to-violet-500 rounded-2xl p-4 text-white shadow-lg">
        <Plus className="w-8 h-8 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{monthlySummary.newGathas}</p>
        <p className="text-sm text-purple-100">New Gathas</p>
      </div>
      
      <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-4 text-white shadow-lg">
        <Heart className="w-8 h-8 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{monthlySummary.revisionGathas}</p>
        <p className="text-sm text-blue-100">Revisions</p>
      </div>
      
      <div className="bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl p-4 text-white shadow-lg">
        <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
        <p className="text-3xl font-bold">{monthlySummary.newGathas + monthlySummary.revisionGathas}</p>
        <p className="text-sm text-orange-100">Total Gathas</p>
      </div>
    </div>
  );

  const renderModal = () => {
    if (!showModal || !selectedDayDetails) return null;
    const { dateStr, activity } = selectedDayDetails;
    const newGathas = (activity.details || []).filter((d) => d.type === 'new');
    const revisionGathas = (activity.details || []).filter((d) => d.type === 'revision');
    const newCount = Number(activity.gathas?.new || 0);
    const revisionCount = Number(activity.gathas?.revision || 0);

    return (
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-3xl p-5 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Calendar size={24} className="text-orange-500" />
                {formatDateIn(dateStr, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  <Check size={12} /> Approved
                </span>
              </div>
            </div>
            <button 
              onClick={closeModal} 
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" 
              aria-label="Close"
            >
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* New Gathas */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border-2 border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <Plus size={18} strokeWidth={3} /> New Gathas: {newCount}
              </h4>
              {newGathas.length === 0 ? (
                <p className="text-sm text-purple-600 bg-white bg-opacity-50 px-4 py-3 rounded-xl">
                  No new gathas recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {newGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white border border-purple-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-white bg-purple-500 px-2 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-purple-700">{entry.total_gatha} gathas</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Sutra:</strong> {entry.sutra_name}</p>
                      <p className="text-sm text-gray-600"><strong>Gatha:</strong> {entry.which_gatha}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revisions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-2xl border-2 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Heart size={18} strokeWidth={3} /> Revisions: {revisionCount}
              </h4>
              {revisionGathas.length === 0 ? (
                <p className="text-sm text-blue-600 bg-white bg-opacity-50 px-4 py-3 rounded-xl">
                  No revisions recorded
                </p>
              ) : (
                <div className="space-y-2">
                  {revisionGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white border border-blue-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-bold text-blue-700">{entry.total_gatha} gathas</span>
                      </div>
                      <p className="text-sm text-gray-700"><strong>Sutra:</strong> {entry.sutra_name}</p>
                      <p className="text-sm text-gray-600"><strong>Gatha:</strong> {entry.which_gatha}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={closeModal}
            className="w-full mt-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-3 rounded-xl bg-orange-50 active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} className="text-orange-600" />
          </button>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-800">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-sm text-gray-500">Tap a green day for details</p>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()}
            className="p-3 rounded-xl bg-orange-50 active:scale-95 transition-transform disabled:opacity-40"
          >
            <ChevronRight size={24} className="text-orange-600" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="mt-4 text-gray-600">Loading history...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        ) : (
          <>
            {renderCalendarView()}
            {renderSummaryCards()}
          </>
        )}
      </div>

      {renderModal()}
    </div>
  );
};

// -------------------------------------
// Pending Page Component
// -------------------------------------
const PendingPage = ({ pendingStatus, onRefresh, onEditGatha, onDeletePendingGatha }) => {
  const pendingAttendance = pendingStatus.attendance?.filter(p => p.status === 'pending') || [];
  const pendingGatha = pendingStatus.gatha?.filter(p => p.status === 'pending') || [];
  const rejectedItems = [
    ...(pendingStatus.attendance?.filter(p => p.status === 'rejected') || []).map(i => ({ ...i, itemType: 'attendance' })),
    ...(pendingStatus.gatha?.filter(p => p.status === 'rejected') || []).map(i => ({ ...i, itemType: 'gatha' })),
  ];

  const totalPending = pendingAttendance.length + pendingGatha.length;

  return (
    <div className="space-y-4">
      {/* Pending Summary Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-100 text-sm">Awaiting Approval</p>
            <p className="text-3xl font-bold">{totalPending}</p>
            <p className="text-yellow-100 text-sm">items pending</p>
          </div>
          <button
            onClick={onRefresh}
            className="p-3 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-colors"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Pending Items */}
      {totalPending === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center border-2 border-green-200">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up! 🎉</h3>
          <p className="text-gray-600">No pending approvals. Great job!</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-yellow-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Items
          </h3>
          
          <div className="space-y-3">
            {/* Pending Attendance */}
            {pendingAttendance.map((item) => (
              <div key={`att-${item.id}`} className="flex items-center gap-3 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-yellow-700" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">Attendance</p>
                  <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                </div>
                <PendingBadge status="pending" />
              </div>
            ))}

            {/* Pending Gatha */}
            {pendingGatha.map((item) => (
              <GathaEntryCard
                key={`gatha-${item.id}`}
                entry={item}
                status="pending"
                onEdit={onEditGatha}
                onDelete={onDeletePendingGatha}
              />
            ))}
          </div>
        </div>
      )}

      {/* Rejected Items */}
      {rejectedItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-4 border-2 border-red-200">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Rejected ({rejectedItems.length})
          </h3>
          
          <div className="space-y-3">
            {rejectedItems.map((item, index) => (
              <div key={`rejected-${index}`} className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border-2 border-red-200">
                <div className="w-12 h-12 bg-red-200 rounded-xl flex items-center justify-center">
                  {item.itemType === 'attendance' ? (
                    <Calendar className="w-6 h-6 text-red-700" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-red-700" />
                  )}
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
            ))}
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
  // Navigation
  const [currentPage, setCurrentPage] = useState(PAGES.DASHBOARD);

  // Attendance & stats
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayAttendanceMarked, setTodayAttendanceMarked] = useState(false);
  const [userYearlyAttendance, setUserYearlyAttendance] = useState(0);
  const [attendanceStreak, setAttendanceStreak] = useState(0);

  // Pending Status
  const [pendingStatus, setPendingStatus] = useState({ attendance: [], gatha: [] });
  const [todayPendingAttendance, setTodayPendingAttendance] = useState(null);

  // Gatha entries
  const [gathaEntries, setGathaEntries] = useState([]);
  const [showGathaForm, setShowGathaForm] = useState(false);
  const [activeGathaTab, setActiveGathaTab] = useState('new');
  const [gathaForm, setGathaForm] = useState({
    sutraName: '',
    whichGatha: '',
    totalGatha: '',
  });
  
  // Edit mode state
  const [editingGatha, setEditingGatha] = useState(null);
  const [editForm, setEditForm] = useState({
    sutraName: '',
    whichGatha: '',
    totalGatha: '',
  });

  // Analytics
  const [dateRange, setDateRange] = useState(getMonthDateRange());
  const [analyticsData, setAnalyticsData] = useState({ attendanceLeader: null, gathaStats: null });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [userNewGathasCount, setUserNewGathasCount] = useState(0);
  const [userTotalGathasCount, setUserTotalGathasCount] = useState(0);

  // UI feedback
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Daily quote
  const [dailyQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  // Convenience
  const todayIso = formatLocalDateString(new Date());
  const greeting = getGreeting();

  const clearGlobalError = () => setGlobalError('');

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Normalizer for gatha entries
  const normalizeEntry = (entry) => ({
    id: entry.id ?? entry._id ?? null,
    type: entry.type,
    sutra_name: entry.sutra_name ?? entry.sutraName ?? entry.sutra ?? '',
    which_gatha: entry.which_gatha ?? entry.whichGatha ?? entry.gatha ?? '',
    total_gatha: Number(entry.total_gatha ?? entry.totalGatha ?? entry.total ?? 0),
    created_at: entry.created_at ?? entry.date ?? entry.createdAt ?? null,
  });

  // Memoized derived data
  const todaysEntries = useMemo(
    () =>
      gathaEntries.filter(
        (e) => e.created_at && formatLocalDateString(e.created_at) === todayIso,
      ),
    [gathaEntries, todayIso],
  );

  // Get pending gatha for today
  const todaysPendingGatha = useMemo(() => {
    return pendingStatus.gatha?.filter(
      (p) => formatLocalDateString(p.date) === todayIso && p.status === 'pending'
    ) || [];
  }, [pendingStatus.gatha, todayIso]);

  // Count total pending
  const totalPendingCount = useMemo(() => {
    const pendingAtt = pendingStatus.attendance?.filter(p => p.status === 'pending').length || 0;
    const pendingGatha = pendingStatus.gatha?.filter(p => p.status === 'pending').length || 0;
    return pendingAtt + pendingGatha;
  }, [pendingStatus]);

  // Attendance status for today
  const todayAttendanceStatus = useMemo(() => {
    if (todayAttendanceMarked) return 'approved';
    if (todayPendingAttendance) return 'pending';
    return 'not_marked';
  }, [todayAttendanceMarked, todayPendingAttendance]);

  // Calculate streak
  const calculateStreak = (history) => {
    const sortedDates = history
      .map(r => formatLocalDateString(r.date))
      .sort((a, b) => new Date(b) - new Date(a));
    
    if (sortedDates.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const dateStr of sortedDates) {
      const date = new Date(dateStr);
      date.setHours(0, 0, 0, 0);
      
      const diffDays = Math.floor((currentDate - date) / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 1) {
        streak++;
        currentDate = date;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // Achievements
  const achievements = useMemo(() => [
    {
      title: 'First Steps',
      description: '1 day attendance',
      icon: Star,
      unlocked: userYearlyAttendance >= 1,
      color: 'bronze',
    },
    {
      title: 'Week Warrior',
      description: '7 days attendance',
      icon: Flame,
      unlocked: userYearlyAttendance >= 7,
      color: 'silver',
    },
    {
      title: 'Month Master',
      description: '30 days attendance',
      icon: Trophy,
      unlocked: userYearlyAttendance >= 30,
      color: 'gold',
    },
    {
      title: 'Gatha Guru',
      description: '100+ gathas',
      icon: BookOpen,
      unlocked: userTotalGathasCount >= 100,
      color: 'purple',
    },
  ], [userYearlyAttendance, userTotalGathasCount]);

  // -------------------------------------
  // API calls
  // -------------------------------------
  const fetchPendingStatus = async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/student/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingStatus(data);
        
        const todayPending = data.attendance?.find(
          (p) => formatLocalDateString(p.date) === todayIso && p.status === 'pending'
        );
        setTodayPendingAttendance(todayPending || null);
      }
    } catch (error) {
      console.error('Error fetching pending status:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!dateRange.start || !dateRange.end) return;
    setIsAnalyticsLoading(true);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(
        `${API_BASE}/analytics/leaderboard?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Could not fetch analytics.');
      const data = await res.json();
      setAnalyticsData(data);
      clearGlobalError();
    } catch (error) {
      setAnalyticsData({ attendanceLeader: null, gathaStats: null });
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchUserYearlyStats = async () => {
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(`${API_BASE}/stats/yearly`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not fetch yearly stats.');
      const data = await res.json();
      setUserYearlyAttendance(data.totalDaysPresent ?? 0);
    } catch (error) {
      setUserYearlyAttendance(0);
    }
  };

  const fetchGathaEntries = async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/gatha`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not fetch gatha entries.');
      const data = await res.json();
      const entries = Array.isArray(data) ? data.map(normalizeEntry) : [];
      setGathaEntries(entries);
      
      // Calculate total gathas
      const total = entries.reduce((sum, e) => sum + Number(e.total_gatha || 0), 0);
      setUserTotalGathasCount(total);
    } catch (error) {
      setGathaEntries([]);
    }
  };

  const fetchAttendance = async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/attendance`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not fetch attendance history.');
      const data = await res.json();
      const history = Array.isArray(data) ? data : [];
      setAttendanceHistory(history);
      setAttendanceStreak(calculateStreak(history));
    } catch (error) {
      setAttendanceHistory([]);
    }
  };

  // -------------------------------------
  // Effects
  // -------------------------------------
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    fetchUserYearlyStats();
    fetchAttendance();
    fetchGathaEntries();
    fetchPendingStatus();
  }, []);

  useEffect(() => {
    const isMarked = attendanceHistory.some(
      (record) => formatLocalDateString(record.date) === todayIso,
    );
    setTodayAttendanceMarked(isMarked);
  }, [attendanceHistory, todayIso]);

  useEffect(() => {
    const startRange = coerceToDate(dateRange.start);
    const endRange = coerceToDate(dateRange.end);

    if (!startRange || !endRange) {
      setUserNewGathasCount(0);
      return;
    }

    const count = gathaEntries
      .filter((e) => {
        if (e.type !== 'new' || !e.created_at) return false;
        const entryDate = coerceToDate(e.created_at);
        if (!entryDate) return false;
        return entryDate >= startRange && entryDate <= endRange;
      })
      .reduce((sum, e) => sum + Number(e.total_gatha || 0), 0);

    setUserNewGathasCount(count);
  }, [gathaEntries, dateRange.start, dateRange.end]);

  // -------------------------------------
  // Attendance + Gatha handlers
  // -------------------------------------
  const markAttendance = async () => {
    if (todayAttendanceStatus !== 'not_marked') return;
    
    setGlobalError('');
    setIsSubmitting(true);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const response = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setGlobalError(data.error || 'Failed to mark attendance');
        return;
      }

      showSuccess('✅ Attendance submitted for approval!');
      await fetchPendingStatus();
    } catch (error) {
      console.error('markAttendance error:', error);
      setGlobalError('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitGatha = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('jainPathshalaToken');
    setIsSubmitting(true);
    setGlobalError('');

    const { sutraName, whichGatha, totalGatha } = gathaForm;

    if (!sutraName || !whichGatha || !totalGatha) {
      setGlobalError('Please fill all fields');
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        type: activeGathaTab,
        sutra_name: sutraName,
        which_gatha: whichGatha,
        total_gatha: Number(totalGatha),
      };

      const res = await fetch(`${API_BASE}/gatha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit gatha');
      }

      showSuccess('✅ Gatha submitted for approval!');
      await fetchPendingStatus();
      setGathaForm({ sutraName: '', whichGatha: '', totalGatha: '' });
      setShowGathaForm(false);
    } catch (error) {
      console.error('submitGatha error:', error);
      setGlobalError(error.message || 'Failed to submit gatha');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit gatha
  const handleEditGatha = (entry) => {
    setEditingGatha(entry);
    setEditForm({
      sutraName: entry.sutra_name || '',
      whichGatha: entry.which_gatha || '',
      totalGatha: String(entry.total_gatha || ''),
    });
  };

  const closeEditModal = () => {
    setEditingGatha(null);
    setEditForm({ sutraName: '', whichGatha: '', totalGatha: '' });
  };

  const submitEditedGatha = async () => {
    if (!editingGatha) return;
    
    const token = localStorage.getItem('jainPathshalaToken');
    setIsSubmitting(true);
    setGlobalError('');

    try {
      const payload = {
        sutra_name: editForm.sutraName,
        which_gatha: editForm.whichGatha,
        total_gatha: Number(editForm.totalGatha),
      };

      const res = await fetch(`${API_BASE}/gatha/pending/${editingGatha.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update gatha');
      }

      showSuccess('✅ Gatha updated successfully!');
      closeEditModal();
      await fetchPendingStatus();
      await fetchGathaEntries();
    } catch (error) {
      console.error('updateGatha error:', error);
      setGlobalError(error.message || 'Failed to update gatha');
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Failed to delete entry');
      }

      showSuccess('🗑️ Entry deleted');
      await fetchPendingStatus();
      await fetchGathaEntries();
    } catch (error) {
      console.error('deletePendingGatha error:', error);
      setGlobalError(error.message || 'Failed to delete gatha entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePendingGathaRequest = (id) => {
    setConfirmAction({
      title: "Delete Pending Gatha",
      message: "Are you sure you want to delete this pending gatha entry?",
      handler: () => deletePendingGatha(id),
      id: id
    });
  };

  // -------------------------------------
  // Render Gatha Form Modal
  // -------------------------------------
  const renderGathaFormModal = () => {
    if (!showGathaForm) return null;

    return (
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={() => setShowGathaForm(false)}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-8 h-8" />
                <div>
                  <h3 className="text-xl font-bold">Add Gatha Entry</h3>
                  <p className="text-sm text-purple-100">Record your progress</p>
                </div>
              </div>
              <button
                onClick={() => setShowGathaForm(false)}
                className="p-2 bg-white bg-opacity-20 rounded-full"
              >
                <CloseIcon size={20} />
              </button>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-2 bg-gray-100">
            <button
              onClick={() => setActiveGathaTab('new')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                activeGathaTab === 'new'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-1" />
              New Gatha
            </button>
            <button
              onClick={() => setActiveGathaTab('revision')}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                activeGathaTab === 'revision'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              <Heart className="w-4 h-4 inline mr-1" />
              Revision
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Sutra Name
              </label>
              <input
                type="text"
                value={gathaForm.sutraName}
                onChange={(e) => setGathaForm({ ...gathaForm, sutraName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="Enter sutra name"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Which Gatha
              </label>
              <input
                type="text"
                value={gathaForm.whichGatha}
                onChange={(e) => setGathaForm({ ...gathaForm, whichGatha: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="e.g., Gatha 1, 2, 3"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">
                Total Gatha Count
              </label>
              <input
                type="number"
                value={gathaForm.totalGatha}
                onChange={(e) => setGathaForm({ ...gathaForm, totalGatha: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none transition-colors"
                placeholder="Enter total count"
                min="1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowGathaForm(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={submitGatha}
                disabled={isSubmitting || !gathaForm.sutraName || !gathaForm.whichGatha || !gathaForm.totalGatha}
                className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg disabled:opacity-50 ${
                  activeGathaTab === 'new'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <>Submit {activeGathaTab === 'new' ? 'New' : 'Revision'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------
  // Render Edit Modal
  // -------------------------------------
  const renderEditModal = () => {
    if (!editingGatha) return null;

    const isNew = editingGatha.type === 'new';

    return (
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
        onClick={closeEditModal}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isNew ? 'bg-purple-100' : 'bg-blue-100'
              }`}>
                <Edit2 className={`w-6 h-6 ${isNew ? 'text-purple-600' : 'text-blue-600'}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">Edit Gatha</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isNew ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {isNew ? 'New Gatha' : 'Revision'}
                </span>
              </div>
            </div>
            <button onClick={closeEditModal} className="p-2 bg-gray-100 rounded-full">
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Sutra Name</label>
              <input
                type="text"
                value={editForm.sutraName}
                onChange={(e) => setEditForm({ ...editForm, sutraName: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Which Gatha</label>
              <input
                type="text"
                value={editForm.whichGatha}
                onChange={(e) => setEditForm({ ...editForm, whichGatha: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-700 mb-2 block">Total Gatha Count</label>
              <input
                type="number"
                value={editForm.totalGatha}
                onChange={(e) => setEditForm({ ...editForm, totalGatha: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-400 focus:outline-none"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={closeEditModal}
              className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={submitEditedGatha}
              disabled={isSubmitting || !editForm.sutraName || !editForm.whichGatha || !editForm.totalGatha}
              className={`flex-1 py-3 font-bold rounded-xl text-white shadow-lg disabled:opacity-50 ${
                isNew ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
              }`}
            >
              {isSubmitting ? <Loader className="w-5 h-5 animate-spin mx-auto" /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // -------------------------------------
  // Render Dashboard
  // -------------------------------------
  const renderDashboard = () => {
    const GreetingIcon = greeting.icon;
    
    return (
      <div className="space-y-4">
        {/* Welcome Section */}
        <div className="bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 rounded-3xl p-5 text-white shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <GreetingIcon className="w-5 h-5" />
                <span className="text-orange-100 text-sm">{greeting.text}</span>
              </div>
              <h1 className="text-2xl font-bold">{user?.name || user?.username}</h1>
              <p className="text-orange-100 text-sm mt-1">Ready to learn today?</p>
            </div>
            <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-3xl">{greeting.emoji}</span>
            </div>
          </div>
          
          {/* Streak Badge */}
          {attendanceStreak > 0 && (
            <StreakBadge streak={attendanceStreak} />
          )}
        </div>

        {/* Today's Quick Actions */}
        <TodaysQuickActions
          attendanceStatus={todayAttendanceStatus}
          onMarkAttendance={markAttendance}
          onAddGatha={() => setShowGathaForm(true)}
          isSubmitting={isSubmitting}
          todaysEntries={todaysEntries}
          todaysPendingGatha={todaysPendingGatha}
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <QuickStatCard
            icon={Calendar}
            label="Days Present"
            value={userYearlyAttendance}
            subtext="This year"
            color="green"
          />
          <QuickStatCard
            icon={BookOpen}
            label="Total Gathas"
            value={userTotalGathasCount}
            subtext="Lifetime"
            color="purple"
          />
        </div>

        {/* Today's Entries */}
        {(todaysEntries.length > 0 || todaysPendingGatha.length > 0) && (
          <AnalyticsCard title="Today's Gathas" icon={BookOpen} color="purple">
            <div className="space-y-3">
              {todaysEntries.map((entry) => (
                <GathaEntryCard
                  key={entry.id}
                  entry={entry}
                  status="approved"
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ))}
              {todaysPendingGatha.map((entry) => (
                <GathaEntryCard
                  key={entry.id}
                  entry={entry}
                  status="pending"
                  onEdit={handleEditGatha}
                  onDelete={handleDeletePendingGathaRequest}
                />
              ))}
            </div>
          </AnalyticsCard>
        )}

        {/* Achievements */}
        <AnalyticsCard title="Achievements" icon={Award} color="orange">
          <div className="grid grid-cols-4 gap-2">
            {achievements.map((achievement, index) => (
              <AchievementBadge key={index} {...achievement} />
            ))}
          </div>
        </AnalyticsCard>

        {/* Analytics Section */}
        <AnalyticsCard 
          title="Pathshala Analytics" 
          icon={BarChart3} 
          color="green"
          action={
            <button
              onClick={fetchAnalytics}
              className="p-2 bg-green-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 text-green-600" />
            </button>
          }
        >
          {/* Date Range Selector */}
          <div className="bg-green-50 rounded-xl p-4 mb-4 border-2 border-green-100">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">From</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-green-200 text-sm bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">To</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border-2 border-green-200 text-sm bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const today = formatLocalDateString(new Date());
                  setDateRange({ start: today, end: today });
                }}
                className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange(getMonthDateRange())}
                className="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
              >
                This Month
              </button>
            </div>
          </div>

          {isAnalyticsLoading ? (
            <div className="text-center py-8">
              <Loader className="w-10 h-10 animate-spin text-green-500 mx-auto" />
            </div>
          ) : (
            <div className="space-y-3">
              <LeaderboardMini
                leader={analyticsData.attendanceLeader}
                type="Attendance"
                color="gold"
              />
              <LeaderboardMini
                leader={analyticsData.gathaStats?.gathaLeader}
                type="Gatha"
                color="purple"
              />
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100 text-center">
                  <p className="text-2xl font-bold text-blue-600">{userNewGathasCount}</p>
                  <p className="text-xs text-gray-600 font-medium">Your New Gathas</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl border-2 border-purple-100 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData.gathaStats?.totalPathshalaGathas || 0}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">Pathshala Total</p>
                </div>
              </div>
            </div>
          )}
        </AnalyticsCard>

        {/* Daily Quote */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-8 h-8 flex-shrink-0 opacity-80" />
            <div>
              <p className="text-xl font-bold mb-1">{dailyQuote.text}</p>
              <p className="text-purple-100 text-sm">{dailyQuote.meaning}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.HISTORY:
        return <HistoryPage formatDateIn={formatDateIn} formatLocalDateString={formatLocalDateString} />;
      case PAGES.PENDING:
        return (
          <PendingPage 
            pendingStatus={pendingStatus} 
            onRefresh={fetchPendingStatus}
            onEditGatha={handleEditGatha}
            onDeletePendingGatha={handleDeletePendingGathaRequest}
          />
        );
      default:
        return renderDashboard();
    }
  };

  // -------------------------------------
  // Main Return
  // -------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white bg-opacity-95 backdrop-blur-sm shadow-md px-4 py-3">
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
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-medium text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Global Messages */}
        {globalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl mb-4 flex items-start gap-3 shadow-md animate-shake">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 text-sm font-medium">{globalError}</p>
            </div>
            <button onClick={clearGlobalError} className="text-red-400">
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-xl mb-4 flex items-center gap-3 shadow-md animate-slide-in">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4 bg-white p-2 rounded-2xl shadow-lg">
          {[
            { page: PAGES.DASHBOARD, icon: BarChart3, label: 'Home' },
            { page: PAGES.PENDING, icon: Clock, label: 'Pending', badge: totalPendingCount },
            { page: PAGES.HISTORY, icon: Calendar, label: 'History' },
          ].map(({ page, icon: Icon, label, badge }) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`flex-1 relative flex flex-col items-center gap-1 py-3 rounded-xl font-bold transition-all active:scale-[0.98] ${
                currentPage === page
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
              {badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Footer */}
        <div className="mt-6 mb-4 text-center">
          <p className="text-gray-400 text-xs">
            © 2024 Jain Pathshala • Made with ❤️
          </p>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        title={confirmAction?.title}
        message={confirmAction?.message}
        onConfirm={confirmAction?.handler}
        onCancel={() => setConfirmAction(null)}
      />
      
      {renderGathaFormModal()}
      {renderEditModal()}

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-slide-in { animation: slideIn 0.3s ease-out; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
}
