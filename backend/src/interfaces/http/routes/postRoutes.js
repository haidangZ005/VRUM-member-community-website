const express = require('express');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const { createPostSchema, updatePostSchema, createCommentSchema, postIdSchema, categoryIdSchema, listPostsSchema, listCategoriesSchema } = require('../validators/postValidator');
const { categorySchema } = require('../validators/adminValidator');
const { updateCommentSchema, commentIdSchema } = require('../validators/postValidator');

function makePostRoutes(controller, authMiddleware, optionalAuthMiddleware) {
  const router = express.Router();
  router.get('/categories', optionalAuthMiddleware, validateRequest(listCategoriesSchema, 'query'), asyncHandler(controller.listCategories));
  router.post('/categories', authMiddleware, validateRequest(categorySchema), asyncHandler(controller.createCategory));
  router.put('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), validateRequest(categorySchema), asyncHandler(controller.updateCategory));
  router.delete('/categories/:id', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.deleteCategory));
  router.post('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.joinCategory));
  router.delete('/categories/:id/join', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.leaveCategory));
  router.post('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.favoriteCategory));
  router.delete('/categories/:id/favorite', authMiddleware, validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.unfavoriteCategory));
  router.get('/', optionalAuthMiddleware, validateRequest(listPostsSchema, 'query'), asyncHandler(controller.list));
  router.post('/', authMiddleware, validateRequest(createPostSchema), asyncHandler(controller.create));
  router.get('/:id', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.getById));
  router.put('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(updatePostSchema), asyncHandler(controller.update));
  router.delete('/:id', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.remove));
  router.post('/:id/like', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.like));
  router.delete('/:id/like', authMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.unlike));
  router.get('/:id/comments', optionalAuthMiddleware, validateRequest(postIdSchema, 'params'), asyncHandler(controller.listComments));
  router.post('/:id/comments', authMiddleware, validateRequest(postIdSchema, 'params'), validateRequest(createCommentSchema), asyncHandler(controller.createComment));
  router.put('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), validateRequest(updateCommentSchema), asyncHandler(controller.updateComment));
  router.delete('/:id/comments/:commentId', authMiddleware, validateRequest(commentIdSchema, 'params'), asyncHandler(controller.deleteComment));
  return router;
}

module.exports = makePostRoutes;
