const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database('./data.db');

db.serialize(() => {
  // 1. Staging Table (البيانات الأولية كما هي)
  db.run(`
    CREATE TABLE IF NOT EXISTS products_staging (
      id INTEGER PRIMARY KEY,
      name TEXT,
      raw_data TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      processed INTEGER DEFAULT 0
    )
  `);

  // 2. Final Table (البيانات الجاهزة بعد المعالجة)
  db.run(`
    CREATE TABLE IF NOT EXISTS products_final (
      productId INTEGER PRIMARY KEY,
      productName TEXT,
      currentPrice REAL,
      salePrice REAL,
      stockQuantity INTEGER,
      lastUpdated DATETIME,
      sourceVersion TEXT
    )
  `);

  // 3. Logs Table (لتتبع المعالجة)
  db.run(`
    CREATE TABLE IF NOT EXISTS processing_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_size INTEGER,
      processed_count INTEGER,
      duration_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

module.exports = db;