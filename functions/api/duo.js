// API Handler: POST /api/duo
// Thin routing layer — delegates to DuoService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { DuoService } from '../_services/duo-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handlePost(context) {
    const { request, env } = context;
    const { action, data = {} } = await request.json();

    switch (action) {
        case 'create':
            return jsonResponse(await DuoService.create(env.DB, data));
        case 'get':
            return jsonResponse(await DuoService.get(env.DB, data.duoId));
        case 'quiz_complete':
            return jsonResponse(await DuoService.handleQuizComplete(env.DB, data));
        default:
            throw new ValidationError('Invalid action: ' + action);
    }
}

export const onRequestPost = withMiddleware(handlePost, { requireDb: true });
