const Queue = require('./queue');

const BATCH_SIZE = 100;

function createProductQueue(products) {
  const queue = new Queue();

  for (let index = 0; index < products.length; index += BATCH_SIZE) {
    queue.enqueue({
      batchNumber: Math.floor(index / BATCH_SIZE) + 1,
      size: products.slice(index, index + BATCH_SIZE).length,
      productIds: products.slice(index, index + BATCH_SIZE).map((product) => product.id),
    });
  }

  return queue;
}

function processProductBatches(products, processBatch) {
  const queue = createProductQueue(products);
  const processedBatches = [];

  while (!queue.isEmpty()) {
    const batch = queue.dequeue();
    processedBatches.push(processBatch(batch));
  }

  return processedBatches;
}

module.exports = {
  BATCH_SIZE,
  createProductQueue,
  processProductBatches,
};
