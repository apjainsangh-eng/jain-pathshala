'use client';

import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { PathshalaProvider, LAST_ADMIN_PATHSHALA_KEY } from './PathshalaContext';
import { Phone, Lock, LogIn } from 'lucide-react';
import { Toran, Lotus, TempleArch } from './Decor';

const API_BASE = '/api';

const KEYS = {
  user: 'jainPathshalaUser',
  token: 'jainPathshalaToken',
  family: 'jainPathshalaFamily',
  pathshala: 'jainPathshalaInfo',
};
function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function LoginScreen({ onLogin }) {
  const { t, toggleLang } = useLanguage();
  const [loginForm, setLoginForm] = useState({ mobile: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const mobile = loginForm.mobile.replace(/\D/g, '');
    const password = loginForm.password.trim();

    if (!mobile || !password) {
      setLoginError(t('err_empty'));
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      // One login for students, families and admins; the mobile number decides the pathshala
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Admins with several pathshalas reopen the one they used last
        body: JSON.stringify({ mobile, password, lastPathshalaId: localStorage.getItem(LAST_ADMIN_PATHSHALA_KEY) }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.user && data.token) {
        onLogin(data.user, data.token, data.familyGroup || null, data.pathshala);
        setLoginForm({ mobile: '', password: '' });
      } else if (res.status === 403) {
        setLoginError(data.inactive ? t('err_account_inactive') : t('err_pathshala_inactive'));
      } else if (res.status === 400) {
        setLoginError(t('err_mobile_format'));
      } else {
        setLoginError(t('err_invalid'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError(t('err_network'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="clay-ui min-h-screen bg-pathshala flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-temple overflow-hidden border border-sona-300/70">
          <Toran />

          {/* Header: temple colours with a lotus emblem */}
          <div className="relative bg-gradient-to-b from-kumkum-700 via-kumkum-600 to-kesar-600 px-6 pt-6 pb-10 text-white text-center">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="absolute top-3 right-3 bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/40 transition-colors"
            >
              {t('lang_toggle')}
            </button>

            <div className="w-20 h-20 bg-chandan-100 rounded-full mx-auto mb-3 flex items-center justify-center ring-4 ring-sona-400/60 shadow-lg">
              <Lotus className="w-12 h-12" />
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">પ્રણામ</h1>
            <p className="text-chandan-200 text-sm mt-1">{t('app_tagline')}</p>
            <TempleArch className="absolute -bottom-px left-0 text-white" />
          </div>

          {/* Login Form */}
          <div className="p-5">
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl">
                <p className="text-sm">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-kumkum-900 font-semibold mb-2 text-sm">
                  {t('mobile_label')}
                </label>
                <div className="relative">
                <Phone className="w-5 h-5 text-kesar-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={loginForm.mobile}
                  onChange={(e) => setLoginForm({ ...loginForm, mobile: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-chandan-50 border-2 border-chandan-300 rounded-2xl focus:outline-none focus:border-kesar-500 focus:bg-white text-lg tracking-wider font-semibold text-gray-800 placeholder:text-sm placeholder:tracking-normal placeholder:font-normal transition-colors"
                  placeholder={t('mobile_placeholder')}
                  disabled={isLoading}
                  autoComplete="tel-national"
                  maxLength={14}
                />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-kumkum-900 font-semibold mb-2 text-sm">
                  {t('password_label')}
                </label>
                <div className="relative">
                <Lock className="w-5 h-5 text-kesar-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-3.5 bg-chandan-50 border-2 border-chandan-300 rounded-2xl focus:outline-none focus:border-kesar-500 focus:bg-white text-base text-gray-800 transition-colors"
                  placeholder={t('password_placeholder')}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-kesar-600 to-kumkum-600 text-white font-bold text-base py-3.5 rounded-2xl shadow-temple disabled:opacity-50 transition-all active:scale-[0.98] hover:brightness-110"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('logging_in')}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> {t('login_btn')}</span>
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">{t('login_help')}</p>
          </div>
          <Toran className="rotate-180" />
        </div>
        <p className="text-center text-kumkum-800/60 text-xs mt-4 font-display">॥ સમ્યગ્ દર્શન · સમ્યગ્ જ્ઞાન · સમ્યગ્ ચારિત્ર ॥</p>

        {/* Credit */}
        <div className="mt-3 text-center text-[11px] text-gray-500 leading-relaxed">
          <p>Created by <span className="font-semibold text-kumkum-800">Moksh Mehta</span></p>
          <p>
            <a href="tel:+918141392124" className="hover:text-kumkum-700 underline-offset-2 hover:underline">+91 81413 92124</a>
            <span className="mx-1.5">·</span>
            <a href="mailto:mehtamoksh.mm@gmail.com" className="hover:text-kumkum-700 underline-offset-2 hover:underline">mehtamoksh.mm@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function AppInner() {
  const [currentUser, setCurrentUser] = useState(null);
  const [familyGroup, setFamilyGroup] = useState(null);
  const [pathshala, setPathshala] = useState(null);

  const handleLogout = () => {
    const wasSuperAdmin = !!readJSON(KEYS.user)?.openedBySuperAdmin;
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    setCurrentUser(null);
    setFamilyGroup(null);
    setPathshala(null);
    // Super admin "opened" this pathshala's admin panel; send them back to their own dashboard
    if (wasSuperAdmin) window.location.href = '/superadmin';
  };

  useEffect(() => {
    const user = readJSON(KEYS.user);
    const token = localStorage.getItem(KEYS.token);
    const info = readJSON(KEYS.pathshala);
    if (!user || !token || !info) {
      if (user || token) handleLogout();
      return;
    }
    setCurrentUser(user);
    setFamilyGroup(readJSON(KEYS.family));
    setPathshala(info);

    // Drop sessions the server no longer accepts (expired, pathshala deactivated, or an old-style token)
    fetch(`${API_BASE}/activity-types`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { if (res.status === 401) handleLogout(); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.title = pathshala?.name || 'Jain Pathshala Portal';
  }, [pathshala]);

  const handleLogin = (user, token, family, info) => {
    localStorage.setItem(KEYS.user, JSON.stringify(user));
    localStorage.setItem(KEYS.token, token);
    localStorage.setItem(KEYS.pathshala, JSON.stringify(info));
    if (user.role === 'admin' && info?.id) localStorage.setItem(LAST_ADMIN_PATHSHALA_KEY, info.id);
    if (family) localStorage.setItem(KEYS.family, JSON.stringify(family));
    else localStorage.removeItem(KEYS.family);
    setCurrentUser(user);
    setFamilyGroup(family);
    setPathshala(info);
  };

  if (!currentUser || !pathshala) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <PathshalaProvider value={pathshala}>
      {currentUser.role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={currentUser} onLogout={handleLogout} familyGroup={familyGroup} />
      )}
    </PathshalaProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
