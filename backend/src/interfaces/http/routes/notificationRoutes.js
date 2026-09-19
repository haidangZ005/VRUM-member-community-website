const express = require('express');
const validateRequest = require('../middlewares/validateRequest');
const { notificationListSchema, notificationIdSchema, preferencesSchema } = require('../validators/notificationValidator');

function makeNotificationRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', validateRequest(notificationListSchema, 'query'), controller.list);
  router.get('/unread-count', controller.unreadCount);
  router.patch('/read-all', controller.markAllRead);
  router.patch('/:id/read', validateRequest(notificationIdSchema, 'params'), controller.markRead);
  return router;
}

function makePreferenceRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', controller.getPreferences);
  router.put('/', validateRequest(preferencesSchema), controller.updatePreferences);
  return router;
}

module.exports = { makeNotificationRoutes, makePreferenceRoutes };
