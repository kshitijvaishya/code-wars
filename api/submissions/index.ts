import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectDB } from '../../lib/db/connection';
import { authenticate } from '../../lib/auth/middleware';
import { Submission, Match } from '../../lib/db/models';
import { sendSuccess, sendError } from '../../lib/utils/response';
import { UnauthorizedError, NotFoundError, ForbiddenError, ValidationError } from '../../lib/utils/errors';
import { validateDeadline } from '../../lib/tournament/timer';
import { evaluateSubmission } from '../../lib/judging/evaluate';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
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

    const { matchId, questionId, language, sourceCode, type } = req.body;

    // Validation
    if (!matchId || !questionId || !language || !sourceCode) {
      throw new ValidationError('Missing required fields: matchId, questionId, language, sourceCode');
    }

    if (sourceCode.length > 100000) {
      throw new ValidationError('Source code too large (max 100KB)');
    }

    // Verify match and participation
    const match = await Match.findById(matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    const isParticipant = match.playerIds.some(
      id => id.toString() === user._id
    );

    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this match');
    }

    // Verify deadline
    try {
      validateDeadline(match.questionDeadlineAt);
    } catch (error) {
      throw new ValidationError('Question deadline has expired');
    }

    // Create submission
    const submission = await Submission.create({
      matchId,
      playerId: user._id,
      questionId,
      language,
      sourceCode,
      submissionType: type || 'submit',
      status: 'pending',
      submittedAt: new Date(),
    });

    // Start evaluation asynchronously (don't wait)
    if (type === 'submit' || !type) {
      evaluateSubmission(submission._id.toString()).catch(error => {
        console.error('Evaluation error:', error);
      });
    }

    return sendSuccess(res, {
      submissionId: submission._id,
      status: 'pending',
      message: type === 'run' ? 'Code executed' : 'Submission queued for evaluation',
    }, 202);

  } catch (error) {
    return sendError(res, error as Error);
  }
}
