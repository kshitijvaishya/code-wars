import { connectDB } from '../../../lib/db/connection';
import { authenticate } from '../../../lib/auth/middleware';
import { Tournament } from '../../../lib/db/models';
import { sendSuccess, sendError } from '../../../lib/utils/response';
import { NotFoundError, UnauthorizedError, ConflictError, ValidationError } from '../../../lib/utils/errors';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        await connectDB();
        const user = await authenticate(req);
        if (!user) {
            throw new UnauthorizedError();
        }
        const { id } = req.query;
        const tournament = await Tournament.findById(id);
        if (!tournament) {
            throw new NotFoundError('Tournament not found');
        }
        // Check tournament status
        if (tournament.status !== 'registration') {
            throw new ValidationError('Tournament registration is not open');
        }
        // Check if already joined
        if (tournament.participantIds.some(pid => pid.toString() === user._id)) {
            throw new ConflictError('Already joined this tournament');
        }
        // Check capacity
        if (tournament.participantIds.length >= tournament.maxParticipants) {
            throw new ValidationError('Tournament is full');
        }
        // Add participant
        tournament.participantIds.push(user._id);
        await tournament.save();
        // TODO: Publish realtime event
        // await publishEvent(`tournament:${id}:lobby`, 'participant_joined', {
        //   userId: user._id,
        //   username: user.username,
        // });
        return sendSuccess(res, {
            message: 'Successfully joined tournament',
            participantCount: tournament.participantIds.length,
        });
    }
    catch (error) {
        return sendError(res, error);
    }
}
