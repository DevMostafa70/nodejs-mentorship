const express = require('express');
const router = express.Router();

// بيانات المخزون
const stock = {};
for (let i = 1; i <= 1000; i++) {
  stock[i] = { quantity: Math.floor(Math.random() * 500) };
}

// GET /api/stock/:id
router.get('/stock/:id', (req, res) => {
  const id = parseInt(req.params.id);
  setTimeout(() => {
    res.json({
      product_id: id,
      quantity: stock[id]?.quantity || 0
    });
  }, 30);
});

// POST /api/stock (Batch)
router.post('/stock', (req, res) => {
  const ids = req.body;
  const results = ids.map(id => ({
    product_id: id,
    quantity: stock[id]?.quantity || 0
  }));
  
  setTimeout(() => {
    res.json(results);
  }, 50);
});

module.exports = router;