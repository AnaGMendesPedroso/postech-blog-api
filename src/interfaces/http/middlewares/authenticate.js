const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../../../domain/errors/AppError');

/**
 * Authentication Middleware - Interface Layer
 * Verifies JWT token and attaches user to request
 */
const authenticate = (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token não fornecido');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    throw new UnauthorizedError('Token inválido ou expirado');
  }
};

module.exports = authenticate;
