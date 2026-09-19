const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const validateRequest = require('../middlewares/validateRequest');
const { createPostSchema, updatePostSchema, createCommentSchema, voteSchema, hiddenSchema, mutedSchema, postIdSchema, categoryIdSchema, listPostsSchema, listCategoriesSchema, recommendationsSchema } = require('../validators/postValidator');
const { categorySchema } = require('../validators/adminValidator');
const { updateCommentSchema, commentIdSchema } = require('../validators/postValidator');

function makePostRoutes(controller, authMiddleware, optionalAuthMiddleware) {
  const router = express.Router();
  const summaryLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id ? `user:${req.user.id}` : `ip:${ipKeyGenerator(req.ip)}`,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn đã yêu cầu quá nhiều bản tóm tắt. Vui lòng thử lại sau.' } },
  });
  router.get('/categories', optionalAuthMiddleware, validateRequest(listCategoriesSchema, 'query'), controller.listCategories);
  router.get('/categories/recommendations', authMiddleware, validateRequest(recommendationsSchema, 'query'), controller.recommendedCategories);
  router.post('/categories', authMiddleware, validateRequest(categorySchema), controller.createCategory);
  router.put('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), validateRequest(categorySchema), controller.updateCategory);
  router.delete('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), controller.deleteCategory);
  router.post('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), controller.joinCategory);
  router.delete('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), controller.leaveCategory);
  router.post('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), controller.favoriteCategory);
  router.delete('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), controller.unfavoriteCategory);
  router.put('/categories/:id/mutes', authMiddleware, validateRequest(categoryIdSchema, 'params'), validateRequest(mutedSchema), controller.setCategoryMuted);
  router.get('/', optionalAuthMiddleware, validateRequest(listPostsSchema, 'query'), controller.list);
  router.post('/', authMiddleware, validateRequest(createPostSchema), controller.create);
  router.get('/:id', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), controller.getById);
  router.put('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(updatePostSchema), controller.update);
  router.delete('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), controller.remove);
  router.put('/:id/votes', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(voteSchema), controller.setPostVote);
  router.post('/:id/views', authMiddleware, validateRequest(postIdSchema, 'params'), controller.recordPostView);
  router.put('/:id/hides', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(hiddenSchema), controller.setPostHidden);
  router.post('/:id/recommendation-feedback', authMiddleware, validateRequest(postIdSchema, 'params'), controller.markPostNotInterested);
  router.get('/:id/summary', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), controller.getSummary);
  router.post('/:id/summary', optionalAuthMiddleware, summaryLimiter, validateRequest(postIdSchema, 'params'), controller.summarize);
  router.get('/:id/comments', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), controller.listComments);
  router.post('/:id/comments', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(createCommentSchema), controller.createComment);
  router.put('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), validateRequest(updateCommentSchema), controller.updateComment);
  router.delete('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), controller.deleteComment);
  router.put('/:id/comments/:commentId/votes', authMiddleware, validateRequest(commentIdSchema, 'params'), validateRequest(voteSchema), controller.setCommentVote);
  return router;
}

module.exports = makePostRoutes;
