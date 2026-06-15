# nodejs-data-structures-lab

An Express.js project that demonstrates real-world Data Structures usage in an e-commerce integration system.

The app simulates three external APIs using local JSON files:

- `data/products.json`: product catalog data
- `data/prices.json`: pricing data
- `data/stock.json`: inventory data

The aggregator service merges those sources into one unified product response.

```json
{
  "id": 1,
  "name": "Pro Laptop 1",
  "category": "Electronics",
  "price": 33.48,
  "currency": "USD",
  "stock": 18,
  "active": true
}
```

## Setup

```bash
npm install
npm start
```

Server URL:

```text
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/products` | Returns merged product, price, and stock data |
| GET | `/api/products/:id` | Returns one merged product by ID |
| GET | `/api/categories` | Returns unique product categories using `Set` |
| GET | `/api/cache` | Returns in-memory cache metadata using `Map` |
| GET | `/api/queue` | Returns batch queue processing status |
| GET | `/api/stack` | Returns operation history using `Stack` |
| GET | `/api/summary` | Returns a summary of Array, Map, and Set usage |

## Business Scenario

In a real e-commerce platform, product information, prices, and inventory often come from different services. A product page or admin dashboard needs one clean response, so the backend must combine those sources efficiently.

This project loads:

- 100 product records
- 100 price records
- 100 stock records

Then it uses multiple Data Structures to process, merge, cache, deduplicate, batch, and track operations.

## Array

An `Array` is an ordered collection of values. Arrays are ideal when you need to iterate through a list, transform records, filter records, sort records, or calculate summaries.

Where it is used:

- `data/products.json` is loaded as an array of products.
- `core/array-processing.js` demonstrates `map()`, `filter()`, `reduce()`, and `sort()`.
- `services/aggregator.service.js` maps products into the final merged response.

Example:

```js
const activeProducts = products.filter((product) => product.active);
const productNames = products.map((product) => product.name);
```

Why it is a good choice:

- Product data naturally arrives as a list.
- Arrays provide expressive built-in methods for business processing.

Big-O:

- Access by index: `O(1)`
- Iteration with `map`, `filter`, or `reduce`: `O(n)`
- Sorting: `O(n log n)`

## Map

A `Map` stores key-value pairs. It is useful when you need fast lookup by a unique key.

Where it is used:

- `priceMap` uses `productId` as the key.
- `stockMap` uses `productId` as the key.
- `services/cache.service.js` uses `Map` for in-memory caching.

Example:

```js
const priceMap = new Map(prices.map((price) => [price.productId, price]));
const priceRecord = priceMap.get(product.id);
```

Why it is a good choice:

- Without `Map`, merging products with prices and stock often becomes nested loops.
- Nested loops over 100 products and 100 prices are `O(n * m)`.
- With `Map`, each lookup is `O(1)` on average, making the merge much faster and cleaner.

Big-O:

- `get`: `O(1)` average case
- `set`: `O(1)` average case
- `has`: `O(1)` average case
- Building a map from an array: `O(n)`

## Set

A `Set` stores unique values. If the same value is added more than once, it only keeps one copy.

Where it is used:

- Unique product categories in `GET /api/categories`
- Unique product IDs in `GET /api/summary`

Example:

```js
const categories = [...new Set(products.map((product) => product.category))];
```

Why it is a good choice:

- Removing duplicates is a common business requirement.
- A `Set` avoids manual duplicate checks.

Big-O:

- `add`: `O(1)` average case
- `has`: `O(1)` average case
- Building a set from an array: `O(n)`

## Queue

A `Queue` is a First-In, First-Out Data Structure. The first item added is the first item removed.

Where it is used:

- `core/queue.js` implements a reusable Queue class.
- `core/queue-demo.js` uses the queue for product batch processing.
- Products are processed in batches of 100.

Implemented methods:

- `enqueue()`
- `dequeue()`
- `peek()`
- `isEmpty()`
- `size()`

Example:

```js
queue.enqueue(batch);
const nextBatch = queue.dequeue();
```

Why it is a good choice:

- Batch jobs, message processing, import pipelines, and background workers often process tasks in arrival order.
- Queue behavior matches real integration systems where data should be processed predictably.

Big-O:

- `enqueue`: `O(1)`
- `peek`: `O(1)`
- `isEmpty`: `O(1)`
- `size`: `O(1)`
- `dequeue`: `O(n)` in this array-backed implementation because `shift()` re-indexes the array

Note: A production queue with very high volume can use a linked list or head pointer to make `dequeue` `O(1)`.

## Stack

A `Stack` is a Last-In, First-Out Data Structure. The last item added is the first item removed.

Where it is used:

- `core/stack-demo.js` implements an operation history stack.
- `GET /api/stack` returns recent operations.
- The stack can support undo-style behavior through `undo()`.

Example:

```js
history.push({ action: 'GET_PRODUCTS' });
const lastOperation = history.peek();
```

Why it is a good choice:

- Undo, browser history, call stacks, and operation logs often need the most recent action first.
- Stack behavior makes it easy to inspect or remove the latest operation.

Big-O:

- `push`: `O(1)`
- `pop`: `O(1)`
- `peek`: `O(1)`

## Project Structure

```text
nodejs-data-structures-lab/
├── core/
│   ├── queue.js
│   ├── queue-demo.js
│   ├── stack-demo.js
│   ├── map-demo.js
│   ├── set-demo.js
│   └── array-processing.js
├── services/
│   ├── aggregator.service.js
│   └── cache.service.js
├── data/
│   ├── products.json
│   ├── prices.json
│   └── stock.json
├── server.js
├── package.json
└── README.md
```

## Example Requests

```bash
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/1
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/cache
curl http://localhost:3000/api/queue
curl http://localhost:3000/api/stack
curl http://localhost:3000/api/summary
```

## Key Lesson

Choosing the right Data Structure improves both readability and performance:

- Use `Array` for ordered data processing.
- Use `Map` for fast lookup by ID.
- Use `Set` for uniqueness.
- Use `Queue` for first-in, first-out batch processing.
- Use `Stack` for last-in, first-out history and undo behavior.
