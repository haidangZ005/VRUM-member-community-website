const UnauthorizedError = require('../../../domain/errors/UnauthorizedError');

function makeAuthMiddleware(tokenService, userRepository, { optional = false } = {}) {
  return async (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (optional && (scheme !== 'Bearer' || !token)) return next();
    if (scheme !== 'Bearer' || !token) return next(new UnauthorizedError('Vui lòng đăng nhập'));

    let payload;
    try {
      payload = tokenService.verifyAccessToken(token);
    } catch {
      if (optional) return next();
      return next(new UnauthorizedError('Access token không hợp lệ hoặc đã hết hạn'));
    }

    try {
      const user = await userRepository.findById(payload.sub);
      if (!user || user.status !== 'active') {
        if (optional) return next();
        return next(new UnauthorizedError('Tài khoản không còn quyền truy cập'));
      }
      req.user = { id: user.id, role: user.role };
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = makeAuthMiddleware;
