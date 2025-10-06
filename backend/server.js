require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- Basic required env check ---
const REQUIRED_ENVS = ['MONGODB_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENVS.filter(k => !process.env[k]);
if (missing.length) {
  console.error('FATAL: Missing required environment variables:', missing.join(', '));
  console.error('Please add them to your .env or environment and restart the server.');
  process.exit(1);
}

// --- Config ---
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
const DB_NAME = process.env.DB_NAME || 'jainpathshala';

// --- MongoDB connection manager with SSL/TLS configuration ---
let db = null;
let client = null;

async function createIndexes() {
  try {
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    // Using .catch() for index creation is generally fine for non-critical indexes that might already exist
    await db.collection('attendance').createIndex({ user_id: 1, date: 1 }, { unique: true }).catch(() => {});
    await db.collection('attendance').createIndex({ date: 1 }).catch(() => {});
    await db.collection('gatha_entries').createIndex({ user_id: 1, created_at: 1 }).catch(() => {});
    await db.collection('gatha_entries').createIndex({ created_at: 1 }).catch(() => {});
    console.log('✅ Database indexes created (or already existed)');
  } catch (err) {
    console.warn('⚠️ Index creation warning:', err.message);
  }
}

async function connectToDatabase() {
  try {
    // Enhanced MongoDB connection options for SSL/TLS
    const connectionOptions = {
      // For mongodb+srv:// URIs, SSL/TLS is typically enabled by default.
      // Explicitly setting `ssl: true` or `tls: true` is often redundant but harmless.
      // Removed `tlsVersion` as it caused a parse error with your driver version.
      // The driver will negotiate the strongest TLS version supported by Node.js and the server.
      
      retryWrites: true,
      w: 'majority',
      
      // Connection pool settings
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      
      // Timeout settings
      serverSelectionTimeoutMS: 10000, // How long to wait for server selection to succeed
      socketTimeoutMS: 45000, // How long to wait for a socket to return data
      connectTimeoutMS: 10000, // How long to wait for connection to be established
      
      // Disable IPv6 family auto-selection (helps with some network issues)
      autoSelectFamily: false,
    };

    console.log('🔄 Attempting to connect to MongoDB...');
    // Mask sensitive parts of the URI for logging
    console.log('📍 Connection URI format:', process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@'));

    client = new MongoClient(process.env.MONGODB_URI, connectionOptions);
    
    // Connect with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        await client.connect();
        break; // If connection is successful, break out of retry loop
      } catch (err) {
        retries--;
        console.error(`❌ MongoDB connection attempt failed. Retries left: ${retries}`);
        console.error('Error details:', err.message);
        
        if (retries === 0) {
          console.error('All connection retries exhausted. Exiting.');
          throw err; // Re-throw the error after all retries fail
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Ping the admin database to verify the connection is truly open
    await client.db('admin').command({ ping: 1 });
    
    db = client.db(DB_NAME);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Connected to database: ${DB_NAME}`);
    
    // Create indexes for better performance
    await createIndexes();
    return db;
    
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    
    // Provide specific guidance for common SSL/network errors
    if (err.message.includes('TLSV1_ALERT_INTERNAL_ERROR') || err.message.includes('SSL') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
      console.error('');
      console.error('🔧 SSL/TLS/Network Error Troubleshooting:');
      console.error('1. **MongoDB Atlas IP Whitelist:** Ensure your server\'s public IP address is added to the Network Access List in your MongoDB Atlas project. This is the MOST common cause.');
      console.error('2. **Connection String:** Verify your MONGODB_URI in your .env file. It should start with `mongodb+srv://` and have the correct username, password, cluster name, and database name.');
      console.error('3. **Network Firewall:** Check if any firewalls (local or cloud) are blocking outbound connections on port 27017.');
      console.error('4. **MongoDB Atlas Status:** Confirm your MongoDB Atlas cluster is running and not paused.');
      console.error('5. **Node.js/Driver Version:** Ensure your Node.js version is relatively recent (e.g., 16+) and you have the latest `mongodb` driver (`npm install mongodb@latest`).');
      console.error('');
    }
    
    throw err;
  }
}

// Enhanced error handling wrapper for database operations
function withDatabaseErrorHandling(operation) {
  return async (req, res, next) => {
    try {
      await operation(req, res, next);
    } catch (err) {
      console.error('Database operation error:', err.message);
      
      // Handle specific SSL/network errors
      if (err.message.includes('SSL') || err.message.includes('ENOTFOUND') || err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
        return res.status(503).json({ 
          error: 'Database connection issue. Please try again later. Check server logs for details.',
          code: 'DB_CONNECTION_ERROR'
        });
      }
      
      // Handle MongoDB specific errors (e.g., duplicate key, validation errors)
      if (err.name === 'MongoError' || err.name === 'MongoServerError') {
        // Example: Duplicate key error (E11000)
        if (err.code === 11000) {
          return res.status(409).json({ error: 'Duplicate data error.', code: 'DUPLICATE_KEY', details: err.message });
        }
        return res.status(500).json({ 
          error: 'Database operation failed.',
          code: 'DB_OPERATION_ERROR',
          details: err.message
        });
      }
      
      // Pass other errors to the next middleware (or default error handler)
      next(err);
    }
  };
}

// --- Request logger ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - auth: ${req.headers.authorization ? 'yes' : 'no'}`);
  next();
});

