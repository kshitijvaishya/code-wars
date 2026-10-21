import { ApiError } from './errors';
export function logApiError(req, endpoint, error) {
    const requestId = req.headers['x-request-id']?.toString() ?? 'unknown';
    const message = error instanceof Error ? error.message : String(error);
    const category = error instanceof ApiError
        ? 'client-error'
        : message.includes('MONGODB_URI') || message.toLowerCase().includes('mongo')
            ? 'database'
            : 'unexpected';
    console.error(JSON.stringify({
        requestId,
        endpoint,
        category,
        message,
        stack: error instanceof Error ? error.stack : undefined,
    }));
}
