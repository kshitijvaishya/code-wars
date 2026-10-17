import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Submission } from '../models/Submission';
import { runCode, submitCode } from '../services/submission.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { getJudgeProvider } from '../judge';

export async function handleRunCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problemId, languageId, sourceCode, customInput } = req.body as {
      problemId: string;
      languageId: number;
      sourceCode: string;
      customInput?: string;
    };

    const results = await runCode(req.user!.userId, problemId, languageId, sourceCode, customInput);
    sendSuccess(res, results);
  } catch (err) {
    next(err);
  }
}

export async function handleSubmit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problemId, battleId, languageId, sourceCode } = req.body as {
      problemId: string;
      battleId?: string;
      languageId: number;
      sourceCode: string;
    };

    // Access the io from app locals (set during server init)
    const io = req.app.locals.io;
    const result = await submitCode(req.user!.userId, problemId, battleId ?? null, languageId, sourceCode, io);
    sendSuccess(res, result, 202);
  } catch (err) {
    next(err);
  }
}

export async function getSubmission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      sendError(res, 'NOT_FOUND', 'Submission not found', 404);
      return;
    }

    // Only the submitter can see their submission
    if (submission.userId.toString() !== req.user!.userId && req.user!.role === 'user') {
      sendError(res, 'FORBIDDEN', 'Not authorized', 403);
      return;
    }

    // Fetch with sample stdout/stderr for the user's own submission
    const fullSubmission = await Submission.findById(req.params.id)
      .select('+testCaseResults.stdout +testCaseResults.stderr +sourceCode');

    // Strip hidden test stdout/stderr
    if (fullSubmission) {
      fullSubmission.testCaseResults = fullSubmission.testCaseResults.map((r) => {
        if (!r.isSample) {
          r.stdout = undefined;
          r.stderr = undefined;
        }
        return r;
      });
    }

    sendSuccess(res, fullSubmission);
  } catch (err) {
    next(err);
  }
}

export async function listUserSubmissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { problemId, battleId, page = '1', pageSize = '20' } = req.query as Record<string, string>;
    const query: Record<string, unknown> = { userId: req.user!.userId };
    if (problemId) query.problemId = problemId;
    if (battleId) query.battleId = battleId;

    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(50, Math.max(1, parseInt(pageSize)));

    const [submissions, total] = await Promise.all([
      Submission.find(query).sort({ submittedAt: -1 }).skip((pg - 1) * ps).limit(ps),
      Submission.countDocuments(query),
    ]);

    sendSuccess(res, { items: submissions, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}

export async function getSupportedLanguages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const judge = getJudgeProvider();
    const languages = await judge.getSupportedLanguages();
    sendSuccess(res, languages);
  } catch (err) {
    next(err);
  }
}
