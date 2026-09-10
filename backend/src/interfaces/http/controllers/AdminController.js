function makeAdminController(useCases) {
  return {
    async dashboard(_req, res) {
      return res.json({ data: await useCases.getDashboardStats.execute() });
    },
    async listMembers(req, res) {
      return res.json(await useCases.listMembers.execute(req.validatedQuery));
    },
    async lockMember(req, res) {
      return res.json({ data: await useCases.lockMemberAccount.execute(req.validatedParams.id) });
    },
    async unlockMember(req, res) {
      return res.json({ data: await useCases.unlockMemberAccount.execute(req.validatedParams.id) });
    },
    async listPosts(req, res) {
      return res.json(await useCases.adminListPosts.execute(req.validatedQuery));
    },
    async deletePost(req, res) {
      return res.json({ data: await useCases.adminDeletePost.execute(req.validatedParams.id, req.user.id, req.validatedBody.reason) });
    },
    async listComments(req, res) {
      return res.json(await useCases.adminListComments.execute(req.validatedQuery));
    },
    async deleteComment(req, res) {
      return res.json({ data: await useCases.moderateComment.execute(req.validatedParams.id, req.user.id, req.validatedBody.reason) });
    },
    async listCategories(_req, res) {
      return res.json({ data: await useCases.listAdminCategories.execute() });
    },
    async createCategory(req, res) {
      return res.status(201).json({ data: await useCases.createCategory.execute(req.validatedBody) });
    },
    async updateCategory(req, res) {
      return res.json({ data: await useCases.updateCategory.execute(req.validatedParams.id, req.validatedBody) });
    },
    async deleteCategory(req, res) {
      return res.json({ data: await useCases.deleteCategory.execute(req.validatedParams.id) });
    },
  };
}

module.exports = makeAdminController;
