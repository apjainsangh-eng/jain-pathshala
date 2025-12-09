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
      
      console.log('Attempting login to:', `${API_BASE}${endpoint}`);
      console.log('With credentials:', { username: trimmedUsername, password: trimmedPassword });
      
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

      console.log('Response status:', response.status);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        setLoginError('Server error. Please try again.');
        return;
      }

      const data = await response.json();
      console.log('Response data:', data);

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
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setLoginError('Cannot connect to server. Please check your internet connection.');
      } else {
        setLoginError(`Network error: ${error.message}`);
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
                  {isAdminLogin ? 'Admin Username' : 'Student Username'}
                </label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full px-3 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 text-sm"
                  placeholder={isAdminLogin ? 'e.g., admin1' : 'e.g., AaravSharma'}
                  disabled={isLoading}
                  autoComplete="username"
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
                  placeholder={isAdminLogin ? 'e.g., Admin@123' : 'e.g., 2005-03-15'}
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
                  `Login as ${isAdminLogin ? 'Admin' : 'Student'}`
                )}
              </button>
            </form>

            {/* Quick Fill Buttons for Testing */}
            <div className="mt-4 space-y-2">
              <p className="text-xs text-gray-500 text-center">Quick fill for testing:</p>
              {isAdminLogin ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'admin1', password: 'Admin@123' })}
                    className="flex-1 text-xs bg-indigo-100 text-indigo-700 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Admin 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'admin2', password: 'Admin@456' })}
                    className="flex-1 text-xs bg-indigo-100 text-indigo-700 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Admin 2
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'admin3', password: 'Admin@789' })}
                    className="flex-1 text-xs bg-indigo-100 text-indigo-700 py-2 rounded-lg hover:bg-indigo-200 transition-colors"
                  >
                    Admin 3
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'AaravSharma', password: '2005-03-15' })}
                    className="flex-1 text-xs bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Aarav
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'PriyaJain', password: '2004-07-22' })}
                    className="flex-1 text-xs bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Priya
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginForm({ username: 'RohanGupta', password: '2005-11-08' })}
                    className="flex-1 text-xs bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Rohan
                  </button>
                </div>
              )}
            </div>

            {/* Help text */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
              {isAdminLogin ? (
                <>
                  <p className="text-blue-700 font-semibold mb-1.5">Admin Credentials:</p>
                  <div className="space-y-0.5 text-blue-600">
                    <p>• <strong>admin1</strong> / Admin@123</p>
                    <p>• <strong>admin2</strong> / Admin@456</p>
                    <p>• <strong>admin3</strong> / Admin@789</p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-blue-700 font-semibold mb-1.5">Student Credentials:</p>
                  <div className="space-y-0.5 text-blue-600">
                    <p>• <strong>AaravSharma</strong> / 2005-03-15</p>
                    <p>• <strong>PriyaJain</strong> / 2004-07-22</p>
                    <p>• <strong>RohanGupta</strong> / 2005-11-08</p>
                  </div>
                  <p className="mt-2 text-gray-500 italic">Password = Date of Birth (YYYY-MM-DD)</p>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-4">
          © 2024 Jain Pathshala. All rights reserved.
        </p>
      </div>
    </div>
  );
}
