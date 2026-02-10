/**
 * Standardized API Response Utility
 * Provides consistent response formats across all API endpoints
 */

/**
 * Creates a standardized success response
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {object} Standardized response object
 */
export function successResponse(data, message = 'Success', statusCode = 200) {
  return {
    status: 'Success',
    message,
    statusCode,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {string} errorCode - Optional error code for client handling
 * @param {object} details - Optional additional error details
 * @returns {object} Standardized error response object
 */
export function errorResponse(message, statusCode = 500, errorCode = null, details = null) {
  const response = {
    status: 'Error',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
  };
  
  if (errorCode) {
    response.errorCode = errorCode;
  }
  
  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }
  
  return response;
}

/**
 * Creates a validation error response
 * @param {array} errors - Array of validation errors
 * @returns {object} Standardized validation error response
 */
export function validationErrorResponse(errors) {
  return {
    status: 'Error',
    message: 'Validation failed',
    statusCode: 400,
    errorCode: 'VALIDATION_ERROR',
    errors: Array.isArray(errors) ? errors : [errors],
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a paginated response
 * @param {array} items - Array of items
 * @param {object} pagination - Pagination info (page, pageSize, total, etc.)
 * @param {string} message - Optional success message
 * @returns {object} Standardized paginated response
 */
export function paginatedResponse(items, pagination, message = 'Success') {
  return {
    status: 'Success',
    message,
    statusCode: 200,
    data: items,
    pagination: {
      page: pagination.page || 1,
      pageSize: pagination.pageSize || items.length,
      total: pagination.total || items.length,
      totalPages: pagination.totalPages || Math.ceil((pagination.total || items.length) / (pagination.pageSize || items.length)),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a rate limit response
 * @param {string} message - Rate limit message
 * @param {number} retryAfter - Seconds until retry is allowed
 * @returns {object} Standardized rate limit response
 */
export function rateLimitResponse(message = 'Too many requests', retryAfter = 60) {
  return {
    status: 'Error',
    message,
    statusCode: 429,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an authentication error response
 * @param {string} message - Auth error message
 * @param {string} authType - Type of authentication required
 * @returns {object} Standardized auth error response
 */
export function authErrorResponse(message = 'Authentication required', authType = 'Bearer') {
  return {
    status: 'Error',
    message,
    statusCode: 401,
    errorCode: 'AUTHENTICATION_REQUIRED',
    authType,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates an authorization error response
 * @param {string} message - Authorization error message
 * @returns {object} Standardized authorization error response
 */
export function authorizationErrorResponse(message = 'Access denied') {
  return {
    status: 'Error',
    message,
    statusCode: 403,
    errorCode: 'AUTHORIZATION_FAILED',
    timestamp: new Date().toISOString(),
  };
}
