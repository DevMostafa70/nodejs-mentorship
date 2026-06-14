const express = require('express');
const router = express.Router();

// بيانات الأسعار لكل منتج (market + sale)
const prices = {};

for (let i = 1; i <= 1000; i++) {
  prices[i] = [
    { type: 'market', price: +(Math.random() * 100 + 50).toFixed(2) },
    { type: 'sale', price: +(Math.random() * 50 + 20).toFixed(2) }
  ];
}

// GET /api/price/:id
router.get('/price/:id', (req, res) => {
  const id = parseInt(req.params.id);
  setTimeout(() => {
    res.json({
      product_id: id,
      prices: prices[id] || []
    });
  }, 30);
});

// POST /api/prices (Batch)
router.post('/prices', (req, res) => {
  const ids = req.body;
  const results = ids.map(id => ({
    product_id: id,
    prices: prices[id] || []
  }));
  
  setTimeout(() => {
    res.json(results);
  }, 50);
});

module.exports = router;