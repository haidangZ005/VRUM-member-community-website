const express = require('express');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const {
  idParamSchema, memberListSchema, postModerationListSchema, commentModerationListSchema, moderationSchema, categorySchema,
} = require('../validators/adminValidator');

function makeAdminRoutes(controller, authMiddleware, roleGuard) {
  const router = express.Router();
  router.use(authMiddleware, roleGuard('admin'));
  router.get('/dashboard', asyncHandler(controller.dashboard));
  router.get('/members', validateRequest(memberListSchema, 'query'), asyncHandler(controller.listMembers));
  router.patch('/members/:id/lock', validateRequest(idParamSchema, 'params'), asyncHandler(controller.lockMember));
  router.patch('/members/:id/unlock', validateRequest(idParamSchema, 'params'), asyncHandler(controller.unlockMember));
  router.get('/posts', validateRequest(postModerationListSchema, 'query'), asyncHandler(controller.listPosts));
  router.delete('/posts/:id', validateRequest(idParamSchema, 'params'), validateRequest(moderationSchema), asyncHandler(controller.deletePost));
  router.get('/comments', validateRequest(commentModerationListSchema, 'query'), asyncHandler(controller.listComments));
  router.delete('/comments/:id', validateRequest(idParamSchema, 'params'), validateRequest(moderationSchema), asyncHandler(controller.deleteComment));
  router.get('/categories', asyncHandler(controller.listCategories));
  router.post('/categories', validateRequest(categorySchema), asyncHandler(controller.createCategory));
  router.put('/categories/:id', validateRequest(idParamSchema, 'params'), validateRequest(categorySchema), asyncHandler(controller.updateCategory));
  router.delete('/categories/:id', validateRequest(idParamSchema, 'params'), asyncHandler(controller.deleteCategory));
  return router;
}

module.exports = makeAdminRoutes;
