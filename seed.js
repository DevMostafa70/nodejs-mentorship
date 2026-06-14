const db = require('./db');
const axios = require('axios');

async function seedDatabase() {
  console.log('🌱 Seeding database...');
  
  // جلب المنتجات من API المحاكاة
  const response = await axios.get('http://localhost:3000/api/products/all');
  const products = response.data;
  
  db.serialize(() => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products_staging (id, name, raw_data, processed)
      VALUES (?, ?, ?, 0)
    `);
    
    for (const product of products) {
      stmt.run(product.id, product.name, JSON.stringify(product));
    }
    
    stmt.finalize();
    console.log(`✅ Seeded ${products.length} products into staging`);
  });
}

seedDatabase();