const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { getNews, addLike } = require('../controllers/news.controller');
const { validateId, validatePagination } = require('../middlewares/validator');
const { strictLimiter } = require('../config/rateLimit');
const { apiKeyAuth } = require('../middlewares/auth');

// GET /api/news - مع تحقق من الصفحات ومعدل عام (من app.js)
router.get('/', validatePagination, asyncHandler(getNews));

// POST /api/news/:id/like - مع حماية صارمة وتحقق من ID
router.post(
  '/:id/like',
  strictLimiter, // حماية من الطلبات المتكررة
  validateId, // تحقق من صحة الـ ID
  asyncHandler(addLike)
);

module.exports = router;