// JainPathshalaApp.js

import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Crown,
  Heart,
  LogOut,
  Plus,
  Trash2,
  Trophy,
  User,
  X as CloseIcon,
} from 'lucide-react';
import HistoryPage from './HistoryPage';

// -------------------------------------
// Helper utilities
// -------------------------------------
const API_BASE = (process.env.REACT_APP_API_BASE?.trim()) || 'https://jain-pathshala.vercel.app';
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
};

// -------------------------------------
// Component
// -------------------------------------
export default function JainPathshalaApp() {
  // Auth & user
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Navigation
  const [currentPage, setCurrentPage] = useState(PAGES.DASHBOARD);

  // Attendance & stats
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayAttendanceMarked, setTodayAttendanceMarked] = useState(false);
  const [userYearlyAttendance, setUserYearlyAttendance] = useState(0);

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

  // Convenience
  const todayIso = formatLocalDateString(new Date());

  const reportError = (error, fallback = 'Something went wrong.') => {
    const message = typeof error === 'string' ? error : error?.message;
    console.error(fallback, error);
    setGlobalError(message || fallback);
  };

  const clearGlobalError = () => setGlobalError('');

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

  // -------------------------------------
  // API calls
  // -------------------------------------
  const fetchAnalytics = async () => {
    if (!isLoggedIn || !dateRange.start || !dateRange.end) return;
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
      reportError(error, 'Failed to fetch analytics.');
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const fetchCurrentMonthAnalytics = async () => {
    if (!isLoggedIn) return;
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
      clearGlobalError();
    } catch (error) {
      setCurrentMonthAnalytics({ attendanceLeader: null, gathaStats: null });
      reportError(error, 'Failed to fetch current-month analytics.');
    } finally {
      setIsCurrentMonthLoading(false);
    }
  };

  const fetchUserYearlyStats = async () => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('jainPathshalaToken');

    try {
      const res = await fetch(`${API_BASE}/stats/yearly`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Could not fetch yearly stats.');
      const data = await res.json();
      setUserYearlyAttendance(data.totalDaysPresent ?? 0);
      clearGlobalError();
    } catch (error) {
      setUserYearlyAttendance(0);
      reportError(error, 'Failed to fetch yearly stats.');
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
      clearGlobalError();
    } catch (error) {
      setGathaEntries([]);
      reportError(error, 'Failed to load gatha entries.');
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
      clearGlobalError();
    } catch (error) {
      setAttendanceHistory([]);
      reportError(error, 'Failed to load attendance history.');
    }
  };

  // -------------------------------------
  // Effects
  // -------------------------------------
  useEffect(() => {
    fetchAnalytics();
  }, [isLoggedIn, dateRange.start, dateRange.end]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoggedIn) {
      fetchCurrentMonthAnalytics();
      fetchUserYearlyStats();
      setCurrentPage(PAGES.DASHBOARD);
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isLoggedIn) {
      const isMarked = attendanceHistory.some(
        (record) => formatLocalDateString(record.date) === todayIso,
      );
      setTodayAttendanceMarked(isMarked);
    }
  }, [attendanceHistory, isLoggedIn, todayIso]);

  useEffect(() => {
    const savedUser = localStorage.getItem('jainPathshalaUser');
    const token = localStorage.getItem('jainPathshalaToken');
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
        fetchAttendance();
        fetchGathaEntries();
      } catch (error) {
        console.error('Error parsing saved user:', error);
        handleLogout();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Auth handlers
  // -------------------------------------
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }

      if (data.user) {
        localStorage.setItem('jainPathshalaUser', JSON.stringify(data.user));
        if (data.token) localStorage.setItem('jainPathshalaToken', data.token);

        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setLoginForm({ username: '', password: '' });
        clearGlobalError();

        await Promise.all([fetchAttendance(), fetchGathaEntries(), fetchUserYearlyStats()]);
        setCurrentPage(PAGES.DASHBOARD);
      } else {
        setLoginError('Login failed. Invalid response from server.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jainPathshalaUser');
    localStorage.removeItem('jainPathshalaToken');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAttendanceHistory([]);
    setTodayAttendanceMarked(false);
    setGathaEntries([]);
    setShowGathaForm(false);
    setGathaForm({
      newGatha: { sutraName: '', whichGatha: '', totalGatha: '' },
      revision: { sutraName: '', whichGatha: '', totalGatha: '' },
    });
    setLoginError('');
    setUserYearlyAttendance(0);
    setCurrentPage(PAGES.DASHBOARD);
    clearGlobalError();
  };

  // -------------------------------------
  // Attendance + Gatha handlers
  // -------------------------------------
  const markAttendance = async () => {
    setLoginError('');
    const token = localStorage.getItem('jainPathshalaToken');
    if (!token) {
      setLoginError('You must be logged in');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/attendance/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errResp = await response.json().catch(() => ({ error: 'Failed to mark attendance' }));
        setLoginError(errResp.error || 'Failed to mark attendance');
        return;
      }

      setAttendanceHistory((prev) => [
        ...prev,
        { date: todayIso, created_at: new Date().toISOString() },
      ]);
      setTodayAttendanceMarked(true);
      clearGlobalError();

      await Promise.all([fetchAttendance(), fetchAnalytics(), fetchCurrentMonthAnalytics(), fetchUserYearlyStats()]);
    } catch (error) {
      console.error('markAttendance error:', error);
      setLoginError('Network error occurred');
    }
  };

  const unmarkAttendance = async () => {
    if (!window.confirm("Are you sure you want to unmark today's attendance?")) return;

    try {
      const token = localStorage.getItem('jainPathshalaToken');
      const response = await fetch(`${API_BASE}/attendance/unmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to unmark attendance');
      await fetchAttendance();
      setTodayAttendanceMarked(false);
      clearGlobalError();

      await Promise.all([fetchAnalytics(), fetchCurrentMonthAnalytics(), fetchUserYearlyStats()]);
    } catch (error) {
      console.error('Error unmarking attendance:', error);
      setLoginError('Failed to unmark attendance');
    }
  };

  const submitGatha = async (e) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('jainPathshalaToken');
    if (!token) {
      setLoginError('You must be logged in');
      return;
    }

    const { newGatha, revision } = gathaForm;
    const todaysEntryByType = (type) => todaysEntries.find((en) => en.type === type);

    try {
      if (newGatha.sutraName && newGatha.whichGatha && String(newGatha.totalGatha).trim() !== '') {
        const payload = {
          type: 'new',
          sutra_name: newGatha.sutraName,
          which_gatha: newGatha.whichGatha,
          total_gatha: Number(newGatha.totalGatha),
        };
        const existing = todaysEntryByType('new');
        const url = existing ? `${API_BASE}/gatha/${existing.id}` : `${API_BASE}/gatha`;
        const method = existing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to submit/update new gatha');
      }

      if (revision.sutraName && revision.whichGatha && String(revision.totalGatha).trim() !== '') {
        const payload = {
          type: 'revision',
          sutra_name: revision.sutraName,
          which_gatha: revision.whichGatha,
          total_gatha: Number(revision.totalGatha),
        };
        const existing = todaysEntryByType('revision');
        const url = existing ? `${API_BASE}/gatha/${existing.id}` : `${API_BASE}/gatha`;
        const method = existing ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to submit/update revision gatha');
      }

      await Promise.all([fetchGathaEntries(), fetchAnalytics(), fetchCurrentMonthAnalytics()]);
      setGathaForm({
        newGatha: { sutraName: '', whichGatha: '', totalGatha: '' },
        revision: { sutraName: '', whichGatha: '', totalGatha: '' },
      });
      setShowGathaForm(false);
      setLoginError('');
      clearGlobalError();
    } catch (error) {
      console.error('submitGatha error:', error);
      setLoginError(error.message || 'Failed to submit gatha');
    }
  };

  const removeGathaEntry = async (id) => {
    if (!window.confirm('Are you sure you want to delete this gatha entry?')) return;
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
      await Promise.all([fetchGathaEntries(), fetchAnalytics(), fetchCurrentMonthAnalytics()]);
      clearGlobalError();
    } catch (error) {
      console.error('removeGathaEntry error:', error);
      setLoginError(error.message || 'Failed to delete gatha entry');
    }
  };

  const handleEditTodaysGathaClick = () => {
    setGathaForm({
      newGatha: todaysNew
        ? { sutraName: todaysNew.sutra_name, whichGatha: todaysNew.which_gatha, totalGatha: todaysNew.total_gatha }
        : { sutraName: '', whichGatha: '', totalGatha: '' },
      revision: todaysRevision
        ? {
            sutraName: todaysRevision.sutra_name,
            whichGatha: todaysRevision.which_gatha,
            totalGatha: todaysRevision.total_gatha,
          }
        : { sutraName: '', whichGatha: '', totalGatha: '' },
    });
    setShowGathaForm(true);
  };

  // -------------------------------------
  // Render helpers
  // -------------------------------------
  const renderDashboard = () => (
    <>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Attendance Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 transform transition-all hover:scale-[1.01]">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Calendar className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Mark Attendance</h3>
            <p className="text-gray-600 mb-6">Record your presence for today's session</p>

            {!todayAttendanceMarked ? (
              <button
                onClick={markAttendance}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                Mark Present
              </button>
            ) : (
              <div>
                <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center justify-center gap-3 mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-bold text-lg">Attendance Marked!</span>
                </div>
                <button
                  onClick={unmarkAttendance}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                >
                  Unmark Attendance
                </button>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">Date: {formatDateIn(new Date())}</div>

            <div className="mt-6 pt-6 border-t-2 border-gray-100">
              <div className="text-sm text-gray-600 mb-2">Total Days Present (This Year)</div>
              <div className="text-3xl font-bold text-blue-600">{userYearlyAttendance}</div>
            </div>
          </div>
        </div>

        {/* Gatha Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Submit Gatha</h3>
            <p className="text-gray-600 mb-6">Record your gatha learning progress</p>

            {todaysEntries.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="font-semibold text-gray-700 text-left">Today's Entries:</h4>
                {todaysEntries.map((entry) => (
                  <div key={entry.id} className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-left">
                    <div className="flex justify-between items-start mb-2">
                      <span className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                        {entry.type === 'new' ? 'New Gatha' : 'Revision'}
                      </span>
                      <button
                        onClick={() => removeGathaEntry(entry.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">Sutra:</span> {entry.sutra_name}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">Gatha:</span> {entry.which_gatha}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">Total:</span> {entry.total_gatha}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!showGathaForm && (
              <button
                onClick={todaysEntries.length > 0 ? handleEditTodaysGathaClick : () => setShowGathaForm(true)}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                {todaysEntries.length > 0 ? "Edit Today's Gatha" : 'Add Gatha Entry'}
              </button>
            )}

            {showGathaForm && (
              <div className="space-y-6 text-left">
                <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                  <h4 className="font-bold text-purple-700 mb-3">
                    New Gatha {hasTodaysNewGatha && '(Editing)'}
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={gathaForm.newGatha.sutraName}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          newGatha: { ...prev.newGatha, sutraName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      placeholder="Enter sutra name"
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
                      className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
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
                      className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 text-sm"
                      placeholder="Enter total count"
                      min="1"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
                  <h4 className="font-bold text-blue-700 mb-3">
                    Revision {hasTodaysRevision && '(Editing)'}
                  </h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={gathaForm.revision.sutraName}
                      onChange={(e) =>
                        setGathaForm((prev) => ({
                          ...prev,
                          revision: { ...prev.revision, sutraName: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                      placeholder="Enter sutra name"
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
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
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
                      className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 text-sm"
                      placeholder="Enter total count"
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
                    className="bg-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-400 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitGatha}
                    disabled={
                      !(gathaForm.newGatha.sutraName && gathaForm.newGatha.whichGatha && gathaForm.newGatha.totalGatha) &&
                      !(
                        gathaForm.revision.sutraName &&
                        gathaForm.revision.whichGatha &&
                        gathaForm.revision.totalGatha
                      )
                    }
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {hasTodaysNewGatha || hasTodaysRevision ? 'Update' : 'Submit'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Analytics Section */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Pathshala Analytics</h3>
              <p className="text-gray-600">Performance for the selected period</p>
            </div>
          </div>
          <div className="flex items-end gap-3 bg-green-50 p-2 rounded-xl border-2 border-green-200">
            <div>
              <label htmlFor="startDate" className="text-xs font-semibold text-gray-600">
                Start Date{' '}
                <span className="font-normal text-green-700">({formatDateIn(dateRange.start) || 'N/A'})</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="p-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="text-xs font-semibold text-gray-600">
                End Date{' '}
                <span className="font-normal text-green-700">({formatDateIn(dateRange.end) || 'N/A'})</span>
              </label>
              <input
                type="date"
                id="endDate"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="p-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 text-sm"
              />
            </div>
            <button
              onClick={() => {
                const today = formatLocalDateString(new Date());
                setDateRange({ start: today, end: today });
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 text-sm"
            >
              Today
            </button>
          </div>
        </div>

        {isAnalyticsLoading ? (
          <div className="text-center py-16">Loading Analytics...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-yellow-50 border-2 border-yellow-300 p-6 rounded-2xl text-center">
              <Trophy className="w-10 h-10 mx-auto text-yellow-500 mb-3" />
              <h4 className="font-bold text-gray-700">Attendance Leader</h4>
              <p className="text-3xl font-bold text-yellow-600">
                {analyticsData.attendanceLeader?.username || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {analyticsData.attendanceLeader?.attendance_count || 0} days
              </p>
              <p className="text-xs text-gray-500">Tie-break by new gathas</p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-2xl text-center">
              <User className="w-10 h-10 mx-auto text-blue-500 mb-3" />
              <h4 className="font-bold text-gray-700">Your New Gathas</h4>
              <p className="text-3xl font-bold text-blue-600">{userNewGathasCount}</p>
              <p className="text-sm text-gray-500">in this period</p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-2xl text-center">
              <BookOpen className="w-10 h-10 mx-auto text-purple-500 mb-3" />
              <h4 className="font-bold text-gray-700">Pathshala's Total Gathas</h4>
              <p className="text-3xl font-bold text-purple-600">
                {analyticsData.gathaStats?.totalPathshalaGathas || 0}
              </p>
              <p className="text-sm text-gray-500">learned together</p>
            </div>
            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-2xl text-center">
              <Crown className="w-10 h-10 mx-auto text-red-500 mb-3" />
              <h4 className="font-bold text-gray-700">Gatha Leader</h4>
              <p className="text-3xl font-bold text-red-600">
                {analyticsData.gathaStats?.gathaLeader?.username || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {analyticsData.gathaStats?.gathaLeader?.count || 0} gathas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Current Month Summary */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Current Month Summary</h3>
            <p className="text-gray-600">
              Performance for {formatDateIn(new Date(), { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {isCurrentMonthLoading ? (
          <div className="text-center py-16">Loading Current Month Analytics...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-cyan-50 border-2 border-cyan-300 p-6 rounded-2xl text-center">
              <Trophy className="w-10 h-10 mx-auto text-cyan-500 mb-3" />
              <h4 className="font-bold text-gray-700">Attendance Leader</h4>
              <p className="text-3xl font-bold text-cyan-600">
                {currentMonthAnalytics.attendanceLeader?.username || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {currentMonthAnalytics.attendanceLeader?.attendance_count || 0} days
              </p>
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-2xl text-center">
              <User className="w-10 h-10 mx-auto text-blue-500 mb-3" />
              <h4 className="font-bold text-gray-700">Total Attendance of All Students</h4>
              <p className="text-3xl font-bold text-blue-600">
                {currentMonthAnalytics.gathaStats?.totalAttendance || 0}
              </p>
              <p className="text-sm text-gray-500">for this month</p>
            </div>
            <div className="bg-purple-50 border-2 border-purple-300 p-6 rounded-2xl text-center">
              <BookOpen className="w-10 h-10 mx-auto text-purple-500 mb-3" />
              <h4 className="font-bold text-gray-700">Pathshala's Total Gathas</h4>
              <p className="text-3xl font-bold text-purple-600">
                {currentMonthAnalytics.gathaStats?.totalPathshalaGathas || 0}
              </p>
              <p className="text-sm text-gray-500">learned this month</p>
            </div>
            <div className="bg-red-50 border-2 border-red-300 p-6 rounded-2xl text-center">
              <Crown className="w-10 h-10 mx-auto text-red-500 mb-3" />
              <h4 className="font-bold text-gray-700">Gatha Leader</h4>
              <p className="text-3xl font-bold text-red-600">
                {currentMonthAnalytics.gathaStats?.gathaLeader?.username || 'N/A'}
              </p>
              <p className="text-sm text-gray-500">
                {currentMonthAnalytics.gathaStats?.gathaLeader?.count || 0} gathas
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderContent = () =>
    currentPage === PAGES.HISTORY ? (
      <HistoryPage formatDateIn={formatDateIn} formatLocalDateString={formatLocalDateString} />
    ) : (
      renderDashboard()
    );

  // -------------------------------------
  // JSX
  // -------------------------------------
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">जय जिनेंद्र</h1>
              <p className="text-orange-100">Jain Pathshala Portal</p>
            </div>
            <div className="p-8">
              {loginError && (
                <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                  <p className="text-sm">{loginError}</p>
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                    placeholder="Enter your username"
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="mb-8">
                  <label className="block text-gray-700 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                    placeholder="Enter your password"
                    disabled={isLoading}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                      Logging in...
                    </div>
                  ) : (
                    'Login to Pathshala'
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="text-blue-700 font-semibold mb-2">Available Test Accounts:</p>
                <div className="space-y-1 text-blue-600">
                  <p>• AaravSharma / 2005-03-15</p>
                  <p>• PriyaJain / 2004-07-22</p>
                  <p>• RohanGupta / 2005-11-08</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-orange-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-inner">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  जay Jinendra, {currentUser?.name || currentUser?.username}
                </h2>
                <p className="text-gray-600">Welcome to Pathshala</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors shadow-md"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        {/* Global error banner */}
        {globalError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-2xl mb-6 flex items-start gap-3 text-red-700 shadow">
            <div className="flex-1">
              <p className="font-semibold text-sm">Heads up!</p>
              <p className="text-sm">{globalError}</p>
            </div>
            <button
              onClick={clearGlobalError}
              className="text-red-600 hover:text-red-800"
              aria-label="Dismiss message"
            >
              <CloseIcon size={18} />
            </button>
          </div>
        )}

        {/* Navigation Bar */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setCurrentPage(PAGES.DASHBOARD)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
              currentPage === PAGES.DASHBOARD
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-orange-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentPage(PAGES.HISTORY)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-colors ${
              currentPage === PAGES.HISTORY
                ? 'bg-orange-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-orange-50 border border-orange-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            History
          </button>
        </div>

        {/* Dynamic Content */}
        {renderContent()}

        {/* Footer */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl shadow-xl p-8 text-center text-white mt-6">
          <BookOpen className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">अहिंसा परमो धर्मः</h3>
          <p className="text-orange-100">Non-violence is the supreme religion</p>
        </div>
      </div>
    </div>
  );
}
