const logger = require('../config/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  // نعدل طريقة الـ json عشان نسجل الرد
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - start;
    
    // نسجل الطلب مع وقت الاستجابة وحالة الرد
    logger.logRequest(req, {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length
    });

    return originalJson.call(this, data);
  };

  next();
}

module.exports = requestLogger;