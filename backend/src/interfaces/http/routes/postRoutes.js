const express = require('express');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const { createPostSchema, updatePostSchema, createCommentSchema, postIdSchema, categoryIdSchema, listPostsSchema, listCategoriesSchema } = require('../validators/postValidator');
const { categorySchema } = require('../validators/adminValidator');
const { updateCommentSchema, commentIdSchema } = require('../validators/postValidator');

function makePostRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/categories', validateRequest(listCategoriesSchema, 'query'), asyncHandler(controller.listCategories));
  router.post('/categories', validateRequest(categorySchema), asyncHandler(controller.createCategory));
  router.put('/categories/:id', validateRequest(categoryIdSchema, 'params'), validateRequest(categorySchema), asyncHandler(controller.updateCategory));
  router.delete('/categories/:id', validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.deleteCategory));
  router.post('/categories/:id/join', validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.joinCategory));
  router.delete('/categories/:id/join', validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.leaveCategory));
  router.post('/categories/:id/favorite', validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.favoriteCategory));
  router.delete('/categories/:id/favorite', validateRequest(categoryIdSchema, 'params'), asyncHandler(controller.unfavoriteCategory));
  router.get('/', validateRequest(listPostsSchema, 'query'), asyncHandler(controller.list));
  router.post('/', validateRequest(createPostSchema), asyncHandler(controller.create));
  router.get('/:id', validateRequest(postIdSchema, 'params'), asyncHandler(controller.getById));
  router.put('/:id', validateRequest(postIdSchema, 'params'), validateRequest(updatePostSchema), asyncHandler(controller.update));
  router.delete('/:id', validateRequest(postIdSchema, 'params'), asyncHandler(controller.remove));
  router.post('/:id/like', validateRequest(postIdSchema, 'params'), asyncHandler(controller.like));
  router.delete('/:id/like', validateRequest(postIdSchema, 'params'), asyncHandler(controller.unlike));
  router.get('/:id/comments', validateRequest(postIdSchema, 'params'), asyncHandler(controller.listComments));
  router.post('/:id/comments', validateRequest(postIdSchema, 'params'), validateRequest(createCommentSchema), asyncHandler(controller.createComment));
  router.put('/:id/comments/:commentId', validateRequest(commentIdSchema, 'params'), validateRequest(updateCommentSchema), asyncHandler(controller.updateComment));
  router.delete('/:id/comments/:commentId', validateRequest(commentIdSchema, 'params'), asyncHandler(controller.deleteComment));
  return router;
}

module.exports = makePostRoutes;
