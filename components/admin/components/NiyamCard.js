'use client';

import React, { useEffect, useState } from 'react';
import { BookMarked, RefreshCw, ExternalLink, Users } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

const API_BASE = '/api';
const auth = () => ({ Authorization: 'Bearer ' + localStorage.getItem('jainPathshalaToken') });

// Niyam Yatra for this pathshala: open its admin (signed in automatically) and send students across.
export default function NiyamCard() {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [opening, setOpening] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/admin/niyam/status`, { headers: auth() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setEnabled(!!d?.enabled))
      .catch(() => {});
  }, []);

  if (!enabled) return null;

  const open = async () => {
    setOpening(true);
    setNote('');
    try {
      const res = await fetch(`${API_BASE}/niyam/handoff`, { method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: '{}' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || t('niyam_open_failed'));
      window.location.assign(data.url);
    } catch (e) {
      setNote(e.message);
      setOpening(false);
    }
  };

  const sync = async () => {
    setSyncing(true);
    setNote('');
    try {
      const res = await fetch(`${API_BASE}/admin/niyam/sync`, { method: 'POST', headers: auth() });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || t('niyam_sync_failed'));
      setNote(t('niyam_sync_done').replace('{created}', d.created || 0).replace('{linked}', d.linked || 0));
    } catch (e) {
      setNote(e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-100 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <BookMarked className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-gray-800">{t('nav_niyam')}</span>
          <span className="block text-xs text-gray-500">{t('niyam_admin_desc')}</span>
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button onClick={open} disabled={opening} className="flex items-center justify-center gap-1.5 bg-amber-500 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-50">
          {opening ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} {t('niyam_open_admin')}
        </button>
        <button onClick={sync} disabled={syncing} className="flex items-center justify-center gap-1.5 bg-white border-2 border-amber-200 text-amber-800 text-xs font-bold py-2.5 rounded-xl disabled:opacity-50">
          {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />} {t('niyam_sync')}
        </button>
      </div>
      {note && <p className="text-xs text-gray-600 mt-2">{note}</p>}
    </div>
  );
}
