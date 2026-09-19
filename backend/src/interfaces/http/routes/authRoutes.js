const express = require('express');
const rateLimit = require('express-rate-limit');
const validateRequest = require('../middlewares/validateRequest');
const schemas = require('../validators/authValidator');

function makeAuthRoutes(controller) {
  const router = express.Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau.' } },
  });

  router.post('/register', authLimiter, validateRequest(schemas.registerSchema), controller.register);
  router.post('/login', authLimiter, validateRequest(schemas.loginSchema), controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/forgot-password', authLimiter, validateRequest(schemas.forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', authLimiter, validateRequest(schemas.resetPasswordSchema), controller.resetPassword);
  return router;
}

module.exports = makeAuthRoutes;
