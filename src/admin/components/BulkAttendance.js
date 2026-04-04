import React, { useState } from 'react';
import {
  Calendar, Check, CheckCircle, Search, RefreshCw,
  AlertTriangle, X as CloseIcon
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

const formatLocalDate = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

export default function BulkAttendance({ students, familyGroups, onSuccess }) {
  const [date, setDate] = useState(formatLocalDate());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [entries, setEntries] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Build group lookup
  const groupLookup = {};
  (familyGroups || []).forEach(g => {
    (g.members || []).forEach(m => { groupLookup[m] = g.groupName; });
  });

  const filtered = (students || []).filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'all' || groupLookup[s.username] === groupFilter;
    return matchSearch && matchGroup;
  });

  const uniqueGroups = [...new Set(Object.values(groupLookup))];

  const setStatus = (username, status) => {
    setEntries(prev => ({ ...prev, [username]: { ...prev[username], status, remark: prev[username]?.remark || '' } }));
  };

  const setRemark = (username, remark) => {
    setEntries(prev => ({ ...prev, [username]: { ...prev[username], remark } }));
  };

  const markAllPresent = () => {
    const updated = { ...entries };
    filtered.forEach(s => { updated[s.username] = { status: 'present', remark: updated[s.username]?.remark || '' }; });
    setEntries(updated);
  };

  const markAllAbsent = () => {
    const updated = { ...entries };
    filtered.forEach(s => { updated[s.username] = { status: 'absent', remark: updated[s.username]?.remark || '' }; });
    setEntries(updated);
  };

  const clearAll = () => setEntries({});

  const selectedCount = Object.values(entries).filter(e => e.status === 'present').length;

  const handleSave = async () => {
    const presentEntries = Object.entries(entries)
      .filter(([_, e]) => e.status === 'present')
      .map(([username, e]) => ({ username, status: 'present', remark: e.remark }));

    if (presentEntries.length === 0) {
      setError('No students marked as present');
      return;
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/bulk/attendance`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries: presentEntries })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }

      const data = await res.json();
      setSuccess(`Saved! ${data.added} added, ${data.skipped} already existed.`);
      setTimeout(() => setSuccess(''), 4000);
      setEntries({});
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-4 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5" /> Bulk Attendance
        </h3>
        <p className="text-green-100 text-xs mt-1">Mark attendance for multiple students at once</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <p className="text-xs text-red-700">{error}</p>
          <button onClick={() => setError('')}><CloseIcon className="w-4 h-4 text-red-500" /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-xs text-green-700 font-semibold">{success}</p>
        </div>
      )}

      {/* Date picker */}
      <div className="bg-white rounded-xl border-2 border-green-200 p-3">
        <label className="block text-xs font-bold text-gray-600 mb-1">Select Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 border-2 border-green-200 rounded-xl text-sm font-bold focus:outline-none focus:border-green-400 bg-white" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400" />
        </div>
        <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
          className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs font-bold focus:outline-none focus:border-green-400 bg-white">
          <option value="all">All Groups</option>
          {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <button onClick={markAllPresent} className="flex-1 py-2 bg-green-100 text-green-700 rounded-xl text-xs font-bold active:scale-95">
          ✓ All Present
        </button>
        <button onClick={markAllAbsent} className="flex-1 py-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold active:scale-95">
          ✗ All Absent
        </button>
        <button onClick={clearAll} className="py-2 px-3 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold active:scale-95">
          Clear
        </button>
      </div>

      {/* Student list */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
          <p className="text-xs font-bold text-gray-600">{filtered.length} students · {selectedCount} marked present</p>
        </div>
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {filtered.map(s => {
            const status = entries[s.username]?.status || '';
            const group = groupLookup[s.username];
            return (
              <div key={s.username} className={`flex items-center gap-2 p-2.5 transition-colors ${status === 'present' ? 'bg-green-50' : status === 'absent' ? 'bg-red-50' : ''}`}>
                <div className="flex gap-1">
                  <button onClick={() => setStatus(s.username, 'present')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    P
                  </button>
                  <button onClick={() => setStatus(s.username, 'absent')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    A
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-700 truncate">{s.name}</p>
                  {group && <p className="text-[10px] text-gray-400">{group}</p>}
                </div>
                <input type="text" placeholder="Remark" value={entries[s.username]?.remark || ''}
                  onChange={e => setRemark(s.username, e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-green-400" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <button onClick={handleSave} disabled={saving || selectedCount === 0}
        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        Save Attendance ({selectedCount} students)
      </button>
    </div>
  );
}
