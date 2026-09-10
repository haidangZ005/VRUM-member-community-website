const express = require('express');
const makeAuthRoutes = require('./authRoutes');
const makeUserRoutes = require('./userRoutes');
const makePostRoutes = require('./postRoutes');
const makeAdminRoutes = require('./adminRoutes');
const makeSearchRoutes = require('./searchRoutes');
const { makeNotificationRoutes, makePreferenceRoutes } = require('./notificationRoutes');
const roleGuard = require('../middlewares/roleGuard');

function makeRoutes({ authController, userController, postController, adminController, searchController, notificationController, authMiddleware, optionalAuthMiddleware }) {
  const router = express.Router();
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.use('/auth', makeAuthRoutes(authController));
  router.use('/users', makeUserRoutes(userController, authMiddleware));
  router.use('/posts', makePostRoutes(postController, authMiddleware, optionalAuthMiddleware));
  router.use('/search', makeSearchRoutes(searchController, optionalAuthMiddleware));
  router.use('/notifications', makeNotificationRoutes(notificationController, authMiddleware));
  router.use('/notification-preferences', makePreferenceRoutes(notificationController, authMiddleware));
  router.use('/admin', makeAdminRoutes(adminController, authMiddleware, roleGuard));
  return router;
}

module.exports = makeRoutes;
