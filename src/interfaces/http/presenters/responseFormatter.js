/**
 * Response Formatter - Interface Layer
 * Standardized response format for the API
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Express response
 */
const success = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of items
 * @param {Object} pagination - Pagination info
 * @returns {Object} Express response
 */
const paginated = (res, data, pagination) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    },
  });
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} details - Additional error details
 * @returns {Object} Express response
 */
// eslint-disable-next-line max-params -- details is optional, keeps call sites clean
const error = (res, message, statusCode = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
    },
  };

  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

module.exports = {
  success,
  paginated,
  error,
};
