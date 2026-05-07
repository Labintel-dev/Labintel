'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');

const logger = require('./logger');

// ROUTES
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const reportRoutes = require('./routes/reports');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const patientPortalRoutes = require('./routes/patientPortal');
const ocrRoutes = require('./routes/ocr');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');

const app = express();

const PORT = process.env.PORT || 3001;

// SECURITY
app.use(helmet());

// CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
  ],
  credentials: true,
}));

// BODY PARSER
app.use(express.json({ limit: '10mb' }));

app.use(express.urlencoded({
  extended: true,
}));

// LOGGER
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// RATE LIMIT
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

app.use('/api/v1/auth', authLimiter);

// HEALTH
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
  });
});

// ROUTES
app.use('/api/v1/auth', authRoutes);

app.use('/api/v1/patients', patientRoutes);

app.use('/api/v1/reports', reportRoutes);

app.use('/api/v1/analytics', analyticsRoutes);

app.use('/api/v1/dashboard', dashboardRoutes);

app.use('/api/v1/settings', settingsRoutes);

app.use('/api/v1/patient', patientPortalRoutes);

app.use('/api/v1/ocr', ocrRoutes);

app.use('/api/v1/attendance', attendanceRoutes);

app.use('/api/v1/admin', adminRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

// ERROR HANDLER
app.use((err, req, res, next) => {

  logger.error(err.message);

  res.status(500).json({
    error: 'Internal server error',
  });
});

// CRON
cron.schedule('30 17 * * *', async () => {

  try {

    const { run } = require('./jobs/alertEngine');

    await run();

    logger.info('Alert engine completed');

  } catch (err) {

    logger.error(err.message);
  }

}, {
  timezone: 'UTC',
});

// START
app.listen(PORT, () => {

  logger.info(
    `LabIntel API running on port ${PORT}`
  );

});

module.exports = app;
