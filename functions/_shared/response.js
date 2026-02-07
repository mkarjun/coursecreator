// Shared HTTP response utilities
// Single source of truth for CORS headers and response formatting

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export { CORS_HEADERS };

/**
 * Create a JSON response with CORS headers
 * @param {any} data - Response body (will be JSON-stringified)
 * @param {number} status - HTTP status code
 */
export function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}

/**
 * Create an error JSON response
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @param {object} extra - Additional fields to include (e.g. { detail: '...' })
 */
export function errorResponse(message, status = 500, extra = {}) {
    return jsonResponse({ error: message, ...extra }, status);
}

/**
 * Create a CORS preflight response (for OPTIONS requests)
 */
export function corsPreflightResponse() {
    return new Response(null, { headers: CORS_HEADERS });
}
