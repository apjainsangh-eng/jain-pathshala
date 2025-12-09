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

const PAGES = {
  DASHBOARD: 'Dashboard',
  HISTORY: 'History',
  PENDING: 'Pending',
};

// -------------------------------------
// Confirmation Modal Component
// -------------------------------------
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
  if (!title) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 transform transition-all">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" />
          <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        </div>
        <p className="text-gray-600 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            Confirm
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
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-300">
        <Clock className="w-3 h-3 animate-pulse" />
        Pending
      </span>
    );
  }
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-300">
        <Check className="w-3 h-3" />
        Approved
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded-full border border-red-300">
        <CloseIcon className="w-3 h-3" />
        Rejected
      </span>
    );
  }
  return null;
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

  const renderSummaryCards = () => (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-green-700 font-bold">Present</p>
          <Calendar className="text-green-500" size={16} />
        </div>
        <p className="text-2xl font-bold text-green-700">
          {monthlySummary.presentDays || 0}
        </p>
        <p className="text-xs text-green-600">Days attended</p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-purple-700 font-bold">New</p>
          <Plus className="text-purple-500" size={16} />
        </div>
        <p className="text-2xl font-bold text-purple-700">
          {monthlySummary.newGathas || 0}
        </p>
        <p className="text-xs text-purple-600">Gathas learned</p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-blue-700 font-bold">Revisions</p>
          <Heart className="text-blue-500" size={16} />
        </div>
        <p className="text-2xl font-bold text-blue-700">
          {monthlySummary.revisionGathas || 0}
        </p>
        <p className="text-xs text-blue-600">Gathas revised</p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-orange-700 font-bold">Total</p>
          <TrendingUp className="text-orange-500" size={16} />
        </div>
        <p className="text-2xl font-bold text-orange-700">
          {(monthlySummary.newGathas || 0) + (monthlySummary.revisionGathas || 0)}
        </p>
        <p className="text-xs text-orange-600">Combined count</p>
      </div>
    </div>
  );

  const renderDailyHistory = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-500"></div>
          <p className="mt-4 text-gray-600 font-medium text-sm">Loading history...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
          <CloseIcon size={40} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-700 font-semibold text-sm">{error}</p>
        </div>
      );
    }

    if (presentDays.length === 0) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-gray-600 mb-2">No Activity This Month</p>
          <p className="text-gray-500 text-sm">
            Approved attendance will appear here!
          </p>
        </div>
      );
    }

    const todayIso = formatLocalDateString(new Date());

    return (
      <div className="space-y-3">
        {presentDays.map(([dateStr, activity]) => {
          const { gathas = { new: 0, revision: 0 } } = activity;
          const newCount = Number(gathas.new || 0);
          const revisionCount = Number(gathas.revision || 0);
          const totalCount = newCount + revisionCount;
          const isToday = dateStr === todayIso;

          const weekdayLabel = formatDateIn(dateStr, { weekday: 'short' });
          const friendlyDate = formatDateIn(dateStr, { day: 'numeric', month: 'short' });

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr, activity)}
              className={`w-full text-left bg-white border-2 rounded-xl p-4 shadow-sm transition-all active:scale-[0.98] ${
                isToday ? 'border-orange-400 ring-2 ring-orange-200' : 'border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex-shrink-0">
                  <Check size={22} strokeWidth={3} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-gray-800">
                      {weekdayLabel}, {friendlyDate}
                    </p>
                    {isToday && (
                      <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        TODAY
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {newCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                        <Plus size={12} strokeWidth={3} /> {newCount} New
                      </span>
                    )}
                    {revisionCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                        <Heart size={12} strokeWidth={3} /> {revisionCount} Rev
                      </span>
                    )}
                    {totalCount === 0 && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        No gathas
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderModal = () => {
    if (!showModal || !selectedDayDetails) return null;
    const { dateStr, activity } = selectedDayDetails;
    const newGathas = (activity.details || []).filter((d) => d.type === 'new');
    const revisionGathas = (activity.details || []).filter((d) => d.type === 'revision');
    const newCount = Number(activity.gathas?.new || 0);
    const revisionCount = Number(activity.gathas?.revision || 0);

    return (
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-3"
        onClick={closeModal}
      >
        <div
          className="bg-white rounded-2xl p-4 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-3 mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Calendar size={20} className="text-orange-500" />
                {formatDateIn(dateStr, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </h3>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <Check size={12} /> Approved
              </span>
            </div>
            <button 
              onClick={closeModal} 
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg" 
              aria-label="Close"
            >
              <CloseIcon size={22} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <Plus size={18} strokeWidth={3} /> New Gathas: {newCount}
              </h4>
              {newGathas.length === 0 ? (
                <p className="text-sm text-purple-600 bg-white bg-opacity-50 px-3 py-2 rounded-lg">
                  No new gathas recorded.
                </p>
              ) : (
                <div className="space-y-2">
                  {newGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white bg-opacity-70 border border-purple-200 rounded-lg p-3">
                      <span className="text-xs font-bold text-purple-600 bg-purple-200 px-2 py-0.5 rounded mb-2 inline-block">
                        #{index + 1}
                      </span>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-semibold">Sutra:</span> {entry.sutra_name}</p>
                        <p><span className="font-semibold">Gatha:</span> {entry.which_gatha}</p>
                        <p><span className="font-semibold">Count:</span> <span className="font-bold text-purple-700">{entry.total_gatha}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                <Heart size={18} strokeWidth={3} /> Revisions: {revisionCount}
              </h4>
              {revisionGathas.length === 0 ? (
                <p className="text-sm text-blue-600 bg-white bg-opacity-50 px-3 py-2 rounded-lg">
                  No revisions recorded.
                </p>
              ) : (
                <div className="space-y-2">
                  {revisionGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-3">
                      <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-0.5 rounded mb-2 inline-block">
                        #{index + 1}
                      </span>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-semibold">Sutra:</span> {entry.sutra_name}</p>
                        <p><span className="font-semibold">Gatha:</span> {entry.which_gatha}</p>
                        <p><span className="font-semibold">Count:</span> <span className="font-bold text-blue-700">{entry.total_gatha}</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={closeModal}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md active:scale-[0.98]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-orange-200 mb-4">
      <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-100 pb-3 flex items-center gap-2">
        <Clock size={24} className="text-orange-500" /> Approved History
      </h2>

      <div className="flex items-center justify-between gap-2 mb-6 bg-orange-50 p-3 rounded-xl">
        <button
          onClick={() => handleMonthChange(-1)}
          className="p-2 rounded-lg bg-white shadow-sm active:scale-95"
          aria-label="Previous Month"
        >
          <ChevronLeft size={22} />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-bold text-orange-600">
            {monthNames[selectedMonth - 1]} {selectedYear}
          </h3>
          <p className="text-xs text-gray-600">Tap day for details</p>
        </div>
        <button
          onClick={() => handleMonthChange(1)}
          className="p-2 rounded-lg bg-white shadow-sm active:scale-95 disabled:opacity-40"
          aria-label="Next Month"
          disabled={
            selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()
          }
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {renderSummaryCards()}
      
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={18} className="text-green-500" />
          Days Attended ({presentDays.length})
        </h3>
      </div>
      
      {renderDailyHistory()}
      {renderModal()}
    </div>
  );
};

// -------------------------------------
// Pending Page Component
// -------------------------------------
const PendingPage = ({ pendingStatus, onRefresh }) => {
  const todayIso = formatLocalDateString(new Date());

  const pendingAttendance = pendingStatus.attendance?.filter(p => p.status === 'pending') || [];
  const pendingGatha = pendingStatus.gatha?.filter(p => p.status === 'pending') || [];
  const rejectedAttendance = pendingStatus.attendance?.filter(p => p.status === 'rejected') || [];
  const rejectedGatha = pendingStatus.gatha?.filter(p => p.status === 'rejected') || [];

  const totalPending = pendingAttendance.length + pendingGatha.length;
  const totalRejected = rejectedAttendance.length + rejectedGatha.length;

  return (
    <div className="space-y-4">
      {/* Pending Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-yellow-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Clock size={24} className="text-yellow-500" /> Pending Approvals
          </h2>
          <button
            onClick={onRefresh}
            className="p-2 bg-yellow-100 rounded-lg active:scale-95"
          >
            <Loader size={18} className="text-yellow-600" />
          </button>
        </div>

        {totalPending === 0 ? (
          <div className="text-center py-8 bg-green-50 rounded-xl">
            <Check size={48} className="mx-auto text-green-400 mb-3" />
            <p className="text-green-700 font-semibold">All caught up!</p>
            <p className="text-green-600 text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pending Attendance */}
            {pendingAttendance.map((item) => (
              <div key={`att-${item.id}`} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-yellow-700" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Attendance</p>
                      <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                    </div>
                  </div>
                  <PendingBadge status="pending" />
                </div>
              </div>
            ))}

            {/* Pending Gatha */}
            {pendingGatha.map((item) => (
              <div key={`gatha-${item.id}`} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} className="text-purple-700" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-800">Gatha</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'new' 
                            ? 'bg-purple-500 text-white' 
                            : 'bg-blue-500 text-white'
                        }`}>
                          {item.type === 'new' ? 'New' : 'Revision'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{item.sutra_name}</p>
                      <p className="text-xs text-gray-500">{item.which_gatha} • {item.total_gatha} gathas</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDateIn(item.date)}</p>
                    </div>
                  </div>
                  <PendingBadge status="pending" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejected Items */}
      {totalRejected > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-red-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={24} className="text-red-500" /> Rejected ({totalRejected})
          </h2>
          
          <div className="space-y-3">
            {rejectedAttendance.map((item) => (
              <div key={`rej-att-${item.id}`} className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                      <Calendar size={20} className="text-red-700" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Attendance</p>
                      <p className="text-sm text-gray-600">{formatDateIn(item.date)}</p>
                    </div>
                  </div>
                  <PendingBadge status="rejected" />
                </div>
              </div>
            ))}

            {rejectedGatha.map((item) => (
              <div key={`rej-gatha-${item.id}`} className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={20} className="text-red-700" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">Gatha - {item.type}</p>
                      <p className="text-sm text-gray-600">{item.sutra_name}</p>
                      {item.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {item.rejection_reason}</p>
                      )}
                    </div>
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

  // Pending Status
  const [pendingStatus, setPendingStatus] = useState({ attendance: [], gatha: [] });
  const [todayPendingAttendance, setTodayPendingAttendance] = useState(null);

  // Gatha entries
  const [gathaEntries, setGathaEntries] = useState([]);
  const [showGathaForm, setShowGathaForm] = useState(false);
  const [gathaForm, setGathaForm] = useState({
    newGatha: { sutraName: '', whichGatha: '', totalGatha: '' },
    revision: { sutraName: '', whichGatha: '', totalGatha: '' },
  });

  // Analytics
  const [dateRange, setDateRange] = useState(getMonthDateRange());
  const [analyticsData, setAnalyticsData] = useState({ attendanceLeader: null, gathaStats: null });
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [userNewGathasCount, setUserNewGathasCount] = useState(0);
  const [currentMonthAnalytics, setCurrentMonthAnalytics] = useState({ attendanceLeader: null, gathaStats: null });
  const [isCurrentMonthLoading, setIsCurrentMonthLoading] = useState(false);

  // UI feedback
  const [globalError, setGlobalError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convenience
  const todayIso = formatLocalDateString(new Date());

  const reportError = (error, fallback = 'Something went wrong.') => {
    const message = typeof error === 'string' ? error : error?.message;
    console.error(fallback, error);
    setGlobalError(message || fallback);
  };

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

  const todaysNew = useMemo(() => todaysEntries.find((e) => e.type === 'new'), [todaysEntries]);
  const todaysRevision = useMemo(() => todaysEntries.find((e) => e.type === 'revision'), [todaysEntries]);
  const hasTodaysNewGatha = Boolean(todaysNew);
  const hasTodaysRevision = Boolean(todaysRevision);

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
        
        // Check if today's attendance is pending
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

  const fetchCurrentMonthAnalytics = async () => {
    setIsCurrentMonthLoading(true);
    const token = localStorage.getItem('jainPathshalaToken');
    const monthRange = getMonthDateRange();

    try {
      const res = await fetch(
        `${API_BASE}/analytics/leaderboard?startDate=${monthRange.start}&endDate=${monthRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error('Could not fetch current month analytics.');
      const data = await res.json();
      setCurrentMonthAnalytics(data);
    } catch (error) {
      setCurrentMonthAnalytics({ attendanceLeader: null, gathaStats: null });
    } finally {
      setIsCurrentMonthLoading(false);
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
      setGathaEntries(Array.isArray(data) ? data.map(normalizeEntry) : []);
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
      setAttendanceHistory(Array.isArray(data) ? data : []);
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
    fetchCurrentMonthAnalytics();
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

      showSuccess('Attendance submitted for approval!');
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

    const { newGatha, revision } = gathaForm;

    try {
      let submitted = false;

      if (newGatha.sutraName && newGatha.whichGatha && String(newGatha.totalGatha).trim() !== '') {
        const payload = {
          type: 'new',
          sutra_name: newGatha.sutraName,
          which_gatha: newGatha.whichGatha,
          total_gatha: Number(newGatha.totalGatha),
        };

        const res = await fetch(`${API_BASE}/gatha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to submit new gatha');
        }
        submitted = true;
      }

      if (revision.sutraName && revision.whichGatha && String(revision.totalGatha).trim() !== '') {
        const payload = {
          type: 'revision',
          sutra_name: revision.sutraName,
          which_gatha: revision.whichGatha,
          total_gatha: Number(revision.totalGatha),
        };

        const res = await fetch(`${API_BASE}/gatha`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to submit revision gatha');
        }
        submitted = true;
      }

      if (submitted) {
        showSuccess('Gatha submitted for approval!');
        await fetchPendingStatus();
        setGathaForm({
          newGatha: { sutraName: '', whichGatha: '', totalGatha: '' },
          revision: { sutraName: '', whichGatha: '', totalGatha: '' },
        });
        setShowGathaForm(false);
      }
    } catch (error) {
      console.error('submitGatha error:', error);
      setGlobalError(error.message || 'Failed to submit gatha');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveGathaRequest = (id) => {
    setConfirmAction({
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this gatha entry?",
      handler: () => removeGathaEntry(id),
      id: id
    });
  };

  const removeGathaEntry = async (id) => {
    setConfirmAction(null);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(`${API_BASE}/gatha/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Failed to delete entry');
      }
      await fetchGathaEntries();
      showSuccess('Gatha entry deleted');
    } catch (error) {
      console.error('removeGathaEntry error:', error);
      setGlobalError(error.message || 'Failed to delete gatha entry');
    }
  };

  // -------------------------------------
  // Render Dashboard
  // -------------------------------------
  const renderDashboard = () => (
    <>
      {/* Attendance & Gatha Cards */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        {/* Attendance Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 border-4 border-orange-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Mark Attendance</h3>
            <p className="text-gray-600 text-sm mb-4">Record your presence for today</p>

            {/* Show different states based on status */}
            {todayAttendanceMarked ? (
              // Already approved
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-bold">Attendance Approved!</span>
                </div>
                <p className="text-green-600 text-xs">Your attendance is recorded</p>
              </div>
            ) : todayPendingAttendance ? (
              // Pending approval
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-600 animate-pulse" />
                  <span className="text-yellow-700 font-bold">Pending Approval</span>
                </div>
                <p className="text-yellow-600 text-xs">Waiting for admin to approve</p>
              </div>
            ) : (
              // Not marked yet
              <button
                onClick={markAttendance}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-xl active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  'Mark Present'
                )}
              </button>
            )}

            <div className="mt-3 text-xs text-gray-500">{formatDateIn(new Date())}</div>

            <div className="mt-4 pt-4 border-t-2 border-gray-100">
              <div className="text-xs text-gray-600 mb-1">Total Days Present (This Year)</div>
              <div className="text-2xl font-bold text-blue-600">{userYearlyAttendance}</div>
            </div>
          </div>
        </div>

        {/* Gatha Card */}
        <div className="bg-white rounded-2xl shadow-xl p-5 border-4 border-orange-200">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Submit Gatha</h3>
            <p className="text-gray-600 text-sm mb-4">Record your gatha progress</p>

            {/* Show approved entries */}
            {todaysEntries.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-semibold text-gray-700 text-left text-sm flex items-center gap-2">
                  <Check size={16} className="text-green-500" />
                  Approved Today:
                </h4>
                {todaysEntries.map((entry) => (
                  <div key={entry.id} className="bg-green-50 border-2 border-green-300 rounded-xl p-3 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                        {entry.type === 'new' ? 'New' : 'Revision'} ✓
                      </span>
                      <button
                        onClick={() => handleRemoveGathaRequest(entry.id)}
                        className="text-red-500 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Sutra:</span> {entry.sutra_name}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Gatha:</span> {entry.which_gatha}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Total:</span> {entry.total_gatha}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Show pending entries */}
            {todaysPendingGatha.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-semibold text-gray-700 text-left text-sm flex items-center gap-2">
                  <Clock size={16} className="text-yellow-500" />
                  Pending Approval:
                </h4>
                {todaysPendingGatha.map((entry) => (
                  <div key={entry.id} className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">
                        {entry.type === 'new' ? 'New' : 'Revision'} ⏳
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Sutra:</span> {entry.sutra_name}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Gatha:</span> {entry.which_gatha}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-bold">Total:</span> {entry.total_gatha}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!showGathaForm && (
              <button
                onClick={() => setShowGathaForm(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-xl active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Gatha Entry
              </button>
            )}

            {showGathaForm && (
              <div className="space-y-4 text-left">
                <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-700 mb-3 text-sm">New Gatha</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={gathaForm.newGatha.sutraName}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          newGatha: { ...prev.newGatha, sutraName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      placeholder="Sutra name"
                    />
                    <input
                      type="text"
                      value={gathaForm.newGatha.whichGatha}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          newGatha: { ...prev.newGatha, whichGatha: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      placeholder="e.g., Gatha 1, 2, 3"
                    />
                    <input
                      type="number"
                      value={gathaForm.newGatha.totalGatha}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          newGatha: { ...prev.newGatha, totalGatha: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      placeholder="Total count"
                      min="1"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-blue-700 mb-3 text-sm">Revision</h4>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={gathaForm.revision.sutraName}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          revision: { ...prev.revision, sutraName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                      placeholder="Sutra name"
                    />
                    <input
                      type="text"
                      value={gathaForm.revision.whichGatha}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          revision: { ...prev.revision, whichGatha: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                      placeholder="e.g., Gatha 1, 2, 3"
                    />
                    <input
                      type="number"
                      value={gathaForm.revision.totalGatha}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          revision: { ...prev.revision, totalGatha: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                      placeholder="Total count"
                      min="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setShowGathaForm(false);
                      setGathaForm({
                        newGatha: { sutraName: '', whichGatha: '', totalGatha: '' },
                        revision: { sutraName: '', whichGatha: '', totalGatha: '' },
                      });
                    }}
                    className="bg-gray-300 text-gray-700 font-bold py-3 rounded-xl active:scale-[0.98]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitGatha}
                    disabled={
                      isSubmitting ||
                      (!(gathaForm.newGatha.sutraName && gathaForm.newGatha.whichGatha && gathaForm.newGatha.totalGatha) &&
                        !(gathaForm.revision.sutraName && gathaForm.revision.whichGatha && gathaForm.revision.totalGatha))
                    }
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-xl active:scale-[0.98] shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pathshala Analytics Section */}
      <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-orange-200 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Pathshala Analytics</h3>
            <p className="text-xs text-gray-600">Performance for selected period</p>
          </div>
        </div>

        {/* Date Picker Section */}
        <div className="bg-green-50 p-3 rounded-xl border-2 border-green-200 mb-4">
          <div className="space-y-3">
            <div>
              <label htmlFor="startDate" className="text-xs font-semibold text-gray-600 block mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              />
              <span className="text-xs text-green-700 mt-1 block">
                {formatDateIn(dateRange.start) || 'Select date'}
              </span>
            </div>

            <div>
              <label htmlFor="endDate" className="text-xs font-semibold text-gray-600 block mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2.5 rounded-lg border-2 border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white"
              />
              <span className="text-xs text-green-700 mt-1 block">
                {formatDateIn(dateRange.end) || 'Select date'}
              </span>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  const today = formatLocalDateString(new Date());
                  setDateRange({ start: today, end: today });
                }}
                className="flex-1 bg-blue-500 text-white px-3 py-2.5 rounded-lg active:scale-[0.98] text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setDateRange(getMonthDateRange())}
                className="flex-1 bg-green-500 text-white px-3 py-2.5 rounded-lg active:scale-[0.98] text-sm font-medium"
              >
                This Month
              </button>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        {isAnalyticsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-green-200 border-t-green-500"></div>
            <p className="mt-3 text-gray-600 text-sm">Loading Analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-yellow-50 border-2 border-yellow-300 p-3 rounded-xl text-center">
              <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Attendance Leader</h4>
              <p className="text-lg font-bold text-yellow-600 truncate">
                {analyticsData.attendanceLeader?.username || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {analyticsData.attendanceLeader?.attendance_count || 0} days
              </p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded-xl text-center">
              <User className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Your New Gathas</h4>
              <p className="text-lg font-bold text-blue-600">{userNewGathasCount}</p>
              <p className="text-xs text-gray-500">in this period</p>
            </div>
            
            <div className="bg-purple-50 border-2 border-purple-300 p-3 rounded-xl text-center">
              <BookOpen className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Total Gathas</h4>
              <p className="text-lg font-bold text-purple-600">
                {analyticsData.gathaStats?.totalPathshalaGathas || 0}
              </p>
              <p className="text-xs text-gray-500">learned together</p>
            </div>
            
            <div className="bg-red-50 border-2 border-red-300 p-3 rounded-xl text-center">
              <Crown className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Gatha Leader</h4>
              <p className="text-lg font-bold text-red-600 truncate">
                {analyticsData.gathaStats?.gathaLeader?.username || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {analyticsData.gathaStats?.gathaLeader?.count || 0} gathas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Month Summary */}
      <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-orange-200 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">Current Month</h3>
            <p className="text-xs text-gray-600">
              {formatDateIn(new Date(), { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {isCurrentMonthLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-cyan-200 border-t-cyan-500"></div>
            <p className="mt-3 text-gray-600 text-sm">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-cyan-50 border-2 border-cyan-300 p-3 rounded-xl text-center">
              <Trophy className="w-8 h-8 mx-auto text-cyan-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Attendance Leader</h4>
              <p className="text-lg font-bold text-cyan-600 truncate">
                {currentMonthAnalytics.attendanceLeader?.username || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {currentMonthAnalytics.attendanceLeader?.attendance_count || 0} days
              </p>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-300 p-3 rounded-xl text-center">
              <User className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Total Attendance</h4>
              <p className="text-lg font-bold text-blue-600">
                {currentMonthAnalytics.gathaStats?.totalAttendance || 0}
              </p>
              <p className="text-xs text-gray-500">all students</p>
            </div>
            
            <div className="bg-purple-50 border-2 border-purple-300 p-3 rounded-xl text-center">
              <BookOpen className="w-8 h-8 mx-auto text-purple-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Total Gathas</h4>
              <p className="text-lg font-bold text-purple-600">
                {currentMonthAnalytics.gathaStats?.totalPathshalaGathas || 0}
              </p>
              <p className="text-xs text-gray-500">this month</p>
            </div>
            
            <div className="bg-red-50 border-2 border-red-300 p-3 rounded-xl text-center">
              <Crown className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <h4 className="font-bold text-gray-700 text-xs">Gatha Leader</h4>
              <p className="text-lg font-bold text-red-600 truncate">
                {currentMonthAnalytics.gathaStats?.gathaLeader?.username || 'N/A'}
              </p>
              <p className="text-xs text-gray-500">
                {currentMonthAnalytics.gathaStats?.gathaLeader?.count || 0} gathas
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderContent = () => {
    switch (currentPage) {
      case PAGES.HISTORY:
        return <HistoryPage formatDateIn={formatDateIn} formatLocalDateString={formatLocalDateString} />;
      case PAGES.PENDING:
        return <PendingPage pendingStatus={pendingStatus} onRefresh={fetchPendingStatus} />;
      default:
        return renderDashboard();
    }
  };

  // -------------------------------------
  // Main Return
  // -------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-3">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 border-4 border-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-inner">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  जय जिनेंद्र, {user?.name || user?.username}
                </h2>
                <p className="text-xs text-gray-600">Welcome to Pathshala</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-xl active:scale-[0.98] shadow-md text-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global error banner */}
        {globalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl mb-4 flex items-start gap-2 text-red-700 shadow">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs">{globalError}</p>
            </div>
            <button
              onClick={clearGlobalError}
              className="text-red-600 p-1"
              aria-label="Dismiss"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-xl mb-4 flex items-center gap-2 text-green-700 shadow">
            <Check className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs">{successMessage}</p>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setCurrentPage(PAGES.DASHBOARD)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-bold transition-colors active:scale-[0.98] text-sm ${
              currentPage === PAGES.DASHBOARD
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-orange-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => setCurrentPage(PAGES.PENDING)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-bold transition-colors active:scale-[0.98] text-sm relative ${
              currentPage === PAGES.PENDING
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-orange-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending
            {totalPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalPendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setCurrentPage(PAGES.HISTORY)}
            className={`flex-1 flex items-center justify-center gap-1 px-3 py-3 rounded-xl font-bold transition-colors active:scale-[0.98] text-sm ${
              currentPage === PAGES.HISTORY
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-orange-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            History
          </button>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Footer */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-2xl shadow-xl p-6 text-center text-white mt-4">
          <BookOpen className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-1">अहिंसा परमो धर्मः</h3>
          <p className="text-orange-100 text-sm">Non-violence is the supreme religion</p>
        </div>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmationModal
        title={confirmAction?.title}
        message={confirmAction?.message}
        onConfirm={confirmAction?.handler}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
