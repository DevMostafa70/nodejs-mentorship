const { fail } = require('../utils/response');

function validateId(req, res, next) {
  const id = Number(req.params.id);
  
  if (!Number.isFinite(id) || id < 1) {
    return fail(res, 400, 'Invalid ID', 'ID must be a positive integer');
  }
  
  req.validatedId = id;
  next();
}

function validatePagination(req, res, next) {
  let { page, limit } = req.query;
  
  page = Number(page);
  limit = Number(limit);
  
  if (page && (!Number.isFinite(page) || page < 1)) {
    return fail(res, 400, 'Invalid page', 'Page must be a positive integer');
  }
  
  if (limit && (!Number.isFinite(limit) || limit < 1 || limit > 50)) {
    return fail(res, 400, 'Invalid limit', 'Limit must be between 1 and 50');
  }
  
  req.validatedQuery = { page: page || 1, limit: limit || 10 };
  next();
}

module.exports = {
  validateId,
  validatePagination
};