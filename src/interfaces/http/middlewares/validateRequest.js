const { ValidationError } = require('../../../domain/errors/AppError');

/**
 * Validation Middleware - Interface Layer
 * Validates request data against Joi schemas
 */

/**
 * Creates a validation middleware for the specified schema and source
 * @param {Object} schema - Joi schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 */
const validateRequest = (schema, source = 'body') => {
  return (req, _res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      next(new ValidationError('Dados inválidos', details));
      return;
    }

    // Replace request data with validated and sanitized values
    req[source] = value;
    next();
  };
};

/**
 * Shorthand validators for common sources
 */
const validateBody = (schema) => validateRequest(schema, 'body');
const validateQuery = (schema) => validateRequest(schema, 'query');
const validateParams = (schema) => validateRequest(schema, 'params');

module.exports = {
  validateRequest,
  validateBody,
  validateQuery,
  validateParams,
};
