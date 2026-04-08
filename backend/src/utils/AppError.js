/**
 * AppError — typed operational error for the API.
 * Throw this instead of plain Error to get a specific HTTP status code.
 *
 * @example
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Email already in use', 409);
 */
export class AppError extends Error {
  /**
   * @param {string} message  Human-readable error message (sent to client).
   * @param {number} status   HTTP status code (default 500).
   */
  constructor(message, status = 500) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    /** Mark as operational (expected) so the error handler can distinguish
     *  it from unexpected programming errors. */
    this.isOperational = true;
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;
