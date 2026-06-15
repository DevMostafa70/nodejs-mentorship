const express = require('express');
const aggregatorService = require('./services/aggregator.service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    project: 'nodejs-data-structures-lab',
    scenario: 'E-commerce integration system using real-world data structures',
    endpoints: [
      'GET /api/products',
      'GET /api/products/:id',
      'GET /api/categories',
      'GET /api/cache',
      'GET /api/queue',
      'GET /api/stack',
      'GET /api/summary',
    ],
  });
});

app.get('/api/products', (req, res) => {
  res.json(aggregatorService.getProducts());
});

app.get('/api/products/:id', (req, res) => {
  const product = aggregatorService.getProductById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  return res.json(product);
});

app.get('/api/categories', (req, res) => {
  res.json(aggregatorService.getCategories());
});

app.get('/api/cache', (req, res) => {
  res.json(aggregatorService.getCacheStatus());
});

app.get('/api/queue', (req, res) => {
  res.json(aggregatorService.getQueueStatus());
});

app.get('/api/stack', (req, res) => {
  res.json(aggregatorService.getHistory());
});

app.get('/api/summary', (req, res) => {
  res.json(aggregatorService.getDataStructureSummary());
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`nodejs-data-structures-lab running on http://localhost:${PORT}`);
});
