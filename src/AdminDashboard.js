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

export default function AdminDashboard({ user, onLogout }) {
  const [pendingData, setPendingData] = useState({ attendance: [], gatha: [] });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

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

  useEffect(() => {
    fetchPendingData();
  }, [fetchPendingData]);

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
                <h2 className="text-base font-bold text-gray-800">
                  Admin: {user.name}
                </h2>
                <p className="text-xs text-gray-600">Approval Dashboard</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-red-500 text-white px-3 py-2 rounded-xl active:scale-[0.98] text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 border-2 border-yellow-200 shadow">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <span className="text-xs font-bold text-gray-600">Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{totalPending}</p>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-green-200 shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-500" />
              <span className="text-xs font-bold text-gray-600">Today</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {stats?.today_attendance || 0}
            </p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
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

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
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
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${
              activeTab === 'attendance'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Attendance ({pendingData.attendance.length})
          </button>
          <button
            onClick={() => setActiveTab('gatha')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm ${
              activeTab === 'gatha'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'bg-white text-gray-600 border-2 border-indigo-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Gatha ({pendingData.gatha.length})
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-4 border-4 border-indigo-200">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-500"></div>
              <p className="mt-4 text-gray-600 text-sm">Loading...</p>
            </div>
          ) : activeTab === 'attendance' ? (
            // Attendance List
            pendingData.attendance.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No pending attendance</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingData.attendance.map((item) => (
                  <div
                    key={item.id}
                    className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-gray-800">
                            {item.student_name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">@{item.student_username}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {formatDate(item.date)}
                          </span>
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
            // Gatha List
            pendingData.gatha.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No pending gatha entries</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingData.gatha.map((item) => (
                  <div
                    key={item.id}
                    className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-gray-800">
                            {item.student_name}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            item.type === 'new' 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-blue-500 text-white'
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

        {/* Footer */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-center text-white mt-4">
          <Shield className="w-10 h-10 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-1">Admin Portal</h3>
          <p className="text-indigo-100 text-sm">Managing Jain Pathshala</p>
        </div>
      </div>
    </div>
  );
}
