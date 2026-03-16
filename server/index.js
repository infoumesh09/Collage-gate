const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { router: authRoutes } = require('./routes/auth');
const userRoutes = require('./routes/users');
const faceRoutes = require('./routes/face');
const logRoutes = require('./routes/logs');
const statsRoutes = require('./routes/stats');
const gateRoutes = require('./routes/gate');
const vehicleRoutes = require('./routes/vehicles');
const settingRoutes = require('./routes/settings');
const registrationRoutes = require('./routes/registration');
const attendanceRoutes = require('./routes/attendance');
const mlRoutes = require('./routes/ml');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3002; // Changed port to avoid conflict

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false 
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true
}));

// Rate limiting - increased for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
// Alias for /api/login using the same auth router
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/face', faceRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/registration', registrationRoutes);
app.use('/api', attendanceRoutes);
app.use('/api', mlRoutes);

// Simple logout endpoint (stateless JWT)
app.post('/api/logout', (req, res) => {
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);

  // Schedule midnight archive of previous day's stats
  scheduleDailyArchive();
});

// Archive previous day's stats and schedule daily run at local midnight
function scheduleDailyArchive() {
  const prisma = new PrismaClient();
  const attendanceService = require('./services/attendanceService');

  const archiveYesterday = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayEnd = new Date(todayStart);

      const [entries, exits, denied] = await Promise.all([
        prisma.accessLog.count({ where: { direction: 'entry', success: true, timestamp: { gte: yesterdayStart, lt: yesterdayEnd } } }),
        prisma.accessLog.count({ where: { direction: 'exit', success: true, timestamp: { gte: yesterdayStart, lt: yesterdayEnd } } }),
        prisma.accessLog.count({ where: { success: false, timestamp: { gte: yesterdayStart, lt: yesterdayEnd } } })
      ]);

      const total_attempts = entries + exits + denied;

      await prisma.dailyStat.upsert({
        where: { date: yesterdayStart },
        update: { entries, exits, denied, total_attempts },
        create: { date: yesterdayStart, entries, exits, denied, total_attempts }
      });

      console.log('✅ Archived daily stats for', yesterdayStart.toISOString().slice(0, 10));

      // Generate attendance for yesterday
      await attendanceService.generateForDate(yesterdayStart);
      console.log('✅ Generated attendance for', yesterdayStart.toISOString().slice(0, 10));
    } catch (err) {
      console.error('❌ Failed to archive daily stats:', err);
    }
  };

  // Backfill yesterday on startup (idempotent)
  archiveYesterday();

  // Calculate ms until next midnight
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setDate(now.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  const msUntilMidnight = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    // Run at next midnight, then every 24 hours
    archiveYesterday();
    setInterval(archiveYesterday, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}
