const rateLimit = require('express-rate-limit');

// محدد عام للـ API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب لكل IP
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
      details: 'Rate limit exceeded'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // نستثني بعض الـ IPs (مثلاً الـ Admin)
    return req.ip === '127.0.0.1' && process.env.NODE_ENV === 'development';
  }
});

// محدد خاص لعمليات الحساسة (مثل إضافة لايك)
const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 10, // 10 طلبات فقط
  message: {
    success: false,
    error: {
      message: 'Too many likes, please slow down.',
      details: 'Strict rate limit exceeded'
    }
  }
});

// محدد خاص للسكرابر (عملية ثقيلة)
const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 مرات فقط في الساعة
  message: {
    success: false,
    error: {
      message: 'Scraping limit exceeded. Please wait.',
      details: 'Scrape rate limit exceeded'
    }
  }
});

module.exports = {
  generalLimiter,
  strictLimiter,
  scrapeLimiter
};