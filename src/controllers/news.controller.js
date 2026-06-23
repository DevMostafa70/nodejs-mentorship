const { ok, fail } = require('../utils/response');
const { listNews, likeNews } = require('../services/news.service');
const { NotFoundError, ValidationError } = require('../middlewares/errorHandler');

async function getNews(req, res) {
  const { page, limit } = req.validatedQuery; // من الميدلوير
  
  const result = await listNews({ page, limit });
  return ok(res, result.items, result.meta);
}

async function addLike(req, res) {
  const id = req.validatedId; // من الميدلوير

  const updated = await likeNews(id);
  if (!updated) {
    throw new NotFoundError('News not found');
  }

  return ok(res, updated);
}

module.exports = { getNews, addLike };