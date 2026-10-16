'use client';

import React, { useEffect, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { usePathshala, LAST_ADMIN_PATHSHALA_KEY } from '../../PathshalaContext';
import { useLanguage } from '../../LanguageContext';

const API_BASE = '/api';

// Shown in the admin header. Admins who manage more than one pathshala pick which one to work in.
// Renders just the pathshala name for everyone else.
export default function PathshalaSwitcher({ fallbackLabel }) {
  const pathshala = usePathshala();
  const { t } = useLanguage();
  const [options, setOptions] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('jainPathshalaToken');
    fetch(`${API_BASE}/admin/my-pathshalas`, { headers: { Authorization: 'Bearer ' + token } })
      .then((res) => (res.ok ? res.json() : { pathshalas: [] }))
      .then((data) => setOptions(data.pathshalas || []))
      .catch(() => setOptions([]));
  }, []);

  const label = pathshala.name || fallbackLabel;

  if (options.length < 2) {
    return <p className="text-xs text-indigo-600 font-semibold truncate max-w-[180px]">{label}</p>;
  }

  const switchTo = async (pathshalaId) => {
    if (!pathshalaId || pathshalaId === pathshala.id) return;
    setSwitching(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/admin/switch-pathshala`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem('jainPathshalaToken'), 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathshalaId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch');

      localStorage.setItem('jainPathshalaToken', data.token);
      localStorage.setItem('jainPathshalaUser', JSON.stringify(data.user));
      localStorage.setItem('jainPathshalaInfo', JSON.stringify(data.pathshala));
      localStorage.setItem(LAST_ADMIN_PATHSHALA_KEY, data.pathshala.id);
      // Reload so every screen loads the new pathshala's data from scratch
      window.location.reload();
    } catch (err) {
      setError(err.message);
      setSwitching(false);
    }
  };

  return (
    <div className="max-w-[200px]">
      <label className="relative flex items-center">
        <span className="sr-only">{t('adm_switch_pathshala')}</span>
        <select
          value={pathshala.id}
          disabled={switching}
          onChange={(e) => switchTo(e.target.value)}
          className="appearance-none w-full truncate bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg pl-2 pr-6 py-1 focus:outline-none focus:border-indigo-400 disabled:opacity-60"
          title={t('adm_switch_pathshala')}
        >
          {options.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {switching
          ? <RefreshCw className="w-3 h-3 text-indigo-500 absolute right-1.5 animate-spin pointer-events-none" />
          : <ChevronDown className="w-3 h-3 text-indigo-500 absolute right-1.5 pointer-events-none" />}
      </label>
      {error && <p className="text-[10px] text-red-600 mt-0.5">{error}</p>}
    </div>
  );
}
