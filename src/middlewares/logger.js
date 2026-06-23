const logger = require('../config/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    logger.logRequest(req, {
      statusCode: res.statusCode,
      duration: `${Date.now() - start}ms`,
      contentLength: res.get('content-length'),
      cache: res.get('x-cache')
    });
  });

  next();
}

module.exports = requestLogger;
