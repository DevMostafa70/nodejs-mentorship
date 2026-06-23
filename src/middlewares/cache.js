const crypto = require('crypto');

const memoryCache = new Map();

function buildCacheKey(req) {
  const tenantId = req.user?.tenantId || req.get('x-tenant-id') || 'public';
  return `${tenantId}:${req.method}:${req.originalUrl}`;
}

function cacheResponse(ttlSeconds = 60) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = buildCacheKey(req);
    const cached = memoryCache.get(key);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      res.set(cached.headers);
      res.set('X-Cache', 'HIT');
      if (req.get('if-none-match') === cached.headers.ETag) {
        return res.status(304).end();
      }
      return res.status(cached.statusCode).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const payload = JSON.stringify(body);
        const etag = `"${crypto.createHash('sha1').update(payload).digest('hex')}"`;
        const headers = {
          'Cache-Control': `private, max-age=${ttlSeconds}`,
          ETag: etag
        };

        res.set(headers);
        res.set('X-Cache', 'MISS');
        memoryCache.set(key, {
          statusCode: res.statusCode,
          body,
          headers,
          expiresAt: now + ttlSeconds * 1000
        });
      }

      return originalJson(body);
    };

    return next();
  };
}

function invalidateCache(prefix = '') {
  for (const key of memoryCache.keys()) {
    if (!prefix || key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}

module.exports = {
  cacheResponse,
  invalidateCache
};
