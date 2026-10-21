import { connectDB } from '../../../lib/db/connection';
import { authenticate } from '../../../lib/auth/middleware';
import { Tournament } from '../../../lib/db/models';
import { sendSuccess, sendError } from '../../../lib/utils/response';
import { NotFoundError, UnauthorizedError } from '../../../lib/utils/errors';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) {
            throw new UnauthorizedError();
        }
        const { id } = req.query;
        const tournament = await Tournament.findById(id)
            .populate('participantIds', 'username email rating avatarUrl')
            .lean();
        if (!tournament) {
            throw new NotFoundError('Tournament not found');
        }
        return sendSuccess(res, {
            participants: tournament.participantIds,
            count: tournament.participantIds.length,
            minParticipants: tournament.minParticipants,
            maxParticipants: tournament.maxParticipants,
        });
    }
    catch (error) {
        return sendError(res, error);
    }
}
