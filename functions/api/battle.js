// API Handler: POST /api/battle
// Thin routing layer — delegates to BattleService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { BattleService } from '../_services/battle-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handlePost(context) {
    const { request, env } = context;
    const { action, data } = await request.json();

    switch (action) {
        case 'create':
            return jsonResponse(await BattleService.create(env.DB, data));
        case 'get':
            return jsonResponse(await BattleService.get(env.DB, data.battleId));
        case 'submit':
            return jsonResponse(await BattleService.submit(env.DB, data));
        default:
            throw new ValidationError('Invalid action');
    }
}

export const onRequestPost = withMiddleware(handlePost, { requireDb: true });
