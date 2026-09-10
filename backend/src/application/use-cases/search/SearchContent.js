class SearchContent {
  constructor({ searchRepository }) { this.searchRepository = searchRepository; }

  async execute({ q, type = 'all', categoryId = null, authorId = null, from = null, to = null, sort = 'relevance', page = 1, limit = 20 }) {
    const normalizedPage = Number(page);
    const normalizedLimit = Number(limit);
    const filters = {
      q: q.trim(), categoryId, authorId, from, to, sort, page: normalizedPage,
      limit: type === 'all' ? Math.min(5, normalizedLimit) : normalizedLimit,
      includeThumbnail: type !== 'all',
    };
    const methods = {
      posts: 'searchPosts', comments: 'searchComments', communities: 'searchCommunities', users: 'searchUsers', media: 'searchMedia',
    };
    if (type !== 'all') {
      const result = await this.searchRepository[methods[type]](filters);
      return {
        data: result.items,
        meta: {
          page: normalizedPage,
          limit: filters.limit,
          total: result.total,
          totalPages: Math.max(1, Math.ceil(result.total / filters.limit)),
        },
      };
    }
    const requestedTypes = Object.keys(methods);
    const entries = await Promise.all(requestedTypes.map(async (resultType) => [resultType, await this.searchRepository[methods[resultType]](filters)]));
    const data = { posts: [], comments: [], communities: [], users: [], media: [] };
    const totals = { posts: 0, comments: 0, communities: 0, users: 0, media: 0 };
    for (const [resultType, result] of entries) {
      data[resultType] = result.items;
      totals[resultType] = result.total;
    }
    return { data, meta: { page: normalizedPage, limit: filters.limit, totals } };
  }
}

module.exports = SearchContent;
