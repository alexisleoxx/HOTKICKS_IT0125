// Wraps async route handlers so thrown errors reach the error middleware
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// An error whose message is safe to show to the client. `code` lets the UI react (e.g. EMAIL_NOT_CONFIRMED).
export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
