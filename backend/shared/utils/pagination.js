const buildPaginationOptions = (query = {}) => {
  const limit = Math.min(parseInt(query.limit) || 20, 100); 

  const options = {
    take: limit + 1, 
    orderBy: { created_at: 'desc' },
  };

  if (query.cursor) {
    options.cursor = { id: query.cursor };
    options.skip = 1; 
  }

  return options;
};

const paginateResult = (results, limit = 20) => {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  const cursor = data.length > 0 ? data[data.length - 1].id : null;

  return { data, cursor, hasMore };
};

module.exports = { buildPaginationOptions, paginateResult };

