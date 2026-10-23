'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Send, Users, User, Trash2, RefreshCw, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../LanguageContext';

const API_BASE = '/api';
const ABSENT_OPTIONS = [3, 5, 7, 10, 14, 21, 30];
const auth = () => ({ Authorization: 'Bearer ' + localStorage.getItem('jainPathshalaToken') });

// Admin overview card: connect Telegram chats that receive approval requests (with Approve / Reject buttons)
export default function TelegramCard() {
  const { t } = useLanguage();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const pollRef = useRef(null);
  const [test, setTest] = useState({ kind: null, state: 'idle' }); // state: idle | sending | sent | failed

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

  // Schedule settings save as soon as they change
  const saveSetting = async (patch) => {
    setInfo((i) => ({ ...i, settings: { ...i.settings, ...patch } }));
    try {
      const res = await fetch(`${API_BASE}/admin/telegram/settings`, {
        method: 'PUT', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (res.ok) setInfo((i) => ({ ...i, settings: data.settings }));
      else load();
    } catch { load(); }
  };

  const sendTest = async (kind) => {
    setTest({ kind, state: 'sending' });
    try {
      const res = await fetch(`${API_BASE}/admin/telegram/test-summary`, {
        method: 'POST', headers: { ...auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }),
      });
      setTest({ kind, state: res.ok ? 'sent' : 'failed' });
    } catch { setTest({ kind, state: 'failed' }); }
    setTimeout(() => setTest({ kind: null, state: 'idle' }), 4000);
  };
  const testLabel = (kind, idleKey) => {
    if (test.kind !== kind) return t(idleKey);
    return test.state === 'sending' ? t('tgs_sending') : test.state === 'sent' ? t('tgs_sent') : test.state === 'failed' ? t('tgs_failed') : t(idleKey);
  };

  if (!info) return null;
  const connected = info.chats.length > 0;
  const st = info.settings || {};

  const Toggle = ({ on, onChange, label }) => (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center gap-3 w-full text-left">
      <span className={`w-10 h-6 rounded-full p-0.5 transition-colors flex-shrink-0 ${on ? 'bg-sky-500' : 'bg-gray-300'}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-4' : ''}`} />
      </span>
      <span className="text-sm font-semibold text-gray-800">{label}</span>
    </button>
  );
  const selectClass = 'mt-1.5 ml-[52px] px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700';

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

              {connected && (
                <div className="border-t border-sky-100 pt-3 space-y-3">
                  <p className="text-xs font-bold text-gray-700">{t('tgs_title')}</p>

                  <div>
                    <Toggle on={!!st.summaryEnabled} onChange={(v) => saveSetting({ summaryEnabled: v })} label={t('tgs_summary')} />
                    {st.summaryEnabled && <p className="ml-[52px] text-[11px] text-gray-500 mt-1">{t('tgs_midnight_note')}</p>}
                  </div>

                  <div>
                    <Toggle on={!!st.weeklyEnabled} onChange={(v) => saveSetting({ weeklyEnabled: v })} label={t('tgs_weekly')} />
                    {st.weeklyEnabled && <p className="ml-[52px] text-[11px] text-gray-500 mt-1">{t('tgs_weekly_note')}</p>}
                  </div>

                  <div>
                    <Toggle on={!!st.absentEnabled} onChange={(v) => saveSetting({ absentEnabled: v })} label={t('tgs_absent')} />
                    {st.absentEnabled && (
                      <select value={st.absentDays} onChange={(e) => saveSetting({ absentDays: Number(e.target.value) })} className={selectClass} aria-label={t('tgs_absent_days')}>
                        {(ABSENT_OPTIONS.includes(st.absentDays) ? ABSENT_OPTIONS : [...ABSENT_OPTIONS, st.absentDays].sort((a, b) => a - b)).map((d) => (
                          <option key={d} value={d}>{t('tgs_absent_after').replace('{n}', d)}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[['daily', 'tgs_test'], ['weekly', 'tgs_test_weekly']].map(([kind, key]) => (
                      <button
                        key={kind}
                        onClick={() => sendTest(kind)}
                        disabled={test.state === 'sending'}
                        className="flex items-center justify-center gap-1.5 bg-white border-2 border-sky-200 text-sky-700 text-xs font-bold py-2.5 px-2 rounded-xl disabled:opacity-50"
                      >
                        <Send className="w-4 h-4 flex-shrink-0" />
                        {testLabel(kind, key)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 bg-gray-50 rounded-xl p-2.5">{t('tgs_commands')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
