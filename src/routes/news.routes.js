const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const { getNews, addLike } = require('../controllers/news.controller');
const { validateId, validatePagination } = require('../middlewares/validator');
const { strictLimiter } = require('../config/rateLimit');
const { authorizeResource } = require('../middlewares/auth');
const { cacheResponse } = require('../middlewares/cache');

router.get(
  '/',
  authorizeResource('news', 'read'),
  validatePagination,
  cacheResponse(Number(process.env.NEWS_CACHE_TTL_SECONDS || 60)),
  asyncHandler(getNews)
);

router.post(
  '/:id/like',
  authorizeResource('news', 'like'),
  strictLimiter,
  validateId,
  asyncHandler(addLike)
);

module.exports = router;
