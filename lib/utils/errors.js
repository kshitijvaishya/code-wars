export class ApiError extends Error {
    constructor(statusCode, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
    }
}
export class ValidationError extends ApiError {
    constructor(message, details) {
        super(400, message, details);
        this.name = 'ValidationError';
    }
}
export class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized') {
        super(401, message);
        this.name = 'UnauthorizedError';
    }
}
export class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(403, message);
        this.name = 'ForbiddenError';
    }
}
export class NotFoundError extends ApiError {
    constructor(message = 'Not found') {
        super(404, message);
        this.name = 'NotFoundError';
    }
}
export class ConflictError extends ApiError {
    constructor(message) {
        super(409, message);
        this.name = 'ConflictError';
    }
}
export class DeadlineExpiredError extends ApiError {
    constructor(message = 'Deadline has expired') {
        super(400, message);
        this.name = 'DeadlineExpiredError';
    }
}
