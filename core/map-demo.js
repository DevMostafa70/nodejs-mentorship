function createLookupMap(records, keyName) {
  return new Map(records.map((record) => [record[keyName], record]));
}

function mapSummary(map, label) {
  return {
    label,
    type: 'Map',
    size: map.size,
    lookup: 'O(1) average-case lookup by productId',
    sampleKeys: [...map.keys()].slice(0, 5),
  };
}

module.exports = {
  createLookupMap,
  mapSummary,
};
