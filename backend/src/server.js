import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';

import { connectDB } from './systems/mongodb.js';
import { authRouter } from './routers/auth.js';
import { oauthRouter } from './routers/oauth.js';
import { expensesRouter } from './routers/expenses.js';
import { groupsRouter } from './routers/groups.js';
import { reportsRouter } from './routers/reports.js';
import { remindersRouter } from './routers/reminders.js';
import { paymentsRouter } from './routers/payments.js';
import notificationsRouter from './routers/notifications.js';
import { contactRouter } from './routers/contact.js';
import { supportRouter } from './routers/support.js';
import { sseRouter }     from './routers/sse.js';
import { createStandardResponse } from './utils/responses.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startImapPoller } from './services/imapPoller.js';

// ── Process-level crash guards ────────────────────────────────────────────────
// Catch unhandled promise rejections (e.g. DB call without await)
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', promise, 'Reason:', reason);
  // Give the server a chance to finish current requests before exiting
  // In production you may want to restart via a process manager (PM2 etc.)
});

// Catch synchronous exceptions that escaped all try/catch blocks
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception — shutting down gracefully:', err);
  process.exit(1); // Force restart via the process manager
});


const app = express();

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://localhost:5500',
  'https://127.0.0.1:5500',
  'https://splitwise.space',
  'https://www.splitwise.space'
];

// FIXED: Enhanced CORS configuration to handle preflight requests and tunnel URLs
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing CORS: No origin (mobile/curl)');
      return callback(null, true);
    }

    // Allow localhost origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ Allowing CORS for localhost:', origin);
      return callback(null, true);
    }

    // FIXED: Allow dev tunnels (VS Code port forwarding) - more robust check
    if (origin.includes('devtunnels.ms') ||
      origin.includes('.inc1.devtunnels.ms') ||
      origin.includes('inc1.devtunnels.ms') ||
      origin.match(/https?:\/\/[a-z0-9]+-5500\.inc1\.devtunnels\.ms/) ||
      origin.match(/https?:\/\/[a-z0-9]+-4000\.inc1\.devtunnels\.ms/) ||
      origin.match(/https?:\/\/[a-z0-9]+-[0-9]+\.inc1\.devtunnels\.ms/)) {
      console.log('✅ Allowing CORS for tunnel:', origin);
      return callback(null, true);
    }

    // Allow all origins in development mode
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('✅ Allowing CORS in development mode:', origin);
      return callback(null, true);
    }

    // Deny in production if not in allowed list
    console.error('❌ CORS blocked:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  // FIXED: Explicitly allow all methods and headers for preflight requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  // FIXED: Set max age for preflight cache
  maxAge: 86400 // 24 hours
}));

// FIXED: Handle preflight OPTIONS requests explicitly
app.options('*', cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

// Enable gzip compression for all responses
app.use(compression());

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Allow token passthrough via query (?token=...) for file downloads
app.use((req, _res, next) => {
  const t = req.query.token;
  if (t && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${t}`;
  }
  next();
});

async function start() {
  // Connect to MongoDB
  await connectDB();

  app.get('/api/health', (req, res) => {
    res.json(createStandardResponse(true, { status: 'ok' }));
  });

  app.use('/api/auth', authRouter);
  app.use('/api/oauth', oauthRouter);
  app.use('/api/expenses', expensesRouter);
  app.use('/api/groups', groupsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/reminders', remindersRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/contact',       contactRouter);
  app.use('/api/support',       supportRouter);
  app.use('/api/sse',           sseRouter);          // Real-time event stream

  // 404 catch-all — must come after all routers
  app.use((req, res) => {
    res.status(404).json(createStandardResponse(false, null, `Route not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralised error handler — must be last and must have 4 params
  app.use(errorHandler);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`SplitWise API running on http://localhost:${PORT}`);

    // Start IMAP IDLE watcher — fires instantly when new email arrives
    // Handles: no ticket → reply+delete, active ticket first email → leave for agent,
    // repeated emails with active ticket → patience reply+delete
    startImapPoller();
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
});