// --- Utility functions ---
function getCurrentYearRange() {
  const now = new Date();
  const year = now.getFullYear();
  return { startDate: `${year}-01-01`, endDate: `${year}-12-31` };
}

function safeDateString(value) {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  if (s.length >= 10) return s.slice(0, 10);
  return s;
}

// --- Auth middleware ---
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid Authorization header format' });

  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.id) {
      console.error('Auth verification failed: token payload missing id');
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    try {
      req.user = {
        id: payload.id,
        username: payload.username,
        _id: new ObjectId(payload.id)
      };
    } catch (err) {
      console.error('Auth verification failed: invalid user id in token', err.message);
      return res.status(401).json({ error: 'Invalid token user id' });
    }
    next();
  } catch (err) {
    console.error('Auth verification failed:', err.name, err.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// --- Endpoints with enhanced error handling ---

// Register
app.post('/api/register', withDatabaseErrorHandling(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await db.collection('users').insertOne({
    username,
    password_hash,
    created_at: new Date()
  });

  res.json({
    id: result.insertedId.toString(),
    username
  });
}));

// Login
app.post('/api/login', withDatabaseErrorHandling(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username & password required' });

  const user = await db.collection('users').findOne({ username });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({
    id: user._id.toString(),
    username: user.username
  }, JWT_SECRET, { expiresIn: '8h' });

  res.json({
    user: { id: user._id.toString(), name: user.username },
    token
  });
}));

// WhoAmI
app.get('/api/whoami', authMiddleware, (req, res) => {
  res.json({
    userId: req.user.id,
    username: req.user.username,
    authenticatedAt: new Date().toISOString(),
  });
});

// --- Attendance ---
app.post('/api/attendance/mark', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userId = req.user.id;
  const userObjId = req.user._id;
  const username = req.user.username || null;
  const today = new Date().toISOString().slice(0, 10);

  const result = await db.collection('attendance').updateOne(
    { user_id: userObjId, date: today },
    {
      $set: {
        user_id: userObjId,
        username,
        date: today,
        created_at: new Date()
      }
    },
    { upsert: true }
  );

  res.json({
    success: true,
    date: today,
    affectedRows: (result.upsertedCount || result.modifiedCount || 0)
  });
}));

app.post('/api/attendance/unmark', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const today = new Date().toISOString().slice(0, 10);

  await db.collection('attendance').deleteOne({ user_id: userObjId, date: today });
  res.json({ success: true });
}));

app.get('/api/attendance', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;

  const rows = await db.collection('attendance')
    .find({ user_id: userObjId })
    .sort({ date: -1 })
    .toArray();

  const out = rows.map(r => ({
    ...r,
    _id: r._id.toString(),
    user_id: r.user_id instanceof ObjectId ? r.user_id.toString() : r.user_id
  }));

  res.json(out);
}));

// --- Gatha endpoints ---
app.post('/api/gatha', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const { type, sutra_name, which_gatha, total_gatha } = req.body || {};

  if (!type || (type !== 'new' && type !== 'revision')) {
    return res.status(400).json({ error: 'type must be new or revision' });
  }

  const entry = {
    user_id: userObjId,
    type,
    sutra_name: sutra_name || null,
    which_gatha: which_gatha || null,
    total_gatha: total_gatha ?? null,
    created_at: new Date()
  };

  const result = await db.collection('gatha_entries').insertOne(entry);

  const insertedEntry = await db.collection('gatha_entries').findOne({
    _id: result.insertedId
  });

  res.json({
    id: result.insertedId.toString(),
    entry: {
      ...insertedEntry,
      id: insertedEntry._id.toString(),
      user_id: insertedEntry.user_id instanceof ObjectId ? insertedEntry.user_id.toString() : insertedEntry.user_id
    }
  });
}));

