export function sendSuccess(res, data, statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        data,
        requestId: res.req?.requestId,
    });
}
export function sendError(res, code, message, statusCode = 400, details) {
    return res.status(statusCode).json({
        success: false,
        error: { code, message, ...(details ? { details } : {}) },
        requestId: res.req?.requestId,
    });
}
export class AppError extends Error {
    constructor(code, message, statusCode = 400, details) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'AppError';
    }
}
