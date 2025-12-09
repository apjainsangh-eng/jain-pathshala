import React, { useState, useEffect } from 'react';
import AdminDashboard from './AdminDashboard';
import StudentDashboard from './StudentDashboard';
import { BookOpen } from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_BASE || 'https://pathshala-backend.vercel.app/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('jainPathshalaUser');
    const token = localStorage.getItem('jainPathshalaToken');
    
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        handleLogout();
      }
    }
  }, []);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setLoginError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      const endpoint = isAdminLogin ? '/admin/login' : '/login';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username.trim(),
          password: loginForm.password,
        }),
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
  };

  // Show appropriate dashboard based on role
  if (isLoggedIn && currentUser) {
    if (currentUser.role === 'admin') {
      return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
    }
    return <StudentDashboard user={currentUser} onLogout={handleLogout} />;
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-3">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-orange-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-6 text-white text-center">
            <div className="w-16 h-16 bg-white rounded-full mx-auto mb-3 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-1">जय जिनेंद्र</h1>
            <p className="text-orange-100 text-sm">Jain Pathshala Portal</p>
          </div>

          {/* Toggle Admin/Student Login */}
          <div className="flex border-b-2 border-orange-100">
            <button
              onClick={() => { setIsAdminLogin(false); setLoginError(''); }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                !isAdminLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Student Login
            </button>
            <button
              onClick={() => { setIsAdminLogin(true); setLoginError(''); }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                isAdminLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Admin Login
            </button>
          </div>

          {/* Login Form */}
          <div className="p-5">
            {loginError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 rounded">
                <p className="text-xs">{loginError}</p>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
                  {isAdminLogin ? 'Admin Username' : 'Student Username'}
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={isAdminLogin ? 'Enter admin username' : 'Enter student username'}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={isAdminLogin ? 'Enter admin password' : 'Enter your DOB (YYYY-MM-DD)'}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Logging in...
                  </div>
                ) : (
                  `Login as ${isAdminLogin ? 'Admin' : 'Student'}`
                )}
              </button>
            </form>

            {/* Help text */}
            <div className="mt-5 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              {isAdminLogin ? (
                <>
                  <p className="text-blue-700 font-semibold mb-1.5">Admin Accounts:</p>
                  <div className="space-y-0.5 text-blue-600">
                    <p>• admin1 / Admin@123</p>
                    <p>• admin2 / Admin@456</p>
                    <p>• admin3 / Admin@789</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-blue-700 font-semibold mb-1.5">Student Test Accounts:</p>
                  <div className="space-y-0.5 text-blue-600">
                    <p>• AaravSharma / 2005-03-15</p>
                    <p>• PriyaJain / 2004-07-22</p>
                    <p>• RohanGupta / 2005-11-08</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
