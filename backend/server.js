'use strict';
require('dotenv').config();
const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit   = require('express-rate-limit');
const cron        = require('node-cron');
const logger      = require('./logger');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes          = require('./routes/auth');
const patientRoutes       = require('./routes/patients');
const reportRoutes        = require('./routes/reports');
const analyticsRoutes     = require('./routes/analytics');
const dashboardRoutes     = require('./routes/dashboard');
const settingsRoutes      = require('./routes/settings');
const patientPortalRoutes = require('./routes/patientPortal');
const ocrRoutes           = require('./routes/ocr');
const attendanceRoutes    = require('./routes/attendance');
const adminRoutes         = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware stack (section 4.1 — order is critical) ─────────────────────

// 1. Security headers (12 headers: CSP, HSTS, X-Frame-Options, etc.)
app.use(helmet());

// 2. CORS — allow configured frontend origins (Vercel URL + local dev)
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,       // e.g. https://labintel.vercel.app
  'http://localhost:5173',         // local dev (standard)
  'http://localhost:5174',         // local dev (alternative)
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin header (curl, Render health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
}));

// 3. JSON body parsing (10mb limit for large report payloads)
app.use(express.json({ limit: '10mb' }));

// 4. Rate limiting on auth routes (100 req / 15 min per IP)
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests. Please try again in 15 minutes.' },
});
app.use('/api/v1/auth', authLimiter);

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'LabIntel API' });
});

// ── Route registration (5–8 in the middleware order) ──────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/patients',  patientRoutes);
app.use('/api/v1/reports',   reportRoutes);
app.use('/api/v1/analytics',  analyticsRoutes);
app.use('/api/v1/dashboard',  dashboardRoutes);
app.use('/api/v1/settings',   settingsRoutes);
app.use('/api/v1/patient',    patientPortalRoutes);
app.use('/api/v1/ocr',        ocrRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/admin',      adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ── Global error handler (catches all unhandled errors from controllers) ──
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ error: 'Internal server error. Please try again later.' });
});

// ── Cron: Alert engine — 11 PM IST (17:30 UTC) ───────────────────────────
cron.schedule('30 17 * * *', async () => {
  logger.info('Nightly alert engine started');
  try {
    const { run } = require('./jobs/alertEngine');
    await run();
    logger.info('Nightly alert engine completed');
  } catch (err) {
    logger.error(`Alert engine failed: ${err.message}`);
  }
}, {
  timezone: 'UTC',
});

// ── Start server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`✅  LabIntel API running on port ${PORT}`);
  logger.info(`    Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`    Frontend CORS: ${process.env.FRONTEND_URL}`);
  logger.info(`    Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app; // export for testing
