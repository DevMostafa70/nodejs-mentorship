const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { getRequestContext } = require('../middlewares/requestContext');

const logDir = 'logs';
let canWriteLogFiles = true;

try {
  fs.mkdirSync(logDir, { recursive: true });
} catch (error) {
  canWriteLogFiles = false;
}

const withRequestContext = winston.format((info) => {
  const context = getRequestContext();
  return {
    ...info,
    requestId: info.requestId || context.requestId,
    tenantId: info.tenantId || context.tenantId,
    userId: info.userId || context.userId
  };
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    withRequestContext(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'news-api' },
  transports: canWriteLogFiles
    ? [
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error'
        }),
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log')
        })
      ]
    : []
});

if (process.env.NODE_ENV !== 'production' || !canWriteLogFiles) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

logger.logRequest = (req, meta = {}) => {
  logger.info({
    message: 'http_request',
    requestId: req.context?.requestId,
    tenantId: req.user?.tenantId || req.context?.tenantId,
    userId: req.user?.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...meta
  });
};

module.exports = logger;
