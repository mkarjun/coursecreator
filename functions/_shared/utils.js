// Shared utility functions

/**
 * Generate a short, readable ID using non-ambiguous characters
 * Used for battles, duos, and other shareable entities
 * @param {number} length - ID length (default 8)
 * @returns {string} Generated ID
 */
export function generateId(length = 8) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Safely parse a JSON string, returning a fallback on failure
 * Handles cases where DB content might be already-parsed or malformed
 * @param {string|any} str - String to parse (or already-parsed value)
 * @param {any} fallback - Value to return on parse failure
 * @returns {any} Parsed value or fallback
 */
export function safeJsonParse(str, fallback = {}) {
    if (typeof str !== 'string') return str || fallback;
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}
