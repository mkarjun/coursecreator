// API Handler: GET /api/youtube
// Thin routing layer — delegates to YoutubeService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { YoutubeService } from '../_services/youtube-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handleGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const maxResults = url.searchParams.get('maxResults') || '5';

    if (!query) {
        throw new ValidationError('Query parameter "q" is required');
    }

    const { data, status } = await YoutubeService.search(env, { query, maxResults });
    return jsonResponse(data, status);
}

export const onRequestGet = withMiddleware(handleGet);
