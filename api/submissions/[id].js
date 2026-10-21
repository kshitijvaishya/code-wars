import { connectDB } from '../../lib/db/connection';
import { authenticate } from '../../lib/auth/middleware';
import { Submission, Match } from '../../lib/db/models';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError, NotFoundError, ForbiddenError } from '../../lib/utils/errors';
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
        const submission = await Submission.findById(id)
            .populate('questionId', 'title difficulty')
            .lean();
        if (!submission) {
            throw new NotFoundError('Submission not found');
        }
        // Verify authorization
        const match = await Match.findById(submission.matchId);
        if (!match) {
            throw new NotFoundError('Match not found');
        }
        const isParticipant = match.playerIds.some(id => id.toString() === user._id);
        const isOwnSubmission = submission.playerId.toString() === user._id;
        if (!isOwnSubmission && !isParticipant) {
            throw new ForbiddenError('Cannot view this submission');
        }
        // Don't expose other player's source code
        if (!isOwnSubmission) {
            delete submission.sourceCode;
        }
        return sendSuccess(res, submission);
    }
    catch (error) {
        return sendError(res, error);
    }
}
