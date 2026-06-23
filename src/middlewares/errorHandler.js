const logger = require('../config/logger');
const { fail } = require('../utils/response');

class AppError extends Error {
  constructor(message, statusCode, details = null, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details, 'VALIDATION_ERROR');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, null, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, null, 'FORBIDDEN');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, null, 'NOT_FOUND');
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error', details = null) {
    super(message, 500, details, 'DATABASE_ERROR');
  }
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = req.context?.requestId;

  logger.error({
    message: 'request_error',
    requestId,
    code: err.code,
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenantId || req.context?.tenantId,
    ...(err.details && { details: err.details })
  });

  if (err.isOperational) {
    return fail(res, statusCode, err.message, err.details, {
      code: err.code,
      requestId
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return fail(res, 409, 'Duplicate entry', 'This record already exists', {
      code: 'DUPLICATE_ENTRY',
      requestId
    });
  }

  if (err.type === 'entity.too.large') {
    return fail(res, 413, 'Request body too large', err.message, {
      code: 'BODY_TOO_LARGE',
      requestId
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return fail(res, 400, 'Malformed JSON body', err.message, {
      code: 'MALFORMED_JSON',
      requestId
    });
  }

  if (err.name === 'ValidationError') {
    return fail(res, 400, 'Validation Error', err.message, {
      code: 'VALIDATION_ERROR',
      requestId
    });
  }

  return fail(
    res,
    500,
    'Internal Server Error',
    isDevelopment ? err.message : 'Something went wrong',
    { code: 'INTERNAL_ERROR', requestId }
  );
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  DatabaseError,
  errorHandler
};
