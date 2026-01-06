import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Plus,
  X as CloseIcon,
  TrendingUp,
} from 'lucide-react';

// -------------------------------------
// VERCEL DEPLOYMENT CONFIGURATION
// -------------------------------------
const API_BASE = (process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_BASE?.trim() || 'http://localhost:5000/api'));
const DEFAULT_DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };


// -------------------------------------
// Helper utilities
// -------------------------------------
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

// ============================================
// HISTORY PAGE COMPONENT - CORRECTED
// ============================================

const HistoryPage = ({ activeUserId }) => {
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

  const monthNamesGujarati = [
    'જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન',
    'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર',
  ];

  const fetchHistory = useCallback(async (year, month) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      // FIX: Changed 'userId' to 'studentId' to match your Backend logic
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
  }, [activeUserId]); // Added activeUserId as dependency

  useEffect(() => {
    fetchHistory(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchHistory]); // Added fetchHistory to dependencies

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

      days.push(
        <button
          key={day}
          onClick={() => isPresent && setSelectedDay({ dateStr, activity })}
          disabled={!isPresent || isFuture}
          className={`h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${
            isPresent
              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-md active:scale-95'
              : isToday
              ? 'bg-orange-100 text-orange-600 border-2 border-orange-400 ring-2 ring-orange-200'
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
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-800">
             {/* Dynamic Title based on selection */}
             {activeUserId ? "Student History" : "My History"}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Green days = Present. Tap on green days to see gatha details.
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
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-xs text-gray-500">{monthNamesGujarati[selectedMonth - 1]}</p>
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
                  <div key={i} className="h-6 sm:h-8 flex items-center justify-center text-xs font-bold text-gray-400">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-md bg-gradient-to-br from-green-400 to-green-600" />
                <span className="text-gray-600">Present ({monthlySummary.presentDays})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500" />
                <span className="text-gray-600">Has Gathas</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-2 sm:p-3 text-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1" />
                <p className="text-xl sm:text-2xl font-bold text-green-600">{monthlySummary.presentDays}</p>
                <p className="text-xs text-gray-500">Days Present</p>
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
                    <PendingBadge status="approved" />
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
          className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start border-b-2 border-gray-100 pb-4 mb-6">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <Calendar size={24} className="text-orange-500" />
                {formatDateIn(dateStr, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  <Check size={14} /> Attendance Marked
                </span>
              </div>
            </div>
            <button 
              onClick={closeModal} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors" 
              aria-label="Close"
            >
              <CloseIcon size={24} />
            </button>
          </div>

          <div className="space-y-4">
            {/* New Gathas Section */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border-2 border-purple-200">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                <Plus size={20} strokeWidth={3} /> New Gathas: {newCount}
              </h4>
              {newGathas.length === 0 ? (
                <p className="text-sm text-purple-600 bg-white bg-opacity-50 px-4 py-3 rounded-lg">
                  No new gathas recorded on this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {newGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white bg-opacity-70 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600 bg-purple-200 px-2 py-1 rounded">
                          Entry #{index + 1}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Sutra:</span>
                          <span className="text-gray-800">{entry.sutra_name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Gatha:</span>
                          <span className="text-gray-800">{entry.which_gatha}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Count:</span>
                          <span className="font-bold text-purple-700">{entry.total_gatha}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Revision Gathas Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200">
              <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2 text-lg">
                <Heart size={20} strokeWidth={3} /> Revisions: {revisionCount}
              </h4>
              {revisionGathas.length === 0 ? (
                <p className="text-sm text-blue-600 bg-white bg-opacity-50 px-4 py-3 rounded-lg">
                  No revisions recorded on this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {revisionGathas.map((entry, index) => (
                    <div key={entry.id} className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded">
                          Entry #{index + 1}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Sutra:</span>
                          <span className="text-gray-800">{entry.sutra_name}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Gatha:</span>
                          <span className="text-gray-800">{entry.which_gatha}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700 min-w-[80px]">Count:</span>
                          <span className="font-bold text-blue-700">{entry.total_gatha}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t-2 border-gray-100">
            <button
              onClick={closeModal}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 mb-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-gray-100 pb-4 flex items-center gap-3">
        <Clock size={32} className="text-orange-500" /> 
        {/* CHANGE 4: Dynamic Title based on selected student */}
        {activeStudent?.name ? `${activeStudent.name}'s History` : 'Personal History'}
      </h2>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleMonthChange(-1)}
            className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-orange-100 hover:to-orange-200 transition-all shadow-sm hover:shadow"
            aria-label="Previous Month"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-orange-600">
              {monthNames[selectedMonth - 1]} {selectedYear}
            </h3>
            <p className="text-sm text-gray-600">
              Review your attendance and gatha practice
            </p>
          </div>
          <button
            onClick={() => handleMonthChange(1)}
            className="p-3 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-orange-100 hover:to-orange-200 transition-all shadow-sm hover:shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-gray-100 disabled:hover:to-gray-200"
            aria-label="Next Month"
            disabled={
              selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear()
            }
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {renderSummaryCards()}
      
      <div className="mb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Calendar size={20} className="text-green-500" />
          Days Attended ({presentDays.length})
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Click on any day to view detailed activity
        </p>
      </div>
      
      {renderDailyHistory()}
      {renderModal()}
    </div>
  );
};

export default HistoryPage;


