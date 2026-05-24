import React, { useState } from 'react';
import { Calendar, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../LanguageContext';

const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getYearOptions = () => {
  const y = new Date().getFullYear();
  return Array.from({length: y - 2019}, (_, i) => y - i);
};

const formatLocalDateString = (input = new Date()) => {
  const d = input instanceof Date ? input : new Date(input);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

const getDateRangePreset = (preset, month, year, cs, ce) => {
  const today = new Date();
  switch(preset) {
    case 'today': return { start: formatLocalDateString(today), end: formatLocalDateString(today) };
    case 'week': { const s = new Date(today); s.setDate(today.getDate()-today.getDay()); return { start: formatLocalDateString(s), end: formatLocalDateString(today) }; }
    case 'month': { const ms = new Date(year, month-1, 1); const me = new Date(year, month, 0); return { start: formatLocalDateString(ms), end: formatLocalDateString(me) }; }
    case 'year': return { start: `${year}-01-01`, end: `${year}-12-31` };
    case 'all': return { start: '2020-01-01', end: '2099-12-31' };
    case 'custom': return { start: cs || formatLocalDateString(today), end: ce || formatLocalDateString(today) };
    default: return getDateRangePreset('month', month, year);
  }
};

export default function DatePickerPanel({ dateRange, onDateRangeChange, showExport, onExport }) {
  const { t } = useLanguage();
  const [datePreset, setDatePreset] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()+1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customStart, setCustomStart] = useState(formatLocalDateString());
  const [customEnd, setCustomEnd] = useState(formatLocalDateString());
  const [showMonthDD, setShowMonthDD] = useState(false);
  const [showYearDD, setShowYearDD] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (p, m, y, cs, ce) => {
    const range = getDateRangePreset(p, m || selectedMonth, y || selectedYear, cs || customStart, ce || customEnd);
    onDateRangeChange(range);
  };

  const formatDate = (s) => { if(!s) return ''; const d=new Date(s); return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}); };

  const presets = [
    { key: 'today', label: t('adm_today') },
    { key: 'week', label: t('adm_week') },
    { key: 'month', label: t('adm_month') },
    { key: 'year', label: t('adm_year') },
    { key: 'all', label: t('adm_all_time') },
    { key: 'custom', label: t('adm_custom') },
  ];

  return (
    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" /> {t('adm_date_range')}
        </p>
        {showExport && (
          <button onClick={onExport} className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:scale-[0.98]">
            {t('adm_export_btn')}
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {presets.map(p => (
          <button key={p.key} onClick={() => { setDatePreset(p.key); setShowCustom(p.key==='custom'); applyPreset(p.key); }}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${datePreset===p.key?'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg':'bg-gray-100 text-gray-600'}`}>
            {p.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('adm_from_date')}</label>
              <input type="date" value={customStart} onChange={e => { setCustomStart(e.target.value); setDatePreset('custom'); }}
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-400 bg-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('adm_to_date')}</label>
              <input type="date" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setDatePreset('custom'); }}
                className="w-full px-3 py-2.5 border-2 border-orange-200 rounded-xl text-sm font-bold focus:outline-none focus:border-orange-400 bg-white" />
            </div>
          </div>
          <button onClick={() => { applyPreset('custom', null, null, customStart, customEnd); setShowCustom(false); }}
            className="w-full mt-3 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl font-bold text-sm active:scale-[0.98]">
            {t('adm_apply_custom')}
          </button>
        </div>
      )}

      {(datePreset==='month'||datePreset==='year') && (
        <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-100">
          <div className="flex gap-2">
            {datePreset==='month' && (
              <div className="flex-1 relative">
                <button onClick={() => { setShowMonthDD(!showMonthDD); setShowYearDD(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between ${showMonthDD?'border-indigo-500 bg-white shadow-lg':'border-indigo-200 bg-white'}`}>
                  <span className="text-gray-800 text-xs">{MONTH_NAMES_SHORT[selectedMonth-1]}</span>
                  <ChevronDown className={`w-4 h-4 text-indigo-500 transition-transform ${showMonthDD?'rotate-180':''}`} />
                </button>
                {showMonthDD && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border-2 border-indigo-200 shadow-2xl z-50 max-h-48 overflow-y-auto">
                    <div className="p-1">
                      {MONTH_NAMES_SHORT.map((m,i) => (
                        <button key={i} onClick={() => { setSelectedMonth(i+1); setShowMonthDD(false); applyPreset('month',i+1,selectedYear); }}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm ${selectedMonth===i+1?'bg-indigo-500 text-white':'text-gray-700 hover:bg-indigo-50'}`}>
                          {m} {selectedMonth===i+1 && <Check className="w-4 h-4 inline float-right" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className={datePreset==='month'?'w-24':'flex-1'}>
              <button onClick={() => { setShowYearDD(!showYearDD); setShowMonthDD(false); }}
                className={`w-full px-3 py-2.5 rounded-xl border-2 text-left font-bold text-sm flex items-center justify-between ${showYearDD?'border-purple-500 bg-white shadow-lg':'border-purple-200 bg-white'}`}>
                <span className="text-gray-800 text-xs">{selectedYear}</span>
                <ChevronDown className={`w-4 h-4 text-purple-500 transition-transform ${showYearDD?'rotate-180':''}`} />
              </button>
              {showYearDD && (
                <div className="absolute mt-1 bg-white rounded-xl border-2 border-purple-200 shadow-2xl z-50 max-h-48 overflow-y-auto" style={{width:'6rem'}}>
                  <div className="p-1">
                    {getYearOptions().map(y => (
                      <button key={y} onClick={() => { setSelectedYear(y); setShowYearDD(false); applyPreset(datePreset,selectedMonth,y); }}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm ${selectedYear===y?'bg-purple-500 text-white':'text-gray-700 hover:bg-purple-50'}`}>
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
}

export { formatLocalDateString, getDateRangePreset };
