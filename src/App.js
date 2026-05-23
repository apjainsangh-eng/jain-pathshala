import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { BookOpen } from 'lucide-react';

const API_BASE = 'https://pathshala-backend.vercel.app/api';

function LoginScreen({ onLogin }) {
  const { t, lang, toggleLang } = useLanguage();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    const username = loginForm.username.trim();
    const password = loginForm.password.trim();

    if (!username || !password) {
      setLoginError(t('err_empty'));
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const studentResponse = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (studentResponse.ok) {
        const data = await studentResponse.json();
        if (data.user && data.token) {
          onLogin(data.user, data.token, data.familyGroup);
          setLoginForm({ username: '', password: '' });
          return;
        }
      }

      const adminResponse = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const adminData = await adminResponse.json();
      if (adminResponse.ok && adminData.user && adminData.token) {
        onLogin(adminData.user, adminData.token, null);
        setLoginForm({ username: '', password: '' });
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-6 text-white text-center relative">
            {/* Language Toggle */}
            <button
              onClick={toggleLang}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-3 py-1.5 rounded-full border border-white/40 transition-colors"
            >
              {t('lang_toggle')}
            </button>

            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-1">પ્રણામ</h1>
            <p className="text-orange-100 text-sm">શ્રી સોમચીન્તામણી વાસુપૂજ્યસ્વામી જૈન પાઠશાળા</p>
          </div>

          {/* Login Form */}
          <div className="p-5">
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                <p className="text-sm">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  {t('username_label')}
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={t('username_placeholder')}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  {t('password_label')}
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={t('password_placeholder')}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all active:scale-[0.98]"
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
                  t('login_btn')
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-400 text-xs mt-4">
          © 2025 આદિनाथ Parshwanath Jain Sangh
        </p>
      </div>
    </div>
  );
}

function AppInner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [familyGroup, setFamilyGroup] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('jainPathshalaUser');
    const token = localStorage.getItem('jainPathshalaToken');
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        const savedFamily = localStorage.getItem('jainPathshalaFamily');
        setCurrentUser(user);
        setFamilyGroup(savedFamily ? JSON.parse(savedFamily) : null);
        setIsLoggedIn(true);
      } catch {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = (user, token, family) => {
    localStorage.setItem('jainPathshalaUser', JSON.stringify(user));
    localStorage.setItem('jainPathshalaToken', token);
    if (family) localStorage.setItem('jainPathshalaFamily', JSON.stringify(family));
    setCurrentUser(user);
    setFamilyGroup(family);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('jainPathshalaUser');
    localStorage.removeItem('jainPathshalaToken');
    localStorage.removeItem('jainPathshalaFamily');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setFamilyGroup(null);
  };

  if (isLoggedIn && currentUser) {
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
    return <StudentDashboard user={currentUser} onLogout={handleLogout} familyGroup={familyGroup} />;
  }

  return <LoginScreen onLogin={handleLogin} />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  );
}
