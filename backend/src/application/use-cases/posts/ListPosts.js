class ListPosts {
  constructor({ postRepository }) { this.postRepository = postRepository; }

  async execute({ page = 1, limit = 10, categoryId = null, viewerId = null, feed = 'all', sort } = {}) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || 10));
    const normalizedFeed = categoryId ? 'all' : feed;
    const normalizedSort = sort || (normalizedFeed === 'all' ? 'new' : 'hot');
    const result = await this.postRepository.list({
      page: normalizedPage,
      limit: normalizedLimit,
      categoryId: categoryId || null,
      viewerId,
      feed: normalizedFeed,
      sort: normalizedSort,
    });
    return {
      data: result.items.map((post) => post.toJSON()),
      meta: {
        page: normalizedPage,
        limit: normalizedLimit,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / normalizedLimit)),
      },
    };
  }
}

module.exports = ListPosts;
