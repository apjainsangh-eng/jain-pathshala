import React, { useEffect, useMemo, useState } from 'react';
// ... all your existing imports ...

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

// ... all your helper functions ...

export default function StudentDashboard({ user, onLogout }) {
  // ... all your existing state ...
  
  // ADD: Pending status state
  const [pendingStatus, setPendingStatus] = useState({
    attendance: null,
    gatha: []
  });

  // ADD: Fetch pending status
  const fetchPendingStatus = async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    try {
      const res = await fetch(`${API_BASE}/student/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingStatus(data);
      }
    } catch (error) {
      console.error('Error fetching pending status:', error);
    }
  };

  // ADD: Call fetchPendingStatus in useEffect
  useEffect(() => {
    fetchPendingStatus();
  }, []);

  // MODIFY: After marking attendance, show pending status
  const markAttendance = async () => {
    // ... existing code ...
    
    // After successful submission:
    await fetchPendingStatus(); // Refresh pending status
  };

  // In your attendance card, show pending status:
  const renderAttendanceCard = () => {
    const todayPending = pendingStatus.attendance?.find(
      p => formatLocalDateString(p.date) === todayIso && p.status === 'pending'
    );

    return (
      <div className="...">
        {todayPending ? (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-3 flex items-center justify-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600 animate-pulse" />
            <span className="text-yellow-700 font-bold">Pending Approval</span>
          </div>
        ) : todayAttendanceMarked ? (
          <div className="bg-green-50 border-2 border-green-300 rounded-xl p-3">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-bold">Attendance Approved!</span>
          </div>
        ) : (
          <button onClick={markAttendance}>Mark Present</button>
        )}
      </div>
    );
  };

  // ... rest of your existing code ...
  
  // Use currentUser from props instead of state
  // Replace: currentUser with user
  // Replace: handleLogout function call with onLogout prop
  
  return (
    <div className="...">
      {/* Use user.name instead of currentUser.name */}
      {/* Use onLogout instead of handleLogout */}
      {/* ... rest of your JSX ... */}
    </div>
  );
}
