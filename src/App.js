import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import { BookOpen } from 'lucide-react';

const API_BASE = 'https://pathshala-backend.vercel.app/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Check for existing session
  useEffect(() => {
    const savedUser = localStorage.getItem('jainPathshalaUser');
    const token = localStorage.getItem('jainPathshalaToken');
    
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        handleLogout();
      }
    }
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    const username = loginForm.username.trim();
    const password = loginForm.password.trim();
    
    if (!username || !password) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const endpoint = isAdminLogin ? '/admin/login' : '/login';
      
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.error || 'Login failed');
        return;
      }

      if (data.user && data.token) {
        localStorage.setItem('jainPathshalaUser', JSON.stringify(data.user));
        localStorage.setItem('jainPathshalaToken', data.token);
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setLoginForm({ username: '', password: '' });
        setLoginError('');
      } else {
        setLoginError('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jainPathshalaUser');
    localStorage.removeItem('jainPathshalaToken');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setLoginError('');
    setLoginForm({ username: '', password: '' });
  };

  // Show dashboard based on role
  if (isLoggedIn && currentUser) {
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
    return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-200">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-1">પ્રણામ</h1>
            <p className="text-orange-100 text-sm">શ્રી સોમચીન્તામણી વસુપૂજ્યસ્વામી જૈન પાઠશાળા</p>
          </div>

          {/* Toggle Buttons */}
          <div className="flex border-b-2 border-orange-100">
            <button
              type="button"
              onClick={() => { 
                setIsAdminLogin(false); 
                setLoginError(''); 
                setLoginForm({ username: '', password: '' });
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                !isAdminLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Student Login
            </button>
            <button
              type="button"
              onClick={() => { 
                setIsAdminLogin(true); 
                setLoginError(''); 
                setLoginForm({ username: '', password: '' });
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                isAdminLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Admin Login
            </button>
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
                  {isAdminLogin ? 'Admin Username' : 'Username'}
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={isAdminLogin ? 'Enter admin username' : 'Enter your name'}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder="Enter your password"
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
                    Logging in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-xs mt-4">
          © 2025 આદિનાથ પાર્શ્વનાથ જૈન સંઘ
        </p>
      </div>
    </div>
  );
}
