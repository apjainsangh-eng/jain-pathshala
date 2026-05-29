import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Calendar, BookOpen, CheckCircle,
  TrendingUp, Plus, FileText, RefreshCw,
  AlertTriangle, Users, Activity
} from 'lucide-react';
import CalendarHeatmap from './shared/CalendarHeatmap';
import { useLanguage } from '../../LanguageContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

const formatDate = (s) => {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function StudentProfile({ username, onBack, onAddAttendance, onAddGatha }) {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('jainPathshalaToken');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/student/${username}/profile`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      } else {
        setError(t('sp_failed_load'));
      }
    } catch (err) {
      setError(t('sp_network_error'));
    } finally {
      setLoading(false);
    }
  }, [username, t]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    const token = localStorage.getItem('jainPathshalaToken');
    setAddingNote(true);
    try {
      const res = await fetch(`${API_BASE}/admin/student/${username}/notes`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: noteText })
      });
      if (res.ok) {
        setNoteText('');
        setSuccess(t('sp_note_added'));
        setTimeout(() => setSuccess(''), 2000);
        fetchProfile();
      }
    } catch (err) {
      setError(t('sp_failed_note'));
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="w-10 h-10 mx-auto text-yellow-500 mb-2" />
        <p className="text-gray-500">{error || t('sp_no_data')}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm">{t('sp_go_back')}</button>
      </div>
    );
  }

  const { student, stats, monthlyStats, recentActivity, attendanceHistory, pendingAttendanceHistory, gathaHistory, notes } = profile;

  // Build calendar data for current month
  const now = new Date();
  const attMap = {};
  const gathaMap = {};
  const pendingMap = {};
  (attendanceHistory || []).forEach(a => { attMap[a.date] = true; });
  (gathaHistory || []).forEach(g => { gathaMap[g.date] = (gathaMap[g.date] || 0) + (g.totalGatha || 1); });
  (pendingAttendanceHistory || []).filter(p => p.status === 'pending').forEach(p => { pendingMap[p.date] = true; });

  const initials = (student.name || 'S').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const hue = student.name ? student.name.charCodeAt(0) * 7 % 360 : 200;

  const tabs = [
    { key: 'overview', label: t('sp_tab_overview'), icon: Activity },
    { key: 'attendance', label: t('adm_attendance'), icon: Calendar },
    { key: 'gatha', label: t('gatha_label'), icon: BookOpen },
    { key: 'analytics', label: t('sp_tab_analytics'), icon: TrendingUp },
    { key: 'notes', label: t('sp_tab_notes'), icon: FileText },
  ];

  return (
    <div className="space-y-3 pb-4">
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-600 font-bold text-sm active:scale-95">
        <ArrowLeft className="w-4 h-4" /> {t('sp_back')}
      </button>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg"
              style={{ backgroundColor: `hsl(${hue}, 60%, 45%)` }}>
              {initials}
            </div>
            <div className="flex-1">
              <h2 className="text-white font-bold text-lg">{student.name}</h2>
              <p className="text-white/70 text-xs">@{student.username}</p>
              <div className="flex items-center gap-2 mt-1">
                {student.group && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3" /> {student.group.name}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${student.isActive ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                  {student.isActive ? t('adm_active_badge') : t('adm_inactive')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex gap-2 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-t border-indigo-100">
          <button onClick={() => onAddAttendance && onAddAttendance(username)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 text-white py-2 rounded-xl text-xs font-bold active:scale-95">
            <Plus className="w-3.5 h-3.5" /> {t('sp_add_attendance')}
          </button>
          <button onClick={() => onAddGatha && onAddGatha(username)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-purple-500 text-white py-2 rounded-xl text-xs font-bold active:scale-95">
            <Plus className="w-3.5 h-3.5" /> {t('sp_add_gatha')}
          </button>
          <button onClick={fetchProfile}
            className="flex items-center justify-center gap-1.5 bg-indigo-100 text-indigo-700 py-2 px-3 rounded-xl text-xs font-bold active:scale-95">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-xs text-green-700 font-semibold">{success}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t('sp_stat_present'), value: stats.totalPresent, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: t('sp_stat_absent'), value: stats.totalAbsent, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: t('sp_stat_att_pct'), value: stats.attendancePercent + '%', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: t('sp_stat_streak'), value: stats.currentStreak, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} border rounded-xl p-2 text-center`}>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-gray-500 font-semibold">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: t('sp_stat_gathas'), value: stats.totalGathasSubmitted, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
          { label: t('adm_pending_tab'), value: stats.totalPending, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
          { label: t('sp_stat_score'), value: stats.score, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200' },
          { label: t('sp_stat_rejected'), value: stats.rejectedGathas, color: 'text-pink-600', bg: 'bg-pink-50 border-pink-200' },
        ].map((c, i) => (
          <div key={i} className={`${c.bg} border rounded-xl p-2 text-center`}>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}</p>
            <p className="text-[10px] text-gray-500 font-semibold">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1 flex-1 py-2 px-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-white text-indigo-700 shadow' : 'text-gray-500'}`}>
            <tab.icon className="w-3.5 h-3.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Info row */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3 space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_join_date')}</span><span className="font-bold text-gray-700">{formatDate(student.joinDate)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_last_att')}</span><span className="font-bold text-gray-700">{formatDate(student.lastAttendanceDate)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_last_gatha')}</span><span className="font-bold text-gray-700">{formatDate(student.lastGathaDate)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_max_streak')}</span><span className="font-bold text-orange-600">{stats.maxStreak} {t('sp_days')}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_new_gathas')}</span><span className="font-bold text-purple-600">{stats.totalNewGathas}</span></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">{t('sp_revision_gathas')}</span><span className="font-bold text-blue-600">{stats.totalRevisionGathas}</span></div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
            <CalendarHeatmap year={now.getFullYear()} month={now.getMonth() + 1}
              attendanceMap={attMap} gathaMap={gathaMap} pendingMap={pendingMap} />
          </div>

          {/* Recent Activity */}
          {recentActivity && recentActivity.length > 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
              <p className="text-sm font-bold text-gray-700 mb-2">{t('sp_recent_activity')}</p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {recentActivity.slice(0, 15).map((act, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    {act.type === 'attendance' ? (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">
                        {act.type === 'attendance' ? t('sp_stat_present') : `${act.sutraName || t('gatha_label')} (${act.totalGatha})`}
                      </p>
                      <p className="text-[10px] text-gray-400">{formatDate(act.date)}</p>
                    </div>
                    <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">{act.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="space-y-2">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700 mb-2">{t('sp_att_history')} ({(attendanceHistory||[]).length} {t('sp_days')})</p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {(attendanceHistory || []).map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-green-50 rounded-lg p-2.5 border border-green-100">
                  <div>
                    <p className="text-xs font-bold text-gray-700">{formatDate(a.date)}</p>
                    <p className="text-[10px] text-gray-400">{t('sp_marked_by')}: {a.markedBy} · {t('sp_approved_by')}: {a.approvedBy}</p>
                  </div>
                  <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">{t('sp_stat_present')}</span>
                </div>
              ))}
              {(attendanceHistory || []).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t('sp_no_att_records')}</p>}
            </div>
          </div>
          {(pendingAttendanceHistory || []).filter(p => p.status === 'pending').length > 0 && (
            <div className="bg-white rounded-xl border-2 border-yellow-200 p-3">
              <p className="text-sm font-bold text-yellow-700 mb-2">{t('sp_pending_att')}</p>
              {pendingAttendanceHistory.filter(p => p.status === 'pending').map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-yellow-50 rounded-lg p-2.5 mb-1">
                  <p className="text-xs font-bold text-gray-700">{formatDate(a.date)}</p>
                  <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">{t('adm_pending_tab')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'gatha' && (
        <div className="space-y-2">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700 mb-2">{t('sp_gatha_history')} ({(gathaHistory || []).length} {t('sp_entries')})</p>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {(gathaHistory || []).map((g, i) => (
                <div key={i} className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      {(g.type === 'new' || g.type === 'revision') && <p className="text-xs font-bold text-gray-700">{g.sutraName || t('gatha_label')}</p>}
                      {(g.type === 'new' || g.type === 'revision') && <p className="text-[10px] text-gray-500">{g.whichGatha} · {t('sp_count_col')}: {g.totalGatha}</p>}
                      {g.type !== 'new' && g.type !== 'revision' && (
                        <p className="text-xs font-bold text-gray-700">
                          {g.activityTypeName && g.activityTypeName !== 'Other'
                            ? g.activityTypeName
                            : g.customActivityDescription || ''}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400">{formatDate(g.date)} · {t('sp_by_col')}: {g.addedBy}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${g.type === 'new' ? 'bg-purple-500 text-white' : g.type === 'revision' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-700'}`}>
                        {g.type === 'new' ? t('new_learning') : g.type === 'revision' ? t('revision') : 'Other'}
                      </span>
                      <p className="text-[10px] text-green-600 mt-0.5 font-semibold">{g.status}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(gathaHistory || []).length === 0 && <p className="text-center text-gray-400 text-sm py-4">{t('sp_no_gatha_records')}</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-3">
          {/* Monthly chart */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700 mb-3">{t('sp_monthly_trends')} ({now.getFullYear()})</p>
            <div className="space-y-1.5">
              {(monthlyStats || []).map((ms, i) => {
                const maxVal = Math.max(...(monthlyStats || []).map(m => Math.max(m.attendance, m.newGathas)), 1);
                const attWidth = Math.round((ms.attendance / maxVal) * 100);
                const gathaWidth = Math.round((ms.newGathas / maxVal) * 100);
                const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 w-8">{mName}</span>
                    <div className="flex-1 space-y-0.5">
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                          style={{ width: attWidth + '%' }} />
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all"
                          style={{ width: gathaWidth + '%' }} />
                      </div>
                    </div>
                    <div className="text-right w-12">
                      <p className="text-[10px] font-bold text-green-600">{ms.attendance}</p>
                      <p className="text-[10px] font-bold text-purple-600">{ms.newGathas}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-2 justify-center">
              <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-green-400" /> {t('sp_legend_attendance')}</span>
              <span className="flex items-center gap-1 text-[10px]"><span className="w-3 h-3 rounded bg-purple-400" /> {t('sp_legend_new_gathas')}</span>
            </div>
          </div>

          {/* Best/Worst month */}
          <div className="grid grid-cols-2 gap-2">
            {(() => {
              const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const best = (monthlyStats||[]).reduce((a,b,i) => (b.attendance > (a?.attendance||0) ? {...b, idx:i} : a), null);
              const worst = (monthlyStats||[]).filter(m => m.attendance > 0).reduce((a,b,i) => (!a || b.attendance < a.attendance ? {...b, idx:i} : a), null);
              return (
                <>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 font-semibold">{t('sp_best_month')}</p>
                    <p className="text-sm font-bold text-green-600">{best ? mo[best.idx] : '-'}</p>
                    <p className="text-xs text-gray-500">{best?.attendance || 0} {t('sp_days')}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 font-semibold">{t('sp_weakest_month')}</p>
                    <p className="text-sm font-bold text-red-600">{worst ? mo[worst.idx] : '-'}</p>
                    <p className="text-xs text-gray-500">{worst?.attendance || 0} {t('sp_days')}</p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-3">
            <p className="text-sm font-bold text-gray-700 mb-2">{t('sp_admin_notes')}</p>
            <div className="flex gap-2">
              <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={t('sp_add_note_ph')}
                className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
              <button onClick={handleAddNote} disabled={addingNote || !noteText.trim()}
                className="px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold active:scale-95 disabled:opacity-50">
                {addingNote ? <RefreshCw className="w-4 h-4 animate-spin" /> : t('sp_add_btn')}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {(notes || []).map((note, i) => (
              <div key={i} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-xl p-3">
                <p className="text-sm text-gray-700">{note.text}</p>
                <p className="text-[10px] text-gray-400 mt-1">{t('sp_note_by')} {note.createdBy} · {formatDate(note.createdAt)}</p>
              </div>
            ))}
            {(!notes || notes.length === 0) && (
              <p className="text-center text-gray-400 text-sm py-6">{t('sp_no_notes')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
