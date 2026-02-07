// API Handler: GET /api/config
// Serves public OAuth client IDs to the frontend (non-secret values)

import { jsonResponse } from '../_shared/response.js';
export { onRequestOptions } from '../_shared/middleware.js';

export async function onRequestGet(context) {
    const { env } = context;

    return jsonResponse({
        googleClientId: env.GOOGLE_CLIENT_ID || '',
        microsoftClientId: env.MICROSOFT_CLIENT_ID || '',
    });
}
