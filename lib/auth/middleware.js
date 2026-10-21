import { verifyAccessToken } from './jwt';
import { User } from '../db/models';
import { connectDB } from '../db/connection';
export async function authenticate(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    try {
        const decoded = verifyAccessToken(token);
        await connectDB();
        const user = await User.findById(decoded.userId)
            .select('username email role')
            .lean();
        if (!user) {
            return null;
        }
        return {
            _id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}
export function requireAdmin(user) {
    return user?.role === 'admin' || user?.role === 'superadmin';
}
export function requireAuth(user) {
    return user !== null;
}
