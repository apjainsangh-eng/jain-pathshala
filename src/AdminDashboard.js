import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  LogOut,
  User,
  X as CloseIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  Shield,
  TrendingUp,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Search,
  Flame,
  Star,
  Activity,
  Target,
  Zap,
  CalendarDays,
  UserCheck,
  BookMarked,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y >= 2020; y--) {
    years.push(y);
  }
  return years;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const formatLocalDateString = (input = new Date()) => {
  const parsed = input instanceof Date ? input : new Date(input);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    case 'lastMonth':
      const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: formatLocalDateString(startLastMonth),
        end: formatLocalDateString(endLastMonth),
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

const getPerformanceBadge = (attendance, gatha) => {
  const total = (attendance || 0) + (gatha || 0);
  if (total >= 50) return { label: 'Champion', color: 'from-yellow-400 to-orange-500', icon: '🏆' };
  if (total >= 30) return { label: 'Star', color: 'from-purple-400 to-pink-500', icon: '⭐' };
  if (total >= 15) return { label: 'Rising', color: 'from-blue-400 to-indigo-500', icon: '🚀' };
  if (total >= 5) return { label: 'Active', color: 'from-green-400 to-emerald-500', icon: '✨' };
  return { label: 'New', color: 'from-gray-400 to-gray-500', icon: '🌱' };
};

// Group activities by date
const groupActivitiesByDate = (activities) => {
  if (!activities || activities.length === 0) return [];
  
  const grouped = {};
  
  activities.forEach(activity => {
    const dateKey = activity.date?.split('T')[0] || activity.date;
    if (!grouped[dateKey]) {
      grouped[dateKey] = {
        date: dateKey,
        attendance: null,
        gathas: []
      };
    }
    
    if (activity.type === 'attendance') {
      grouped[dateKey].attendance = activity;
    } else if (activity.type === 'gatha') {
      grouped[dateKey].gathas.push(activity);
    }
  });
  
  // Sort by date descending
  return Object.values(grouped).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
};

export default function AdminDashboard({ user, onLogout }) {
  const [pendingData, setPendingData] = useState({ attendance: [], gatha: [] });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Students & Analytics state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [dateRange, setDateRange] = useState(getDateRangePreset('month')); // Changed to month
  const [datePreset, setDatePreset] = useState('month'); // Changed to month
  const [topStudents, setTopStudents] = useState({ topAttendance: [], topGatha: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [studentFilter, setStudentFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // Fetch pending data and stats
  const fetchPendingData = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setIsLoading(true);
    setError('');

    try {
      const [pendingRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!pendingRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const pending = await pendingRes.json();
      const statsData = await statsRes.json();

      setPendingData(pending);
      setStats(statsData);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load data. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch all students with stats
  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        `${API_BASE}/admin/students?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [dateRange]);

  // Fetch top students
  const fetchTopStudents = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        `${API_BASE}/admin/top-students?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=5`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setTopStudents(data);
      }
    } catch (err) {
      console.error('Error fetching top students:', err);
    }
  }, [dateRange]);

  // Fetch single student details
  const fetchStudentDetail = useCallback(async (studentId) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setDetailLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/student/${studentId}/activity?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setStudentDetail(data);
      }
    } catch (err) {
      console.error('Error fetching student detail:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [dateRange]);

  // Initial data fetch
  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

  // Fetch students when date range changes
  useEffect(() => {
    fetchStudents();
    fetchTopStudents();
  }, [fetchStudents, fetchTopStudents]);

  // Fetch student detail when selected
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetail(selectedStudent);
    } else {
      setStudentDetail(null);
    }
  }, [selectedStudent, fetchStudentDetail]);

  // Update date range when preset changes
  useEffect(() => {
    if (datePreset !== 'custom') {
      setDateRange(getDateRangePreset(datePreset));
    }
  }, [datePreset]);

  // Approval handlers
  const handleApprove = async (type, id) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading(`approve-${type}-${id}`);
    setError('');

    try {
      const endpoint = type === 'attendance' 
        ? `/admin/attendance/approve/${id}`
        : `/admin/gatha/approve/${id}`;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Approval failed');
      }

      setSuccessMessage('✅ Entry approved!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPendingData();
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (type, id) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading(`reject-${type}-${id}`);
    setError('');

    try {
      const endpoint = type === 'attendance'
        ? `/admin/attendance/reject/${id}`
        : `/admin/gatha/reject/${id}`;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: 'Rejected by admin' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Rejection failed');
      }

      setSuccessMessage('❌ Entry rejected!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPendingData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!window.confirm('Approve ALL pending entries?')) return;

    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('approve-all');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/approve-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Bulk approval failed');

      const data = await res.json();
      setSuccessMessage(`✅ Approved ${data.approved.attendance} attendance + ${data.approved.gatha} gatha!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchPendingData();
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = pendingData.attendance.length + pendingData.gatha.length;

  // Filter and sort students - ALPHABETICALLY by default
  const filteredStudents = students
    .filter(student => {
      const matchesSearch = student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;
      
      if (studentFilter === 'active') {
        return (student.attendance_count || 0) + (student.new_gathas || 0) > 0;
      } else if (studentFilter === 'inactive') {
        return (student.attendance_count || 0) + (student.new_gathas || 0) === 0;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'attendance') {
        return (b.attendance_count || 0) - (a.attendance_count || 0);
      } else if (sortBy === 'gatha') {
        return (b.new_gathas || b.total_gathas || 0) - (a.new_gathas || a.total_gathas || 0);
      } else if (sortBy === 'total') {
        const totalA = (a.attendance_count || 0) + (a.new_gathas || a.total_gathas || 0);
        const totalB = (b.attendance_count || 0) + (b.new_gathas || b.total_gathas || 0);
        return totalB - totalA;
      }
      return 0;
    });

  // Filter pending items
  const filteredPendingAttendance = approvalFilter === 'gatha' ? [] : pendingData.attendance;
  const filteredPendingGatha = approvalFilter === 'attendance' ? [] : pendingData.gatha;

  // Calculate stats
  const activeStudentsCount = students.filter(s => 
    (s.attendance_count || 0) + (s.new_gathas || s.total_gathas || 0) > 0
  ).length;
  
  const totalAttendanceCount = students.reduce((sum, s) => sum + (s.attendance_count || 0), 0);
  const totalNewGathaCount = students.reduce((sum, s) => sum + (s.new_gathas || 0), 0);
  const totalGathaCount = students.reduce((sum, s) => sum + (s.total_gathas || 0), 0);

  const attendanceRate = students.length > 0 
    ? Math.round((stats?.today_attendance || 0) / students.length * 100)
    : 0;

  // ==================== RENDER FUNCTIONS ====================

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Today's Summary Card */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span className="font-bold">Today's Summary</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <UserCheck className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats?.today_attendance || 0}</p>
            <p className="text-xs opacity-80">Present</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <Users className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{students.length}</p>
            <p className="text-xs opacity-80">Students</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
            <Clock className="w-6 h-6 mx-auto mb-1" />
            <p className="text-2xl font-bold">{totalPending}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-500" />
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">
              {activeStudentsCount} active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Students</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-green-500" />
            <span className={`text-xs px-2 py-1 rounded-full font-bold ${
              attendanceRate >= 70 ? 'bg-green-100 text-green-700' :
              attendanceRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {attendanceRate}%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats?.today_attendance || 0}/{students.length}</p>
          <p className="text-xs text-gray-500 mt-1">Today's Attendance</p>
        </div>

        <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-8 h-8 text-purple-500" />
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">
              ✨ New
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalNewGathaCount || totalGathaCount}</p>
          <p className="text-xs text-gray-500 mt-1">New Gathas (This Month)</p>
        </div>

        <button
          onClick={() => setActiveTab('approvals')}
          className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow-sm text-left relative overflow-hidden active:scale-[0.98]"
        >
          {totalPending > 0 && (
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-400 transform rotate-45 translate-x-10 -translate-y-10"></div>
          )}
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-500" />
            {totalPending > 0 && (
              <span className="relative z-10 animate-pulse">
                <Zap className="w-5 h-5 text-yellow-600" />
              </span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-800">{totalPending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Approvals →</p>
        </button>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h3>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs text-indigo-600 font-bold"
          >
            View All →
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4 overflow-hidden">
            <div className="absolute top-2 right-2 text-3xl">🏆</div>
            <p className="text-xs font-bold text-yellow-800 mb-1">Attendance King</p>
            <p className="text-lg font-bold text-gray-800 truncate pr-8">
              {topStudents.topAttendance?.[0]?.name || 'N/A'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <Calendar className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-bold text-yellow-700">
                {topStudents.topAttendance?.[0]?.count || 0} days
              </span>
            </div>
          </div>

          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-xl p-4 overflow-hidden">
            <div className="absolute top-2 right-2 text-3xl">📚</div>
            <p className="text-xs font-bold text-purple-800 mb-1">New Gatha Master</p>
            <p className="text-lg font-bold text-gray-800 truncate pr-8">
              {topStudents.topGatha?.[0]?.name || 'N/A'}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-bold text-purple-700">
                {topStudents.topGatha?.[0]?.count || 0} new
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('students')}
          className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm active:scale-[0.98]"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">Students</p>
            <p className="text-xs text-gray-500">View all students</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className="flex items-center gap-3 bg-white rounded-xl p-4 border-2 border-green-200 shadow-sm active:scale-[0.98]"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800">Analytics</p>
            <p className="text-xs text-gray-500">View reports</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Pending Approvals</h3>
        <button
          onClick={fetchPendingData}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-2 rounded-xl active:scale-[0.98] text-sm font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Approve All Button */}
      {totalPending > 0 && (
        <button
          onClick={handleApproveAll}
          disabled={actionLoading === 'approve-all'}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl active:scale-[0.98] font-bold shadow-lg"
        >
          <Check className="w-5 h-5" />
          {actionLoading === 'approve-all' ? 'Approving...' : `Approve All (${totalPending})`}
        </button>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setApprovalFilter('all')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            approvalFilter === 'all' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
          }`}
        >
          All ({totalPending})
        </button>
        <button
          onClick={() => setApprovalFilter('attendance')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            approvalFilter === 'attendance' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
          }`}
        >
          📅 ({pendingData.attendance.length})
        </button>
        <button
          onClick={() => setApprovalFilter('gatha')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
            approvalFilter === 'gatha' ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
          }`}
        >
          📖 ({pendingData.gatha.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 border-2 border-indigo-200 text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      ) : totalPending === 0 ? (
        <div className="bg-white rounded-xl p-8 border-2 border-green-200 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
          <p className="text-lg font-bold text-gray-800">All Caught Up!</p>
          <p className="text-sm text-gray-500">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Attendance Items */}
          {filteredPendingAttendance.map((item) => (
            <div key={`att-${item.id}`} className="bg-white border-2 border-yellow-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{item.student_name || item.username}</span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full ml-2">
                        Attendance
                      </span>
                    </div>
                  </div>
                  <div className="ml-10 text-sm text-gray-600">
                    <p>📅 {formatDate(item.date)}</p>
                    {item.formatted_time && <p className="text-xs text-gray-400">⏰ {item.formatted_time}</p>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove('attendance', item.id)}
                    disabled={actionLoading === `approve-attendance-${item.id}`}
                    className="p-3 bg-green-500 text-white rounded-xl active:scale-95 shadow-md"
                  >
                    {actionLoading === `approve-attendance-${item.id}` ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject('attendance', item.id)}
                    disabled={actionLoading === `reject-attendance-${item.id}`}
                    className="p-3 bg-red-500 text-white rounded-xl active:scale-95 shadow-md"
                  >
                    {actionLoading === `reject-attendance-${item.id}` ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Gatha Items */}
          {filteredPendingGatha.map((item) => (
            <div key={`gatha-${item.id}`} className="bg-white border-2 border-purple-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800">{item.student_name || item.username}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ml-2 ${
                        item.type === 'new' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        {item.type === 'new' ? '✨ New' : '🔄 Revision'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="ml-10 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    <p><span className="font-semibold">📖 Sutra:</span> {item.sutra_name}</p>
                    <p><span className="font-semibold">📝 Gatha:</span> {item.which_gatha}</p>
                    <p><span className="font-semibold">#️⃣ Total:</span> {item.total_gatha}</p>
                    <p className="text-xs text-gray-500">📅 {formatDate(item.date)}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleApprove('gatha', item.id)}
                    disabled={actionLoading === `approve-gatha-${item.id}`}
                    className="p-3 bg-green-500 text-white rounded-xl active:scale-95 shadow-md"
                  >
                    {actionLoading === `approve-gatha-${item.id}` ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject('gatha', item.id)}
                    disabled={actionLoading === `reject-gatha-${item.id}`}
                    className="p-3 bg-red-500 text-white rounded-xl active:scale-95 shadow-md"
                  >
                    {actionLoading === `reject-gatha-${item.id}` ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStudentsList = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white rounded-xl p-3 border-2 border-indigo-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
          />
        </div>
      </div>

      {/* Date Range for Students */}
<div className="bg-white rounded-xl p-3 border-2 border-indigo-200 shadow-sm">
  <p className="text-xs font-bold text-gray-600 mb-2">📅 Date Range</p>
  
  {/* Quick Presets */}
  <div className="flex flex-wrap gap-2 mb-3">
    {[
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' },
      { key: 'all', label: 'All' },
      { key: 'custom', label: '📅 Custom' },
    ].map((preset) => (
      <button
        key={preset.key}
        onClick={() => setDatePreset(preset.key)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
          datePreset === preset.key
            ? 'bg-indigo-500 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {preset.label}
      </button>
    ))}
  </div>

  {/* Month/Year Dropdowns - Show when custom */}
  {datePreset === 'custom' && (
    <div className="flex gap-2 mb-3">
      <select
        value={selectedMonth}
        onChange={(e) => {
          const month = parseInt(e.target.value);
          setSelectedMonth(month);
          const start = new Date(selectedYear, month - 1, 1);
          const end = new Date(selectedYear, month, 0);
          setDateRange({
            start: formatLocalDateString(start),
            end: formatLocalDateString(end),
          });
        }}
        className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400"
      >
        {MONTH_NAMES.map((name, idx) => (
          <option key={idx} value={idx + 1}>{name}</option>
        ))}
      </select>

      <select
        value={selectedYear}
        onChange={(e) => {
          const year = parseInt(e.target.value);
          setSelectedYear(year);
          const start = new Date(year, selectedMonth - 1, 1);
          const end = new Date(year, selectedMonth, 0);
          setDateRange({
            start: formatLocalDateString(start),
            end: formatLocalDateString(end),
          });
        }}
        className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-400"
      >
        {getYearOptions().map((year) => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>
    </div>
  )}

  {/* Show selected range */}
  <p className="text-xs text-gray-500 text-center">
    📅 {formatDate(dateRange.start)} - {formatDate(dateRange.end)}
  </p>
</div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'active', 'inactive'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStudentFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap ${
              studentFilter === filter
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            {filter === 'all' ? `All (${students.length})` : 
             filter === 'active' ? `Active (${activeStudentsCount})` :
             `Inactive (${students.length - activeStudentsCount})`}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'name', label: 'A-Z', icon: '🔤' },
          { key: 'attendance', label: 'Days', icon: '📅' },
          { key: 'gatha', label: 'Gatha', icon: '✨' },
          { key: 'total', label: 'Total', icon: '⭐' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setSortBy(option.key)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              sortBy === option.key ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
            }`}
          >
            {option.icon} {option.label}
          </button>
        ))}
      </div>

      {/* Students Count */}
      <p className="text-sm text-gray-600 font-semibold">
        Showing {filteredStudents.length} students
      </p>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map((student, index) => {
          const newGathas = student.new_gathas || student.total_gathas || 0;
          const badge = getPerformanceBadge(student.attendance_count, newGathas);
          
          return (
            <div key={student.id} className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  if (expandedStudent === student.id) {
                    setExpandedStudent(null);
                    setSelectedStudent(null);
                  } else {
                    setExpandedStudent(student.id);
                    setSelectedStudent(student.username);
                  }
                }}
                className="w-full p-4 text-left active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-12 h-12 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center text-xl shadow-md`}>
                        {badge.icon}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-white text-xs font-bold px-1.5 rounded-full border">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{student.name}</p>
                      <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-white font-bold`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{student.attendance_count || 0}</p>
                      <p className="text-xs text-gray-400">Days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-600">{newGathas}</p>
                      <p className="text-xs text-gray-400">New</p>
                    </div>
                    {expandedStudent === student.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expandedStudent === student.id && (
                <div className="border-t-2 border-indigo-100 p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
                  {detailLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                      <p className="text-xs text-gray-500 mt-2">Loading details...</p>
                    </div>
                  ) : studentDetail ? (
                    <>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-white rounded-xl p-3 border-2 border-green-200 text-center">
                          <Calendar className="w-5 h-5 text-green-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-green-600">
                            {studentDetail.summary?.totalAttendance || studentDetail.attendance?.length || 0}
                          </p>
                          <p className="text-xs text-gray-500">Days</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border-2 border-purple-200 text-center">
                          <Star className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-purple-600">
                            {studentDetail.gathaStats?.new || 0}
                          </p>
                          <p className="text-xs text-gray-500">New</p>
                        </div>
                        <div className="bg-white rounded-xl p-3 border-2 border-blue-200 text-center">
                          <RefreshCw className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                          <p className="text-xl font-bold text-blue-600">
                            {studentDetail.gathaStats?.revision || 0}
                          </p>
                          <p className="text-xs text-gray-500">Revision</p>
                        </div>
                      </div>

                      {/* Activity Grouped by Date */}
                      {studentDetail.recentActivity && studentDetail.recentActivity.length > 0 && (
                        <div>
                          <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Activity by Date
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {groupActivitiesByDate(studentDetail.recentActivity).map((dayGroup, idx) => (
                              <div key={idx} className="bg-white rounded-xl p-3 border-2 border-gray-200 shadow-sm">
                                {/* Date Header */}
                                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                                  <span className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-indigo-500" />
                                    {formatDate(dayGroup.date)}
                                  </span>
                                </div>

                                {/* Day's Activities */}
                                <div className="space-y-2">
                                  {/* Attendance */}
                                  {dayGroup.attendance && (
                                    <div className="flex items-center gap-2 bg-green-50 rounded-lg p-2">
                                      <UserCheck className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-700 font-medium">
                                        ✅ Present
                                      </span>
                                      {dayGroup.attendance.formatted_time && (
                                        <span className="text-xs text-green-600 ml-auto">
                                          {dayGroup.attendance.formatted_time}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Gathas */}
                                  {dayGroup.gathas.map((gatha, gIdx) => (
                                    <div key={gIdx} className={`rounded-lg p-2 ${
                                      gatha.gatha_type === 'new' 
                                        ? 'bg-purple-50' 
                                        : 'bg-blue-50'
                                    }`}>
                                      <div className="flex items-center gap-2">
                                        <BookOpen className={`w-4 h-4 ${
                                          gatha.gatha_type === 'new' 
                                            ? 'text-purple-600' 
                                            : 'text-blue-600'
                                        }`} />
                                        <span className={`text-sm font-medium ${
                                          gatha.gatha_type === 'new' 
                                            ? 'text-purple-700' 
                                            : 'text-blue-700'
                                        }`}>
                                          {gatha.gatha_type === 'new' ? '✨ New Gatha' : '🔄 Revision'}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
                                          gatha.gatha_type === 'new' 
                                            ? 'bg-purple-200 text-purple-700' 
                                            : 'bg-blue-200 text-blue-700'
                                        }`}>
                                          {gatha.total_gatha} gathas
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1 ml-6">
                                        📖 {gatha.sutra_name} • {gatha.which_gatha}
                                      </p>
                                    </div>
                                  ))}

                                  {/* If nothing on this day */}
                                  {!dayGroup.attendance && dayGroup.gathas.length === 0 && (
                                    <p className="text-xs text-gray-400 text-center py-2">No activity</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!studentDetail.recentActivity || studentDetail.recentActivity.length === 0) && (
                        <p className="text-center text-gray-500 py-4 text-sm">No recent activity</p>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-4">No data available</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">No students found</p>
        </div>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      {/* Date Range Presets */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Date Range
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {[
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' },
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

        <button
          onClick={() => { fetchStudents(); fetchTopStudents(); }}
          className="w-full bg-indigo-500 text-white py-2 rounded-lg active:scale-[0.98] text-sm font-bold flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 text-white shadow-lg">
          <Calendar className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{totalAttendanceCount}</p>
          <p className="text-xs opacity-80">Total Attendance</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-4 text-white shadow-lg">
          <BookOpen className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{totalNewGathaCount || totalGathaCount}</p>
          <p className="text-xs opacity-80">New Gathas</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-4 text-white shadow-lg">
          <TrendingUp className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">
            {students.length > 0 ? Math.round((totalNewGathaCount || totalGathaCount) / students.length) : 0}
          </p>
          <p className="text-xs opacity-80">Avg Gathas/Student</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-4 text-white shadow-lg">
          <Users className="w-8 h-8 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{activeStudentsCount}</p>
          <p className="text-xs opacity-80">Active Students</p>
        </div>
      </div>

      {/* Top 5 Students - Attendance */}
      <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          🏆 Top 5 - Attendance
        </h3>
        <div className="space-y-2">
          {topStudents.topAttendance?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div
                key={student.username}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 ? 'bg-yellow-50 border-2 border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                  index === 2 ? 'bg-orange-50 border-2 border-orange-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[index]}</span>
                  <span className="font-bold text-gray-800">{student.name}</span>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold text-sm">
                  {student.count} days
                </span>
              </div>
            );
          })}
          {(!topStudents.topAttendance || topStudents.topAttendance.length === 0) && (
            <p className="text-center text-gray-500 py-4">No data available</p>
          )}
        </div>
      </div>

      {/* Top 5 Students - New Gatha */}
      <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          ✨ Top 5 - New Gathas
        </h3>
        <div className="space-y-2">
          {topStudents.topGatha?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div
                key={student.username}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  index === 0 ? 'bg-purple-50 border-2 border-purple-200' :
                  index === 1 ? 'bg-gray-50 border-2 border-gray-200' :
                  index === 2 ? 'bg-pink-50 border-2 border-pink-200' :
                  'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{medals[index]}</span>
                  <span className="font-bold text-gray-800">{student.name}</span>
                </div>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-bold text-sm">
                  {student.count} new
                </span>
              </div>
            );
          })}
          {(!topStudents.topGatha || topStudents.topGatha.length === 0) && (
            <p className="text-center text-gray-500 py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RETURN ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 pb-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 border-4 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">👋 {user.name}</h2>
                <p className="text-xs text-indigo-600 font-semibold">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-red-100 text-red-600 px-3 py-2 rounded-xl active:scale-[0.98] text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              Exit
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl mb-4 flex items-center gap-2 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError('')}>
              <CloseIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-xl mb-4 flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 font-semibold">{successMessage}</p>
          </div>
        )}

        {/* Navigation Tabs - PENDING MOVED TO LAST */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { key: 'overview', icon: BarChart3, label: 'Home' },
            { key: 'students', icon: Users, label: 'Students' },
            { key: 'analytics', icon: TrendingUp, label: 'Stats' },
            { key: 'approvals', icon: Clock, label: 'Pending', badge: totalPending },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-all ${
                activeTab === tab.key
                  ? 'bg-indigo-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 border-2 border-indigo-200'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'students' && renderStudentsList()}
        {activeTab === 'analytics' && renderAnalytics()}
      </div>
    </div>
  );
}
