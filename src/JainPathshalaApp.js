import React, { useState } from 'react';
import { Calendar, BookOpen, User, LogOut, Check, Heart, BarChart3, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function JainPathshalaApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [gathaEntries, setGathaEntries] = useState([]);
  const [showGathaForm, setShowGathaForm] = useState(false);
  const [gathaType, setGathaType] = useState('');
  const [gathaForm, setGathaForm] = useState({
    sutraName: '',
    whichGatha: '',
    totalGatha: ''
  });
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  
  // Mock attendance data for demonstration
  const generateAttendanceData = (period) => {
    if (period === 'week') {
      return [
        { name: 'Mon', attendance: 85 },
        { name: 'Tue', attendance: 90 },
        { name: 'Wed', attendance: 78 },
        { name: 'Thu', attendance: 95 },
        { name: 'Fri', attendance: 88 },
        { name: 'Sat', attendance: 92 },
        { name: 'Sun', attendance: 80 }
      ];
    } else if (period === 'month') {
      return [
        { name: 'Week 1', attendance: 85 },
        { name: 'Week 2', attendance: 88 },
        { name: 'Week 3', attendance: 82 },
        { name: 'Week 4', attendance: 90 }
      ];
    } else {
      return [
        { name: 'Jan', attendance: 85 },
        { name: 'Feb', attendance: 88 },
        { name: 'Mar', attendance: 92 },
        { name: 'Apr', attendance: 87 },
        { name: 'May', attendance: 90 },
        { name: 'Jun', attendance: 85 }
      ];
    }
  };

  const handleLogin = () => {
    if (loginForm.username && loginForm.password) {
      setCurrentUser({
        name: loginForm.username,
        id: Math.random().toString(36).substr(2, 9)
      });
      setIsLoggedIn(true);
      setLoginForm({ username: '', password: '' });
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAttendanceMarked(false);
    setGathaEntries([]);
    setShowGathaForm(false);
    setGathaType('');
    setGathaForm({ sutraName: '', whichGatha: '', totalGatha: '' });
  };

  const markAttendance = () => {
    setAttendanceMarked(true);
  };

  const unmarkAttendance = () => {
    setAttendanceMarked(false);
  };

  const submitGatha = () => {
    if (gathaType && gathaForm.sutraName && gathaForm.whichGatha && gathaForm.totalGatha) {
      const newEntry = {
        id: Date.now(),
        type: gathaType,
        ...gathaForm
      };
      setGathaEntries([...gathaEntries, newEntry]);
      setGathaType('');
      setGathaForm({ sutraName: '', whichGatha: '', totalGatha: '' });
      setShowGathaForm(false);
    }
  };

  const removeGathaEntry = (id) => {
    setGathaEntries(gathaEntries.filter(entry => entry.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200">
            <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-8 text-white text-center">
              <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-3xl font-bold mb-2">जय जिनेंद्र</h1>
              <p className="text-orange-100">Jain Pathshala Portal</p>
            </div>
            
            <div className="p-8">
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Username</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="Enter your username"
                />
              </div>
              
              <div className="mb-8">
                <label className="block text-gray-700 font-semibold mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-400 transition-colors"
                  placeholder="Enter your password"
                />
              </div>
              
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all transform hover:scale-105 shadow-lg"
              >
                Login to Pathshala
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-orange-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">जय जिनेंद्र, {currentUser.name}</h2>
                <p className="text-gray-600">Welcome to Pathshala</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-colors shadow-md"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Attendance Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 transform transition-all hover:scale-105">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Calendar className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Mark Attendance</h3>
              <p className="text-gray-600 mb-6">Record your presence for today's session</p>
              
              {!attendanceMarked ? (
                <button
                  onClick={markAttendance}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                >
                  Mark Present
                </button>
              ) : (
                <div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center justify-center gap-3 mb-4">
                    <Check className="w-6 h-6 text-green-600" />
                    <span className="text-green-700 font-bold text-lg">Attendance Marked!</span>
                  </div>
                  <button
                    onClick={unmarkAttendance}
                    className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-3 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                  >
                    Unmark Attendance
                  </button>
                </div>
              )}
              
              <div className="mt-4 text-sm text-gray-500">
                Date: {new Date().toLocaleDateString('en-IN')}
              </div>
            </div>
          </div>

          {/* Gatha Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Submit Gatha</h3>
              <p className="text-gray-600 mb-6">Record your gatha learning progress</p>

              {/* Display existing entries */}
              {gathaEntries.length > 0 && (
                <div className="mb-6 space-y-3 max-h-64 overflow-y-auto">
                  {gathaEntries.map((entry) => (
                    <div key={entry.id} className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-left">
                      <div className="flex justify-between items-start mb-2">
                        <span className="inline-block px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                          {entry.type === 'new' ? 'New Gatha' : 'Revision'}
                        </span>
                        <button
                          onClick={() => removeGathaEntry(entry.id)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ×
                        </button>
                      </div>
                      <p className="text-sm text-gray-700"><span className="font-bold">Sutra:</span> {entry.sutraName}</p>
                      <p className="text-sm text-gray-700"><span className="font-bold">Gatha:</span> {entry.whichGatha}</p>
                      <p className="text-sm text-gray-700"><span className="font-bold">Total:</span> {entry.totalGatha}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Gatha Button or Form */}
              {!showGathaForm ? (
                <button
                  onClick={() => setShowGathaForm(true)}
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Gatha Entry
                </button>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <button
                        onClick={() => setGathaType('new')}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                          gathaType === 'new'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        New Gatha
                      </button>
                      <button
                        onClick={() => setGathaType('revision')}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                          gathaType === 'revision'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                        }`}
                      >
                        Revision
                      </button>
                    </div>
                  </div>

                  {gathaType && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-left">Sutra Name</label>
                        <input
                          type="text"
                          value={gathaForm.sutraName}
                          onChange={(e) => setGathaForm({...gathaForm, sutraName: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400"
                          placeholder="Enter sutra name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-left">Which Gatha</label>
                        <input
                          type="text"
                          value={gathaForm.whichGatha}
                          onChange={(e) => setGathaForm({...gathaForm, whichGatha: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400"
                          placeholder="e.g., Gatha 1, 2, 3"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2 text-left">Total Number of Gatha Done</label>
                        <input
                          type="number"
                          value={gathaForm.totalGatha}
                          onChange={(e) => setGathaForm({...gathaForm, totalGatha: e.target.value})}
                          className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:outline-none focus:border-purple-400"
                          placeholder="Enter total count"
                          min="1"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setShowGathaForm(false);
                            setGathaType('');
                            setGathaForm({ sutraName: '', whichGatha: '', totalGatha: '' });
                          }}
                          className="bg-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-400 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitGatha}
                          disabled={!gathaForm.sutraName || !gathaForm.whichGatha || !gathaForm.totalGatha}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold py-3 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Graph */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-orange-200 mb-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Attendance Analytics</h3>
                <p className="text-gray-600">Track your pathshala attendance over time</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPeriod('week')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedPeriod === 'week'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSelectedPeriod('month')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedPeriod === 'month'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setSelectedPeriod('6months')}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  selectedPeriod === '6months'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                6 Months
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={generateAttendanceData(selectedPeriod)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '2px solid #f97316',
                  borderRadius: '12px',
                  padding: '10px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="attendance" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Message */}
        <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl shadow-xl p-8 text-center text-white">
          <BookOpen className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">अहिंसा परमो धर्मः</h3>
          <p className="text-orange-100">Non-violence is the supreme religion</p>
        </div>
      </div>
    </div>
  );
}