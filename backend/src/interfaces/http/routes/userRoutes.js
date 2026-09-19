const express = require('express');
const validateRequest = require('../middlewares/validateRequest');
const { updateProfileSchema } = require('../validators/authValidator');

function makeUserRoutes(controller, authMiddleware) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/me', controller.getMe);
  router.put('/me', validateRequest(updateProfileSchema), controller.updateMe);
  return router;
}

module.exports = makeUserRoutes;
