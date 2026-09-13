const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const asyncHandler = require('../../../shared/utils/asyncHandler');
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
  router.get('/categories', optionalAuthMiddleware, validateRequest(listCategoriesSchema, 'query'), asyncHandler(controller.listCategories));
  router.get('/categories/recommendations', authMiddleware, validateRequest(recommendationsSchema, 'query'), asyncHandler(controller.recommendedCategories));
  router.post('/categories', authMiddleware, validateRequest(categorySchema), asyncHandler(controller.createCategory));
  router.put('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), validateRequest(categorySchema), asyncHandler(controller.updateCategory));
  router.delete('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.deleteCategory));
  router.post('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.joinCategory));
  router.delete('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.leaveCategory));
  router.post('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.favoriteCategory));
  router.delete('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.unfavoriteCategory));
  router.put('/categories/:id/mutes', authMiddleware, validateRequest(categoryIdSchema, 'params'), validateRequest(mutedSchema), asyncHandler(controller.setCategoryMuted));
  router.get('/', optionalAuthMiddleware, validateRequest(listPostsSchema, 'query'), asyncHandler(controller.list));
  router.post('/', authMiddleware, validateRequest(createPostSchema), asyncHandler(controller.create));
  router.get('/:id', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.getById));
  router.put('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(updatePostSchema), asyncHandler(controller.update));
  router.delete('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.remove));
  router.put('/:id/votes', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(voteSchema), asyncHandler(controller.setPostVote));
  router.post('/:id/views', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.recordPostView));
  router.put('/:id/hides', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(hiddenSchema), asyncHandler(controller.setPostHidden));
  router.post('/:id/recommendation-feedback', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.markPostNotInterested));
  router.get('/:id/summary', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.getSummary));
  router.post('/:id/summary', optionalAuthMiddleware, summaryLimiter, validateRequest(postIdSchema, 'params'), asyncHandler(controller.summarize));
  router.get('/:id/comments', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.listComments));
  router.post('/:id/comments', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(createCommentSchema), asyncHandler(controller.createComment));
  router.put('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), validateRequest(updateCommentSchema), asyncHandler(controller.updateComment));
  router.delete('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), asyncHandler(controller.deleteComment));
  router.put('/:id/comments/:commentId/votes', authMiddleware, validateRequest(commentIdSchema, 'params'), validateRequest(voteSchema), asyncHandler(controller.setCommentVote));
  return router;
}

module.exports = makePostRoutes;
