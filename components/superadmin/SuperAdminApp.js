'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Shield, Plus, Copy, ExternalLink, LogOut, Users, UserCog, KeyRound, Trash2, Power,
  Pencil, Check, X, ChevronDown, ChevronUp, RefreshCw, BookOpen,
} from 'lucide-react';

const API_BASE = '/api';
const TOKEN_KEY = 'jainPathshalaSuperToken';
const USER_KEY = 'jainPathshalaSuperUser';

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const res = await fetch(API_BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const inputClass = 'w-full px-3 py-2.5 border-2 border-indigo-100 rounded-xl focus:outline-none focus:border-indigo-400 text-sm';
const primaryBtn = 'inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow disabled:opacity-50 active:scale-[0.98]';
const ghostBtn = 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors';

// ---------------- Login ----------------

function LoginScreen({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/superadmin/login', { method: 'POST', body: form });
      onLogin(data.user, data.token);
    } catch (err) {
      setError(err.status === 401 ? 'Wrong username or password' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pathshala flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-indigo-200">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
            <Shield className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-xl font-bold">Super Admin</h1>
          <p className="text-indigo-100 text-sm">Manage all pathshalas</p>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded text-sm">{error}</div>}
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">Username</label>
            <input className={inputClass} value={form.username} autoComplete="username"
              onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1.5 text-sm">Password</label>
            <input type="password" className={inputClass} value={form.password} autoComplete="current-password"
              onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <button type="submit" disabled={loading || !form.username || !form.password} className={primaryBtn + ' w-full'}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------- New pathshala ----------------

function NewPathshalaForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({ name: '', sanghName: '', slug: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api('/superadmin/pathshalas', { method: 'POST', body: form });
      onCreated(`Pathshala created. Now add an admin for it.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow p-4 border-2 border-indigo-200 space-y-3">
      <h3 className="font-bold text-gray-800">New pathshala</h3>
      {error && <div className="p-2.5 bg-red-50 border-l-4 border-red-400 text-red-700 rounded text-sm">{error}</div>}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Pathshala name (shown on login and header)</label>
        <input className={inputClass} value={form.name} placeholder="શ્રી ... જૈન પાઠશાળા"
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Sangh name (shown in footer)</label>
        <input className={inputClass} value={form.sanghName} placeholder="e.g. Parshwanath Jain Sangh"
          onChange={(e) => {
            const sanghName = e.target.value;
            setForm((f) => ({ ...f, sanghName, slug: slugTouched ? f.slug : slugify(sanghName) }));
          }} />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Short code</label>
        <input className={inputClass} value={form.slug} placeholder="parshwanath"
          onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }} />
        <p className="text-[11px] text-gray-400 mt-1">For your reference only (lowercase letters, numbers, hyphens). Everyone logs in on the same page with their mobile number.</p>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className={ghostBtn + ' border-gray-200 text-gray-600'}>Cancel</button>
        <button type="submit" disabled={saving || !form.name.trim() || form.slug.length < 3} className={primaryBtn}>
          {saving ? 'Creating…' : 'Create pathshala'}
        </button>
      </div>
    </form>
  );
}

// ---------------- Admins of one pathshala ----------------

function AdminsPanel({ pathshala, notify, onChanged }) {
  const [admins, setAdmins] = useState(null);
  const [form, setForm] = useState({ name: '', mobile: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // { id, field: 'password' | 'mobile' } for the inline editor that's open
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');

  const load = useCallback(async () => {
    try {
      setAdmins(await api(`/superadmin/pathshalas/${pathshala.id}/admins`));
    } catch (err) {
      setError(err.message);
    }
  }, [pathshala.id]);

  useEffect(() => { load(); }, [load]);

  const run = async (fn, message) => {
    setError('');
    setBusy(true);
    try {
      const data = await fn();
      // Without a fixed message, show the server's (e.g. "added to this pathshala too")
      notify(message || data?.message || 'Done');
      await load();
      onChanged();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const addAdmin = async (e) => {
    e.preventDefault();
    const ok = await run(() => api(`/superadmin/pathshalas/${pathshala.id}/admins`, { method: 'POST', body: form }), null);
    if (ok) setForm({ name: '', mobile: '', password: '' });
  };

  const openEditor = (id, field, value = '') => {
    const same = editing?.id === id && editing?.field === field;
    setEditing(same ? null : { id, field });
    setEditValue(same ? '' : value);
  };

  const saveEdit = async (admin) => {
    const body = editing.field === 'password' ? { password: editValue } : { mobile: editValue };
    const message = editing.field === 'password' ? `Password reset for ${admin.name}` : `Mobile updated for ${admin.name}`;
    const ok = await run(() => api(`/superadmin/admins/${admin.id}`, { method: 'PUT', body }), message);
    if (ok) { setEditing(null); setEditValue(''); }
  };

  const mobileDigits = (v) => v.replace(/\D/g, '');

  return (
    <div className="mt-3 pt-3 border-t border-indigo-100 space-y-3">
      {error && <div className="p-2.5 bg-red-50 border-l-4 border-red-400 text-red-700 rounded text-xs">{error}</div>}

      {admins === null ? (
        <p className="text-xs text-gray-400">Loading admins…</p>
      ) : admins.length === 0 ? (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">No admins yet. Add one below so this pathshala can be managed.</p>
      ) : (
        <ul className="space-y-2">
          {admins.map((a) => (
            <li key={a.id} className={`rounded-xl border p-2.5 ${a.isActive ? 'border-gray-200 bg-gray-50' : 'border-gray-200 bg-gray-100 opacity-70'}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{a.name}</p>
                  {a.mobile ? (
                    <p className="text-xs text-gray-500 truncate">📱 {a.mobile}{!a.isActive && ' · disabled'}</p>
                  ) : (
                    <p className="text-xs font-semibold text-red-600">No mobile number — can't log in</p>
                  )}
                  {a.pathshalaCount > 1 && (
                    <p className="text-[11px] text-purple-600 font-semibold">
                      Also admin of {a.pathshalaCount - 1} other pathshala{a.pathshalaCount > 2 ? 's' : ''} · mobile, password and disable apply to all
                    </p>
                  )}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button title="Change mobile number" disabled={busy} onClick={() => openEditor(a.id, 'mobile', a.mobile || '')}
                    className={ghostBtn + ' border-indigo-200 text-indigo-600 bg-white'}><Pencil className="w-3.5 h-3.5" /></button>
                  <button title="Reset password" disabled={busy} onClick={() => openEditor(a.id, 'password')}
                    className={ghostBtn + ' border-indigo-200 text-indigo-600 bg-white'}><KeyRound className="w-3.5 h-3.5" /></button>
                  <button title={a.isActive ? 'Disable' : 'Enable'} disabled={busy}
                    onClick={() => run(() => api(`/superadmin/admins/${a.id}`, { method: 'PUT', body: { isActive: !a.isActive } }), a.isActive ? 'Admin disabled' : 'Admin enabled')}
                    className={ghostBtn + ' border-amber-200 text-amber-600 bg-white'}><Power className="w-3.5 h-3.5" /></button>
                  <button title="Remove from this pathshala" disabled={busy}
                    onClick={() => {
                      const msg = a.pathshalaCount > 1
                        ? `Remove "${a.name}" from this pathshala? They stay admin of their other pathshalas.`
                        : `Remove "${a.name}"? This is their only pathshala, so the admin login is deleted.`;
                      if (window.confirm(msg)) run(() => api(`/superadmin/pathshalas/${pathshala.id}/admins/${a.id}`, { method: 'DELETE' }), null);
                    }}
                    className={ghostBtn + ' border-red-200 text-red-600 bg-white'}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {editing?.id === a.id && (
                <div className="flex gap-2 mt-2">
                  {editing.field === 'mobile' ? (
                    <input type="tel" inputMode="numeric" className={inputClass + ' py-1.5'} placeholder="10-digit mobile number" value={editValue}
                      onChange={(e) => setEditValue(mobileDigits(e.target.value))} maxLength={10} />
                  ) : (
                    <input type="text" className={inputClass + ' py-1.5'} placeholder="New password (min 6)" value={editValue}
                      onChange={(e) => setEditValue(e.target.value)} />
                  )}
                  <button
                    disabled={busy || (editing.field === 'mobile' ? editValue.length !== 10 : editValue.length < 6)}
                    onClick={() => saveEdit(a)} className={primaryBtn + ' py-1.5'}>Save</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addAdmin} className="bg-indigo-50/60 rounded-xl p-2.5 space-y-2">
        <p className="text-xs font-bold text-indigo-700">Add admin</p>
        <input className={inputClass + ' py-2'} placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <input type="tel" inputMode="numeric" className={inputClass + ' py-2'} placeholder="Mobile number" maxLength={10}
            value={form.mobile} onChange={(e) => setForm({ ...form, mobile: mobileDigits(e.target.value) })} />
          <input className={inputClass + ' py-2'} placeholder="Password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <p className="text-[11px] text-gray-500">
          The admin logs in on the main page with this mobile number and password.
          To give an existing admin (from another pathshala) access here, just enter their mobile number; name and password are kept.
        </p>
        <button type="submit" disabled={busy || form.mobile.length !== 10} className={primaryBtn + ' w-full py-2'}>
          <Plus className="w-4 h-4" /> Add admin
        </button>
      </form>
    </div>
  );
}

// ---------------- One pathshala card ----------------

function PathshalaCard({ p, notify, reload }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name: p.name, sanghName: p.sanghName });
  const [busy, setBusy] = useState(false);
  // Same login page for every pathshala; the mobile number decides which one
  const link = typeof window !== 'undefined' ? `${window.location.origin}/` : '/';

  const update = async (body, message) => {
    setBusy(true);
    try {
      await api(`/superadmin/pathshalas/${p.id}`, { method: 'PUT', body });
      notify(message);
      setEditing(false);
      reload();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify('Link copied');
    } catch {
      notify(link);
    }
  };

  const openAsAdmin = async () => {
    setBusy(true);
    try {
      const data = await api(`/superadmin/pathshalas/${p.id}/open-as-admin`, { method: 'POST' });
      localStorage.setItem('jainPathshalaUser', JSON.stringify({ ...data.user, openedBySuperAdmin: true }));
      localStorage.setItem('jainPathshalaToken', data.token);
      localStorage.setItem('jainPathshalaInfo', JSON.stringify(data.pathshala));
      localStorage.removeItem('jainPathshalaFamily');
      window.location.href = '/';
    } catch (err) {
      notify(err.message, true);
      setBusy(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow p-4 border-2 ${p.isActive ? 'border-indigo-100' : 'border-gray-200 bg-gray-50'}`}>
      {editing ? (
        <div className="space-y-2">
          <input className={inputClass} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Pathshala name" />
          <input className={inputClass} value={edit.sanghName} onChange={(e) => setEdit({ ...edit, sanghName: e.target.value })} placeholder="Sangh name" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditing(false); setEdit({ name: p.name, sanghName: p.sanghName }); }} className={ghostBtn + ' border-gray-200 text-gray-600'}><X className="w-3.5 h-3.5" /> Cancel</button>
            <button disabled={busy || !edit.name.trim()} onClick={() => update(edit, 'Pathshala updated')} className={ghostBtn + ' border-indigo-300 text-white bg-indigo-500'}><Check className="w-3.5 h-3.5" /> Save</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 truncate">{p.name}</h3>
              {!p.isActive && <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">INACTIVE</span>}
            </div>
            {p.sanghName && <p className="text-xs text-gray-500 truncate">{p.sanghName}</p>}
            <p className="text-xs text-indigo-600 font-mono mt-0.5 truncate">/{p.slug}</p>
          </div>
          <button title="Edit" onClick={() => setEditing(true)} className="p-1.5 text-gray-400 hover:text-indigo-600"><Pencil className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-3 mt-3 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-orange-500" /> {p.studentCount} students</span>
        <span className="inline-flex items-center gap-1"><UserCog className="w-3.5 h-3.5 text-indigo-500" /> {p.adminCount} admins</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        <button onClick={copyLink} className={ghostBtn + ' border-gray-200 text-gray-700'}><Copy className="w-3.5 h-3.5" /> Copy link</button>
        <button onClick={openAsAdmin} disabled={busy || !p.isActive} className={ghostBtn + ' border-indigo-200 text-indigo-700 disabled:opacity-40'}><ExternalLink className="w-3.5 h-3.5" /> Open admin panel</button>
        <button
          onClick={() => {
            const msg = p.isActive
              ? `Deactivate "${p.name}"? Its students and admins won't be able to log in until you turn it back on. No data is deleted.`
              : `Turn "${p.name}" back on?`;
            if (window.confirm(msg)) update({ isActive: !p.isActive }, p.isActive ? 'Pathshala deactivated' : 'Pathshala activated');
          }}
          disabled={busy}
          className={ghostBtn + (p.isActive ? ' border-amber-200 text-amber-700' : ' border-green-200 text-green-700')}
        >
          <Power className="w-3.5 h-3.5" /> {p.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button onClick={() => setOpen(!open)} className={ghostBtn + ' border-purple-200 text-purple-700 ml-auto'}>
          Admins {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {open && <AdminsPanel pathshala={p} notify={notify} onChanged={reload} />}
    </div>
  );
}

// ---------------- Dashboard ----------------

function Dashboard({ user, onLogout }) {
  const [pathshalas, setPathshalas] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    try {
      setError('');
      setPathshalas(await api('/superadmin/pathshalas'));
    } catch (err) {
      if (err.status === 401 || err.status === 403) onLogout();
      else setError(err.message);
    }
  }, [onLogout]);

  useEffect(() => { load(); }, [load]);

  const totals = (pathshalas || []).reduce(
    (t, p) => ({ students: t.students + p.studentCount, admins: t.admins + p.adminCount, active: t.active + (p.isActive ? 1 : 0) }),
    { students: 0, admins: 0, active: 0 }
  );

  return (
    <div className="min-h-screen bg-pathshala p-3 sm:p-4">
      <div className="max-w-2xl mx-auto space-y-3">
        <div className="bg-white rounded-2xl shadow-xl p-3 border-4 border-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-800 truncate">{user.name}</h1>
              <p className="text-xs text-indigo-600 font-semibold">Super Admin</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={load} title="Refresh" className="p-2 bg-indigo-100 text-indigo-700 rounded-xl"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onLogout} className="inline-flex items-center gap-1 bg-red-50 text-red-600 font-bold text-xs px-3 py-2 rounded-xl border border-red-200">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Pathshalas', value: pathshalas ? `${totals.active}/${pathshalas.length}` : '–', icon: BookOpen, color: 'text-purple-600' },
            { label: 'Students', value: pathshalas ? totals.students : '–', icon: Users, color: 'text-orange-500' },
            { label: 'Admins', value: pathshalas ? totals.admins : '–', icon: UserCog, color: 'text-indigo-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl shadow p-3 text-center">
              <Icon className={`w-5 h-5 mx-auto ${color}`} />
              <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
              <p className="text-[11px] text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {creating ? (
          <NewPathshalaForm onCancel={() => setCreating(false)} onCreated={(msg) => { setCreating(false); notify(msg); load(); }} />
        ) : (
          <button onClick={() => setCreating(true)} className={primaryBtn + ' w-full py-3'}>
            <Plus className="w-5 h-5" /> New pathshala
          </button>
        )}

        {error && <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded text-sm">{error}</div>}

        {pathshalas === null && !error ? (
          <p className="text-center text-sm text-gray-400 py-8">Loading…</p>
        ) : pathshalas?.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-8">No pathshalas yet. Create the first one above.</p>
        ) : (
          pathshalas?.map((p) => <PathshalaCard key={p.id} p={p} notify={notify} reload={load} />)
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold text-white max-w-[90vw] break-all ${toast.isError ? 'bg-red-500' : 'bg-gray-800'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminApp() {
  const [user, setUser] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) ? JSON.parse(localStorage.getItem(USER_KEY) || 'null') : null;
    } catch {
      return null;
    }
  });

  useEffect(() => { document.title = 'Super Admin · Jain Pathshala'; }, []);

  const handleLogin = (u, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginScreen onLogin={handleLogin} />;
}