app.get('/api/gatha', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;

  const rows = await db.collection('gatha_entries')
    .find({ user_id: userObjId })
    .sort({ created_at: -1 })
    .toArray();

  const formattedRows = rows.map(row => ({
    ...row,
    id: row._id.toString(),
    user_id: row.user_id instanceof ObjectId ? row.user_id.toString() : row.user_id
  }));

  res.json(formattedRows);
}));

app.put('/api/gatha/:id', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const entryId = req.params.id;
  const { type, sutra_name, which_gatha, total_gatha } = req.body || {};

  if (type && type !== 'new' && type !== 'revision') {
    return res.status(400).json({ error: 'type must be new or revision' });
  }

  const updateDoc = {};
  if (type !== undefined) updateDoc.type = type;
  if (sutra_name !== undefined) updateDoc.sutra_name = sutra_name;
  if (which_gatha !== undefined) updateDoc.which_gatha = which_gatha;
  if (total_gatha !== undefined) updateDoc.total_gatha = total_gatha;

  const result = await db.collection('gatha_entries').updateOne(
    { _id: new ObjectId(entryId), user_id: userObjId },
    { $set: updateDoc }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({ error: 'Entry not found or not owned by you' });
  }

  const updatedEntry = await db.collection('gatha_entries').findOne({
    _id: new ObjectId(entryId)
  });

  res.json({
    success: true,
    entry: {
      ...updatedEntry,
      id: updatedEntry._id.toString(),
      user_id: updatedEntry.user_id instanceof ObjectId ? updatedEntry.user_id.toString() : updatedEntry.user_id
    }
  });
}));

app.delete('/api/gatha/:id', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const entryId = req.params.id;

  const result = await db.collection('gatha_entries').deleteOne({
    _id: new ObjectId(entryId),
    user_id: userObjId
  });

  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'Entry not found or not owned by you' });
  }

  res.json({ success: true });
}));

// --- Analytics ---
app.get('/api/stats/yearly', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const { startDate, endDate } = getCurrentYearRange();

  const totalDaysPresent = await db.collection('attendance').countDocuments({
    user_id: userObjId,
    date: { $gte: startDate, $lte: endDate }
  });

  res.json({
    totalDaysPresent,
    year: new Date().getFullYear()
  });
}));

