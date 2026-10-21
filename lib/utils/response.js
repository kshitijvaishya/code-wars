import { ApiError } from './errors';
export function sendSuccess(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
    });
}
export function sendError(res, error) {
    if (error instanceof ApiError) {
        return res.status(error.statusCode).json({
            success: false,
            error: error.message,
            details: error.details,
        });
    }
    console.error('Unexpected error:', error);
    return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
}
export function sendValidationError(res, errors) {
    return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors,
    });
}
