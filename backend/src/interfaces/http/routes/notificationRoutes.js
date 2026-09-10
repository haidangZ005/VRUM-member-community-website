const express = require('express');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const { notificationListSchema, notificationIdSchema, preferencesSchema } = require('../validators/notificationValidator');

function makeNotificationRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', validateRequest(notificationListSchema, 'query'), asyncHandler(controller.list));
  router.get('/unread-count', asyncHandler(controller.unreadCount));
  router.patch('/read-all', asyncHandler(controller.markAllRead));
  router.patch('/:id/read', validateRequest(notificationIdSchema, 'params'), asyncHandler(controller.markRead));
  return router;
}

function makePreferenceRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', asyncHandler(controller.getPreferences));
  router.put('/', validateRequest(preferencesSchema), asyncHandler(controller.updatePreferences));
  return router;
}

module.exports = { makeNotificationRoutes, makePreferenceRoutes };
