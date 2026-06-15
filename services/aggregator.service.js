const products = require('../data/products.json');
const prices = require('../data/prices.json');
const stock = require('../data/stock.json');
const { summarizeProducts } = require('../core/array-processing');
const { createLookupMap, mapSummary } = require('../core/map-demo');
const { uniqueCategories, uniqueProductIds } = require('../core/set-demo');
const { createProductQueue, processProductBatches } = require('../core/queue-demo');
const OperationHistory = require('../core/stack-demo');
const cacheService = require('./cache.service');

const history = new OperationHistory();

function mergeProductData() {
  const cacheKey = 'merged-products';

  if (cacheService.has(cacheKey)) {
    history.push({ action: 'CACHE_HIT', resource: cacheKey });
    return cacheService.get(cacheKey).value;
  }

  const priceMap = createLookupMap(prices, 'productId');
  const stockMap = createLookupMap(stock, 'productId');

  const mergedProducts = products.map((product) => {
    const priceRecord = priceMap.get(product.id);
    const stockRecord = stockMap.get(product.id);

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      price: priceRecord ? priceRecord.price : null,
      currency: priceRecord ? priceRecord.currency : 'USD',
      stock: stockRecord ? stockRecord.quantity : 0,
      active: product.active,
    };
  });

  cacheService.set(cacheKey, mergedProducts);
  history.push({ action: 'MERGE_PRODUCTS', resource: cacheKey, records: mergedProducts.length });

  return mergedProducts;
}

function getProducts() {
  const mergedProducts = mergeProductData();
  history.push({ action: 'GET_PRODUCTS', records: mergedProducts.length });
  return mergedProducts;
}

function getProductById(id) {
  const productId = Number(id);
  const product = mergeProductData().find((item) => item.id === productId) || null;
  history.push({ action: 'GET_PRODUCT_BY_ID', productId, found: Boolean(product) });
  return product;
}

function getCategories() {
  const categories = uniqueCategories(products);
  history.push({ action: 'GET_CATEGORIES', records: categories.length });
  return categories;
}

function getQueueStatus() {
  const queue = createProductQueue(products);
  const processedBatches = processProductBatches(products, (batch) => ({
    ...batch,
    status: 'processed',
  }));

  history.push({ action: 'PROCESS_BATCH_QUEUE', batchSize: 100, batches: processedBatches.length });

  return {
    batchSize: 100,
    queuedBatchesBeforeProcessing: queue.size(),
    nextBatch: queue.peek(),
    isEmptyBeforeProcessing: queue.isEmpty(),
    processedBatches,
    isEmptyAfterProcessing: true,
  };
}

function getCacheStatus() {
  history.push({ action: 'GET_CACHE_STATUS' });

  return {
    implementation: 'Map',
    entries: cacheService.entries(),
  };
}

function getHistory() {
  return {
    implementation: 'Stack',
    latestOperation: history.peek(),
    totalOperations: history.size(),
    operations: history.toArray(),
  };
}

function getDataStructureSummary() {
  const priceMap = createLookupMap(prices, 'productId');
  const stockMap = createLookupMap(stock, 'productId');

  return {
    array: summarizeProducts(products),
    map: [mapSummary(priceMap, 'priceMap'), mapSummary(stockMap, 'stockMap')],
    set: {
      uniqueProductIds: uniqueProductIds(products).length,
      uniqueCategories: uniqueCategories(products),
    },
  };
}

module.exports = {
  getProducts,
  getProductById,
  getCategories,
  getQueueStatus,
  getCacheStatus,
  getHistory,
  getDataStructureSummary,
};
