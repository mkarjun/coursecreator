// Shared middleware for all API handlers
// Wraps handlers with CORS, DB validation, and error handling

import { jsonResponse, corsPreflightResponse } from './response.js';

/**
 * Wrap an API handler with standard middleware:
 * - CORS preflight handling
 * - Database binding validation (optional)
 * - Automatic error catching with proper status codes
 *
 * @param {Function} handler - The actual request handler
 * @param {object} options
 * @param {boolean} options.requireDb - Whether to validate env.DB exists
 */
export function withMiddleware(handler, options = {}) {
    return async function (context) {
        const { request, env } = context;

        // Handle CORS preflight (safety net — Pages also routes OPTIONS separately)
        if (request.method === 'OPTIONS') {
            return corsPreflightResponse();
        }

        // Validate database binding if required
        if (options.requireDb && !env.DB) {
            return jsonResponse({ error: 'Database not configured' }, 500);
        }

        try {
            return await handler(context);
        } catch (error) {
            console.error(`API error [${new URL(request.url).pathname}]:`, error.message);
            const status = error.status || 500;
            const body = { error: error.message };
            if (error.detail) body.detail = error.detail;
            return jsonResponse(body, status);
        }
    };
}

/**
 * Shared CORS preflight handler — re-export from any API handler:
 * export { onRequestOptions } from '../_shared/middleware.js';
 */
export async function onRequestOptions() {
    return corsPreflightResponse();
}
