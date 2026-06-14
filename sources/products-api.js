const express = require('express');
const router = express.Router();

// بيانات تجريبية (1000 منتج)
const products = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  description: `Description for product ${i + 1}`,
  created_at: new Date().toISOString()
}));

// GET /api/products?page=1&limit=50
router.get('/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const start = (page - 1) * limit;
  const end = start + limit;
  
  setTimeout(() => {
    res.json({
      page,
      limit,
      total: products.length,
      data: products.slice(start, end)
    });
  }, 50); // محاكاة تأخير الشبكة
});

// GET /api/products/all (جلب الكل)
router.get('/products/all', (req, res) => {
  setTimeout(() => {
    res.json(products);
  }, 100);
});

module.exports = router;