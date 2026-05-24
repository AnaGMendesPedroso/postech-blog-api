const authService = require('../../../application/usecases/AuthService');
const { success } = require('../presenters/responseFormatter');

/**
 * Auth Controller - Interface Layer
 * HTTP request handlers for authentication operations
 */
class AuthController {
  /**
   * Register a new user
   * POST /auth/register
   */
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      success(res, user.toJSON(), 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Login user
   * POST /auth/login
   */
  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);
      success(res, { user: user.toJSON(), token });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
