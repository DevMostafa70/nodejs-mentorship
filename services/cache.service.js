class CacheService {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      cachedAt: new Date().toISOString(),
    });
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }

  entries() {
    return [...this.cache.entries()].map(([key, entry]) => ({
      key,
      cachedAt: entry.cachedAt,
      type: Array.isArray(entry.value) ? 'array' : typeof entry.value,
      size: Array.isArray(entry.value) ? entry.value.length : 1,
    }));
  }
}

module.exports = new CacheService();
