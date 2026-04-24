import { createStandardResponse } from '../utils/responses.js';

/**
 * Centralised Express error-handling middleware.
 *
 * Handles:
 *  - AppError (operational)  — uses its own status + message
 *  - Mongoose CastError      — invalid ObjectId → 400
 *  - Mongoose ValidationError → 400 with field details
 *  - Mongoose duplicate key  — 11000 → 409
 *  - JWT errors              → 401
 *  - Zod / parse errors      → 400
 *  - Everything else         → 500 (stack hidden in production)
 *
 * MUST be registered LAST in server.js (after all routers).
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // ── 1. Mongoose: invalid ObjectId ──────────────────────────────────────────
  if (err.name === 'CastError') {
    return res
      .status(400)
      .json(createStandardResponse(false, null, `Invalid ID format: "${err.value}"`));
  }

  // ── 2. Mongoose: schema validation failure ──────────────────────────────────
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map(e => e.message)
      .join(', ');
    return res.status(400).json(createStandardResponse(false, null, messages));
  }

  // ── 3. MongoDB: duplicate key (e.g. unique e-mail) ─────────────────────────
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res
      .status(409)
      .json(createStandardResponse(false, null, `"${field}" already exists`));
  }

  // ── 4. JWT errors ───────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res
      .status(401)
      .json(createStandardResponse(false, null, 'Invalid or expired token'));
  }

  // ── 5. CORS error ───────────────────────────────────────────────────────────
  if (err.message && err.message.includes('Not allowed by CORS')) {
    return res
      .status(403)
      .json(createStandardResponse(false, null, 'CORS: origin not allowed'));
  }

  // ── 6. Operational AppError (thrown explicitly in route logic) ──────────────
  if (err.isOperational) {
    return res
      .status(err.status || 500)
      .json(createStandardResponse(false, null, err.message));
  }

  // ── 7. Unknown / programming error ─────────────────────────────────────────
  const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  console.error('❌ Unhandled error:', err);

  return res.status(500).json(
    createStandardResponse(
      false,
      null,
      isDev ? err.message || 'Internal server error' : 'Internal server error'
    )
  );
}

export default errorHandler;
