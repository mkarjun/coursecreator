// API Handler: POST /api/courses
// Thin routing layer — delegates to CourseService

import { withMiddleware } from '../_shared/middleware.js';
import { jsonResponse } from '../_shared/response.js';
import { CourseService } from '../_services/course-service.js';
import { ValidationError } from '../_shared/validators.js';
export { onRequestOptions } from '../_shared/middleware.js';

async function handlePost(context) {
    const { request, env } = context;
    const { action, data } = await request.json();

    switch (action) {
        case 'create':
            return jsonResponse(await CourseService.create(env.DB, data));
        case 'get':
            return jsonResponse(await CourseService.get(env.DB, data.id, data.userId));
        case 'list':
            return jsonResponse(await CourseService.list(env.DB, data.userId, data.limit));
        case 'delete':
            return jsonResponse(await CourseService.delete(env.DB, data.id, data.userId));
        case 'updateProgress':
            return jsonResponse(await CourseService.updateProgress(env.DB, data));
        case 'getProgress':
            return jsonResponse(await CourseService.getProgress(env.DB, data.userId, data.courseId));
        case 'saveVideoTimestamp':
            return jsonResponse(await CourseService.saveVideoTimestamp(env.DB, data));
        case 'getVideoTimestamps':
            return jsonResponse(await CourseService.getVideoTimestamps(env.DB, data.userId, data.courseId));
        case 'getAllUserData':
            return jsonResponse(await CourseService.getAllUserData(env.DB, data.userId));
        default:
            throw new ValidationError('Invalid action');
    }
}

export const onRequestPost = withMiddleware(handlePost, { requireDb: true });
