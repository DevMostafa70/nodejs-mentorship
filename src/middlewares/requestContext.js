const { AsyncLocalStorage } = require('async_hooks');
const crypto = require('crypto');

const storage = new AsyncLocalStorage();

function getRequestContext() {
  return storage.getStore() || {};
}

function requestContext(req, res, next) {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  const tenantId = req.get('x-tenant-id') || 'public';

  const context = {
    requestId,
    tenantId,
    ip: req.ip,
    method: req.method,
    path: req.originalUrl
  };

  res.setHeader('X-Request-Id', requestId);
  req.context = context;

  storage.run(context, next);
}

module.exports = {
  requestContext,
  getRequestContext
};
