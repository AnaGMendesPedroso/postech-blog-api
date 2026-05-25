const logger = require('../../../infrastructure/logging/logger');
const { error } = require('../presenters/responseFormatter');

const resolveHttpError = (err, res) => {
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Token inválido', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expirado', 401);
  }
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return error(res, 'Dados inválidos', 400, details);
  }
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return error(res, 'ID inválido', 400);
  }
  if (err.code === 11000) {
    return error(res, 'Email já cadastrado', 409);
  }
  if (err.isOperational) {
    return error(res, err.message, err.statusCode, err.details);
  }
  return error(res, 'Erro interno do servidor', 500);
};

/**
 * Error Handler Middleware - Interface Layer
 * Centralized error handling for the application
 */
// eslint-disable-next-line max-params -- Express error middleware requires (err, req, res, next)
const errorHandler = (err, req, res, _next) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });
  return resolveHttpError(err, res);
};

module.exports = errorHandler;
