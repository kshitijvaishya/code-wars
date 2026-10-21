import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';
import { User } from '../models/User';
export async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        sendError(res, 'UNAUTHORIZED', 'No token provided', 401);
        return;
    }
    const token = authHeader.substring(7);
    try {
        const payload = verifyAccessToken(token);
        // Check if user is suspended
        const user = await User.findById(payload.userId).select('isSuspended role').lean();
        if (!user) {
            sendError(res, 'UNAUTHORIZED', 'User not found', 401);
            return;
        }
        if (user.isSuspended) {
            sendError(res, 'SUSPENDED', 'Account suspended', 403);
            return;
        }
        req.user = {
            userId: payload.userId,
            username: payload.username,
            role: user.role, // use DB role, not token role (more secure)
        };
        next();
    }
    catch {
        sendError(res, 'UNAUTHORIZED', 'Invalid or expired token', 401);
    }
}
export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            sendError(res, 'UNAUTHORIZED', 'Not authenticated', 401);
            return;
        }
        if (!roles.includes(req.user.role)) {
            sendError(res, 'FORBIDDEN', 'Insufficient permissions', 403);
            return;
        }
        next();
    };
}
