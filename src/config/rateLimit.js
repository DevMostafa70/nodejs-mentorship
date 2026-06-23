const rateLimit = require('express-rate-limit');

function keyBy(scope) {
  return (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown-ip';
    const userId = req.user?.id || req.get('x-user-id') || 'anonymous';
    const tenantId = req.user?.tenantId || req.get('x-tenant-id') || 'public';
    const endpoint = `${req.method}:${req.baseUrl}${req.route?.path || req.path}`;

    if (scope === 'tenant') return `${tenantId}:${ip}`;
    if (scope === 'user') return `${tenantId}:${userId}`;
    if (scope === 'endpoint') return `${tenantId}:${userId}:${endpoint}`;
    return ip;
  };
}

function rateLimitMessage(message, details) {
  return {
    success: false,
    error: { message, details }
  };
}

const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_IP_MAX || 300),
  keyGenerator: keyBy('ip'),
  message: rateLimitMessage('Too many requests from this IP.', 'IP rate limit exceeded'),
  standardHeaders: true,
  legacyHeaders: false
});

const tenantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_TENANT_MAX || 500),
  keyGenerator: keyBy('tenant'),
  message: rateLimitMessage('Tenant request limit exceeded.', 'Tenant rate limit exceeded'),
  standardHeaders: true,
  legacyHeaders: false
});

const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_USER_MAX || 120),
  keyGenerator: keyBy('user'),
  message: rateLimitMessage('User request limit exceeded.', 'User rate limit exceeded'),
  standardHeaders: true,
  legacyHeaders: false
});

const generalLimiter = [ipLimiter, tenantLimiter, userLimiter];

const strictLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SENSITIVE_MAX || 10),
  keyGenerator: keyBy('endpoint'),
  message: rateLimitMessage('Too many sensitive endpoint requests.', 'Endpoint sensitivity limit exceeded'),
  standardHeaders: true,
  legacyHeaders: false
});

const scrapeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_SCRAPE_MAX || 3),
  keyGenerator: keyBy('tenant'),
  message: rateLimitMessage('Scraping limit exceeded. Please wait.', 'Scrape rate limit exceeded'),
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  strictLimiter,
  scrapeLimiter
};
