/**
 * SSE Router — GET /api/sse
 * ==========================
 * Browser connects here to receive real-time events.
 * Authenticates via JWT token in query string (?token=...) or Authorization header.
 *
 * Frontend usage:
 *   const es = new EventSource('/api/sse?token=' + localStorage.getItem('token'));
 *   es.addEventListener('expense:created', e => { ... });
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { addClient, removeClient } from '../utils/sseEmitter.js';

export const sseRouter = Router();

sseRouter.get('/', (req, res) => {
  // ── Auth: accept token from query or Authorization header ─────────────────
  const rawToken =
    req.query.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);

  if (!rawToken) {
    return res.status(401).json({ success: false, error: 'Token required' });
  }

  let userId;
  try {
    const decoded = jwt.verify(rawToken, process.env.JWT_SECRET);
    userId = decoded.id || decoded.userId || decoded.sub;
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  // ── SSE headers ───────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering
  res.flushHeaders();

  // ── Send connected confirmation ───────────────────────────────────────────
  res.write(`event: connected\ndata: {"userId":"${userId}"}\n\n`);

  // ── Register this client ──────────────────────────────────────────────────
  const clientId = addClient(res, userId);

  // ── Cleanup on disconnect ─────────────────────────────────────────────────
  req.on('close',   () => { removeClient(clientId); res.end(); });
  req.on('aborted', () => { removeClient(clientId); res.end(); });
});
