import React, { useState, useEffect } from 'react';
import {
  BookOpen, Check, CheckCircle, Search, RefreshCw,
  AlertTriangle, X as CloseIcon, Plus, Trash2
} from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

const formatLocalDate = (d = new Date()) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};

// Defined outside component so React never remounts it
const TYPE_OPTIONS = [
  { value: 'new', label: 'New Learning' },
  { value: 'revision', label: 'Revision' },
  { value: 'other', label: 'Other' },
];

function TypeSelect({ value, onChange, className }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} className={className}>
      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// Shown when type === 'other'
function OtherSection({ subType, onSubTypeChange, description, onDescriptionChange, subOptions, onAddOption }) {
  const [showInput, setShowInput] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelectChange = (val) => {
    if (val === '__add__') {
      setShowInput(true);
    } else {
      onSubTypeChange(val);
      setShowInput(false);
    }
  };

  const handleSave = async () => {
    const name = newOption.trim();
    if (!name) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('jainPathshalaToken');
      const res = await fetch(`${API_BASE}/activity-types`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        onAddOption({ id: data.id, name });
        onSubTypeChange(name);
        setNewOption('');
        setShowInput(false);
      }
    } catch (e) { /* silent */ }
    setSaving(false);
  };

  return (
    <div className="col-span-2 space-y-2">
      {/* Main dropdown — Other + saved options + Add Option at bottom */}
      <select
        value={showInput ? '__add__' : subType}
        onChange={e => handleSelectChange(e.target.value)}
        className="w-full px-3 py-2.5 border-2 border-orange-300 rounded-xl text-xs bg-white focus:outline-none focus:border-orange-500 font-medium"
      >
        <option value="Other">Other</option>
        {subOptions.map(opt => (
          <option key={opt.id} value={opt.name}>{opt.name}</option>
        ))}
        <option value="__add__">＋ Add Option</option>
      </select>

      {/* Inline input — appears when "Add Option" is selected */}
      {showInput && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="text"
            value={newOption}
            onChange={e => setNewOption(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setShowInput(false); setNewOption(''); }
            }}
            placeholder="Type option name…"
            className="flex-1 px-3 py-2 border-2 border-orange-300 rounded-xl text-xs focus:outline-none focus:border-orange-500 bg-white"
          />
          <button onClick={handleSave} disabled={saving || !newOption.trim()}
            className="px-3 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold disabled:opacity-50 active:scale-95">
            {saving ? '…' : 'Save'}
          </button>
          <button onClick={() => { setShowInput(false); setNewOption(''); }}
            className="px-2 py-2 bg-gray-100 rounded-xl text-xs active:scale-95">
            <CloseIcon className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      )}


      {/* Textarea — only when "Other" is selected */}
      {subType === 'Other' && !showInput && (
        <textarea
          value={description}
          onChange={e => onDescriptionChange(e.target.value.slice(0, 500))}
          placeholder="Enter what you learned today..."
          rows={2}
          className="w-full px-3 py-2 border-2 border-orange-300 rounded-xl text-xs focus:outline-none focus:border-orange-400 resize-none bg-white"
        />
      )}
    </div>
  );
}