app.get('/api/analytics/leaderboard', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate query parameters are required.' });
  }

  // Gatha counts (summing total_gatha per user)
  const gathaPipeline = [
    {
      $match: {
        type: 'new',
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $group: {
        _id: '$user_id',
        username: { $first: '$user.username' },
        gatha_count: { $sum: { $ifNull: ['$total_gatha', 0] } }
      }
    }
  ];

  const gathaCounts = await db.collection('gatha_entries').aggregate(gathaPipeline).toArray();
  const gathaMap = new Map(gathaCounts.map(r => [r._id.toString(), Number(r.gatha_count || 0)]));

  // Attendance counts
  const attendancePipeline = [
    {
      $match: {
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$user_id',
        attendance_count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' }
  ];

  const attendanceCounts = await db.collection('attendance').aggregate(attendancePipeline).toArray();

  let totalAttendance = 0;
  attendanceCounts.forEach(row => (totalAttendance += Number(row.attendance_count || 0)));

  const leaderboard = attendanceCounts.map(u => ({
    username: u.user.username,
    user_id: u._id instanceof ObjectId ? u._id.toString() : String(u._id),
    attendance_count: Number(u.attendance_count || 0),
    gatha_count: gathaMap.get(u._id.toString()) || 0
  })).sort((a, b) => {
    if (a.attendance_count !== b.attendance_count) return b.attendance_count - a.attendance_count;
    return b.gatha_count - a.gatha_count;
  });

  const totalPathshalaGathas = gathaCounts.reduce((sum, r) => sum + Number(r.gatha_count || 0), 0);

  let gathaLeader = null;
  if (gathaCounts.length > 0) {
    const top = [...gathaCounts].sort((a, b) => Number(b.gatha_count || 0) - Number(a.gatha_count || 0))[0]; // Added [0] to get the top element
    gathaLeader = { username: top.username, count: Number(top.gatha_count || 0) };
  }

  // Current user's gatha count
  const currentUserGathaCount = await db.collection('gatha_entries').aggregate([
    {
      $match: {
        user_id: req.user._id,
        type: 'new',
        created_at: {
          $gte: new Date(startDate),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$total_gatha', 0] } }
      }
    }
  ]).toArray();

  const userGathaTotal = (currentUserGathaCount.length > 0 ? currentUserGathaCount[0].total : 0) || 0; // Corrected access to total

  res.json({
    attendanceLeader: leaderboard.length > 0 ? leaderboard[0] : { username: 'N/A', attendance_count: 0, gatha_count: 0 },
    gathaStats: {
      totalPathshalaGathas,
      gathaLeader: gathaLeader || { username: 'N/A', count: 0 },
      totalAttendance
    },
    currentUserNewGathas: Number(userGathaTotal)
  });
}));

// --- History endpoint ---
app.get('/api/history/:year/:month', authMiddleware, withDatabaseErrorHandling(async (req, res) => {
  const userObjId = req.user._id;
  const { year: yearStr, month: monthStr } = req.params;

  console.log(`📅 History request: userId=${req.user.id} year=${yearStr} month=${monthStr}`);

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  if (Number.isNaN(year) || Number.isNaN(month) || month < 1 || month > 12) {
    console.log('❌ Invalid history parameters received');
    return res.status(400).json({ error: 'Invalid year or month parameter.' });
  }

  const paddedMonth = String(month).padStart(2, '0');
  const startRange = `${year}-${paddedMonth}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endRange = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;

  // Gathas for the month (created_at is Date)
  const gathaDetails = await db.collection('gatha_entries')
    .find({
      user_id: userObjId,
      created_at: {
        $gte: new Date(startRange),
        $lte: new Date(endRange + 'T23:59:59.999Z')
      }
    })
    .sort({ created_at: 1 })
    .toArray();

  // Attendance (date stored as YYYY-MM-DD string)
  const attendance = await db.collection('attendance')
    .find({
      user_id: userObjId,
      date: { $gte: startRange, $lte: endRange }
    })
    .toArray();

  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyActivity = {};

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${paddedMonth}-${String(i).padStart(2, '0')}`;
    dailyActivity[dateStr] = {
      present: false,
      gathas: { new: 0, revision: 0 },
      details: []
    };
  }

  attendance.forEach((att) => {
    const dateStr = safeDateString(att.date);
    if (dateStr && dailyActivity[dateStr]) {
      dailyActivity[dateStr].present = true;
    }
  });

  gathaDetails.forEach((entry) => {
    const dateStr = safeDateString(entry.created_at);
    if (!dateStr || !dailyActivity[dateStr]) return;

    const count = Number(entry.total_gatha || 0);
    if (entry.type === 'new') dailyActivity[dateStr].gathas.new += count;
    else if (entry.type === 'revision') dailyActivity[dateStr].gathas.revision += count;

    dailyActivity[dateStr].details.push({
      id: entry._id.toString(),
      type: entry.type,
      sutra_name: entry.sutra_name,
      which_gatha: entry.which_gatha,
      total_gatha: entry.total_gatha
    });
  });

  res.json({ year, month, dailyActivity });
}));

// --- Health check endpoint ---
app.get('/api/health', async (req, res) => {
  try {
    if (!client || !db) {
      return res.status(503).json({ status: 'error', message: 'Database client not initialized or connected' });
    }
    
    // Test database connection by pinging the admin database
    await client.db('admin').command({ ping: 1 });
    
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      details: 'MongoDB connection is active'
    });
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: err.message 
    });
  }
});


// --- API 404 handler ---
app.use((req, res, next) => {
  if (typeof req.originalUrl === 'string' && req.originalUrl.startsWith('/api/')) {
    console.log(`❌ API 404: ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  }
  next();
});

// Generic 404 for non-API routes
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Global error handlers
// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err);
  // Only send error details in development mode
  const errorResponse = process.env.NODE_ENV === 'development' ? {
    message: err.message,
    stack: err.stack,
    code: err.code || 'SERVER_ERROR'
  } : {
    message: 'An unexpected server error occurred.',
    code: 'SERVER_ERROR'
  };
  res.status(500).json(errorResponse);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  // For production, you might want to gracefully shut down or restart
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Perform graceful cleanup, then exit
  if (client) {
    client.close().then(() => {
      console.log('✅ MongoDB connection closed due to uncaught exception.');
      process.exit(1);
    }).catch(e => {
      console.warn('Error closing MongoDB client during uncaught exception:', e);
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Gracefully shutting down...');
  if (client) {
    try {
      await client.close();
      console.log('✅ MongoDB connection closed');
    } catch (e) {
      console.warn('Error closing MongoDB client:', e);
    }
  }
  process.exit(0);
});

// --- Start server only after DB connects ---
(async function start() {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
      console.log(`📍 API Base: https://jain-pathshala.vercel.app`);
      console.log(` cavern: ${DB_NAME}`);
      console.log(`💡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Server startup failed:', err);
    process.exit(1);
  }

})();
