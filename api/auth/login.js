import { connectDB } from '../../lib/db/connection';
import { User } from '../../lib/db/models';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError, ValidationError } from '../../lib/utils/errors';
import { logApiError } from '../../lib/utils/apiDiagnostics';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        await connectDB();
        const { email, password } = req.body ?? {};
        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }
        // Find user with password
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +refreshTokens');
        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }
        // Check if suspended
        if (user.isSuspended) {
            throw new UnauthorizedError('Account is suspended');
        }
        // Verify password
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid credentials');
        }
        // Generate tokens
        const accessToken = generateAccessToken({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        });
        const refreshToken = generateRefreshToken({
            userId: user._id.toString(),
            username: user.username,
            role: user.role,
        });
        // Add refresh token (keep last 5)
        user.refreshTokens = [...user.refreshTokens.slice(-4), refreshToken];
        await user.save();
        return sendSuccess(res, {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                rating: user.rating,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (error) {
        logApiError(req, '/api/auth/login', error);
        return sendError(res, error);
    }
}
