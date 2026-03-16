const logger = require('../../../infrastructure/logging/logger');
const { error } = require('../presenters/responseFormatter');

/**
 * Error Handler Middleware - Interface Layer
 * Centralized error handling for the application
 */
const errorHandler = (err, req, res, _next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return error(res, 'Dados inválidos', 400, details);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return error(res, 'ID inválido', 400);
  }

  // Handle operational errors (known errors)
  if (err.isOperational) {
    return error(res, err.message, err.statusCode, err.details);
  }

  // Handle unknown errors (bugs)
  return error(res, 'Erro interno do servidor', 500);
};

module.exports = errorHandler;
