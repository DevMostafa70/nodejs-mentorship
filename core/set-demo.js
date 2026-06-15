function uniqueValues(items, selector) {
  return [...new Set(items.map(selector))];
}

function uniqueProductIds(products) {
  return uniqueValues(products, (product) => product.id);
}

function uniqueCategories(products) {
  return uniqueValues(products, (product) => product.category).sort();
}

module.exports = {
  uniqueValues,
  uniqueProductIds,
  uniqueCategories,
};
