import React, { useState, useEffect, useCallback, useRef } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
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
  ChevronUp,
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
  Filter,
  Bell,
  BellRing,
  Wifi,
  WifiOff,
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
  
  return Object.values(grouped).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );
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
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
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
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [topStudents, setTopStudents] = useState({ topAttendance: [], topGatha: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);
  const [studentFilter, setStudentFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [detailLoading, setDetailLoading] = useState(false);

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
        body: `${count} new pending request${count > 1 ? 's' : ''}!`,
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

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Clear new pending alert when viewing approvals tab
  useEffect(() => {
    if (activeTab === 'approvals') {
      setNewPendingAlert(false);
    }
  }, [activeTab]);

  // ============ FETCH FUNCTIONS ============

  // Fetch pending data with new item detection
  const fetchPendingData = useCallback(async (isAutoRefresh = false) => {
    const token = localStorage.getItem('jainPathshalaToken');
    
    if (!isAutoRefresh) {
      setIsLoading(true);
    }

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

      const newTotalPending = pending.attendance.length + pending.gatha.length;
      
      // Check if there are new pending items (skip on first load)
      if (!isFirstLoad.current && isAutoRefresh && newTotalPending > previousPendingCount.current) {
        const newCount = newTotalPending - previousPendingCount.current;
        setNewPendingAlert(true);
        playNotificationSound();
        showBrowserNotification(newCount);
        
        // Vibrate on mobile if supported
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

  // Fetch students with stats
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
        `${API_BASE}/admin/top-students?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=5&gathaType=new`,
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

  // Fetch student detail
  const fetchStudentDetail = useCallback(async (studentId) => {
    const token = localStorage.getItem('jainPathshalaToken');
    setDetailLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/student/${studentId}/activity?startDate=${dateRange.start}&endDate=${dateRange.end}&limit=500`,
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

  // Fetch export data from API
  const fetchExportData = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setExportLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/admin/export-report?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  // ============ AUTO-REFRESH EFFECT ============
  
  useEffect(() => {
    // Clear existing timers
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Initial fetch
    fetchPendingData(false);

    if (autoRefresh && isOnline) {
      // Set up interval for auto-refresh
      refreshTimerRef.current = setInterval(() => {
        fetchPendingData(true);
      }, refreshInterval * 1000);

      // Countdown timer
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

  // Fetch students and top students when date range changes
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

  // Fetch export data when modal opens
  useEffect(() => {
    if (showExportModal) {
      fetchExportData();
    }
  }, [showExportModal, fetchExportData]);

  // ============ HANDLERS ============
  
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
      const res = await fetch(`${API_BASE}/admin/approve-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Bulk approval failed');

      const data = await res.json();
      setSuccessMessage(`✅ Approved ${data.approved.attendance} attendance + ${data.approved.gatha} gatha!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      fetchPendingData(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ============ EXPORT FUNCTIONS ============
  
  const generateTextReport = () => {
    if (!exportData) return '';
    
    const { students: reportStudents, summary, topPerformers } = exportData;
    
    let report = `📊 JAIN PATHSHALA REPORT\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📅 Period: ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}\n`;
    report += `👥 Total Students: ${summary.totalStudents}\n`;
    report += `✅ Active Students: ${summary.activeStudents}\n`;
    report += `📈 Total Attendance: ${summary.totalAttendance}\n`;
    report += `✨ Total New Gathas: ${summary.totalNewGathas}\n`;
    report += `🔄 Total Revisions: ${summary.totalRevisionGathas}\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    report += `🏆 TOP PERFORMERS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `\n📅 By Attendance:\n`;
    topPerformers.byAttendance.slice(0, 5).forEach((s, i) => {
      report += `  ${i + 1}. ${s.name} - ${s.attendanceCount} days\n`;
    });
    
    report += `\n✨ By New Gathas:\n`;
    topPerformers.byGatha.slice(0, 5).forEach((s, i) => {
      report += `  ${i + 1}. ${s.name} - ${s.newGathas} gathas\n`;
    });
    
    report += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `STUDENT-WISE DETAILS (A-Z):\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    reportStudents.forEach((student, idx) => {
      report += `${idx + 1}. ${student.name}\n`;
      report += `   📅 Attendance: ${student.attendanceCount} days\n`;
      report += `   ✨ New Gathas: ${student.newGathas}\n`;
      report += `   🔄 Revisions: ${student.revisionGathas}\n`;
      report += `   ⭐ Total Score: ${student.attendanceCount + student.newGathas}\n\n`;
    });

    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Generated: ${new Date().toLocaleString('en-IN')}\n`;
    report += `Jai Jinendra! 🙏\n`;

    return report;
  };

  const generateCSVReport = () => {
    if (!exportData) return '';
    
    const { students: reportStudents, summary } = exportData;
    
    let csv = `Jain Pathshala Report - ${formatDate(dateRange.start)} to ${formatDate(dateRange.end)}\n\n`;
    csv += `S.No,Name,Username,Attendance (Days),New Gathas,Revision Gathas,Total Score\n`;

    reportStudents.forEach((student, index) => {
      const totalScore = student.attendanceCount + student.newGathas;
      csv += `${index + 1},"${student.name}","${student.username}",${student.attendanceCount},${student.newGathas},${student.revisionGathas},${totalScore}\n`;
    });

    csv += `\n\nSUMMARY\n`;
    csv += `Total Students,${summary.totalStudents}\n`;
    csv += `Active Students,${summary.activeStudents}\n`;
    csv += `Total Attendance,${summary.totalAttendance}\n`;
    csv += `Total New Gathas,${summary.totalNewGathas}\n`;
    csv += `Total Revision Gathas,${summary.totalRevisionGathas}\n`;

    return csv;
  };

 // ============ GENERATE ATTRACTIVE PDF (FIXED) ============
const generatePDFReport = () => {
  if (!exportData) return;
  
  setIsExporting(true);
  
  try {
    const { students: reportStudents, summary, topPerformers } = exportData;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // ===== COLOR PALETTE (Pathshala Theme) =====
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

    // ===== HEADER SECTION =====
    // Main header background
    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Accent stripe
    doc.setFillColor(...colors.secondary);
    doc.rect(0, 40, pageWidth, 4, 'F');
    
    // Sub accent stripe
    doc.setFillColor(...colors.accent);
    doc.rect(0, 44, pageWidth, 2, 'F');
    
    // Decorative circles
    doc.setFillColor(255, 255, 255);
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    doc.circle(180, 10, 25, 'F');
    doc.circle(30, 35, 15, 'F');
    doc.setGState(new doc.GState({ opacity: 1 }));
    
    // Main Title
    doc.setTextColor(...colors.white);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('JAIN PATHSHALA', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Progress Report', pageWidth / 2, 32, { align: 'center' });
    
    // Date Range Badge
    doc.setFillColor(...colors.gold);
    const dateText = `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
    const dateTextWidth = doc.getTextWidth(dateText) + 16;
    doc.roundedRect((pageWidth - dateTextWidth) / 2, 50, dateTextWidth, 10, 3, 3, 'F');
    doc.setTextColor(...colors.dark);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(dateText, pageWidth / 2, 56.5, { align: 'center' });

    let yPos = 70;

    // ===== SUMMARY SECTION =====
    doc.setTextColor(...colors.primary);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY OVERVIEW', 14, yPos);
    
    // Underline
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 70, yPos + 2);
    
    yPos += 12;

    // Summary Cards
    const cardWidth = 43;
    const cardHeight = 28;
    const cardGap = 4;
    const cardStartX = 14;

    const summaryCards = [
      { 
        value: summary.totalStudents, 
        label: 'Total Students', 
        bgColor: [239, 246, 255], 
        borderColor: colors.primary,
        textColor: colors.primary 
      },
      { 
        value: summary.activeStudents, 
        label: 'Active', 
        bgColor: [240, 253, 244], 
        borderColor: colors.success,
        textColor: colors.success 
      },
      { 
        value: summary.totalAttendance, 
        label: 'Attendance', 
        bgColor: [254, 249, 195], 
        borderColor: colors.warning,
        textColor: colors.warning 
      },
      { 
        value: summary.totalNewGathas, 
        label: 'New Gathas', 
        bgColor: [243, 232, 255], 
        borderColor: colors.secondary,
        textColor: colors.secondary 
      },
    ];

    summaryCards.forEach((card, index) => {
      const x = cardStartX + (cardWidth + cardGap) * index;
      
      // Card background
      doc.setFillColor(...card.bgColor);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card border
      doc.setDrawColor(...card.borderColor);
      doc.setLineWidth(0.8);
      doc.roundedRect(x, yPos, cardWidth, cardHeight, 3, 3, 'S');
      
      // Value
      doc.setTextColor(...card.textColor);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(String(card.value), x + cardWidth / 2, yPos + 14, { align: 'center' });
      
      // Label
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + cardWidth / 2, yPos + 22, { align: 'center' });
    });

    yPos += cardHeight + 15;

    // ===== TOP PERFORMERS SECTION =====
    doc.setTextColor(...colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP PERFORMERS', 14, yPos);
    
    doc.setDrawColor(...colors.gold);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 58, yPos + 2);
    
    yPos += 10;

    const perfCardWidth = 88;
    const perfCardHeight = 38;

    // Top Attendance Card
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, yPos, perfCardWidth, perfCardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.warning);
    doc.setLineWidth(0.8);
    doc.roundedRect(14, yPos, perfCardWidth, perfCardHeight, 4, 4, 'S');
    
    // Header stripe
    doc.setFillColor(...colors.warning);
    doc.roundedRect(14, yPos, perfCardWidth, 10, 4, 4, 'F');
    doc.rect(14, yPos + 6, perfCardWidth, 4, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP ATTENDANCE', 14 + perfCardWidth / 2, yPos + 7, { align: 'center' });
    
    // Medal positions
    const medalLabels = ['1st', '2nd', '3rd'];
    
    topPerformers.byAttendance.slice(0, 3).forEach((s, i) => {
      const rowY = yPos + 16 + (i * 8);
      
      // Position badge
      doc.setFillColor(i === 0 ? [254, 240, 138] : i === 1 ? [229, 231, 235] : [253, 186, 116]);
      doc.circle(20, rowY, 3, 'F');
      
      // Position number
      doc.setTextColor(...colors.dark);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), 20, rowY + 1.5, { align: 'center' });
      
      // Name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const displayName = s.name.length > 14 ? s.name.substring(0, 14) + '...' : s.name;
      doc.text(displayName, 26, rowY + 1);
      
      // Count badge
      doc.setFillColor(...colors.warning);
      doc.roundedRect(72, rowY - 3, 22, 6, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(s.attendanceCount + ' days', 83, rowY + 1, { align: 'center' });
    });

    // Top Gathas Card
    doc.setFillColor(250, 245, 255);
    doc.roundedRect(108, yPos, perfCardWidth, perfCardHeight, 4, 4, 'F');
    doc.setDrawColor(...colors.secondary);
    doc.setLineWidth(0.8);
    doc.roundedRect(108, yPos, perfCardWidth, perfCardHeight, 4, 4, 'S');
    
    // Header stripe
    doc.setFillColor(...colors.secondary);
    doc.roundedRect(108, yPos, perfCardWidth, 10, 4, 4, 'F');
    doc.rect(108, yPos + 6, perfCardWidth, 4, 'F');
    
    doc.setTextColor(...colors.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOP NEW GATHAS', 108 + perfCardWidth / 2, yPos + 7, { align: 'center' });
    
    topPerformers.byGatha.slice(0, 3).forEach((s, i) => {
      const rowY = yPos + 16 + (i * 8);
      
      // Position badge
      doc.setFillColor(i === 0 ? [254, 240, 138] : i === 1 ? [229, 231, 235] : [253, 186, 116]);
      doc.circle(114, rowY, 3, 'F');
      
      // Position number
      doc.setTextColor(...colors.dark);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(String(i + 1), 114, rowY + 1.5, { align: 'center' });
      
      // Name
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const displayName = s.name.length > 14 ? s.name.substring(0, 14) + '...' : s.name;
      doc.text(displayName, 120, rowY + 1);
      
      // Count badge
      doc.setFillColor(...colors.secondary);
      doc.roundedRect(166, rowY - 3, 22, 6, 2, 2, 'F');
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(s.newGathas + ' new', 177, rowY + 1, { align: 'center' });
    });

    yPos += perfCardHeight + 12;

    // ===== STUDENT TABLE SECTION =====
    doc.setTextColor(...colors.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT-WISE REPORT (A-Z)', 14, yPos);
    
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(1);
    doc.line(14, yPos + 2, 82, yPos + 2);
    
    yPos += 8;

    // Prepare table data without special characters
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
      didParseCell: function(data) {
        if (data.section === 'body') {
          // Attendance column - Green
          if (data.column.index === 2 && data.cell.raw > 0) {
            data.cell.styles.textColor = colors.success;
            data.cell.styles.fontStyle = 'bold';
          }
          // New Gathas column - Purple
          if (data.column.index === 3 && data.cell.raw > 0) {
            data.cell.styles.textColor = colors.secondary;
            data.cell.styles.fontStyle = 'bold';
          }
          // Revision column - Blue
          if (data.column.index === 4 && data.cell.raw > 0) {
            data.cell.styles.textColor = [59, 130, 246];
            data.cell.styles.fontStyle = 'bold';
          }
          // Score column - Orange/Gold
          if (data.column.index === 5) {
            data.cell.styles.textColor = colors.warning;
            data.cell.styles.fontStyle = 'bold';
            if (data.cell.raw >= 20) {
              data.cell.styles.fillColor = [254, 249, 195];
            }
            if (data.cell.raw >= 30) {
              data.cell.styles.fillColor = [254, 240, 138];
            }
          }
          // Zero values - Gray
          if (data.cell.raw === 0) {
            data.cell.styles.textColor = [180, 180, 180];
          }
        }
      },
      didDrawPage: function(data) {
        const pageCount = doc.internal.getNumberOfPages();
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        
        // Footer background
        doc.setFillColor(...colors.primary);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        
        // Accent line
        doc.setFillColor(...colors.secondary);
        doc.rect(0, pageHeight - 12, pageWidth, 1.5, 'F');
        
        // Footer text
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

    // ===== LEGEND SECTION (after table) =====
    const finalY = doc.lastAutoTable.finalY + 8;
    
    if (finalY < pageHeight - 40) {
      // Legend box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, finalY, pageWidth - 28, 18, 3, 3, 'F');
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.roundedRect(14, finalY, pageWidth - 28, 18, 3, 3, 'S');
      
      doc.setTextColor(...colors.dark);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('LEGEND:', 18, finalY + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      // Legend items
      const legendItems = [
        { color: colors.success, text: 'Attend. = Days Present' },
        { color: colors.secondary, text: 'New = New Gathas' },
        { color: [59, 130, 246], text: 'Revision = Practice' },
        { color: colors.warning, text: 'Score = Attend. + New' },
      ];
      
      legendItems.forEach((item, i) => {
        const x = 18 + (i * 45);
        const y = finalY + 13;
        
        // Colored dot
        doc.setFillColor(...item.color);
        doc.circle(x, y, 1.5, 'F');
        
        // Text
        doc.setTextColor(80, 80, 80);
        doc.text(item.text, x + 4, y + 1);
      });
    }

    // Save the PDF
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
              {!isOnline ? 'No connection' : autoRefresh ? `Next in ${countdown}s` : 'Disabled'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Interval Selector */}
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

          {/* Toggle Button */}
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

          {/* Manual Refresh */}
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

      {/* Progress Bar */}
      {autoRefresh && isOnline && (
        <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000"
            style={{ width: `${(countdown / refreshInterval) * 100}%` }}
          />
        </div>
      )}

      {/* Last Refreshed */}
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

  // ============ RENDER EXPORT MODAL ============
  const renderExportModal = () => {
    if (!showExportModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="bg-white w-full max-h-[90vh] rounded-t-3xl sm:rounded-2xl sm:max-w-md overflow-hidden animate-slide-up">
          {/* Header */}
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
              {/* Summary Stats */}
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
                    <p className="text-xs text-gray-500">📅 Days</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-600">{exportData.summary.totalNewGathas}</p>
                    <p className="text-xs text-gray-500">✨ Gathas</p>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-60 overflow-y-auto p-4">
                <p className="text-xs font-bold text-gray-600 mb-2">📋 Preview (Alphabetical)</p>
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-indigo-100">
                      <tr>
                        <th className="py-2 px-2 text-left text-xs font-bold text-indigo-700">#</th>
                        <th className="py-2 px-2 text-left text-xs font-bold text-indigo-700">Name</th>
                        <th className="py-2 px-2 text-center text-xs font-bold text-indigo-700">📅</th>
                        <th className="py-2 px-2 text-center text-xs font-bold text-indigo-700">✨</th>
                        <th className="py-2 px-2 text-center text-xs font-bold text-indigo-700">⭐</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.students.slice(0, 10).map((student, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-2 text-xs text-gray-500">{idx + 1}</td>
                          <td className="py-2 px-2 text-xs font-medium text-gray-800 truncate max-w-[100px]">
                            {student.name}
                          </td>
                          <td className="py-2 px-2 text-center text-xs font-bold text-green-600">
                            {student.attendanceCount}
                          </td>
                          <td className="py-2 px-2 text-center text-xs font-bold text-purple-600">
                            {student.newGathas}
                          </td>
                          <td className="py-2 px-2 text-center text-xs font-bold text-orange-600">
                            {student.attendanceCount + student.newGathas}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {exportData.students.length > 10 && (
                    <p className="text-center text-xs text-gray-400 py-2">
                      +{exportData.students.length - 10} more students...
                    </p>
                  )}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="p-4 space-y-3 border-t bg-white">
                {/* PDF Button - Primary */}
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
                  📄 Download PDF Report
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
      
      {/* Quick Presets - Scrollable on mobile */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
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

      {/* Custom Date Range Picker */}
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

      {/* Month/Year Selection (for month/year presets) */}
      {(datePreset === 'month' || datePreset === 'year') && (
        <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
          <div className="flex gap-2">
            {/* Month Dropdown */}
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

            {/* Year Dropdown */}
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

      {/* Selected Range Display */}
      <div className="mt-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-2.5 border-2 border-green-200">
        <div className="flex items-center justify-center gap-2 text-xs">
          <span className="font-bold text-green-700">{formatDate(dateRange.start)}</span>
          <span className="text-green-500">→</span>
          <span className="font-bold text-green-700">{formatDate(dateRange.end)}</span>
        </div>
      </div>
    </div>
  );

    // ============ RENDER OVERVIEW ============
  const renderOverview = () => (
    <div className="space-y-4">
      {/* Auto-Refresh Controls */}
      {renderAutoRefreshControls()}

      {/* New Pending Alert Banner */}
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
            View Now →
          </span>
        </button>
      )}

      {/* Today's Summary Card */}
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

      {/* Date Picker with Export */}
      {renderDatePicker()}

      {/* Quick Stats Grid */}
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
              ✨ New
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
          <p className="text-xs text-gray-500">Pending →</p>
        </button>
      </div>

      {/* Top Performers */}
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
            View All →
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
            <p className="text-xs font-bold text-purple-800 mb-0.5">✨ New Gatha</p>
            <p className="text-sm font-bold text-gray-800 truncate pr-6">
              {topStudents.topGatha?.[0]?.name || 'N/A'}
            </p>
            <p className="text-xs font-bold text-purple-700 mt-1">
              {topStudents.topGatha?.[0]?.count || 0} new
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation */}
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
          onClick={() => setActiveTab('analytics')}
          className="flex items-center gap-3 bg-white rounded-xl p-3 border-2 border-green-200 shadow-sm active:scale-[0.98]"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 text-sm">Analytics</p>
            <p className="text-xs text-gray-500">Reports</p>
          </div>
        </button>
      </div>
    </div>
  );

  // ============ RENDER APPROVALS ============
  const renderApprovals = () => (
    <div className="space-y-4">
      {/* Auto-Refresh Controls */}
      {renderAutoRefreshControls()}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800">Pending Approvals</h3>
        <div className="flex items-center gap-2">
          {autoRefresh && isOnline && (
            <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold">LIVE</span>
            </div>
          )}
        </div>
      </div>

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

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'all', label: `All (${totalPending})` },
          { key: 'attendance', label: `📅 (${pendingData.attendance.length})` },
          { key: 'gatha', label: `📖 (${pendingData.gatha.length})` },
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
            <div key={`att-${item.id}`} className="bg-white border-2 border-yellow-200 rounded-xl p-3 shadow-sm">
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
                    disabled={actionLoading === `approve-attendance-${item.id}`}
                    className="p-2.5 bg-green-500 text-white rounded-xl active:scale-95"
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
                    className="p-2.5 bg-red-500 text-white rounded-xl active:scale-95"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredPendingGatha.map((item) => (
            <div key={`gatha-${item.id}`} className="bg-white border-2 border-purple-200 rounded-xl p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="font-bold text-gray-800 text-sm truncate">{item.student_name || item.username}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      item.type === 'new' ? 'bg-purple-500 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {item.type === 'new' ? '✨' : '🔄'}
                    </span>
                  </div>
                  <div className="ml-6 text-xs text-gray-600 space-y-0.5">
                    <p className="truncate">📖 {item.sutra_name}</p>
                    <p>#{item.total_gatha} gathas</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleApprove('gatha', item.id)}
                    disabled={actionLoading === `approve-gatha-${item.id}`}
                    className="p-2 bg-green-500 text-white rounded-lg active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReject('gatha', item.id)}
                    disabled={actionLoading === `reject-gatha-${item.id}`}
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
            {filter === 'all' ? `All (${students.length})` : 
             filter === 'active' ? `Active (${activeStudentsCount})` :
             `Inactive (${students.length - activeStudentsCount})`}
          </button>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: 'name', label: 'A-Z' },
          { key: 'attendance', label: '📅 Attendance' },
          { key: 'gatha', label: '✨ Gatha' },
          { key: 'total', label: '⭐ Score' },
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
                  if (expandedStudent === student.id) {
                    setExpandedStudent(null);
                    setSelectedStudent(null);
                    setExpandedDay(null);
                  } else {
                    setExpandedStudent(student.id);
                    setSelectedStudent(student.username);
                    setExpandedDay(null);
                  }
                }}
                className="w-full p-3 text-left active:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className={`w-10 h-10 bg-gradient-to-br ${badge.color} rounded-full flex items-center justify-center text-lg shadow`}>
                        {badge.icon}
                      </div>
                      <span className="absolute -bottom-1 -right-1 bg-white text-xs font-bold px-1 rounded-full border text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{student.name}</p>
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badge.color} text-white font-bold`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-base font-bold text-green-600">{student.attendance_count || 0}</p>
                      <p className="text-xs text-gray-400">📅</p>
                    </div>
                    <div className="text-center">
                      <p className="text-base font-bold text-purple-600">{newGathas}</p>
                      <p className="text-xs text-gray-400">✨</p>
                    </div>
                    {expandedStudent === student.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>

              {expandedStudent === student.id && (
                <div className="border-t-2 border-indigo-100 p-3 bg-gradient-to-br from-indigo-50 to-purple-50">
                  {detailLoading ? (
                    <div className="text-center py-4">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                    </div>
                  ) : studentDetail ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="bg-white rounded-lg p-2 border border-green-200 text-center">
                          <p className="text-lg font-bold text-green-600">
                            {studentDetail.summary?.totalAttendance || 0}
                          </p>
                          <p className="text-xs text-gray-500">Days</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-purple-200 text-center">
                          <p className="text-lg font-bold text-purple-600">
                            {studentDetail.gathaStats?.new || 0}
                          </p>
                          <p className="text-xs text-gray-500">New ✨</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-blue-200 text-center">
                          <p className="text-lg font-bold text-blue-600">
                            {studentDetail.gathaStats?.revision || 0}
                          </p>
                          <p className="text-xs text-gray-500">Revision</p>
                        </div>
                      </div>

                      {studentDetail.recentActivity && studentDetail.recentActivity.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          <p className="text-xs font-bold text-gray-600 mb-2">📋 Activity Log (Click to expand)</p>
                          {groupActivitiesByDate(studentDetail.recentActivity).slice(0, 15).map((dayGroup, idx) => {
                            const dayKey = `${student.id}-${dayGroup.date}`;
                            const isDayExpanded = expandedDay === dayKey;
                            const newGathasForDay = dayGroup.gathas.filter(g => g.gatha_type === 'new');
                            const revisionGathasForDay = dayGroup.gathas.filter(g => g.gatha_type === 'revision');
                            
                            return (
                              <div key={idx} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedDay(isDayExpanded ? null : dayKey);
                                  }}
                                  className="w-full p-2 text-left active:bg-gray-50 flex items-center justify-between"
                                >
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-gray-700">
                                      📅 {formatDate(dayGroup.date)}
                                    </p>
                                    {dayGroup.attendance && (
                                      <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">✅</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {newGathasForDay.length > 0 && (
                                      <span className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-bold">
                                        ✨ {newGathasForDay.reduce((sum, g) => sum + (g.total_gatha || 0), 0)}
                                      </span>
                                    )}
                                    {revisionGathasForDay.length > 0 && (
                                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">
                                        🔄 {revisionGathasForDay.reduce((sum, g) => sum + (g.total_gatha || 0), 0)}
                                      </span>
                                    )}
                                    {isDayExpanded ? (
                                      <ChevronUp className="w-3 h-3 text-gray-400" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3 text-gray-400" />
                                    )}
                                  </div>
                                </button>
                                
                                {isDayExpanded && (
                                  <div className="border-t border-gray-100 p-2 bg-gradient-to-br from-gray-50 to-indigo-50 space-y-2">
                                    {dayGroup.attendance && (
                                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                                        <p className="text-xs font-bold text-green-700">✅ Attendance Marked</p>
                                        <p className="text-xs text-green-600 mt-0.5">Present on this day</p>
                                      </div>
                                    )}
                                    
                                    {newGathasForDay.length > 0 && (
                                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                                        <p className="text-xs font-bold text-purple-700 mb-1.5">✨ New Gathas Learned</p>
                                        <div className="space-y-1.5">
                                          {newGathasForDay.map((g, gIdx) => (
                                            <div key={gIdx} className="bg-white rounded-lg p-2 border border-purple-100">
                                              <p className="text-xs font-bold text-gray-800 truncate">
                                                📖 {g.sutra_name || 'Unknown Sutra'}
                                              </p>
                                              <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-600">
                                                  Gatha: <span className="font-bold text-purple-600">{g.which_gatha || '-'}</span>
                                                </p>
                                                <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                  {g.total_gatha || 1} Gatha
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {revisionGathasForDay.length > 0 && (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                                        <p className="text-xs font-bold text-blue-700 mb-1.5">🔄 Revision Practice</p>
                                        <div className="space-y-1.5">
                                          {revisionGathasForDay.map((g, gIdx) => (
                                            <div key={gIdx} className="bg-white rounded-lg p-2 border border-blue-100">
                                              <p className="text-xs font-bold text-gray-800 truncate">
                                                📖 {g.sutra_name || 'Unknown Sutra'}
                                              </p>
                                              <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-600">
                                                  Gatha: <span className="font-bold text-blue-600">{g.which_gatha || '-'}</span>
                                                </p>
                                                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                                  {g.total_gatha || 1} Gatha
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {dayGroup.gathas.length === 0 && !dayGroup.attendance && (
                                      <p className="text-xs text-gray-500 text-center py-2">No activity recorded</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {(!studentDetail.recentActivity || studentDetail.recentActivity.length === 0) && (
                        <div className="text-center py-4 text-gray-500">
                          <p className="text-sm">No activity in selected range</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-center text-gray-500 py-4 text-sm">No data available</p>
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
          <p className="text-xs opacity-80">📅 Attendance</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-3 text-white shadow-lg">
          <Star className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{totalNewGathaCount}</p>
          <p className="text-xs opacity-80">✨ New Gathas</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 rounded-xl p-3 text-white shadow-lg">
          <Award className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{totalAttendanceCount + totalNewGathaCount}</p>
          <p className="text-xs opacity-80">⭐ Total Score</p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-3 text-white shadow-lg">
          <Users className="w-6 h-6 mb-1 opacity-80" />
          <p className="text-2xl font-bold">{activeStudentsCount}</p>
          <p className="text-xs opacity-80">Active Students</p>
        </div>
      </div>

      {/* Score Explanation */}
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-3 border-2 border-orange-200">
        <p className="text-xs text-center text-orange-700 font-semibold">
          ⭐ Total Score = 📅 Attendance Days + ✨ New Gathas
        </p>
        <p className="text-xs text-center text-orange-500 mt-1">
          (Revision gathas tracked separately, not added to score)
        </p>
      </div>

      {/* Top 5 by Total Score */}
      <div className="bg-white rounded-xl p-3 border-2 border-orange-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">⭐ Top 5 - Total Score</h3>
        <div className="space-y-1.5">
          {filteredStudents
            .map(s => ({
              ...s,
              totalScore: (s.attendance_count || 0) + (s.new_gathas || 0)
            }))
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5)
            .map((student, index) => {
              const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
              return (
                <div
                  key={student.username}
                  className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{medals[index]}</span>
                    <span className="font-semibold text-gray-800 text-sm">{student.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-600 font-bold">📅{student.attendance_count || 0}</span>
                    <span className="text-xs text-purple-600 font-bold">✨{student.new_gathas || 0}</span>
                    <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold text-xs">
                      ⭐{student.totalScore}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Top 5 Attendance */}
      <div className="bg-white rounded-xl p-3 border-2 border-green-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">📅 Top 5 - Attendance</h3>
        <div className="space-y-1.5">
          {topStudents.topAttendance?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div
                key={student.username}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
              >
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
          {(!topStudents.topAttendance || topStudents.topAttendance.length === 0) && (
            <p className="text-center text-gray-500 py-2 text-sm">No data</p>
          )}
        </div>
      </div>

      {/* Top 5 New Gathas */}
      <div className="bg-white rounded-xl p-3 border-2 border-purple-200 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-2">✨ Top 5 - New Gathas</h3>
        <div className="space-y-1.5">
          {topStudents.topGatha?.slice(0, 5).map((student, index) => {
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
            return (
              <div
                key={student.username}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
              >
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
          {(!topStudents.topGatha || topStudents.topGatha.length === 0) && (
            <p className="text-center text-gray-500 py-2 text-sm">No data</p>
          )}
        </div>
      </div>
    </div>
  );

  // ============ MAIN RETURN ============
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-3 mb-3 border-4 border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800">👋 {user.name}</h2>
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

        {/* Messages */}
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

        {/* Content */}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'students' && renderStudentsList()}
        {activeTab === 'analytics' && renderAnalytics()}

        {/* Export Modal */}
        {renderExportModal()}

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-indigo-200 p-2 shadow-2xl">
          <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
            {[
              { key: 'overview', icon: BarChart3, label: 'Home' },
              { key: 'students', icon: Users, label: 'Students' },
              { key: 'analytics', icon: TrendingUp, label: 'Stats' },
              { key: 'approvals', icon: Clock, label: 'Pending', badge: totalPending, alert: newPendingAlert },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
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
                {tab.alert && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full animate-ping opacity-75" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
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
