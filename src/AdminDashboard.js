import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import StudentProfile from './admin/components/StudentProfile';
import BulkAttendance from './admin/components/BulkAttendance';
import BulkGatha from './admin/components/BulkGatha';
import AttendanceRegister from './admin/components/AttendanceRegister';
import {
  BookOpen,
  Calendar,
  Check,
  Clock,
  LogOut,
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
  Search,
  Star,
  Activity,
  Target,
  Zap,
  CalendarDays,
  UserCheck,
  Download,
  FileText,
  Share2,
  Copy,
  CheckCheck,
  BellRing,
  Wifi,
  WifiOff,
  UserPlus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Plus,
  Key,
  UserCog,
  Menu,
  LayoutGrid,
  ClipboardList,
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

// ============================================
// HELPER FUNCTIONS
// ============================================

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
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

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const formatLocalDateString = (input = new Date()) => {
  const parsed = input instanceof Date ? input : new Date(input);
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const d = String(parsed.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getDateRangePreset = (preset, month, year, customStart, customEnd) => {
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
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);
      return {
        start: formatLocalDateString(monthStart),
        end: formatLocalDateString(monthEnd),
      };
    case 'year':
      const yearStart = new Date(year, 0, 1);
      const yearEnd = new Date(year, 11, 31);
      return {
        start: formatLocalDateString(yearStart),
        end: formatLocalDateString(yearEnd),
      };
    case 'all':
      return {
        start: '2020-01-01',
        end: '2099-12-31',
      };
    case 'custom':
      return {
        start: customStart || formatLocalDateString(today),
        end: customEnd || formatLocalDateString(today),
      };
    default:
      return getDateRangePreset('month', month, year);
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminDashboard({ user, onLogout }) {
  // ============ STATE VARIABLES ============
  const [pendingData, setPendingData] = useState({ attendance: [], gatha: [] });
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [viewingStudentProfile, setViewingStudentProfile] = useState(null);
  const [familyGroups, setFamilyGroups] = useState([]);
  const [familyGroupsLoading, setFamilyGroupsLoading] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ groupName: '', members: [] });
  const [selectedMembers, setSelectedMembers] = useState([]);
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [newPendingAlert, setNewPendingAlert] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const previousPendingCount = useRef(0);
  const refreshTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const isFirstLoad = useRef(true);
  
  // Students & Analytics state
  const [students, setStudents] = useState([]);
  const [topStudents, setTopStudents] = useState({ topAttendance: [], topGatha: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [studentFilter, setStudentFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  // Date picker state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [datePreset, setDatePreset] = useState('month');
  const [customStartDate, setCustomStartDate] = useState(formatLocalDateString(new Date()));
  const [customEndDate, setCustomEndDate] = useState(formatLocalDateString(new Date()));
  const [dateRange, setDateRange] = useState(() => 
    getDateRangePreset('month', new Date().getMonth() + 1, new Date().getFullYear())
  );
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportData, setExportData] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // ============ NEW: USER MANAGEMENT STATE ============
  const [allUsers, setAllUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'student'
  });
  const [userFormError, setUserFormError] = useState('');

  // ============ NEW: ADD ENTRY STATE (Attendance/Gatha) ============
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [addEntryType, setAddEntryType] = useState('attendance');
  const [addEntryData, setAddEntryData] = useState({
    studentUsername: '',
    date: formatLocalDateString(new Date()),
    sutraName: '',
    whichGatha: '',
    totalGatha: 1,
    gathaType: 'new'
  });
  const [addEntryLoading, setAddEntryLoading] = useState(false);

  // ============ NOTIFICATION HELPERS ============
  
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const showBrowserNotification = useCallback((count) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Jain Pathshala', {
        body: count + ' new pending request' + (count > 1 ? 's' : '') + '!',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pending-notification',
      });
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  // ============ ONLINE/OFFLINE DETECTION ============
  
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

  // ============ EFFECTS ============
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMonthDropdown || showYearDropdown) {
        const isOutside = !event.target.closest('[data-dropdown]');
        if (isOutside) {
          setShowMonthDropdown(false);
          setShowYearDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthDropdown, showYearDropdown]);

  useEffect(() => {
    if (datePreset === 'custom') {
      setDateRange(getDateRangePreset('custom', selectedMonth, selectedYear, customStartDate, customEndDate));
    } else {
      setDateRange(getDateRangePreset(datePreset, selectedMonth, selectedYear));
    }
  }, [datePreset, selectedMonth, selectedYear, customStartDate, customEndDate]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  useEffect(() => {
    if (activeTab === 'approvals') {
      setNewPendingAlert(false);
    }
  }, [activeTab]);

  // ============ FETCH FUNCTIONS ============

  const fetchPendingData = useCallback(async (isAutoRefresh = false) => {
    const token = localStorage.getItem('jainPathshalaToken');
    
    if (!isAutoRefresh) {
      setIsLoading(true);
    }

    try {
      const [pendingRes, statsRes] = await Promise.all([
        fetch(API_BASE + '/admin/pending', {
          headers: { Authorization: 'Bearer ' + token },
        }),
        fetch(API_BASE + '/admin/stats', {
          headers: { Authorization: 'Bearer ' + token },
        }),
      ]);

      if (!pendingRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const pending = await pendingRes.json();
      const statsData = await statsRes.json();

      const newTotalPending = pending.attendance.length + pending.gatha.length;
      
      if (!isFirstLoad.current && isAutoRefresh && newTotalPending > previousPendingCount.current) {
        const newCount = newTotalPending - previousPendingCount.current;
        setNewPendingAlert(true);
        playNotificationSound();
        showBrowserNotification(newCount);
        
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }
      
      isFirstLoad.current = false;
      previousPendingCount.current = newTotalPending;
      setPendingData(pending);
      setStats(statsData);
      setLastRefreshed(new Date());
      setCountdown(refreshInterval);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      if (!isAutoRefresh) {
        setError('Failed to load data. Please refresh.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshInterval, playNotificationSound, showBrowserNotification]);

  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        API_BASE + '/admin/students?startDate=' + dateRange.start + '&endDate=' + dateRange.end,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [dateRange]);

  const fetchTopStudents = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(
        API_BASE + '/admin/top-students?startDate=' + dateRange.start + '&endDate=' + dateRange.end + '&limit=5&gathaType=new',
        { headers: { Authorization: 'Bearer ' + token } }
      );
      if (res.ok) {
        const data = await res.json();
        setTopStudents(data);
      }
    } catch (err) {
      console.error('Error fetching top students:', err);
    }
  }, [dateRange]);

  const fetchExportData = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setExportLoading(true);
    try {
      const res = await fetch(
        API_BASE + '/admin/export-report?startDate=' + dateRange.start + '&endDate=' + dateRange.end,
        { headers: { Authorization: 'Bearer ' + token } }
      );
      if (res.ok) {
        const data = await res.json();
        setExportData(data);
      }
    } catch (err) {
      console.error('Error fetching export data:', err);
    } finally {
      setExportLoading(false);
    }
  }, [dateRange]);

  const fetchFamilyGroups = useCallback(async () => {
  const token = localStorage.getItem('jainPathshalaToken');
  setFamilyGroupsLoading(true);
  try {
    const res = await fetch(API_BASE + '/admin/family-groups', {
      headers: { Authorization: 'Bearer ' + token },
    });
    if (res.ok) {
      const data = await res.json();
      setFamilyGroups(data);
    }
  } catch (err) {
    console.error('Error fetching family groups:', err);
  } finally {
    setFamilyGroupsLoading(false);
  }
}, []);
  
  // ============ NEW: FETCH ALL USERS ============
  const fetchAllUsers = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setUsersLoading(true);
    try {
      const res = await fetch(API_BASE + '/admin/users', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        const data = await res.json();
        setAllUsers(data);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ============ AUTO-REFRESH EFFECT ============

  useEffect(() => {
  if (activeTab === 'users') {
    fetchFamilyGroups();
  }
}, [activeTab, fetchFamilyGroups]);
  
  useEffect(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    fetchPendingData(false);

    if (autoRefresh && isOnline) {
      refreshTimerRef.current = setInterval(() => {
        fetchPendingData(true);
      }, refreshInterval * 1000);

      setCountdown(refreshInterval);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) return refreshInterval;
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [autoRefresh, refreshInterval, isOnline, fetchPendingData]);

  useEffect(() => {
    fetchStudents();
    fetchTopStudents();
  }, [fetchStudents, fetchTopStudents]);

  useEffect(() => {
    if (showExportModal) {
      fetchExportData();
    }
  }, [showExportModal, fetchExportData]);

  // Fetch users when users tab is active
  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers();
    }
  }, [activeTab, fetchAllUsers]);

  // ============ HANDLERS ============

  const handleCreateGroup = async () => {
  if (!newGroup.groupName || selectedMembers.length < 2) {
    setError('Group name and at least 2 members required');
    return;
  }

  const token = localStorage.getItem('jainPathshalaToken');
  setActionLoading('create-group');

  try {
    const res = await fetch(API_BASE + '/admin/family-groups', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        groupName: newGroup.groupName,
        members: selectedMembers
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to create group');
    }

    setSuccessMessage('Family group created!');
    setTimeout(() => setSuccessMessage(''), 3000);
    setShowAddGroupModal(false);
    setNewGroup({ groupName: '', members: [] });
    setSelectedMembers([]);
    fetchFamilyGroups();
  } catch (err) {
    setError(err.message);
  } finally {
    setActionLoading(null);
  }
};

const handleDeleteGroup = async (groupId) => {
  if (!window.confirm('Delete this family group?')) return;

  const token = localStorage.getItem('jainPathshalaToken');
  setActionLoading('delete-group-' + groupId);

  try {
    const res = await fetch(API_BASE + '/admin/family-groups/' + groupId, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!res.ok) throw new Error('Failed to delete group');

    setSuccessMessage('Group deleted!');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchFamilyGroups();
  } catch (err) {
    setError(err.message);
  } finally {
    setActionLoading(null);
  }
};

const toggleMemberSelection = (username) => {
  setSelectedMembers(prev => 
    prev.includes(username) 
      ? prev.filter(u => u !== username)
      : [...prev, username]
  );
};
  
  const handleApprove = async (type, id) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('approve-' + type + '-' + id);
    setError('');

    try {
      const endpoint = type === 'attendance' 
        ? '/admin/attendance/approve/' + id
        : '/admin/gatha/approve/' + id;

      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Approval failed');
      }

      setSuccessMessage('Entry approved!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPendingData(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (type, id) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('reject-' + type + '-' + id);
    setError('');

    try {
      const endpoint = type === 'attendance'
        ? '/admin/attendance/reject/' + id
        : '/admin/gatha/reject/' + id;

      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: { 
          Authorization: 'Bearer ' + token,
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
      fetchPendingData(false);
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
      const res = await fetch(API_BASE + '/admin/approve-all', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });

      if (!res.ok) throw new Error('Bulk approval failed');

      const data = await res.json();
      setSuccessMessage('Approved ' + data.approved.attendance + ' attendance + ' + data.approved.gatha + ' gatha!');
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchPendingData(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============ NEW: USER MANAGEMENT HANDLERS ============

  const validateUserForm = (userData, isEdit = false) => {
    if (!userData.username || userData.username.trim().length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (!isEdit && (!userData.password || userData.password.length < 4)) {
      return 'Password must be at least 4 characters';
    }
    if (!userData.name || userData.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }

    // Check for duplicate username with different password requirement
    const existingUsersWithSameUsername = allUsers.filter(
      u => u.username.toLowerCase() === userData.username.toLowerCase() && 
      (!isEdit || u.id !== editingUser?.id)
    );

    if (existingUsersWithSameUsername.length > 0) {
      // Check if any existing user has the same password
      const samePassword = existingUsersWithSameUsername.find(
        u => u.password === userData.password
      );
      if (samePassword) {
        return 'A user with this username and password already exists. Please use a unique password.';
      }
    }

    return null;
  };

  const handleAddUser = async () => {
    const validationError = validateUserForm(newUser);
    if (validationError) {
      setUserFormError(validationError);
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('add-user');
    setUserFormError('');

    try {
      const res = await fetch(API_BASE + '/admin/users', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add user');
      }

      setSuccessMessage('User added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddUserModal(false);
      setNewUser({ username: '', password: '', name: '', role: 'student' });
      fetchAllUsers();
      fetchStudents();
    } catch (err) {
      setUserFormError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    const validationError = validateUserForm(editingUser, true);
    if (validationError) {
      setUserFormError(validationError);
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('update-user');
    setUserFormError('');

    try {
      const res = await fetch(API_BASE + '/admin/users/' + editingUser.id, {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: editingUser.username,
          password: editingUser.password,
          name: editingUser.name,
          role: editingUser.role,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowEditUserModal(false);
      setEditingUser(null);
      fetchAllUsers();
      fetchStudents();
    } catch (err) {
      setUserFormError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm('Are you sure you want to delete user "' + username + '"? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setActionLoading('delete-user-' + userId);

    try {
      const res = await fetch(API_BASE + '/admin/users/' + userId, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAllUsers();
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // ============ NEW: ADD ENTRY HANDLERS (Attendance/Gatha) ============

  const handleAddEntry = async () => {
    if (!addEntryData.studentUsername) {
      setError('Please select a student');
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setAddEntryLoading(true);
    setError('');

    try {
      let endpoint, body;

      if (addEntryType === 'attendance') {
        endpoint = '/admin/attendance/add';
        body = {
          username: addEntryData.studentUsername,
          date: addEntryData.date,
        };
      } else {
        if (!addEntryData.sutraName || !addEntryData.totalGatha) {
          setError('Please fill all required fields');
          setAddEntryLoading(false);
          return;
        }
        endpoint = '/admin/gatha/add';
        body = {
          username: addEntryData.studentUsername,
          date: addEntryData.date,
          sutraName: addEntryData.sutraName,
          whichGatha: addEntryData.whichGatha,
          totalGatha: parseInt(addEntryData.totalGatha),
          type: addEntryData.gathaType,
        };
      }

      const res = await fetch(API_BASE + endpoint, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add entry');
      }

      setSuccessMessage(addEntryType === 'attendance' ? 'Attendance added!' : 'Gatha added!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setShowAddEntryModal(false);
      setAddEntryData({
        studentUsername: '',
        date: formatLocalDateString(new Date()),
        sutraName: '',
        whichGatha: '',
        totalGatha: 1,
        gathaType: 'new'
      });
      fetchStudents();
      fetchPendingData(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAddEntryLoading(false);
    }
  };

  // ============ EXPORT FUNCTIONS ============
  
  const generateTextReport = () => {
    if (!exportData) return '';
    
    const { students: reportStudents, summary, topPerformers } = exportData;
    
    let report = 'JAIN PATHSHALA REPORT\n';
    report += '================================\n';
    report += 'Period: ' + formatDate(dateRange.start) + ' to ' + formatDate(dateRange.end) + '\n';
    report += 'Total Students: ' + summary.totalStudents + '\n';
    report += 'Active Students: ' + summary.activeStudents + '\n';
    report += 'Total Attendance: ' + summary.totalAttendance + '\n';
    report += 'Total New Gathas: ' + summary.totalNewGathas + '\n';
    report += 'Total Revisions: ' + summary.totalRevisionGathas + '\n';
    report += '================================\n\n';
    
    report += 'TOP PERFORMERS\n';
    report += '================================\n';
    report += '\nBy Attendance:\n';
    topPerformers.byAttendance.slice(0, 5).forEach((s, i) => {
      report += '  ' + (i + 1) + '. ' + s.name + ' - ' + s.attendanceCount + ' days\n';
    });
    
    report += '\nBy New Gathas:\n';
    topPerformers.byGatha.slice(0, 5).forEach((s, i) => {
      report += '  ' + (i + 1) + '. ' + s.name + ' - ' + s.newGathas + ' gathas\n';
    });
    
    report += '\n================================\n';
    report += 'STUDENT-WISE DETAILS (A-Z):\n';
    report += '================================\n\n';

    reportStudents.forEach((student, idx) => {
      report += (idx + 1) + '. ' + student.name + '\n';
      report += '   Attendance: ' + student.attendanceCount + ' days\n';
      report += '   New Gathas: ' + student.newGathas + '\n';
      report += '   Revisions: ' + student.revisionGathas + '\n';
      report += '   Total Score: ' + (student.attendanceCount + student.newGathas) + '\n\n';
    });

    report += '================================\n';
    report += 'Generated: ' + new Date().toLocaleString('en-IN') + '\n';
    report += 'Jai Jinendra!\n';

    return report;
  };

  const generateCSVReport = () => {
    if (!exportData) return '';
    
    const { students: reportStudents, summary } = exportData;
    
    let csv = 'Jain Pathshala Report - ' + formatDate(dateRange.start) + ' to ' + formatDate(dateRange.end) + '\n\n';
    csv += 'S.No,Name,Username,Attendance (Days),New Gathas,Revision Gathas,Total Score\n';

    reportStudents.forEach((student, index) => {
      const totalScore = student.attendanceCount + student.newGathas;
      csv += (index + 1) + ',"' + student.name + '","' + student.username + '",' + student.attendanceCount + ',' + student.newGathas + ',' + student.revisionGathas + ',' + totalScore + '\n';
    });

    csv += '\n\nSUMMARY\n';
    csv += 'Total Students,' + summary.totalStudents + '\n';
    csv += 'Active Students,' + summary.activeStudents + '\n';
    csv += 'Total Attendance,' + summary.totalAttendance + '\n';
    csv += 'Total New Gathas,' + summary.totalNewGathas + '\n';
    csv += 'Total Revision Gathas,' + summary.totalRevisionGathas + '\n';

    return csv;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2000);
    }
  };

  const shareReport = async () => {
    const report = generateTextReport();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Jain Pathshala Report',
          text: report,
        });
      } catch (err) {
        copyToClipboard(report);
      }
    } else {
      copyToClipboard(report);
    }
  };

  const downloadReport = (type) => {
    setIsExporting(true);
    
    setTimeout(() => {
      let content, filename, mimeType;
      
      if (type === 'csv') {
        content = generateCSVReport();
        filename = 'pathshala-report-' + dateRange.start + '-to-' + dateRange.end + '.csv';
        mimeType = 'text/csv';
      } else {
        content = generateTextReport();
        filename = 'pathshala-report-' + dateRange.start + '-to-' + dateRange.end + '.txt';
        mimeType = 'text/plain';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setSuccessMessage('Report downloaded!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 500);
  };

  // ============ GENERATE PDF REPORT ============
  const generatePDFReport = () => {
    if (!exportData) return;
    
    setIsExporting(true);
    
    try {
      const { students: reportStudents, summary } = exportData;
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const colors = {
        primary: [99, 102, 241],
        secondary: [168, 85, 247],
        accent: [236, 72, 153],
        success: [34, 197, 94],
        warning: [249, 115, 22],
        gold: [234, 179, 8],
        dark: [31, 41, 55],
        light: [248, 250, 252],
        white: [255, 255, 255],
      };

      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setFillColor(...colors.secondary);
      doc.rect(0, 40, pageWidth, 4, 'F');
      
      doc.setFillColor(...colors.accent);
      doc.rect(0, 44, pageWidth, 2, 'F');
      
      doc.setTextColor(...colors.white);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('JAIN PATHSHALA', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Progress Report', pageWidth / 2, 32, { align: 'center' });
      
      doc.setFillColor(...colors.gold);
      const dateText = formatDate(dateRange.start) + ' - ' + formatDate(dateRange.end);
      const dateTextWidth = doc.getTextWidth(dateText) + 16;
      doc.roundedRect((pageWidth - dateTextWidth) / 2, 50, dateTextWidth, 10, 3, 3, 'F');
      doc.setTextColor(...colors.dark);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(dateText, pageWidth / 2, 56.5, { align: 'center' });

      let yPos = 70;

      doc.setTextColor(...colors.primary);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY OVERVIEW', 14, yPos);
      
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(1);
      doc.line(14, yPos + 2, 70, yPos + 2);
      
      yPos += 12;

      const cardWidth = 43;
      const cardHeight = 28;
      const cardGap = 4;
      const cardStartX = 14;

      const summaryCards = [
        { value: summary.totalStudents, label: 'Total Students', bgColor: [239, 246, 255], borderColor: colors.primary, textColor: colors.primary },
        { value: summary.activeStudents, label: 'Active', bgColor: [240, 253, 244], borderColor: colors.success, textColor: colors.success },
        { value: summary.totalAttendance, label: 'Attendance', bgColor: [254, 249, 195], borderColor: colors.warning, textColor: colors.warning },
        { value: summary.totalNewGathas, label: 'New Gathas', bgColor: [243, 232, 255], borderColor: colors.secondary, textColor: colors.secondary },
      ];

      summaryCards.forEach((card, index) => {
        const x = cardStartX + (cardWidth + cardGap) * index;
        
        doc.setFillColor(...card.bgColor);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');
        
        doc.setDrawColor(...card.borderColor);
        doc.setLineWidth(0.8);
        doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'S');
        
        doc.setTextColor(...card.textColor);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(String(card.value), x + cardWidth / 2, yPos + 14, { align: 'center' });
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(card.label, x + cardWidth / 2, yPos + 22, { align: 'center' });
      });

      yPos += cardHeight + 15;

      doc.setTextColor(...colors.dark);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('STUDENT-WISE REPORT (A-Z)', 14, yPos);
      
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(1);
      doc.line(14, yPos + 2, 82, yPos + 2);
      
      yPos += 8;

      const tableData = reportStudents.map((student, index) => [
        index + 1,
        student.name,
        student.attendanceCount,
        student.newGathas,
        student.revisionGathas,
        student.attendanceCount + student.newGathas
      ]);

      doc.autoTable({
        startY: yPos,
        head: [['#', 'Student Name', 'Attend.', 'New', 'Revision', 'Score']],
        body: tableData,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 3,
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: colors.primary,
          textColor: colors.white,
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'center',
        },
        bodyStyles: {
          halign: 'center',
          valign: 'middle',
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 55, halign: 'left' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 20, halign: 'center' },
          5: { cellWidth: 20, halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function(data) {
          const pageCount = doc.internal.getNumberOfPages();
          const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
          
          doc.setFillColor(...colors.primary);
          doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
          
          doc.setTextColor(...colors.white);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          
          const generatedDate = new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          doc.text('Generated: ' + generatedDate, 14, pageHeight - 4);
          doc.text('Page ' + currentPage + ' of ' + pageCount, pageWidth / 2, pageHeight - 4, { align: 'center' });
          doc.setFont('helvetica', 'bold');
          doc.text('Jai Jinendra!', pageWidth - 14, pageHeight - 4, { align: 'right' });
        },
      });

      const fileName = 'Jain-Pathshala-Report-' + dateRange.start + '-to-' + dateRange.end + '.pdf';
      doc.save(fileName);
      
      setSuccessMessage('PDF Report downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('PDF generation error:', error);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // ============ COMPUTED VALUES ============
  
  const totalPending = pendingData.attendance.length + pendingData.gatha.length;

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
        return (b.new_gathas || 0) - (a.new_gathas || 0);
      } else if (sortBy === 'total') {
        const totalA = (a.attendance_count || 0) + (a.new_gathas || 0);
        const totalB = (b.attendance_count || 0) + (b.new_gathas || 0);
        return totalB - totalA;
      }
      return 0;
    });

  const filteredPendingAttendance = approvalFilter === 'gatha' ? [] : pendingData.attendance;
  const filteredPendingGatha = approvalFilter === 'attendance' ? [] : pendingData.gatha;

  const activeStudentsCount = students.filter(s => 
    (s.attendance_count || 0) + (s.new_gathas || 0) > 0
  ).length;
  
  const totalAttendanceCount = students.reduce((sum, s) => sum + (s.attendance_count || 0), 0);
  const totalNewGathaCount = students.reduce((sum, s) => sum + (s.new_gathas || 0), 0);

  const attendanceRate = students.length > 0 
    ? Math.round((stats?.today_attendance || 0) / students.length * 100)
    : 0;

  // Filter users for display
  const filteredUsers = allUsers.filter(u =>
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

    // ============ RENDER AUTO-REFRESH CONTROLS ============
  const renderAutoRefreshControls = () => (
    <div className="bg-white rounded-xl p-3 border-2 border-indigo-200 shadow-sm mb-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            autoRefresh && isOnline ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            {autoRefresh && isOnline ? (
              <RefreshCw className="w-4 h-4 text-green-600 animate-spin" style={{ animationDuration: '3s' }} />
            ) : (
              <RefreshCw className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-gray-700">Auto-Refresh</p>
              {!isOnline && (
                <span className="flex items-center gap-0.5 bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-500">
              {!isOnline ? 'No connection' : autoRefresh ? 'Next in ' + countdown + 's' : 'Disabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {autoRefresh && isOnline && (
            <select
              value={refreshInterval}
              onChange={(e) => {
                setRefreshInterval(Number(e.target.value));
                setCountdown(Number(e.target.value));
              }}
              className="text-xs bg-gray-100 border-0 rounded-lg px-2 py-1.5 font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={120}>2m</option>
              <option value={300}>5m</option>
            </select>
          )}

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            disabled={!isOnline}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              autoRefresh && isOnline ? 'bg-green-500' : 'bg-gray-300'
            } ${!isOnline ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              autoRefresh && isOnline ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>

          <button
            onClick={() => fetchPendingData(false)}
            disabled={isLoading || !isOnline}
            className={`p-2 bg-indigo-100 text-indigo-700 rounded-xl active:scale-[0.98] ${
              !isOnline ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {autoRefresh && isOnline && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000"
            style={{ width: (countdown / refreshInterval) * 100 + '%' }}
          />
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" />
          )}
          <p className="text-[10px] text-gray-400">
            Last updated: {lastRefreshed.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </p>
        </div>
        {newPendingAlert && (
          <button
            onClick={() => {
              setActiveTab('approvals');
              setNewPendingAlert(false);
            }}
            className="flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse"
          >
            <BellRing className="w-3 h-3" />
            <span className="text-[10px] font-bold">New requests!</span>
          </button>
        )}
      </div>
    </div>
  );

  // ============ RENDER DATE PICKER ============
  const renderDatePicker = () => (
    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-indigo-500" />
          Date Range
        </p>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {[
          { key: 'today', label: 'Today' },
          { key: 'week', label: 'Week' },
          { key: 'month', label: 'Month' },
          { key: 'year', label: 'Year' },
          { key: 'all', label: 'All' },
          { key: 'custom', label: 'Custom' },
        ].map((preset) => (
          <button
            key={preset.key}
            onClick={() => {
              setDatePreset(preset.key);
              if (preset.key === 'custom') {
                setShowCustomDatePicker(true);
              } else {
                setShowCustomDatePicker(false);
              }
              setShowMonthDropdown(false);
              setShowYearDropdown(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex-shrink-0 ${
              datePreset === preset.key
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 active:scale-95'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {(datePreset === 'custom' || showCustomDatePicker) && (
        <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
          <p className="text-xs font-bold text-orange-700 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Select Custom Range
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">From Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">To Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-400 bg-white"
              />
            </div>
          </div>

          <button
            onClick={() => {
              setDatePreset('custom');
              setShowCustomDatePicker(false);
            }}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold text-sm active:scale-[0.98]"
          >
            Apply Custom Range
          </button>
        </div>
      )}

      {(datePreset === 'month' || datePreset === 'year') && (
        <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
          <div className="flex gap-2">
            {datePreset === 'month' && (
              <div className="flex-1 relative" data-dropdown="month">
                <button
                  onClick={() => {
                    setShowMonthDropdown(!showMonthDropdown);
                    setShowYearDropdown(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between ${
                    showMonthDropdown 
                      ? 'border-indigo-500 bg-white shadow-lg' 
                      : 'border-indigo-200 bg-white'
                  }`}
                >
                  <span className="text-gray-800 text-xs">{MONTH_NAMES_SHORT[selectedMonth - 1]}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showMonthDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border-2 border-indigo-200 shadow-2xl z-50 max-h-48 overflow-y-auto">
                    <div className="p-1">
                      {MONTH_NAMES.map((month, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSelectedMonth(idx + 1);
                            setShowMonthDropdown(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between ${
                            selectedMonth === idx + 1
                              ? 'bg-indigo-500 text-white'
                              : 'text-gray-700 hover:bg-indigo-50'
                          }`}
                        >
                          <span>{month}</span>
                          {selectedMonth === idx + 1 && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className={datePreset === 'month' ? 'w-24' : 'flex-1'} data-dropdown="year">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowYearDropdown(!showYearDropdown);
                    setShowMonthDropdown(false);
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between ${
                    showYearDropdown 
                      ? 'border-purple-500 bg-white shadow-lg' 
                      : 'border-purple-200 bg-white'
                  }`}
                >
                  <span className="text-gray-800 text-xs">{selectedYear}</span>
                  <ChevronDown className={`w-4 h-4 text-purple-500 transition-transform ${showYearDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showYearDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border-2 border-purple-200 shadow-2xl z-50 max-h-48 overflow-y-auto">
                    <div className="p-1">
                      {getYearOptions().map((year) => (
                        <button
                          key={year}
                          onClick={() => {
                            setSelectedYear(year);
                            setShowYearDropdown(false);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between ${
                            selectedYear === year
                              ? 'bg-purple-500 text-white'
                              : 'text-gray-700 hover:bg-purple-50'
                          }`}
                        >
                          <span>{year}</span>
                          {selectedYear === year && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-2.5 border-2 border-green-200">
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="font-bold text-green-700">{formatDate(dateRange.start)}</span>
          <span className="text-green-500">→</span>
          <span className="font-bold text-green-700">{formatDate(dateRange.end)}</span>
        </div>
      </div>
    </div>
  );

  // ============ RENDER EXPORT MODAL ============
  const renderExportModal = () => {
    if (!showExportModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg">Export Report</h3>
                  <p className="text-xs opacity-80">
                    {formatDateShort(dateRange.start)} - {formatDateShort(dateRange.end)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {exportLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
              <p className="mt-4 text-gray-600">Loading report data...</p>
            </div>
          ) : exportData ? (
            <>
              <div className="p-4 bg-gray-50 border-b">
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <p className="text-xl font-bold text-indigo-600">{exportData.summary.totalStudents}</p>
                    <p className="text-xs text-gray-500">Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-600">{exportData.summary.activeStudents}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-600">{exportData.summary.totalAttendance}</p>
                    <p className="text-xs text-gray-500">Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-600">{exportData.summary.totalNewGathas}</p>
                    <p className="text-xs text-gray-500">Gathas</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3 border-t bg-white">
                <button
                  onClick={generatePDFReport}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white py-3.5 rounded-xl font-bold text-sm active:scale-[0.98] disabled:opacity-50 shadow-lg"
                >
                  {isExporting ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                  Download PDF Report
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => downloadReport('txt')}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    Text File
                  </button>
                  <button
                    onClick={() => downloadReport('csv')}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 bg-green-100 text-green-700 py-2.5 rounded-xl font-bold text-xs active:scale-[0.98] disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    CSV/Excel
                  </button>
                </div>

                <button
                  onClick={() => copyToClipboard(generateTextReport())}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 text-gray-600 py-2.5 rounded-xl font-bold text-xs active:scale-[0.98] border border-gray-200"
                >
                  {exportCopied ? (
                    <>
                      <CheckCheck className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy to Clipboard
                    </>
                  )}
                </button>

                <button
                  onClick={shareReport}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs active:scale-[0.98]"
                >
                  <Share2 className="w-4 h-4" />
                  Share Report
                </button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <AlertTriangle className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
              <p>Failed to load report data</p>
              <button
                onClick={fetchExportData}
                className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ RENDER ADD USER MODAL ============
  const renderAddUserModal = () => {
    if (!showAddUserModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                <h3 className="font-bold text-lg">Add New User</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setNewUser({ username: '', password: '', name: '', role: 'student' });
                  setUserFormError('');
                }}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {userFormError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-sm text-red-700">{userFormError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                placeholder="Enter username"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">No spaces, lowercase only</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password *</label>
              <input
                type="text"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 4 characters. Must be unique if username exists.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-400"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={handleAddUser}
              disabled={actionLoading === 'add-user'}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] disabled:opacity-50"
            >
              {actionLoading === 'add-user' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              Add User
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER EDIT USER MODAL ============
  const renderEditUserModal = () => {
    if (!showEditUserModal || !editingUser) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit3 className="w-6 h-6" />
                <h3 className="font-bold text-lg">Edit User</h3>
              </div>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setUserFormError('');
                }}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {userFormError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg">
                <p className="text-sm text-red-700">{userFormError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={editingUser.name}
                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username *</label>
              <input
                type="text"
                value={editingUser.username}
                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input
                type="text"
                value={editingUser.password || ''}
                onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                placeholder="Leave empty to keep current"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty to keep current password</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-400"
              >
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={handleUpdateUser}
              disabled={actionLoading === 'update-user'}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] disabled:opacity-50"
            >
              {actionLoading === 'update-user' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER ADD ENTRY MODAL ============
  const renderAddEntryModal = () => {
    if (!showAddEntryModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Plus className="w-6 h-6" />
                <h3 className="font-bold text-lg">Add Entry for Student</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddEntryModal(false);
                  setAddEntryData({
                    studentUsername: '',
                    date: formatLocalDateString(new Date()),
                    sutraName: '',
                    whichGatha: '',
                    totalGatha: 1,
                    gathaType: 'new'
                  });
                }}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Entry Type Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setAddEntryType('attendance')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  addEntryType === 'attendance' ? 'bg-white text-green-600 shadow' : 'text-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Attendance
              </button>
              <button
                onClick={() => setAddEntryType('gatha')}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  addEntryType === 'gatha' ? 'bg-white text-purple-600 shadow' : 'text-gray-600'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Gatha
              </button>
            </div>

            {/* Select Student */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Select Student *</label>
              <select
                value={addEntryData.studentUsername}
                onChange={(e) => setAddEntryData({ ...addEntryData, studentUsername: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
              >
                <option value="">-- Select Student --</option>
                {students.map((s) => (
                  <option key={s.username} value={s.username}>
                    {s.name} (@{s.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={addEntryData.date}
                onChange={(e) => setAddEntryData({ ...addEntryData, date: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
              />
            </div>

            {/* Gatha specific fields */}
            {addEntryType === 'gatha' && (
              <>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Gatha Type</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddEntryData({ ...addEntryData, gathaType: 'new' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${
                        addEntryData.gathaType === 'new' 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      New
                    </button>
                    <button
                      onClick={() => setAddEntryData({ ...addEntryData, gathaType: 'revision' })}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${
                        addEntryData.gathaType === 'revision' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Revision
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Sutra Name *</label>
                  <input
                    type="text"
                    value={addEntryData.sutraName}
                    onChange={(e) => setAddEntryData({ ...addEntryData, sutraName: e.target.value })}
                    placeholder="e.g., Namokar Mantra"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Which Gatha (optional)</label>
                  <input
                    type="text"
                    value={addEntryData.whichGatha}
                    onChange={(e) => setAddEntryData({ ...addEntryData, whichGatha: e.target.value })}
                    placeholder="e.g., 1-5 or specific numbers"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Total Gatha Count *</label>
                  <input
                    type="number"
                    min="1"
                    value={addEntryData.totalGatha}
                    onChange={(e) => setAddEntryData({ ...addEntryData, totalGatha: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleAddEntry}
              disabled={addEntryLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] disabled:opacity-50"
            >
              {addEntryLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {addEntryType === 'attendance' ? 'Add Attendance' : 'Add Gatha'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER FAMILY GROUPS SECTION ============
  const renderFamilyGroupsSection = () => (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-500" />
          Family Groups
        </h3>
        <button
          onClick={() => {
            setSelectedMembers([]);
            setNewGroup({ groupName: '', members: [] });
            setShowAddGroupModal(true);
          }}
          className="flex items-center gap-1 bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="bg-purple-50 rounded-xl p-3 border-2 border-purple-200">
        <p className="text-xs text-purple-700">
          💡 Family groups allow members to mark attendance and add gatha for each other without logging out.
        </p>
      </div>

      {familyGroupsLoading ? (
        <div className="text-center py-4">
          <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
        </div>
      ) : familyGroups.length === 0 ? (
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200 text-center">
          <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No family groups created yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {familyGroups.map((group) => (
            <div key={group.id} className="bg-white rounded-xl border-2 border-purple-200 p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-gray-800">{group.groupName}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {group.members.length} members
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  disabled={actionLoading === 'delete-group-' + group.id}
                  className="p-2 bg-red-100 text-red-600 rounded-lg active:scale-95"
                >
                  {actionLoading === 'delete-group-' + group.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.members.map((member) => (
                  <span
                    key={member.username}
                    className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium"
                  >
                    {member.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============ RENDER ADD GROUP MODAL ============
  const renderAddGroupModal = () => {
    if (!showAddGroupModal) return null;

    // Get students not in any group
    const studentsInGroups = familyGroups.flatMap(g => g.members.map(m => m.username));
    const availableStudents = students.filter(s => !studentsInGroups.includes(s.username));

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6" />
                <h3 className="font-bold text-lg">Create Family Group</h3>
              </div>
              <button
                onClick={() => {
                  setShowAddGroupModal(false);
                  setSelectedMembers([]);
                }}
                className="p-2 hover:bg-white/20 rounded-full"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Group Name *</label>
              <input
                type="text"
                value={newGroup.groupName}
                onChange={(e) => setNewGroup({ ...newGroup, groupName: e.target.value })}
                placeholder="e.g., Sharma Family"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Select Members * ({selectedMembers.length} selected)
              </label>
              <p className="text-xs text-gray-500 mb-2">Select at least 2 members</p>

              <div className="max-h-48 overflow-y-auto border-2 border-gray-200 rounded-xl p-2 space-y-1">
                {availableStudents.map((student) => (
                  <button
                    key={student.username}
                    onClick={() => toggleMemberSelection(student.username)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left ${
                      selectedMembers.includes(student.username)
                        ? 'bg-purple-100 border-2 border-purple-400'
                        : 'bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-800">{student.name}</span>
                    {selectedMembers.includes(student.username) && (
                      <Check className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>

              {selectedMembers.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedMembers.map(username => {
                    const student = students.find(s => s.username === username);
                    return (
                      <span
                        key={username}
                        className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                      >
                        {student?.name || username}
                        <button onClick={() => toggleMemberSelection(username)}>
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleCreateGroup}
              disabled={actionLoading === 'create-group' || selectedMembers.length < 2}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3.5 rounded-xl font-bold active:scale-[0.98] disabled:opacity-50"
            >
              {actionLoading === 'create-group' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Users className="w-5 h-5" />
              )}
              Create Group
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============ RENDER USER MANAGEMENT ============
  const renderUserManagement = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <UserCog className="w-5 h-5 text-indigo-500" />
          User Management
        </h3>
        <button
          onClick={fetchAllUsers}
          disabled={usersLoading}
          className="p-2 bg-indigo-100 text-indigo-600 rounded-xl active:scale-[0.98]"
        >
          <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Render Family Groups Here */}
      {renderFamilyGroupsSection()}
      
      {/* Render Add Group Modal Here */}
      {renderAddGroupModal()}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-xl font-bold active:scale-[0.98] shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
        <button
          onClick={() => setShowAddEntryModal(true)}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold active:scale-[0.98] shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Entry
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl p-3 border-2 border-indigo-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-xl p-3 border-2 border-blue-200 text-center">
          <p className="text-xl font-bold text-blue-600">{allUsers.length}</p>
          <p className="text-xs text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-xl p-3 border-2 border-green-200 text-center">
          <p className="text-xl font-bold text-green-600">{allUsers.filter(u => u.role === 'student').length}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
        <div className="bg-white rounded-xl p-3 border-2 border-purple-200 text-center">
          <p className="text-xl font-bold text-purple-600">{allUsers.filter(u => u.role === 'admin').length}</p>
          <p className="text-xs text-gray-500">Admins</p>
        </div>
      </div>

      {/* Users List */}
      {usersLoading ? (
        <div className="bg-white rounded-xl p-8 border-2 border-indigo-200 text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((u) => (
            <div key={u.id} className="bg-white rounded-xl border-2 border-indigo-200 p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800 text-sm truncate">{u.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      u.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>@{u.username}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Key className="w-3 h-3" />
                      {showPasswords[u.id] ? (
                        <span className="font-mono bg-gray-100 px-1 rounded">{u.password}</span>
                      ) : (
                        <span>••••••</span>
                      )}
                      <button
                        onClick={() => togglePasswordVisibility(u.id)}
                        className="p-0.5 hover:bg-gray-100 rounded"
                      >
                        {showPasswords[u.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 ml-2">
                  <button
                    onClick={() => {
                      setEditingUser({ ...u, password: '' });
                      setShowEditUserModal(true);
                    }}
                    className="p-2 bg-blue-100 text-blue-600 rounded-lg active:scale-95"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id, u.username)}
                    disabled={actionLoading === 'delete-user-' + u.id || u.role === 'admin'}
                    className="p-2 bg-red-100 text-red-600 rounded-lg active:scale-95 disabled:opacity-50"
                  >
                    {actionLoading === 'delete-user-' + u.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-xl p-8 border-2 border-gray-200 text-center">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ============ RENDER OVERVIEW ============
  const renderOverview = () => (
    <div className="space-y-4">
      {renderAutoRefreshControls()}

      {newPendingAlert && (
        <button
          onClick={() => {
            setActiveTab('approvals');
            setNewPendingAlert(false);
          }}
          className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 rounded-xl flex items-center justify-between animate-pulse"
        >
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5" />
            <span className="font-bold text-sm">New pending requests!</span>
          </div>
          <span className="bg-white text-red-500 px-2 py-1 rounded-lg text-xs font-bold">
            View Now
          </span>
        </button>
      )}

      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <span className="font-bold">Today's Summary</span>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/20 backdrop-blur rounded-xl p-2.5 text-center">
            <UserCheck className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats?.today_attendance || 0}</p>
            <p className="text-xs opacity-80">Present</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-2.5 text-center">
            <Users className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{students.length}</p>
            <p className="text-xs opacity-80">Students</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-xl p-2.5 text-center">
            <Clock className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalPending}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
        </div>
      </div>

      {renderDatePicker()}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-3 border-2 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Users className="w-6 h-6 text-blue-500" />
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
              {activeStudentsCount} active
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
          <p className="text-xs text-gray-500">Total Students</p>
        </div>

        <div className="bg-white rounded-xl p-3 border-2 border-green-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <Target className="w-6 h-6 text-green-500" />
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
              attendanceRate >= 70 ? 'bg-green-100 text-green-700' :
              attendanceRate >= 40 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {attendanceRate}%
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats?.today_attendance || 0}/{students.length}</p>
          <p className="text-xs text-gray-500">Today's Attendance</p>
        </div>

        <div className="bg-white rounded-xl p-3 border-2 border-purple-200 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <BookOpen className="w-6 h-6 text-purple-500" />
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full font-bold">
              New
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalNewGathaCount}</p>
          <p className="text-xs text-gray-500">New Gathas (Range)</p>
        </div>

        <button
          onClick={() => setActiveTab('approvals')}
          className="bg-white rounded-xl p-3 border-2 border-yellow-200 shadow-sm text-left relative overflow-hidden active:scale-[0.98]"
        >
          {totalPending > 0 && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400 transform rotate-45 translate-x-8 -translate-y-8"></div>
          )}
          <div className="flex items-center justify-between mb-1">
            <Clock className="w-6 h-6 text-yellow-500" />
            {totalPending > 0 && (
              <Zap className="w-4 h-4 text-yellow-600 animate-pulse relative z-10" />
            )}
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalPending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </button>
      </div>

      <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Top Performers
          </h3>
          <button
            onClick={() => setActiveTab('analytics')}
            className="text-xs text-indigo-600 font-bold"
          >
            View All
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="relative bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-3 overflow-hidden">
            <div className="absolute top-1 right-1 text-2xl">🏆</div>
            <p className="text-xs font-bold text-yellow-800 mb-0.5">Attendance</p>
            <p className="text-sm font-bold text-gray-800 truncate pr-6">
              {topStudents.topAttendance?.[0]?.name || 'N/A'}
            </p>
            <p className="text-xs font-bold text-yellow-700 mt-1">
              {topStudents.topAttendance?.[0]?.count || 0} days
            </p>
          </div>

          <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 overflow-hidden">
            <div className="absolute top-1 right-1 text-2xl">📚</div>
            <p className="text-xs font-bold text-purple-800 mb-0.5">New Gatha</p>
            <p className="text-sm font-bold text-gray-800 truncate pr-6">
              {topStudents.topGatha?.[0]?.name || 'N/A'}
            </p>
            <p className="text-xs font-bold text-purple-700 mt-1">
              {topStudents.topGatha?.[0]?.count || 0} new
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveTab('students')}
          className="flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-blue-200 shadow-sm active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">Students</p>
            <p className="text-xs text-gray-500">View all</p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className="flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-purple-200 shadow-sm active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <UserCog className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">Manage Users</p>
            <p className="text-xs text-gray-500">Add/Edit</p>
          </div>
        </button>
      </div>
    </div>
  );

  // ============ RENDER APPROVALS ============
  const renderApprovals = () => (
    <div className="space-y-4">
      {renderAutoRefreshControls()}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Pending Approvals</h3>
      </div>

      {totalPending > 0 && (
        <button
          onClick={handleApproveAll}
          disabled={actionLoading === 'approve-all'}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl active:scale-[0.98] font-bold shadow-lg"
        >
          <Check className="w-5 h-5" />
          {actionLoading === 'approve-all' ? 'Approving...' : 'Approve All (' + totalPending + ')'}
        </button>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'all', label: 'All (' + totalPending + ')' },
          { key: 'attendance', label: 'Attend (' + pendingData.attendance.length + ')' },
          { key: 'gatha', label: 'Gatha (' + pendingData.gatha.length + ')' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setApprovalFilter(filter.key)}
            className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              approvalFilter === filter.key ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

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
          {filteredPendingAttendance.map((item) => (
            <div key={'att-' + item.id} className="bg-white border-2 border-yellow-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="font-bold text-gray-800 text-sm truncate">{item.student_name || item.username}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">{formatDate(item.date)}</p>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove('attendance', item.id)}
                    disabled={actionLoading === 'approve-attendance-' + item.id}
                    className="p-2.5 bg-green-500 text-white rounded-xl active:scale-95"
                  >
                    {actionLoading === 'approve-attendance-' + item.id ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleReject('attendance', item.id)}
                    disabled={actionLoading === 'reject-attendance-' + item.id}
                    className="p-2.5 bg-red-500 text-white rounded-xl active:scale-95"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredPendingGatha.map((item) => (
            <div key={'gatha-' + item.id} className="bg-white border-2 border-purple-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="font-bold text-gray-800 text-sm truncate">{item.student_name || item.username}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      item.type === 'new' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {item.type === 'new' ? 'New' : 'Rev'}
                    </span>
                  </div>
                  <div className="ml-6 text-xs text-gray-600 space-y-0.5">
                    <p className="truncate">{item.sutra_name}</p>
                    <p>#{item.total_gatha} gathas</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleApprove('gatha', item.id)}
                    disabled={actionLoading === 'approve-gatha-' + item.id}
                    className="p-2 bg-green-500 text-white rounded-lg active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject('gatha', item.id)}
                    disabled={actionLoading === 'reject-gatha-' + item.id}
                    className="p-2 bg-red-500 text-white rounded-lg active:scale-95"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ============ RENDER STUDENTS LIST ============
  const renderStudentsList = () => (
    <div className="space-y-3">
      <div className="bg-white rounded-xl p-3 border-2 border-indigo-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 text-sm"
          />
        </div>
      </div>

      {renderDatePicker()}

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {['all', 'active', 'inactive'].map((filter) => (
          <button
            key={filter}
            onClick={() => setStudentFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              studentFilter === filter
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {filter === 'all' ? 'All (' + students.length + ')' : 
             filter === 'active' ? 'Active (' + activeStudentsCount + ')' :
             'Inactive (' + (students.length - activeStudentsCount) + ')'}
          </button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'name', label: 'A-Z' },
          { key: 'attendance', label: 'Attendance' },
          { key: 'gatha', label: 'Gatha' },
          { key: 'total', label: 'Score' },
        ].map((option) => (
          <button
            key={option.key}
            onClick={() => setSortBy(option.key)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold ${
              sortBy === option.key ? 'bg-white text-gray-800 shadow' : 'text-gray-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-600 font-semibold">
        {filteredStudents.length} students
      </p>

      <div className="space-y-2">
        {filteredStudents.map((student, index) => {
          const newGathas = student.new_gathas || 0;
          const badge = getPerformanceBadge(student.attendance_count, newGathas);
          
          return (
            <div key={student.id} className="bg-white rounded-xl border-2 border-indigo-200 overflow-hidden shadow-sm">
              <button
                onClick={() => {
                  setViewingStudentProfile(student.username);
                }}
                className="w-full p-3 text-left active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className={'w-10 h-10 bg-gradient-to-br ' + badge.color + ' rounded-full flex items-center justify-center text-lg shadow'}>
                        {badge.icon}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-white text-xs font-bold px-1 rounded-full border text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                      <span className={'inline-block text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r ' + badge.color + ' text-white font-bold'}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-base font-bold text-green-600">{student.attendance_count || 0}</p>
                      <p className="text-xs text-gray-400">Att</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-purple-600">{newGathas}</p>
                      <p className="text-xs text-gray-400">New</p>
                    </div>
                  </div>
                </div>
              </button>

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

  // ============ RENDER ANALYTICS ============
  const renderAnalytics = () => (
    <div className="space-y-4">
      {renderDatePicker()}

      <button
        onClick={() => { fetchStudents(); fetchTopStudents(); }}
        className="w-full bg-indigo-500 text-white py-2.5 rounded-xl active:scale-[0.98] text-sm font-bold flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-3 text-white shadow-lg">
          <Calendar className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{totalAttendanceCount}</p>
          <p className="text-xs opacity-80">Attendance</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-3 text-white shadow-lg">
          <Star className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{totalNewGathaCount}</p>
          <p className="text-xs opacity-80">New Gathas</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl p-3 text-white shadow-lg">
          <Award className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{totalAttendanceCount + totalNewGathaCount}</p>
          <p className="text-xs opacity-80">Total Score</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-3 text-white shadow-lg">
          <Users className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{activeStudentsCount}</p>
          <p className="text-xs opacity-80">Active Students</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 border-2 border-green-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Top 5 - Attendance</h3>
        <div className="space-y-1.5">
          {topStudents.topAttendance?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4', '5'];
            return (
              <div key={student.username} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{medals[index]}</span>
                  <span className="font-semibold text-gray-800 text-sm">{student.name}</span>
                </div>
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold text-xs">
                  {student.count} days
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl p-3 border-2 border-purple-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">Top 5 - New Gathas</h3>
        <div className="space-y-1.5">
          {topStudents.topGatha?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4', '5'];
            return (
              <div key={student.username} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{medals[index]}</span>
                  <span className="font-semibold text-gray-800 text-sm">{student.name}</span>
                </div>
                <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold text-xs">
                  {student.count} gathas
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ============ MAIN RETURN ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 pb-20">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-3 mb-3 border-4 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">{user.name}</h2>
                <p className="text-xs text-indigo-600 font-semibold">Admin Panel</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 bg-red-100 text-red-600 px-2.5 py-1.5 rounded-xl active:scale-[0.98] text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-xl mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 flex-1">{error}</p>
            <button onClick={() => setError('')}>
              <CloseIcon className="w-4 h-4 text-red-500" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-2.5 rounded-xl mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700 font-semibold">{successMessage}</p>
          </div>
        )}

        {activeTab === 'overview' && !viewingStudentProfile && renderOverview()}
        {activeTab === 'approvals' && !viewingStudentProfile && renderApprovals()}
        {activeTab === 'students' && !viewingStudentProfile && renderStudentsList()}
        {activeTab === 'analytics' && !viewingStudentProfile && renderAnalytics()}
        {activeTab === 'users' && !viewingStudentProfile && renderUserManagement()}

        {activeTab === 'bulk-attendance' && !viewingStudentProfile && (
          <BulkAttendance students={students} familyGroups={familyGroups}
            onSuccess={() => { fetchStudents(); fetchPendingData(false); }} />
        )}
        {activeTab === 'bulk-gatha' && !viewingStudentProfile && (
          <BulkGatha students={students} familyGroups={familyGroups}
            onSuccess={() => { fetchStudents(); fetchPendingData(false); }} />
        )}
        {activeTab === 'register' && !viewingStudentProfile && (
          <AttendanceRegister />
        )}

        {viewingStudentProfile && (
          <StudentProfile
            username={viewingStudentProfile}
            onBack={() => setViewingStudentProfile(null)}
            onAddAttendance={(u) => {
              setAddEntryData({ ...addEntryData, studentUsername: u });
              setAddEntryType('attendance');
              setShowAddEntryModal(true);
            }}
            onAddGatha={(u) => {
              setAddEntryData({ ...addEntryData, studentUsername: u });
              setAddEntryType('gatha');
              setShowAddEntryModal(true);
            }}
          />
        )}

        {renderExportModal()}
        {renderAddUserModal()}
        {renderEditUserModal()}
        {renderAddEntryModal()}

        {/* More Menu Overlay */}
        {showMoreMenu && (
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowMoreMenu(false)}>
            <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-3xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
              <p className="text-sm font-bold text-gray-700 mb-3">More Options</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'bulk-attendance', icon: ClipboardList, label: 'Bulk Attend.', color: 'bg-green-100 text-green-600' },
                  { key: 'bulk-gatha', icon: BookOpen, label: 'Bulk Gatha', color: 'bg-purple-100 text-purple-600' },
                  { key: 'register', icon: LayoutGrid, label: 'Register', color: 'bg-blue-100 text-blue-600' },
                  { key: 'users', icon: UserCog, label: 'Users', color: 'bg-orange-100 text-orange-600' },
                  { key: 'analytics', icon: TrendingUp, label: 'Analytics', color: 'bg-pink-100 text-pink-600' },
                ].map(item => (
                  <button key={item.key} onClick={() => { setActiveTab(item.key); setShowMoreMenu(false); setViewingStudentProfile(null); }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl active:scale-95 transition-all">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation - 5 Tabs */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-200 p-2 shadow-2xl z-40">
          <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
            {[
              { key: 'overview', icon: BarChart3, label: 'Home' },
              { key: 'students', icon: Users, label: 'Students' },
              { key: 'bulk-attendance', icon: ClipboardList, label: 'Bulk' },
              { key: 'approvals', icon: Clock, label: 'Pending', badge: totalPending, alert: newPendingAlert },
              { key: 'more', icon: Menu, label: 'More' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === 'more') {
                    setShowMoreMenu(!showMoreMenu);
                  } else {
                    setActiveTab(tab.key);
                    setShowMoreMenu(false);
                    setViewingStudentProfile(null);
                  }
                }}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  tab.key === 'more'
                    ? (showMoreMenu ? 'bg-indigo-500 text-white' : 'text-gray-500')
                    : activeTab === tab.key
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-500'
                } ${tab.alert ? 'animate-pulse' : ''}`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px]">{tab.label}</span>
                {tab.badge > 0 && (
                  <span className={`absolute -top-1 -right-1 w-5 h-5 text-white text-[10px] font-bold rounded-full flex items-center justify-center ${
                    tab.alert ? 'bg-red-500 animate-bounce' : 'bg-red-500'
                  }`}>
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes slide-up {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
}
