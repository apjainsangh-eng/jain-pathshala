import React, { useState, useCallback } from 'react';
import { Calendar, RefreshCw, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AttendanceRegister() {
  const { t } = useLanguage();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRegister = useCallback(async () => {
    const start = `${year}-${String(month+1).padStart(2,'0')}-01`;
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const end = `${year}-${String(month+1).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}`;

    const token = localStorage.getItem('jainPathshalaToken');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/attendance-register?startDate=${start}&endDate=${end}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const exportCSV = () => {
    if (!data) return;
    let csv = 'Student,' + data.dates.map(d => d.split('-')[2]).join(',') + ',Present,Total,Att%\n';
    data.students.forEach(s => {
      csv += `"${s.name}",` + data.dates.map(d => s.attendance[d] ? 'P' : '-').join(',');
      csv += `,${s.presentCount},${s.totalDays},${s.attendancePercent}%\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `register-${MONTHS[month]}-${year}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-4 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2"><Calendar className="w-5 h-5" /> {t('reg_title')}</h3>
        <p className="text-blue-100 text-xs mt-1">{t('reg_subtitle')}</p>
      </div>

      {/* Month selector */}
      <div className="bg-white rounded-xl border-2 border-blue-200 p-3">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 bg-blue-100 rounded-lg active:scale-95"><ChevronLeft className="w-4 h-4 text-blue-600" /></button>
          <p className="text-sm font-bold text-gray-800">{MONTHS[month]} {year}</p>
          <button onClick={nextMonth} className="p-2 bg-blue-100 rounded-lg active:scale-95"><ChevronRight className="w-4 h-4 text-blue-600" /></button>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={fetchRegister} disabled={loading}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-xs font-bold active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {t('reg_load')}
          </button>
          {data && (
            <button onClick={exportCSV} className="py-2.5 px-4 bg-green-100 text-green-700 rounded-xl text-xs font-bold active:scale-95 flex items-center gap-1.5">
              <Download className="w-4 h-4" /> CSV
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}

      {data && !loading && (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-gradient-to-r from-blue-50 to-cyan-50">
                  <th className="sticky left-0 bg-blue-50 z-10 px-2 py-2 text-left font-bold text-gray-600 border-r border-gray-200 min-w-[100px]">{t('reg_student_col')}</th>
                  {data.dates.map(d => {
                    const day = parseInt(d.split('-')[2]);
                    const dow = new Date(d).getDay();
                    const isSun = dow === 0;
                    return (
                      <th key={d} className={`px-1 py-2 text-center font-bold min-w-[24px] ${isSun ? 'text-red-500' : 'text-gray-500'}`}>
                        {day}
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center font-bold text-gray-600 border-l border-gray-200">%</th>
                </tr>
              </thead>
              <tbody>
                {data.students.map((s, i) => (
                  <tr key={s.username} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="sticky left-0 z-10 px-2 py-1.5 font-bold text-gray-700 border-r border-gray-200 truncate max-w-[100px]"
                      style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f9fafb' }}>
                      {s.name}
                    </td>
                    {data.dates.map(d => (
                      <td key={d} className="px-0 py-1.5 text-center">
                        {s.attendance[d] ? (
                          <span className="inline-block w-5 h-5 rounded bg-green-400 text-white text-[9px] font-bold leading-5">P</span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded bg-gray-200 text-gray-400 text-[9px] font-bold leading-5">-</span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 text-center font-bold border-l border-gray-200">
                      <span className={`${s.attendancePercent >= 75 ? 'text-green-600' : s.attendancePercent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {s.attendancePercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 bg-gray-50 border-t text-[10px] text-gray-500 font-semibold">
            {data.students.length} {t('reg_student_col')} · {data.dates.length} {t('sp_days')}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">{t('reg_empty_msg')}</p>
        </div>
      )}
    </div>
  );
}
