'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Users, User, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

const API_BASE = '/api';
const auth = () => ({ Authorization: 'Bearer ' + localStorage.getItem('jainPathshalaToken') });

// Admin overview card: connect Telegram chats that receive approval requests (with Approve / Reject buttons)
export default function TelegramCard() {
  const { t } = useLanguage();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/telegram`, { headers: auth() });
      if (res.ok) setInfo(await res.json());
    } catch { /* offline: try again later */ }
  }, []);

  useEffect(() => { load(); return () => clearInterval(pollRef.current); }, [load]);

  // After opening Telegram, check every few seconds until the new chat shows up
  const waitForConnection = (before) => {
    setWaiting(true);
    clearInterval(pollRef.current);
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const res = await fetch(`${API_BASE}/admin/telegram`, { headers: auth() });
        const data = res.ok ? await res.json() : null;
        if (data) setInfo(data);
        if ((data && data.chats.length > before) || tries > 40) {
          clearInterval(pollRef.current);
          setWaiting(false);
        }
      } catch { /* keep trying */ }
    }, 3000);
  };

  const connect = async (group) => {
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/admin/telegram/link`, { method: 'POST', headers: auth() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(group ? data.groupUrl : data.url, '_blank', 'noopener');
      waitForConnection(info?.chats.length || 0);
    } catch {
      // Card stays as it is; admin can retry
    } finally {
      setBusy(false);
    }
  };

  const remove = async (chat) => {
    if (!window.confirm(t('tgc_remove_confirm').replace('{name}', chat.title))) return;
    await fetch(`${API_BASE}/admin/telegram/chats/${encodeURIComponent(chat.chatId)}`, { method: 'DELETE', headers: auth() });
    load();
  };

  if (!info) return null;
  const connected = info.chats.length > 0;

  return (
    <div className="bg-white rounded-2xl border-2 border-sky-100 p-3 shadow-sm">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 text-left">
        <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
          <Send className="w-5 h-5" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-gray-800">{t('tgc_title')}</span>
          <span className={`block text-xs ${connected ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>
            {!info.enabled ? t('tgc_not_setup') : connected ? t('tgc_connected_n').replace('{n}', info.chats.length) : t('tgc_off')}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {!info.enabled ? (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3">{t('tgc_not_setup_desc')}</p>
          ) : (
            <>
              <p className="text-xs text-gray-600">{t('tgc_desc')}</p>

              {info.chats.map((c) => (
                <div key={c.chatId} className="flex items-center gap-2 bg-sky-50 rounded-xl px-3 py-2">
                  {c.type === 'private' ? <User className="w-4 h-4 text-sky-600" /> : <Users className="w-4 h-4 text-sky-600" />}
                  <span className="flex-1 text-sm font-semibold text-gray-800 truncate">{c.title}</span>
                  <button onClick={() => remove(c)} className="p-1.5 text-red-500" aria-label={t('tgc_remove')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => connect(false)}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 bg-sky-500 text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-50"
                >
                  <User className="w-4 h-4" /> {t('tgc_connect_me')}
                </button>
                <button
                  onClick={() => connect(true)}
                  disabled={busy}
                  className="flex items-center justify-center gap-1.5 bg-white border-2 border-sky-200 text-sky-700 text-xs font-bold py-2.5 rounded-xl disabled:opacity-50"
                >
                  <Users className="w-4 h-4" /> {t('tgc_connect_group')}
                </button>
              </div>

              {waiting && (
                <p className="flex items-center gap-2 text-xs text-sky-700">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {t('tgc_waiting')}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
