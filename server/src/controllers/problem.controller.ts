import { Request, Response, NextFunction } from 'express';
import { Problem } from '../models/Problem';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';
import { Battle } from '../models/Battle';
import { Submission } from '../models/Submission';
import { validateProblemCreation, validateProblemPublication } from '../utils/problemValidation';

export async function listProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { difficulty, tags, page = '1', pageSize = '20', search } = req.query as Record<string, string>;
    const query: Record<string, unknown> = {
      $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }],
    };

    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: tags.split(',') };
    if (search) query.title = { $regex: search, $options: 'i' };

    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(50, Math.max(1, parseInt(pageSize)));
    const skip = (pg - 1) * ps;

    const [problems, total] = await Promise.all([
      Problem.find(query).sort({ createdAt: -1 }).skip(skip).limit(ps).select('-hiddenTestCases'),
      Problem.countDocuments(query),
    ]);

    sendSuccess(res, {
      items: problems,
      total,
      page: pg,
      pageSize: ps,
      totalPages: Math.ceil(total / ps),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const problem = await Problem.findOne({
      $and: [
        { $or: [{ _id: mongoose.isValidObjectId(req.params.id) ? req.params.id : null }, { slug: req.params.id }] },
        { $or: [{ status: 'published' }, { status: { $exists: false }, isPublished: true }] },
      ],
    }).select('-hiddenTestCases');

    if (!problem) {
      sendError(res, 'NOT_FOUND', 'Problem not found', 404);
      return;
    }
    sendSuccess(res, problem);
  } catch (err) {
    next(err);
  }
}

export async function createProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { title, difficulty, tags, description, inputFormat, outputFormat,
            constraints, notes, sampleTestCases, hiddenTestCases,
            timeLimitMs, memoryLimitMb, supportedLanguages, outputSizeLimitKb } = req.body;

    const requestedStatus = req.body.status ?? (
      req.body.isPublished === true ? 'published' : 'draft'
    );
    const candidate = {
      ...req.body,
      title: title ?? '',
      sampleTestCases: sampleTestCases ?? [],
      hiddenTestCases: hiddenTestCases ?? [],
      supportedLanguages: supportedLanguages ?? [],
      timeLimitMs,
      memoryLimitMb,
    };
    if (requestedStatus === 'published') {
      const errors = validateProblemCreation({ ...candidate, status: requestedStatus });
      if (errors.length) {
        sendError(res, 'INVALID_PROBLEM', 'Problem is not ready to publish', 400, { fields: errors });
        return;
      }
    }

    const slug = (title || 'untitled-problem').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await Problem.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const problem = new Problem({
      title, slug: finalSlug, difficulty, tags, description,
      inputFormat, outputFormat, constraints, notes,
      sampleTestCases, hiddenTestCases, timeLimitMs, memoryLimitMb,
      supportedLanguages,
      outputSizeLimitKb,
      status: requestedStatus,
      createdBy: req.user!.userId,
      isPublished: requestedStatus === 'published',
    });

    await problem.save();

    await AuditLog.create({
      actorId: req.user!.userId,
      action: 'problem.created',
      resourceType: 'problem',
      resourceId: problem._id.toString(),
      metadata: { title },
      ip: req.ip,
    });

    const safe = await Problem.findById(problem._id).select('-hiddenTestCases');
    sendSuccess(res, safe, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) {
      sendError(res, 'NOT_FOUND', 'Problem not found', 404);
      return;
    }

    const allowedFields = ['title', 'difficulty', 'tags', 'description', 'inputFormat',
      'outputFormat', 'constraints', 'notes', 'sampleTestCases', 'hiddenTestCases',
      'timeLimitMs', 'memoryLimitMb', 'supportedLanguages', 'outputSizeLimitKb'];

    const requestedStatus = req.body.status ?? (
      req.body.isPublished === true ? 'published' :
      req.body.isPublished === false ? 'draft' : undefined
    );
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (problem as unknown as Record<string, unknown>)[field] = req.body[field];
      }
    }

    if (requestedStatus) {
      if (requestedStatus === 'published') {
        const errors = validateProblemPublication(problem);
        if (errors.length) {
          sendError(res, 'INVALID_PROBLEM', 'Problem is not ready to publish', 400, { fields: errors });
          return;
        }
      }
      problem.status = requestedStatus;
      problem.isPublished = requestedStatus === 'published';
    }

    await problem.save();
    const safe = await Problem.findById(problem._id).select('-hiddenTestCases');
    sendSuccess(res, safe);
  } catch (err) {
    next(err);
  }
}

export async function deleteProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [battleReference, submissionReference] = await Promise.all([
      Battle.exists({ problemId: req.params.id }),
      Submission.exists({ problemId: req.params.id }),
    ]);
    if (battleReference || submissionReference) {
      sendError(res, 'PROBLEM_IN_USE', 'Problem is referenced by battle or submission history; archive it instead', 409);
      return;
    }

    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) {
      sendError(res, 'NOT_FOUND', 'Problem not found', 404);
      return;
    }
    sendSuccess(res, { message: 'Problem deleted' });
  } catch (err) {
    next(err);
  }
}

// Admin only — includes hidden test cases
export async function getAdminProblem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const problem = await Problem.findById(req.params.id).select('+hiddenTestCases');
    if (!problem) {
      sendError(res, 'NOT_FOUND', 'Problem not found', 404);
      return;
    }
    const adminProblem = problem.toObject({ transform: false });
    sendSuccess(res, {
      ...adminProblem,
      id: problem._id.toString(),
      _id: undefined,
      __v: undefined,
    });
  } catch (err) {
    next(err);
  }
}

export async function listAdminProblems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', pageSize = '20', search, status } = req.query as Record<string, string>;
    const pg = Math.max(1, parseInt(page));
    const ps = Math.min(50, Math.max(1, parseInt(pageSize)));

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };
    const [problems, total] = await Promise.all([
      Problem.find(query).sort({ createdAt: -1 }).skip((pg - 1) * ps).limit(ps).select('-hiddenTestCases'),
      Problem.countDocuments(query),
    ]);

    sendSuccess(res, { items: problems, total, page: pg, pageSize: ps, totalPages: Math.ceil(total / ps) });
  } catch (err) {
    next(err);
  }
}
