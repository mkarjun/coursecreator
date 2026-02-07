// API Handler: POST /api/generate
// Thin routing layer — delegates to AiService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { AiService } from '../_services/ai-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handlePost(context) {
    const { request, env } = context;
    const { prompt, type = 'course', topic } = await request.json();

    if (!prompt && !topic) {
        throw new ValidationError('Prompt or topic is required');
    }

    const { data, status } = await AiService.generate(env, { prompt, type });
    return jsonResponse(data, status);
}

export const onRequestPost = withMiddleware(handlePost);
