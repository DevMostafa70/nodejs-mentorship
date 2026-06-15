const express = require('express');
const db = require('./db');
const fs = require('fs');

// استيراد APIs المحاكاة
const productsApi = require('./sources/products-api');
const pricesApi = require('./sources/prices-api');
const stockApi = require('./sources/stock-api');

const app = express();
app.use(express.json());

// ============= الـ APIs المحاكاة (لجلب البيانات) =============
app.use('/api', productsApi);
app.use('/', pricesApi);
app.use('/', stockApi);

// ============= API لملء Staging Table =============
app.post('/api/ingest-products', async (req, res) => {
  try {
    const response = await fetch('http://localhost:3000/api/products/all');
    const products = await response.json();
    
    db.serialize(() => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO products_staging (id, name, raw_data, processed)
        VALUES (?, ?, ?, 0)
      `);
      
      for (const product of products) {
        stmt.run(product.id, product.name, JSON.stringify(product));
      }
      
      stmt.finalize();
      res.json({ message: `Ingested ${products.length} products into staging` });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= API للقراءة من الجدول النهائي (سريع) =============
app.get('/api/products-final', (req, res) => {
  db.all(`SELECT * FROM products_final ORDER BY productId`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/products-final/:id', (req, res) => {
  db.get(`SELECT * FROM products_final WHERE productId = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

// ============= API للتحقق من حالة المعالجة =============
app.get('/api/status', (req, res) => {
  db.get(`SELECT COUNT(*) as total, SUM(processed) as processed FROM products_staging`, (err, row) => {
    db.get(`SELECT COUNT(*) as finalCount FROM products_final`, (err2, row2) => {
      res.json({
        staging: { total: row.total, processed: row.processed || 0, pending: (row.total - (row.processed || 0)) },
        final: { count: row2.finalCount }
      });
    });
  });
});

// ============= تشغيل السيرفر =============
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`
  🚀 Server running on http://localhost:${PORT}
  
  📋 Available Endpoints:
  ─────────────────────────────────────────
  🔵 DATA INGESTION:
     POST   /api/ingest-products     → جلب المنتجات إلى Staging Table
  
  🟢 FINAL DATA (READ-OPTIMIZED):
     GET    /api/products-final       → كل المنتجات الجاهزة
     GET    /api/products-final/:id   → منتج واحد جاهز
  
  🟡 STATUS:
     GET    /api/status               → حالة المعالجة
  
  🔴 SIMULATED SOURCE APIs (للاختبار):
     GET    /api/products?page=1      → منتجات
     GET    /price/:id                → سعر منتج
     GET    /stock/:id                → مخزون منتج
  `);
});