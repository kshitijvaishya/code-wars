import { connectDB } from '../../lib/db/connection';
import { authenticate, requireAdmin } from '../../lib/auth/middleware';
import { Tournament } from '../../lib/db/models';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError, ForbiddenError, ValidationError } from '../../lib/utils/errors';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        await connectDB();
        if (req.method === 'GET') {
            return await handleGet(req, res);
        }
        else if (req.method === 'POST') {
            return await handlePost(req, res);
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    }
    catch (error) {
        return sendError(res, error);
    }
}
async function handleGet(req, res) {
    const user = await authenticate(req);
    // Anyone can list tournaments
    const tournaments = await Tournament.find({
        status: { $in: ['registration', 'in_progress', 'completed'] }
    })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('createdBy', 'username')
        .lean();
    return sendSuccess(res, tournaments);
}
async function handlePost(req, res) {
    const user = await authenticate(req);
    if (!user) {
        throw new UnauthorizedError();
    }
    if (!requireAdmin(user)) {
        throw new ForbiddenError('Only admins can create tournaments');
    }
    const { name, minParticipants, maxParticipants, numFinalists, roundConfiguration, } = req.body;
    // Validation
    if (!name) {
        throw new ValidationError('Tournament name is required');
    }
    if (minParticipants && minParticipants < 2) {
        throw new ValidationError('Minimum participants must be at least 2');
    }
    if (maxParticipants && minParticipants && maxParticipants < minParticipants) {
        throw new ValidationError('Maximum participants must be greater than minimum');
    }
    // Create tournament
    const tournament = await Tournament.create({
        name,
        minParticipants: minParticipants || 4,
        maxParticipants: maxParticipants || 32,
        numFinalists: numFinalists || 2,
        createdBy: user._id,
        roundConfiguration: roundConfiguration || {
            round1: {
                questionCount: 15,
                timePerQuestion: 45,
                pointsPerQuestion: 10,
            },
            round2: {
                questionCount: 5,
                timePerQuestion: 150,
                pointsPerQuestion: 50,
            },
            round3: {
                problemCount: 2,
                totalDuration: 1800,
                pointsPerProblem: 100,
            },
        },
    });
    return sendSuccess(res, tournament, 201);
}
