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
  AlertTriangle,
  Trophy,
} from 'lucide-react';

// -------------------------------------
// VERCEL DEPLOYMENT CONFIGURATION
// Use relative path '/api' in Vercel production to hit the serverless function.
// For local dev, fall back to localhost:5000/api
// -------------------------------------
const API_BASE = (process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_BASE?.trim() || 'http://localhost:5000/api'));
const DEFAULT_DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };


// -------------------------------------
// Helper utilities (Needed for independent functioning)
// These functions were previously external but are necessary for this component.
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
  // Note: Since 'en-IN' locale requires the options to be available, we merge default.
  return parsed.toLocaleDateString('en-IN', { ...DEFAULT_DATE_OPTIONS, ...options });
};

// -------------------------------------
// HistoryPage Component
// -------------------------------------
const HistoryPage = () => { // Note: Removed props since we included helpers directly
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

  const fetchHistory = useCallback(async (year, month) => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const url = `${API_BASE}/history/${year}/${month}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (!res.ok) {
        const errorText = await res.text();
        // Try to parse JSON error if available
        const errorData = JSON.parse(errorText.split('\n')[0].trim()); 
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to load history.`);
      }

      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Fetch History Error:', err);
      setError(err.message || 'Failed to load history. Please check your connection.');
      setHistoryData(null);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchHistory(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth, fetchHistory]);

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

  // Filter to get only days where user was present
  const presentDays = useMemo(() => {
    return Object.entries(activityData)
      .filter(([_, activity]) => activity?.present === true)
      .sort((a, b) => new Date(b[0]) - new Date(a[0])); // Sort by date descending (newest first)
  }, [activityData]);

  const monthlySummary = useMemo(() => {
    let presentDays = 0;
    let absentDays = 0;
    let newGathas = 0;
    let revisionGathas = 0;

    Object.entries(activityData).forEach(([dateStr, activity]) => {
      const normalized = activity || {};
      const gathas = normalized.gathas || { new: 0, revision: 0 };
      if (normalized.present) {
        presentDays += 1;
      } else {
        absentDays += 1;
      }
      newGathas += Number(gathas.new || 0);
      revisionGathas += Number(gathas.revision || 0);
    });

    const totalTrackedDays = presentDays + absentDays;

    return {
      totalTrackedDays,
      presentDays,
      absentDays,
      newGathas,
      revisionGathas,
    };
  }, [activityData]);

  const renderSummaryCards = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-green-700 font-bold">Present Days</p>
          <Calendar className="text-green-500" size={20} />
        </div>
        <p className="text-4xl font-bold text-green-700 mb-1">
          {monthlySummary.presentDays || 0}
        </p>
        <p className="text-sm text-green-600">
          Days attended this month
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-purple-700 font-bold">New Gathas</p>
          <Plus className="text-purple-500" size={20} />
        </div>
        <p className="text-4xl font-bold text-purple-700 mb-1">
          {monthlySummary.newGathas || 0}
        </p>
        <p className="text-sm text-purple-600">
          Total new gathas learned
        </p>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-blue-700 font-bold">Revisions</p>
          <Heart className="text-blue-500" size={20} />
        </div>
        <p className="text-4xl font-bold text-blue-700 mb-1">
          {monthlySummary.revisionGathas || 0}
        </p>
        <p className="text-sm text-blue-600">
          Gathas revised this month
        </p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide text-orange-700 font-bold">Total Gathas</p>
          <TrendingUp className="text-orange-500" size={20} />
        </div>
        <p className="text-4xl font-bold text-orange-700 mb-1">
          {(monthlySummary.newGathas || 0) + (monthlySummary.revisionGathas || 0)}
        </p>
        <p className="text-sm text-orange-600">
          Combined practice count
        </p>
      </div>
    </div>
  );

  const renderDailyHistory = () => {
    if (isLoading) {
      return (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-500"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading your history...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
          <CloseIcon size={48} className="mx-auto text-red-400 mb-3" />
          <p className="text-red-700 font-semibold text-lg">{error}</p>
        </div>
      );
    }

    if (presentDays.length === 0) {
      return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center">
          <Calendar size={64} className="mx-auto text-gray-300 mb-4" />
          <p className="text-xl font-semibold text-gray-600 mb-2">No Activity This Month</p>
          <p className="text-gray-500">
            Start attending classes and your progress will appear here!
          </p>
        </div>
      );
    }

    const todayIso = formatLocalDateString(new Date());

    return (
      <div className="space-y-3">
        {presentDays.map(([dateStr, activity]) => {
          const { gathas = { new: 0, revision: 0 }, details = [] } = activity;
          const newCount = Number(gathas.new || 0);
          const revisionCount = Number(gathas.revision || 0);
          const totalCount = newCount + revisionCount;
          const isToday = dateStr === todayIso;

          const weekdayLabel = formatDateIn(dateStr, { weekday: 'short' });
          const friendlyDate = formatDateIn(dateStr, { day: 'numeric', month: 'long', year: 'numeric' });

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr, activity)}
              className={`w-full text-left bg-white border-2 rounded-2xl px-5 py-4 shadow-sm transition-all hover:shadow-lg hover:border-orange-300 ${
                isToday ? 'border-orange-400 ring-2 ring-orange-200' : 'border-green-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex-shrink-0">
                    <Check size={26} strokeWidth={3} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-800 text-lg">
                        {weekdayLabel}
                      </p>
                      {isToday && (
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{friendlyDate}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {newCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200">
                          <Plus size={14} strokeWidth={3} /> {newCount} New Gatha{newCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {revisionCount > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full border border-blue-200">
                          <Heart size={14} strokeWidth={3} /> {revisionCount} Revision{revisionCount > 1 ? 's' : ''}
                        </span>
                      )}
                      {totalCount === 0 && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                          <BookOpen size={14} /> No gathas recorded
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-400 hover:text-orange-500 transition-colors">
                  <span className="font-medium">View Details</span>
                  <ChevronRight size={20} />
                </div>
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
        <Clock size={32} className="text-orange-500" /> Personal History
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
