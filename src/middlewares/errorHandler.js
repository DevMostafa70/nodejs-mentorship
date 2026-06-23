const logger = require('../config/logger');
const { fail } = require('../utils/response');

// كلاسات أخطاء مخصصة
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class DatabaseError extends AppError {
  constructor(message = 'Database error', details = null) {
    super(message, 500, details);
  }
}

// ميدلوير معالجة الأخطاء
function errorHandler(err, req, res, next) {
  // تسجيل الخطأ
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    ...(err.details && { details: err.details })
  });

  // أخطاء معرفة من قبلنا
  if (err.isOperational) {
    return fail(res, err.statusCode, err.message, err.details);
  }

  // أخطاء قاعدة البيانات (SQLite)
  if (err.code === 'SQLITE_CONSTRAINT') {
    return fail(res, 409, 'Duplicate entry', 'This record already exists');
  }

  // أخطاء التحقق من الصحة (من Joi أو غيرها)
  if (err.name === 'ValidationError') {
    return fail(res, 400, 'Validation Error', err.message);
  }

  // أخطاء غير متوقعة
  const isDevelopment = process.env.NODE_ENV === 'development';
  return fail(
    res,
    500,
    'Internal Server Error',
    isDevelopment ? err.message : 'Something went wrong'
  );
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  DatabaseError,
  errorHandler
};