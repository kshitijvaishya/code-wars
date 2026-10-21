import { connectDB } from '../../../lib/db/connection';
import { authenticate, requireAdmin } from '../../../lib/auth/middleware';
import { Tournament } from '../../../lib/db/models';
import { sendSuccess, sendError } from '../../../lib/utils/response';
import { NotFoundError, ForbiddenError } from '../../../lib/utils/errors';
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    try {
        await connectDB();
        const { id } = req.query;
        if (req.method === 'GET') {
            return await handleGet(req, res, id);
        }
        else if (req.method === 'PATCH') {
            return await handlePatch(req, res, id);
        }
        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    }
    catch (error) {
        return sendError(res, error);
    }
}
async function handleGet(req, res, id) {
    const tournament = await Tournament.findById(id)
        .populate('createdBy', 'username')
        .populate('participantIds', 'username email rating')
        .lean();
    if (!tournament) {
        throw new NotFoundError('Tournament not found');
    }
    return sendSuccess(res, tournament);
}
async function handlePatch(req, res, id) {
    const user = await authenticate(req);
    if (!user || !requireAdmin(user)) {
        throw new ForbiddenError('Only admins can update tournaments');
    }
    const tournament = await Tournament.findById(id);
    if (!tournament) {
        throw new NotFoundError('Tournament not found');
    }
    // Only allow updates to draft tournaments
    if (tournament.status !== 'draft') {
        throw new ForbiddenError('Cannot update tournament after it has started');
    }
    const { name, minParticipants, maxParticipants, numFinalists, roundConfiguration } = req.body;
    if (name)
        tournament.name = name;
    if (minParticipants)
        tournament.minParticipants = minParticipants;
    if (maxParticipants)
        tournament.maxParticipants = maxParticipants;
    if (numFinalists)
        tournament.numFinalists = numFinalists;
    if (roundConfiguration)
        tournament.roundConfiguration = roundConfiguration;
    await tournament.save();
    return sendSuccess(res, tournament);
}
