const express = require('express');
const router = express.Router();
const newsRoutes = require('./news.routes');

router.use('/news', newsRoutes);

router.get('/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    ok: true,
    requestId: req.context?.requestId,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
