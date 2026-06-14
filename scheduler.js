const axios = require('axios');
const db = require('./db');
const AutoMapper = require('./auto-mapper');
const cron = require('node-cron');

const API_BASE = 'http://localhost:3001'; // APIs منفصلة
const BATCH_SIZE = 100; // ميت منتج كل مرة

const mapper = new AutoMapper();

// دالة لجلب الأسعار بالتوازي (Parallel + Map - الطريقة الأسرع)
async function fetchPricesParallel(productIds) {
  const promises = productIds.map(id => 
    axios.get(`${API_BASE}/price/${id}`).catch(e => ({ data: { product_id: id, prices: [] } }))
  );
  const results = await Promise.all(promises);
  
  const priceMap = new Map();
  results.forEach(res => {
    priceMap.set(res.data.product_id, res.data);
  });
  return priceMap;
}

// دالة لجلب المخزون بالتوازي
async function fetchStockParallel(productIds) {
  const promises = productIds.map(id => 
    axios.get(`${API_BASE}/stock/${id}`).catch(e => ({ data: { product_id: id, quantity: 0 } }))
  );
  const results = await Promise.all(promises);
  
  const stockMap = new Map();
  results.forEach(res => {
    stockMap.set(res.data.product_id, res.data);
  });
  return stockMap;
}

// معالجة مجموعة من المنتجات
async function processBatch(products) {
  const productIds = products.map(p => JSON.parse(p.raw_data).id);
  
  console.log(`🔄 Processing ${productIds.length} products...`);
  const startTime = Date.now();
  
  // Parallel requests (الطريقة الأسرع من التجارب)
  const [priceMap, stockMap] = await Promise.all([
    fetchPricesParallel(productIds),
    fetchStockParallel(productIds)
  ]);
  
  const finalData = [];
  
  for (const product of products) {
    const productData = JSON.parse(product.raw_data);
    const priceData = priceMap.get(productData.id) || { prices: [] };
    const stockData = stockMap.get(productData.id) || { quantity: 0 };
    
    // تطبيق Auto-Mapping على كل مصدر
    const mappedProduct = mapper.mapSource(productData, 'products');
    const mappedPrices = mapper.applyTransform(priceData, 'prices');
    const mappedStock = mapper.mapSource(stockData, 'stock');
    
    // دمج كل المصادر
    const merged = mapper.merge([mappedProduct, mappedPrices, mappedStock]);
    
    finalData.push(merged);
    
    // تحديث حالة المعالجة في staging
    db.run(`UPDATE products_staging SET processed = 1 WHERE id = ?`, [productData.id]);
  }
  
  // تخزين في الجدول النهائي
  for (const item of finalData) {
    db.run(`
      INSERT OR REPLACE INTO products_final 
      (productId, productName, currentPrice, salePrice, stockQuantity, lastUpdated, sourceVersion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      item.productId,
      item.productName,
      item.currentPrice || 0,
      item.salePrice || 0,
      item.stockQuantity || 0,
      item.lastUpdated,
      'v1'
    ]);
  }
  
  const duration = Date.now() - startTime;
  
  // تسجيل في logs
  db.run(`
    INSERT INTO processing_logs (batch_size, processed_count, duration_ms)
    VALUES (?, ?, ?)
  `, [products.length, finalData.length, duration]);
  
  console.log(`✅ Processed ${finalData.length} products in ${duration}ms`);
  return finalData.length;
}

// الجدولة: كل ساعة
cron.schedule('0 * * * *', async () => {
  console.log('\n⏰ Running scheduled ETL job...', new Date().toISOString());
  
  // جيب منتجات غير معالجة من Staging Table
  db.all(`
    SELECT * FROM products_staging 
    WHERE processed = 0 
    LIMIT ?
  `, [BATCH_SIZE], async (err, products) => {
    if (err) {
      console.error('Error fetching staging products:', err);
      return;
    }
    
    if (products.length === 0) {
      console.log('📭 No pending products to process');
      return;
    }
    
    await processBatch(products);
  });
});

// معالجة أولية عند التشغيل
setTimeout(() => {
  console.log('🚀 Running initial processing...');
  db.all(`SELECT * FROM products_staging WHERE processed = 0 LIMIT ?`, [BATCH_SIZE], async (err, products) => {
    if (products?.length) await processBatch(products);
  });
}, 5000);

console.log('🕐 Scheduler started - will run every hour');