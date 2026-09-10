const express = require('express');
const asyncHandler = require('../../../shared/utils/asyncHandler');
const validateRequest = require('../middlewares/validateRequest');
const { searchSchema } = require('../validators/searchValidator');

function makeSearchRoutes(controller, optionalAuthMiddleware) {
  const router = express.Router();
  router.get('/', optionalAuthMiddleware, validateRequest(searchSchema, 'query'), asyncHandler(controller.search));
  return router;
}

module.exports = makeSearchRoutes;
