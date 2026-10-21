import { connectDB } from '../../lib/db/connection';
import { User } from '../../lib/db/models';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { ConflictError, ValidationError } from '../../lib/utils/errors';
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
        const { username, email, password } = req.body ?? {};
        // Validation
        if (!username || !email || !password) {
            throw new ValidationError('Username, email, and password are required');
        }
        if (username.length < 3 || username.length > 30) {
            throw new ValidationError('Username must be 3-30 characters');
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            throw new ValidationError('Username can only contain letters, numbers, hyphens, and underscores');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new ValidationError('A valid email is required');
        }
        if (password.length < 8) {
            throw new ValidationError('Password must be at least 8 characters');
        }
        // Check if user exists
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { username }]
        });
        if (existingUser) {
            if (existingUser.email === normalizedEmail) {
                throw new ConflictError('Email already registered');
            }
            if (existingUser.username === username) {
                throw new ConflictError('Username already taken');
            }
        }
        // Create user
        const user = await User.create({
            username,
            email: normalizedEmail,
            passwordHash: password, // Will be hashed by pre-save hook
            role: 'user',
        });
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
        // Save refresh token
        user.refreshTokens = [refreshToken];
        await user.save();
        return sendSuccess(res, {
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        }, 201);
    }
    catch (error) {
        logApiError(req, '/api/auth/register', error);
        if (error?.code === 11000) {
            return sendError(res, new ConflictError('Email or username already registered'));
        }
        return sendError(res, error);
    }
}
