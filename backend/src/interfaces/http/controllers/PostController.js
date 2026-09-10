const NotFoundError = require('../../../domain/errors/NotFoundError');

async function ensureCategory(categoryRepository, id) {
  const category = await categoryRepository.findById(id);
  if (!category) throw new NotFoundError('Không tìm thấy cộng đồng');
}

function makePostController(useCases, dependencies) {
  return {
    async list(req, res) {
      const result = await useCases.listPosts.execute({ ...req.validatedQuery, viewerId: req.user?.id });
      return res.json(result);
    },
    async getById(req, res) {
      return res.json({ data: await useCases.getPostDetail.execute(req.validatedParams.id, req.user?.id) });
    },
    async create(req, res) {
      return res.status(201).json({ data: await useCases.createPost.execute(req.user.id, req.validatedBody) });
    },
    async update(req, res) {
      return res.json({ data: await useCases.editPost.execute(req.validatedParams.id, req.user.id, req.validatedBody) });
    },
    async remove(req, res) {
      return res.json({ data: await useCases.deletePost.execute(req.validatedParams.id, req.user.id) });
    },
    async setPostVote(req, res) {
      return res.json({ data: await useCases.setPostVote.execute(req.validatedParams.id, req.user.id, req.validatedBody.value) });
    },
    async recordPostView(req, res) {
      return res.json({ data: await useCases.recordPostView.execute(req.validatedParams.id, req.user.id) });
    },
    async setPostHidden(req, res) {
      return res.json({ data: await useCases.setPostHidden.execute(req.validatedParams.id, req.user.id, req.validatedBody.hidden) });
    },
    async markPostNotInterested(req, res) {
      return res.json({ data: await useCases.markPostNotInterested.execute(req.validatedParams.id, req.user.id) });
    },
    async listComments(req, res) {
      return res.json({ data: await useCases.listCommentsByPost.execute(req.validatedParams.id, req.user?.id) });
    },
    async createComment(req, res) {
      return res.status(201).json({ data: await useCases.createComment.execute(req.validatedParams.id, req.user.id, req.validatedBody) });
    },
    async updateComment(req, res) {
      return res.json({ data: await useCases.editComment.execute(req.validatedParams.id, req.validatedParams.commentId, req.user.id, req.validatedBody) });
    },
    async deleteComment(req, res) {
      return res.json({ data: await useCases.editComment.execute(req.validatedParams.id, req.validatedParams.commentId, req.user.id, null) });
    },
    async setCommentVote(req, res) {
      return res.json({ data: await useCases.setCommentVote.execute(req.validatedParams.id, req.validatedParams.commentId, req.user.id, req.validatedBody.value) });
    },
    async listCategories(req, res) {
      const { id, search = '', limit, mine, joined, favorites } = req.validatedQuery;
      if (!req.user && (mine || joined || favorites)) return res.json({ data: [] });
      if (id) {
        const category = await dependencies.categoryRepository.findById(id, req.user?.id);
        return res.json({ data: category ? [category] : [] });
      }
      return res.json({ data: await dependencies.categoryRepository.list({
        search,
        limit,
        ownerId: mine ? req.user?.id : null,
        viewerId: req.user?.id,
        joinedOnly: Boolean(joined || favorites),
        favoritesOnly: Boolean(favorites),
      }) });
    },
    async createCategory(req, res) {
      return res.status(201).json({ data: await useCases.createCategory.execute(req.validatedBody, req.user.id) });
    },
    async updateCategory(req, res) {
      return res.json({ data: await useCases.updateCategory.execute(req.validatedParams.id, req.validatedBody, req.user.id) });
    },
    async deleteCategory(req, res) {
      return res.json({ data: await useCases.deleteCategory.execute(req.validatedParams.id, req.user.id) });
    },
    async joinCategory(req, res) {
      await ensureCategory(dependencies.categoryRepository, req.validatedParams.id);
      return res.json({ data: await dependencies.categoryRepository.join(req.validatedParams.id, req.user.id) });
    },
    async leaveCategory(req, res) {
      await ensureCategory(dependencies.categoryRepository, req.validatedParams.id);
      return res.json({ data: await dependencies.categoryRepository.leave(req.validatedParams.id, req.user.id) });
    },
    async favoriteCategory(req, res) {
      await ensureCategory(dependencies.categoryRepository, req.validatedParams.id);
      return res.json({ data: await dependencies.categoryRepository.setFavorite(req.validatedParams.id, req.user.id, true) });
    },
    async unfavoriteCategory(req, res) {
      await ensureCategory(dependencies.categoryRepository, req.validatedParams.id);
      return res.json({ data: await dependencies.categoryRepository.setFavorite(req.validatedParams.id, req.user.id, false) });
    },
    async setCategoryMuted(req, res) {
      await ensureCategory(dependencies.categoryRepository, req.validatedParams.id);
      return res.json({ data: await dependencies.categoryRepository.setMuted(req.validatedParams.id, req.user.id, req.validatedBody.muted) });
    },
    async recommendedCategories(req, res) {
      return res.json({ data: await dependencies.categoryRepository.listRecommended(req.user.id, req.validatedQuery.limit) });
    },
  };
}

module.exports = makePostController;
