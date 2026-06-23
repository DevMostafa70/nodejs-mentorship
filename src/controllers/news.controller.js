const { ok } = require('../utils/response');
const { listNews, likeNews } = require('../services/news.service');
const { NotFoundError } = require('../middlewares/errorHandler');
const { invalidateCache } = require('../middlewares/cache');

async function getNews(req, res) {
  const { page, limit } = req.validatedQuery;

  const result = await listNews({ page, limit });
  return ok(res, result.items, result.meta);
}

async function addLike(req, res) {
  const id = req.validatedId;

  const updated = await likeNews(id);
  if (!updated) {
    throw new NotFoundError('News not found');
  }

  invalidateCache('/news');
  return ok(res, updated);
}

module.exports = { getNews, addLike };
