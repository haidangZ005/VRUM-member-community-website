const express = require('express');
const validateRequest = require('../middlewares/validateRequest');
const {
  idParamSchema, memberListSchema, postModerationListSchema, commentModerationListSchema, moderationSchema, categorySchema,
} = require('../validators/adminValidator');

function makeAdminRoutes(controller, authMiddleware, roleGuard) {
  const router = express.Router();
  router.use(authMiddleware, roleGuard('admin'));
  router.get('/dashboard', controller.dashboard);
  router.get('/members', validateRequest(memberListSchema, 'query'), controller.listMembers);
  router.patch('/members/:id/lock', validateRequest(idParamSchema, 'params'), controller.lockMember);
  router.patch('/members/:id/unlock', validateRequest(idParamSchema, 'params'), controller.unlockMember);
  router.get('/posts', validateRequest(postModerationListSchema, 'query'), controller.listPosts);
  router.delete('/posts/:id', validateRequest(idParamSchema, 'params'), validateRequest(moderationSchema), controller.deletePost);
  router.get('/comments', validateRequest(commentModerationListSchema, 'query'), controller.listComments);
  router.delete('/comments/:id', validateRequest(idParamSchema, 'params'), validateRequest(moderationSchema), controller.deleteComment);
  router.get('/categories', controller.listCategories);
  router.post('/categories', validateRequest(categorySchema), controller.createCategory);
  router.put('/categories/:id', validateRequest(idParamSchema, 'params'), validateRequest(categorySchema), controller.updateCategory);
  router.delete('/categories/:id', validateRequest(idParamSchema, 'params'), controller.deleteCategory);
  return router;
}

module.exports = makeAdminRoutes;
