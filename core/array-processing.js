function summarizeProducts(products) {
  const activeProducts = products.filter((product) => product.active);
  const productNames = products.map((product) => product.name);
  const productsByCategory = products.reduce((summary, product) => {
    summary[product.category] = (summary[product.category] || 0) + 1;
    return summary;
  }, {});
  const sortedByName = [...products].sort((first, second) => first.name.localeCompare(second.name));

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    inactiveProducts: products.length - activeProducts.length,
    firstFiveNames: productNames.slice(0, 5),
    productsByCategory,
    firstFiveSortedByName: sortedByName.slice(0, 5).map((product) => product.name),
    methodsUsed: ['map', 'filter', 'reduce', 'sort'],
  };
}

module.exports = {
  summarizeProducts,
};
