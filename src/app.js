const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const logger = require('./config/logger');
const requestLogger = require('./middlewares/logger');
const { errorHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./config/rateLimit');
const { apiKeyAuth } = require('./middlewares/auth');
const routes = require('./routes');
const { fail } = require('./utils/response');

const app = express();

// ========== الأمان والأداء ==========
app.use(helmet()); // حماية الرأسيات
app.use(cors()); // السماح بـ Cross-Origin
app.use(compression()); // ضغط الردود

// ========== ميدلويرات أساسية ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========== تسجيل الطلبات ==========
app.use(requestLogger);

// ========== تحديد المعدل العام ==========
app.use('/api', generalLimiter);

// ========== مفتاح API (اختياري) ==========
app.use('/api', apiKeyAuth);

// ========== الراوتات ==========
app.use('/api', routes);

// ========== مسار غير موجود ==========
app.use((req, res) => {
  fail(res, 404, 'Route not found', `Cannot ${req.method} ${req.url}`);
});

// ========== معالجة الأخطاء (آخر شيء) ==========
app.use(errorHandler);

module.exports = app;