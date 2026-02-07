// API Handler: POST /api/users
// Thin routing layer — delegates to UserService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { UserService } from '../_services/user-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handlePost(context) {
    const { request, env } = context;
    const { action, data } = await request.json();

    switch (action) {
        case 'upsert':
            return jsonResponse(await UserService.upsert(env.DB, data));
        case 'get':
            return jsonResponse(await UserService.get(env.DB, data.id));
        case 'getByEmail':
            return jsonResponse(await UserService.getByEmail(env.DB, data.email));
        case 'updateLastLogin':
            return jsonResponse(await UserService.updateLastLogin(env.DB, data.id));
        case 'getStats':
            return jsonResponse(await UserService.getStats(env.DB, data.id));
        default:
            throw new ValidationError('Invalid action');
    }
}

export const onRequestPost = withMiddleware(handlePost, { requireDb: true });
