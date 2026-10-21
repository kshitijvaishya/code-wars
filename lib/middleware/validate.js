import { sendError } from '../utils/apiResponse';
export function validate(schema, target = 'body') {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const error = result.error;
            sendError(res, 'VALIDATION_ERROR', 'Invalid request data', 400, error.flatten().fieldErrors);
            return;
        }
        req[target] = result.data;
        next();
    };
}
