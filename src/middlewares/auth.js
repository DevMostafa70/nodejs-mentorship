const { ForbiddenError, UnauthorizedError } = require('./errorHandler');

function parseApiKeys() {
  const raw = process.env.API_KEYS || '';
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [key, role = 'reader', tenantId = 'public', userId] = item.split(':');
      return { key, role, tenantId, userId: userId || role };
    });
}

function apiKeyAuth(req, res, next) {
  const apiKeys = parseApiKeys();
  const providedKey = req.get('x-api-key');
  const tenantHeader = req.get('x-tenant-id');

  if (apiKeys.length === 0 && !providedKey) {
    req.user = {
      id: req.get('x-user-id') || 'anonymous',
      role: 'reader',
      tenantId: tenantHeader || 'public'
    };
    return next();
  }

  const matched = apiKeys.find((entry) => entry.key === providedKey);
  if (!matched) {
    return next(new UnauthorizedError('Valid API key is required'));
  }

  req.user = {
    id: req.get('x-user-id') || matched.userId,
    role: matched.role,
    tenantId: matched.tenantId
  };

  if (req.context) {
    req.context.userId = req.user.id;
    req.context.role = req.user.role;
    req.context.tenantId = tenantHeader || req.user.tenantId;
  }

  return next();
}

function authorizeResource(resource, action) {
  return (req, res, next) => {
    const user = req.user || { role: 'reader', tenantId: 'public' };
    const tenantId = req.get('x-tenant-id') || user.tenantId || 'public';

    const policies = {
      news: {
        read: ['reader', 'editor', 'admin'],
        like: ['reader', 'editor', 'admin'],
        write: ['editor', 'admin'],
        delete: ['admin']
      }
    };

    const allowedRoles = policies[resource] && policies[resource][action];
    if (!allowedRoles || !allowedRoles.includes(user.role)) {
      return next(new ForbiddenError(`Missing permission: ${resource}:${action}`));
    }

    if (user.role !== 'admin' && user.tenantId !== tenantId) {
      return next(new ForbiddenError('Cross-tenant access is not allowed'));
    }

    req.resource = { type: resource, action, tenantId };
    return next();
  };
}

module.exports = {
  apiKeyAuth,
  authorizeResource
};
