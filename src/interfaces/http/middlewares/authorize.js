const { ForbiddenError } = require('../../../domain/errors/AppError');

/**
 * Authorization Middleware - Interface Layer
 * Verifies user role against allowed roles
 */
const authorizeRole =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError('Acesso negado para este perfil');
    }
    next();
  };

module.exports = authorizeRole;
