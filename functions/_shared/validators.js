// Input validation helpers and custom error types
// Errors thrown here carry a .status property that middleware uses for HTTP status codes

/**
 * 400 Bad Request — missing or invalid input
 */
export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
        this.status = 400;
    }
}

/**
 * 404 Not Found — resource doesn't exist
 */
export class NotFoundError extends Error {
    constructor(message = 'Not found') {
        super(message);
        this.name = 'NotFoundError';
        this.status = 404;
    }
}

/**
 * 500 Config Error — missing environment variable or binding
 */
export class ConfigError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConfigError';
        this.status = 500;
    }
}

/**
 * Validate that all required fields are present in data
 * @param {object} data - Input data object
 * @param {string[]} fields - Required field names
 * @throws {ValidationError} if any field is missing
 */
export function requireFields(data, fields) {
    const missing = fields.filter(
        (f) => data[f] === undefined || data[f] === null
    );
    if (missing.length > 0) {
        throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
    }
}

/**
 * Validate and return an environment variable
 * @param {object} env - Cloudflare env bindings
 * @param {string} key - Environment variable name
 * @returns {string} The env value
 * @throws {ConfigError} if not configured
 */
export function requireEnv(env, key) {
    if (!env[key]) {
        throw new ConfigError(`${key} not configured`);
    }
    return env[key];
}
