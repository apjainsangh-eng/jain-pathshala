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
    
    const trimmedUsername = loginForm.username.trim();
    const trimmedPassword = loginForm.password.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
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
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: trimmedPassword,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        setLoginError('Server error. Please try again.');
        return;
      }

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
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setLoginError('Cannot connect to server. Please check your internet connection.');
      } else {
        setLoginError('Network error. Please try again.');
      }
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
              type="button"
              onClick={() => { 
                setIsAdminLogin(false); 
                setLoginError(''); 
                setLoginForm({ username: '', password: '' });
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                !isAdminLogin
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  {isAdminLogin ? 'Admin Username' : 'Username'}
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={isAdminLogin ? 'Enter admin username' : 'Enter your name'}
                  disabled={isLoading}
                  autoComplete="username"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-1.5 text-sm">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3.5 rounded-xl active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Logging in...
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-4">
          © 2024 Jain Pathshala
        </p>
      </div>
    </div>
  );
}