export default function BulkGatha({ students, familyGroups, onSuccess }) {
  const { t } = useLanguage();
  const [date, setDate] = useState(formatLocalDate());
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [mode, setMode] = useState('same');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savedSubOptions, setSavedSubOptions] = useState([]); // [{id, name}] — custom only

  // Same gatha mode
  const [selectedStudents, setSelectedStudents] = useState({});
  const [sameGatha, setSameGatha] = useState({
    sutraName: '', whichGatha: '', totalGatha: 1,
    type: 'new',
    otherSubType: 'Other',
    customActivityDescription: '',
    remark: '',
  });

  // Individual mode
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('jainPathshalaToken');
    fetch(`${API_BASE}/activity-types`, { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const SYSTEM_NAMES = ['New Learning', 'Revision', 'Other'];
          setSavedSubOptions(
            data
              .filter(d => !SYSTEM_NAMES.includes(d.name))
              .map(d => ({ id: d.id, name: d.name }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleAddSubOption = ({ id, name }) => {
    setSavedSubOptions(prev => prev.find(o => o.id === id) ? prev : [...prev, { id, name }]);
  };

  const handleDeleteSubOption = (id) => {
    setSavedSubOptions(prev => prev.filter(o => o.id !== id));
  };

  const groupLookup = {};
  (familyGroups || []).forEach(g => { (g.members || []).forEach(m => { groupLookup[m] = g.groupName; }); });
  const uniqueGroups = [...new Set(Object.values(groupLookup))];

  const filtered = (students || []).filter(s => {
    const matchSearch = s.name?.toLowerCase().includes(search.toLowerCase()) || s.username?.toLowerCase().includes(search.toLowerCase());
    const matchGroup = groupFilter === 'all' || groupLookup[s.username] === groupFilter;
    return matchSearch && matchGroup;
  });

  const toggleStudent = (username) => {
    setSelectedStudents(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const selectAll = () => {
    const upd = {};
    filtered.forEach(s => { upd[s.username] = true; });
    setSelectedStudents(upd);
  };

  const deselectAll = () => setSelectedStudents({});

  const addRow = (username) => {
    if (rows.find(r => r.username === username)) return;
    const student = students.find(s => s.username === username);
    setRows(prev => [...prev, {
      username, name: student?.name || username,
      sutraName: '', whichGatha: '', totalGatha: 1,
      type: 'new', otherSubType: 'Other', customActivityDescription: '', remark: '',
    }]);
  };

  const updateRow = (idx, fields) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, ...fields } : r));
  };

  const removeRow = (idx) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
  };

  const selectedCount = mode === 'same'
    ? Object.values(selectedStudents).filter(Boolean).length
    : rows.length;

  const buildEntry = (fields, username) => {
    const isOther = fields.type === 'other';
    const activityTypeName = isOther
      ? (fields.otherSubType === 'Other' ? 'Other' : fields.otherSubType)
      : (fields.type === 'new' ? 'New Learning' : 'Revision');

    return {
      username,
      sutraName: isOther ? '-' : fields.sutraName,
      whichGatha: isOther ? '' : fields.whichGatha,
      totalGatha: isOther ? 0 : parseInt(fields.totalGatha),
      type: fields.type,
      activityTypeName,
      customActivityDescription: isOther && fields.otherSubType === 'Other'
        ? fields.customActivityDescription : null,
      remark: fields.remark,
    };
  };

  const handleSave = async () => {
    let entries = [];

    if (mode === 'same') {
      const selected = Object.entries(selectedStudents).filter(([_, v]) => v).map(([u]) => u);
      if (selected.length === 0) { setError(t('bulk_select_one_err')); return; }

      if (sameGatha.type !== 'other' && (!sameGatha.sutraName || !sameGatha.totalGatha)) {
        setError(t('bulk_fill_sutra_err')); return;
      }
      if (sameGatha.type === 'other' && sameGatha.otherSubType === 'Other' && !sameGatha.customActivityDescription.trim()) {
        setError('Please describe the activity'); return;
      }
      entries = selected.map(username => buildEntry(sameGatha, username));
    } else {
      if (rows.length === 0) { setError(t('bulk_add_one_err')); return; }
      for (const r of rows) {
        if (r.type !== 'other' && (!r.sutraName || !r.totalGatha)) { setError(t('bulk_fill_all_err')); return; }
        if (r.type === 'other' && r.otherSubType === 'Other' && !r.customActivityDescription.trim()) {
          setError(`Please describe activity for ${r.name}`); return;
        }
      }
      entries = rows.map(r => buildEntry(r, r.username));
    }

    const token = localStorage.getItem('jainPathshalaToken');
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/admin/bulk/gatha`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
      const data = await res.json();
      setSuccess(t('bulk_gatha_saved').replace('{added}', data.added));
      setTimeout(() => setSuccess(''), 4000);
      setSelectedStudents({});
      setRows([]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
        <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5" /> {t('bulk_gatha_title')}</h3>
        <p className="text-purple-100 text-xs mt-1">{t('bulk_gatha_subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-2.5 rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 flex-1">{error}</p>
          <button onClick={() => setError('')}><CloseIcon className="w-4 h-4 text-red-500" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-2.5 rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <p className="text-xs text-green-700 font-semibold">{success}</p>
        </div>
      )}

      {/* Date */}
      <div className="bg-white rounded-xl border-2 border-purple-200 p-3">
        <label className="block text-xs font-bold text-gray-600 mb-1">{t('adm_date_field')}</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl text-sm font-bold focus:outline-none focus:border-purple-400 bg-white" />
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button onClick={() => setMode('same')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === 'same' ? 'bg-white text-purple-700 shadow' : 'text-gray-500'}`}>
          {t('bulk_same_mode')}
        </button>
        <button onClick={() => setMode('individual')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold ${mode === 'individual' ? 'bg-white text-purple-700 shadow' : 'text-gray-500'}`}>
          {t('bulk_individual_mode')}
        </button>
      </div>

      {mode === 'same' ? (
        <>
          {/* Gatha form */}
          <div className="bg-white rounded-xl border-2 border-purple-200 p-3 space-y-3">
            <p className="text-xs font-bold text-gray-600">{t('bulk_gatha_details')}</p>
            <div className="grid grid-cols-2 gap-2">

              {/* Sutra + Gatha — hidden for 'other' */}
              {sameGatha.type !== 'other' && (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{t('adm_sutra_name_field')}</label>
                    <input type="text" value={sameGatha.sutraName}
                      onChange={e => setSameGatha({ ...sameGatha, sutraName: e.target.value })}
                      placeholder="e.g. Navkar"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{t('adm_which_gatha')}</label>
                    <input type="text" value={sameGatha.whichGatha}
                      onChange={e => setSameGatha({ ...sameGatha, whichGatha: e.target.value })}
                      placeholder="e.g. 1-5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-purple-400" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{t('bulk_count_star')}</label>
                    <input type="number" min="1" value={sameGatha.totalGatha}
                      onChange={e => setSameGatha({ ...sameGatha, totalGatha: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-purple-400" />
                  </div>
                </>
              )}

              {/* Type dropdown — always visible */}
              <div className={sameGatha.type !== 'other' ? '' : 'col-span-2'}>
                <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">{t('bulk_type_label')}</label>
                <TypeSelect
                  value={sameGatha.type}
                  onChange={v => setSameGatha({ ...sameGatha, type: v, otherSubType: 'Other', customActivityDescription: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-purple-400 bg-white"
                />
              </div>

              {/* Other section */}
              {sameGatha.type === 'other' && (
                <OtherSection
                  subType={sameGatha.otherSubType}
                  onSubTypeChange={v => setSameGatha({ ...sameGatha, otherSubType: v, customActivityDescription: '' })}
                  description={sameGatha.customActivityDescription}
                  onDescriptionChange={v => setSameGatha({ ...sameGatha, customActivityDescription: v })}
                  subOptions={savedSubOptions}
                  onAddOption={handleAddSubOption}
                />
              )}
            </div>
          </div>

          {/* Student selection */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('adm_search_students')}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
            </div>
            <select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}
              className="px-3 py-2.5 border-2 border-gray-200 rounded-xl text-xs font-bold bg-white">
              <option value="all">{t('adm_all_filter')}</option>
              {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <button onClick={selectAll} className="flex-1 py-2 bg-purple-100 text-purple-700 rounded-xl text-xs font-bold active:scale-95">{t('bulk_select_all')}</button>
            <button onClick={deselectAll} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-bold active:scale-95">{t('bulk_deselect_all')}</button>
          </div>

          <div className="bg-white rounded-xl border-2 border-gray-200 max-h-64 overflow-y-auto divide-y divide-gray-100">
            {filtered.map(s => (
              <button key={s.username} onClick={() => toggleStudent(s.username)}
                className={`w-full flex items-center gap-2 p-2.5 text-left transition-colors ${selectedStudents[s.username] ? 'bg-purple-50' : ''}`}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedStudents[s.username] ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                  {selectedStudents[s.username] && <Check className="w-4 h-4 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-700">{s.name}</p>
                  {groupLookup[s.username] && <p className="text-[10px] text-gray-400">{groupLookup[s.username]}</p>}
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        /* Individual mode */
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('bulk_search_to_add_ph')}
                className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-purple-400" />
            </div>
          </div>

          {search && (
            <div className="bg-white rounded-xl border border-gray-200 max-h-32 overflow-y-auto">
              {filtered.filter(s => !rows.find(r => r.username === s.username)).slice(0, 5).map(s => (
                <button key={s.username} onClick={() => { addRow(s.username); setSearch(''); }}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-purple-50 border-b border-gray-50">
                  <Plus className="w-4 h-4 text-purple-500" />
                  <p className="text-xs font-bold text-gray-700">{s.name}</p>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {rows.map((row, idx) => (
              <div key={row.username} className="bg-white rounded-xl border-2 border-purple-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-gray-700">{row.name}</p>
                  <button onClick={() => removeRow(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {row.type !== 'other' && (
                    <>
                      <input type="text" placeholder={t('adm_sutra_name_field')} value={row.sutraName}
                        onChange={e => updateRow(idx, { sutraName: e.target.value })}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-purple-400" />
                      <input type="text" placeholder={t('adm_which_gatha')} value={row.whichGatha}
                        onChange={e => updateRow(idx, { whichGatha: e.target.value })}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-purple-400" />
                      <input type="number" min="1" placeholder={t('bulk_count_star')} value={row.totalGatha}
                        onChange={e => updateRow(idx, { totalGatha: e.target.value })}
                        className="px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] focus:outline-none focus:border-purple-400" />
                    </>
                  )}
                  <div className={row.type !== 'other' ? '' : 'col-span-2'}>
                    <TypeSelect
                      value={row.type}
                      onChange={v => updateRow(idx, { type: v, otherSubType: 'Other', customActivityDescription: '' })}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-[11px] bg-white"
                    />
                  </div>
                  {row.type === 'other' && (
                    <OtherSection
                      subType={row.otherSubType}
                      onSubTypeChange={v => updateRow(idx, { otherSubType: v, customActivityDescription: '' })}
                      description={row.customActivityDescription}
                      onDescriptionChange={v => updateRow(idx, { customActivityDescription: v })}
                      subOptions={savedSubOptions}
                      onAddOption={handleAddSubOption}
                    />
                  )}
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="text-center text-gray-400 text-xs py-6">{t('bulk_empty_rows_msg')}</p>
            )}
          </div>
        </>
      )}

      <button onClick={handleSave} disabled={saving || selectedCount === 0}
        className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
        {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
        {t('adm_gatha_added')} ({selectedCount} {t('reg_student_col')})
      </button>
    </div>
  );
}
