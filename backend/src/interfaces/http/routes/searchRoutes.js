const express = require('express');
const validateRequest = require('../middlewares/validateRequest');
const { searchSchema } = require('../validators/searchValidator');

function makeSearchRoutes(controller, optionalAuthMiddleware) {
  const router = express.Router();
  router.get('/', optionalAuthMiddleware, validateRequest(searchSchema, 'query'), controller.search);
  return router;
}

module.exports = makeSearchRoutes;
