const express = require('express');
const router = express.Router();
const newsRoutes = require('./news.routes');

// نضيف prefix '/api/news' للراوتر
router.use('/news', newsRoutes);

// راوتر للـ Health Check
router.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;