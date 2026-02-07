// API Handler: GET /api/cleanup + Cron Trigger
// Thin routing layer — delegates to CleanupService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { CleanupService } from '../_services/cleanup-service.js';
export { onRequestOptions } from '../_shared/middleware.js';

// Manual trigger via HTTP
async function handleRequest(context) {
    const results = await CleanupService.run(context.env.DB);
    return jsonResponse(results);
}

export const onRequest = withMiddleware(handleRequest, { requireDb: true });

// Scheduled trigger via Cron (daily at midnight)
export async function scheduled(event, env, ctx) {
    ctx.waitUntil(CleanupService.run(env.DB));
}
