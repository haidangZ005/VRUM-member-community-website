const express = require('express');
const makeAuthRoutes = require('./authRoutes');
const makeUserRoutes = require('./userRoutes');
const makePostRoutes = require('./postRoutes');
const makeAdminRoutes = require('./adminRoutes');
const roleGuard = require('../middlewares/roleGuard');

function makeRoutes({ authController, userController, postController, adminController, authMiddleware, optionalAuthMiddleware }) {
  const router = express.Router();
  router.get('/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  router.use('/auth', makeAuthRoutes(authController));
  router.use('/users', makeUserRoutes(userController, authMiddleware));
  router.use('/posts', makePostRoutes(postController, authMiddleware, optionalAuthMiddleware));
  router.use('/admin', makeAdminRoutes(adminController, authMiddleware, roleGuard));
  return router;
}

module.exports = makeRoutes;
