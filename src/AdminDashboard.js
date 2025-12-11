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
  Eye,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatLocalDateString = (input = new Date()) => {
  const parsed = input instanceof Date ? input : new Date(input);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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

export default function AdminDashboard({ user, onLogout }) {
  const [pendingData, setPendingData] = useState({ attendance: [], gatha: [] });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Analytics state
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [dateRange, setDateRange] = useState(getMonthDateRange());
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('attendance');
  const [expandedStudent, setExpandedStudent] = useState(null);

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

  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        `${API_BASE}/analytics/leaderboard?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setLeaderboardData(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  }, [dateRange]);

  const fetchStudentDetail = useCallback(async (studentId) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchPendingData();
    fetchStudents();
    fetchLeaderboard();
  }, [fetchPendingData, fetchStudents, fetchLeaderboard]);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetail(selectedStudent);
    }
  }, [selectedStudent, fetchStudentDetail]);

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

      setSuccessMessage('Entry approved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPendingData();
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

      setSuccessMessage('Entry rejected!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPendingData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveAll = async () => {
    if (!window.confirm('Are you sure you want to approve ALL pending entries?')) {
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('approve-all');
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/approve-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Bulk approval failed');
      }

      const data = await res.json();
      setSuccessMessage(`Approved ${data.approved.attendance} attendance + ${data.approved.gatha} gatha entries!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchPendingData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const totalPending = pendingData.attendance.length + pendingData.gatha.length;

  // Filter and sort students
  const filteredStudents = students
    .filter(student => 
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'attendance') {
        return (b.attendance_count || 0) - (a.attendance_count || 0);
      } else if (sortBy === 'gatha') {
        return (b.total_gathas || 0) - (a.total_gathas || 0);
      }
      return 0;
    });

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold text-blue-800">Total Students</span>
          </div>
          <p className="text-3xl font-bold text-blue-700">{students.length}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-600" />
            <span className="text-xs font-bold text-green-800">Today Present</span>
          </div>
          <p className="text-3xl font-bold text-green-700">{stats?.today_attendance || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-purple-600" />
            <span className="text-xs font-bold text-purple-800">Total Gathas</span>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {leaderboardData?.gathaStats?.totalPathshalaGathas || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border-2 border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-xs font-bold text-yellow-800">Pending</span>
          </div>
          <p className="text-3xl font-bold text-yellow-700">{totalPending}</p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Top Performers
        </h3>
        
        <div className="space-y-3">
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-bold text-yellow-800">Attendance Leader</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {leaderboardData?.attendanceLeader?.username || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              {leaderboardData?.attendanceLeader?.attendance_count || 0} days
            </p>
          </div>

          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-purple-800">Gatha Leader</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {leaderboardData?.gathaStats?.gathaLeader?.username || 'N/A'}
            </p>
            <p className="text-xs text-gray-600">
              {leaderboardData?.gathaStats?.gathaLeader?.count || 0} gathas
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('approvals')}
            className="w-full flex items-center justify-between bg-yellow-50 border-2 border-yellow-200 rounded-lg p-3 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="font-bold text-gray-800">Pending Approvals</span>
            </div>
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {totalPending}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className="w-full flex items-center justify-between bg-blue-50 border-2 border-blue-200 rounded-lg p-3 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-800">View All Students</span>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className="w-full flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-lg p-3 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span className="font-bold text-gray-800">Analytics Dashboard</span>
            </div>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={fetchPendingData}
          disabled={isLoading}
          className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-xl active:scale-[0.98] text-sm font-bold"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        {totalPending > 0 && (
          <button
            onClick={handleApproveAll}
            disabled={actionLoading === 'approve-all'}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl active:scale-[0.98] text-sm font-bold"
          >
            <Check className="w-4 h-4" />
            {actionLoading === 'approve-all' ? 'Approving...' : 'Approve All'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('approvals-attendance')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${
            activeTab === 'approvals-attendance'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-indigo-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Attendance ({pendingData.attendance.length})
        </button>
        <button
          onClick={() => setActiveTab('approvals-gatha')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${
            activeTab === 'approvals-gatha'
              ? 'bg-indigo-500 text-white shadow-lg'
              : 'bg-white text-gray-600 border-2 border-indigo-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Gatha ({pendingData.gatha.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-500"></div>
            <p className="mt-4 text-gray-600 text-sm">Loading...</p>
          </div>
        ) : activeTab === 'approvals-attendance' || activeTab === 'approvals' ? (
          pendingData.attendance.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pending attendance</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingData.attendance.map((item) => (
                <div key={item.id} className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-gray-800">{item.student_name}</span>
                      </div>
                      <p className="text-xs text-gray-500">@{item.student_username}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{formatDate(item.date)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove('attendance', item.id)}
                        disabled={actionLoading === `approve-attendance-${item.id}`}
                        className="p-2 bg-green-500 text-white rounded-lg active:scale-95"
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
                        className="p-2 bg-red-500 text-white rounded-lg active:scale-95"
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
            </div>
          )
        ) : (
          pendingData.gatha.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No pending gatha entries</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingData.gatha.map((item) => (
                <div key={item.id} className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-indigo-500" />
                        <span className="font-bold text-gray-800">{item.student_name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          item.type === 'new' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                        }`}>
                          {item.type === 'new' ? 'New' : 'Revision'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">@{item.student_username}</p>
                      
                      <div className="bg-white rounded-lg p-2 text-sm space-y-1">
                        <p><span className="font-semibold">Sutra:</span> {item.sutra_name}</p>
                        <p><span className="font-semibold">Gatha:</span> {item.which_gatha}</p>
                        <p><span className="font-semibold">Total:</span> {item.total_gatha}</p>
                        <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApprove('gatha', item.id)}
                        disabled={actionLoading === `approve-gatha-${item.id}`}
                        className="p-2 bg-green-500 text-white rounded-lg active:scale-95"
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
                        className="p-2 bg-red-500 text-white rounded-lg active:scale-95"
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
          )
        )}
      </div>
    </div>
  );

  const renderStudentsList = () => (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('attendance')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold ${
              sortBy === 'attendance'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sort by Attendance
          </button>
          <button
            onClick={() => setSortBy('gatha')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold ${
              sortBy === 'gatha'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            Sort by Gatha
          </button>
        </div>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map((student) => (
          <div key={student.id} className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden">
            <button
              onClick={() => {
                if (expandedStudent === student.id) {
                  setExpandedStudent(null);
                  setSelectedStudent(null);
                } else {
                  setExpandedStudent(student.id);
                  setSelectedStudent(student.id);
                }
              }}
              className="w-full p-4 text-left active:bg-gray-50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-500">@{student.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Attendance</p>
                    <p className="text-lg font-bold text-green-600">{student.attendance_count || 0}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Gathas</p>
                    <p className="text-lg font-bold text-purple-600">{student.total_gathas || 0}</p>
                  </div>
                  {expandedStudent === student.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
            </button>

            {expandedStudent === student.id && studentDetail && (
              <div className="border-t-2 border-indigo-100 p-4 bg-indigo-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-600 mb-1">Total Attendance</p>
                    <p className="text-2xl font-bold text-green-600">
                      {studentDetail.attendance?.length || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-purple-200">
                    <p className="text-xs text-gray-600 mb-1">New Gathas</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {studentDetail.gathaStats?.new || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Revisions</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {studentDetail.gathaStats?.revision || 0}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-orange-200">
                    <p className="text-xs text-gray-600 mb-1">Total Gathas</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {(studentDetail.gathaStats?.new || 0) + (studentDetail.gathaStats?.revision || 0)}
                    </p>
                  </div>
                </div>

                {/* Recent Activity */}
                {studentDetail.recentActivity && studentDetail.recentActivity.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-gray-800 mb-2">Recent Activity</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {studentDetail.recentActivity.map((activity, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-2 border border-gray-200 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">
                              {activity.type === 'attendance' ? '✓ Attended' : '📖 Gatha'}
                            </span>
                            <span className="text-gray-500">{formatDate(activity.date)}</span>
                          </div>
                          {activity.type === 'gatha' && (
                            <p className="text-gray-600 mt-1">
                              {activity.sutra_name} - {activity.which_gatha}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-4">
      {/* Date Range Selector */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        <h3 className="text-sm font-bold text-gray-800 mb-3">Select Date Range</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400 text-sm"
            />
          </div>
          <button
            onClick={() => setDateRange(getMonthDateRange())}
            className="w-full bg-indigo-500 text-white py-2 rounded-lg active:scale-[0.98] text-sm font-bold"
          >
            This Month
          </button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-300">
          <Calendar className="w-8 h-8 text-green-600 mb-2" />
          <p className="text-xs font-bold text-green-800 mb-1">Total Attendance</p>
          <p className="text-3xl font-bold text-green-700">
            {leaderboardData?.gathaStats?.totalAttendance || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-300">
          <BookOpen className="w-8 h-8 text-purple-600 mb-2" />
          <p className="text-xs font-bold text-purple-800 mb-1">Total Gathas</p>
          <p className="text-3xl font-bold text-purple-700">
            {leaderboardData?.gathaStats?.totalPathshalaGathas || 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-300">
          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
          <p className="text-xs font-bold text-blue-800 mb-1">Avg per Student</p>
          <p className="text-3xl font-bold text-blue-700">
            {students.length > 0 
              ? Math.round((leaderboardData?.gathaStats?.totalPathshalaGathas || 0) / students.length)
              : 0}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-300">
          <Users className="w-8 h-8 text-orange-600 mb-2" />
          <p className="text-xs font-bold text-orange-800 mb-1">Active Students</p>
          <p className="text-3xl font-bold text-orange-700">{students.length}</p>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </h3>

        <div className="space-y-3">
          {/* Attendance Leader */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-yellow-800 mb-1">🏆 Attendance Champion</p>
                <p className="text-lg font-bold text-gray-800">
                  {leaderboardData?.attendanceLeader?.username || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  {leaderboardData?.attendanceLeader?.attendance_count || 0} days present
                </p>
              </div>
            </div>
          </div>

          {/* Gatha Leader */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-400 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-purple-800 mb-1">📚 Gatha Master</p>
                <p className="text-lg font-bold text-gray-800">
                  {leaderboardData?.gathaStats?.gathaLeader?.username || 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  {leaderboardData?.gathaStats?.gathaLeader?.count || 0} gathas learned
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 border-4 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-inner">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Admin: {user.name}</h2>
                <p className="text-xs text-gray-600">Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-xl active:scale-[0.98] text-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => setError('')} className="ml-auto">
              <CloseIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-xl mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-colors relative ${
              activeTab.startsWith('approvals')
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <Clock className="w-5 h-5" />
            Approvals
            {totalPending > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {totalPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'students'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <Users className="w-5 h-5" />
            Students
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl font-bold text-xs transition-colors ${
              activeTab === 'analytics'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {(activeTab === 'approvals' || activeTab.startsWith('approvals-')) && renderApprovals()}
        {activeTab === 'students' && renderStudentsList()}
        {activeTab === 'analytics' && renderAnalytics()}

        {/* Footer */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-center text-white mt-4">
          <Shield className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-1">Admin Portal</h3>
          <p className="text-indigo-100 text-sm">શ્રી સોમચીન્તામણી વસુપૂજ્યસ્વામી જૈન પાઠશાળા</p>
        </div>
      </div>
    </div>
  );
}
