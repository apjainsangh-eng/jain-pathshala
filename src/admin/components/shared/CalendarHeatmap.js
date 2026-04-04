import React from 'react';

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function CalendarHeatmap({ year, month, attendanceMap, gathaMap, pendingMap }) {
  // attendanceMap: { 'YYYY-MM-DD': true/false }
  // gathaMap: { 'YYYY-MM-DD': number }
  // pendingMap: { 'YYYY-MM-DD': true/false }

  const y = year || new Date().getFullYear();
  const m = (month || new Date().getMonth() + 1) - 1;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const firstDayOfWeek = new Date(y, m, 1).getDay(); // 0=Sun

  const cells = [];
  // Empty cells for offset
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={'empty-' + i} className="w-8 h-8" />);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPresent = attendanceMap?.[dateStr];
    const hasGatha = (gathaMap?.[dateStr] || 0) > 0;
    const isPending = pendingMap?.[dateStr];
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const isFuture = new Date(dateStr) > new Date();

    let bgColor = 'bg-gray-100 text-gray-400'; // default / absent
    let ringClass = '';

    if (isFuture) {
      bgColor = 'bg-gray-50 text-gray-300';
    } else if (isPending) {
      bgColor = 'bg-yellow-200 text-yellow-800';
    } else if (isPresent && hasGatha) {
      bgColor = 'bg-gradient-to-br from-green-400 to-purple-400 text-white';
    } else if (isPresent) {
      bgColor = 'bg-green-400 text-white';
    } else if (hasGatha) {
      bgColor = 'bg-purple-400 text-white';
    } else if (!isFuture) {
      bgColor = 'bg-red-100 text-red-400';
    }

    if (isToday) {
      ringClass = 'ring-2 ring-indigo-500 ring-offset-1';
    }

    cells.push(
      <div key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${bgColor} ${ringClass} transition-all`}
        title={`${dateStr}${isPresent ? ' ✓ Present' : ''}${hasGatha ? ' 📖 Gatha' : ''}${isPending ? ' ⏳ Pending' : ''}`}>
        {d}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-bold text-gray-700">
          {MONTH_NAMES_SHORT[m]} {y}
        </p>
        <div className="flex gap-2 text-[10px]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400" /> Present</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100" /> Absent</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-400" /> Gatha</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-200" /> Pending</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S','M','T','W','T','F','S'].map((d, i) => (
          <div key={i} className="w-8 h-6 flex items-center justify-center text-[10px] font-bold text-gray-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    </div>
  );
}
