const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const env = require('../infrastructure/config/env');
const makeDependencies = require('./factories/makeDependencies');
const makeUseCases = require('./factories/makeUseCases');
const makeAuthController = require('../interfaces/http/controllers/AuthController');
const makeUserController = require('../interfaces/http/controllers/UserController');
const makePostController = require('../interfaces/http/controllers/PostController');
const makeAdminController = require('../interfaces/http/controllers/AdminController');
const makeAuthMiddleware = require('../interfaces/http/middlewares/authMiddleware');
const errorHandler = require('../interfaces/http/middlewares/errorHandler');
const makeRoutes = require('../interfaces/http/routes');

function createApp(overrides = {}) {
  const dependencies = overrides.dependencies || makeDependencies();
  const useCases = overrides.useCases || makeUseCases(dependencies);
  const tokenService = overrides.tokenService || dependencies.tokenService;
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '3mb' }));
  app.use(cookieParser());
  if (env.NODE_ENV !== 'test') app.use(morgan('dev'));

  app.use('/api', makeRoutes({
    authController: makeAuthController(useCases),
    userController: makeUserController(useCases),
    postController: makePostController(useCases, dependencies),
    adminController: makeAdminController(useCases),
    authMiddleware: makeAuthMiddleware(tokenService, dependencies.userRepository),
  }));
  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy endpoint' } }));
  app.use(errorHandler);
  return app;
}

module.exports = createApp;
