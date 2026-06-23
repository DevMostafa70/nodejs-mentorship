const winston = require('winston');
const path = require('path');

const logDir = 'logs';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'news-api' },
  transports: [
    // سجل الأخطاء في ملف منفصل
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    // سجل جميع الطلبات
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// في بيئة التطوير، نطبع في الكونسول بشكل مرتب
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// دالة مساعدة لتسجيل الطلبات
logger.logRequest = (req, meta = {}) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    ...meta
  });
};

module.exports = logger;