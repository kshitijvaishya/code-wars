import { v4 as uuidv4 } from 'uuid';
import { Submission } from '../models/Submission';
import { Problem } from '../models/Problem';
import { Battle } from '../models/Battle';
import { getJudgeProvider } from '../judge';
import { logger } from '../utils/logger';
import { AppError } from '../utils/apiResponse';
import { scoringService } from './scoring.service';
export async function runCode(userId, problemId, languageId, sourceCode, customInput) {
    const problem = await Problem.findById(problemId).select('+sampleTestCases');
    if (!problem)
        throw new AppError('NOT_FOUND', 'Problem not found', 404);
    const judge = getJudgeProvider();
    if (customInput !== undefined) {
        const result = await judge.run({
            sourceCode,
            languageId,
            stdin: customInput,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
        });
        return [{
                testCaseId: 'custom',
                stdin: customInput,
                stdout: result.stdout ?? '',
                stderr: result.stderr ?? '',
                expectedOutput: null,
                verdict: result.verdict,
                timeTakenMs: result.timeTakenMs,
                memoryUsedKb: result.memoryUsedKb,
                isSample: false,
            }];
    }
    // Run against sample test cases
    const results = await Promise.all(problem.sampleTestCases.map(async (tc) => {
        const result = await judge.run({
            sourceCode,
            languageId,
            stdin: tc.input,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
        });
        return {
            testCaseId: tc._id?.toString() ?? 'unknown',
            stdin: tc.input,
            stdout: result.stdout ?? '',
            stderr: result.stderr ?? '',
            expectedOutput: tc.expectedOutput,
            verdict: result.verdict,
            timeTakenMs: result.timeTakenMs,
            memoryUsedKb: result.memoryUsedKb,
            isSample: true,
        };
    }));
    return results;
}
export async function submitCode(userId, problemId, battleId, languageId, sourceCode, io) {
    // Verify battle ownership
    if (battleId) {
        const battle = await Battle.findById(battleId);
        if (!battle)
            throw new AppError('NOT_FOUND', 'Battle not found', 404);
        if (battle.state !== 'ACTIVE')
            throw new AppError('BATTLE_NOT_ACTIVE', 'Battle is not active', 400);
        const participant = battle.participants.find((p) => p.userId.toString() === userId);
        if (!participant)
            throw new AppError('FORBIDDEN', 'You are not a participant in this battle', 403);
    }
    const idempotencyKey = uuidv4();
    const submission = await Submission.create({
        userId,
        problemId,
        battleId: battleId ?? null,
        languageId,
        sourceCode,
        verdict: 'PENDING',
        idempotencyKey,
        submittedAt: new Date(),
    });
    // Notify client that submission is queued
    if (io && battleId) {
        io.to(`battle:${battleId}`).emit('submission:queued', {
            submissionId: submission._id.toString(),
            battleId,
        });
    }
    // Process asynchronously
    processSubmission(submission._id.toString(), io).catch((err) => {
        logger.error('Submission processing failed', { submissionId: submission._id, error: err.message });
    });
    return { submissionId: submission._id.toString() };
}
async function processSubmission(submissionId, io) {
    const submission = await Submission.findById(submissionId);
    if (!submission)
        return;
    await Submission.findByIdAndUpdate(submissionId, { verdict: 'PROCESSING' });
    try {
        const problem = await Problem.findById(submission.problemId).select('+hiddenTestCases');
        if (!problem)
            throw new Error('Problem not found during judging');
        const allTestCases = [
            ...problem.sampleTestCases.map((tc) => ({ ...tc, isSample: true, score: 0 })),
            ...problem.hiddenTestCases.map((tc) => ({ ...tc, isSample: false })),
        ];
        const judge = getJudgeProvider();
        const requests = allTestCases.map((tc) => ({
            sourceCode: submission.sourceCode,
            languageId: submission.languageId,
            stdin: tc.input,
            expectedOutput: tc.expectedOutput,
            timeLimitMs: problem.timeLimitMs,
            memoryLimitMb: problem.memoryLimitMb,
        }));
        const tokens = await judge.submitBatch(requests);
        await Submission.findByIdAndUpdate(submissionId, { executionTokens: tokens });
        const results = await judge.getResults(tokens);
        const testCaseResults = results.map((r, idx) => {
            const tc = allTestCases[idx];
            return {
                testCaseId: tc._id?.toString() ?? `tc-${idx}`,
                verdict: r.verdict,
                timeTakenMs: r.timeTakenMs,
                memoryUsedKb: r.memoryUsedKb,
                isSample: tc.isSample,
                scoreEarned: r.verdict === 'ACCEPTED' ? tc.score : 0,
                ...(tc.isSample ? { stdout: r.stdout ?? undefined, stderr: r.stderr ?? undefined } : {}),
            };
        });
        const hiddenResults = testCaseResults.filter((r) => !r.isSample);
        const totalScore = hiddenResults.reduce((sum, r) => sum + r.scoreEarned, 0);
        const totalPossible = problem.hiddenTestCases.reduce((sum, tc) => sum + tc.score, 0);
        const allPassed = hiddenResults.every((r) => r.verdict === 'ACCEPTED');
        const compilationError = testCaseResults.find((r) => r.verdict === 'COMPILATION_ERROR');
        let finalVerdict;
        if (compilationError) {
            finalVerdict = 'COMPILATION_ERROR';
        }
        else if (allPassed && hiddenResults.length > 0) {
            finalVerdict = 'ACCEPTED';
        }
        else if (totalScore > 0) {
            finalVerdict = 'PARTIAL_SCORE';
        }
        else {
            const worstVerdict = getWorstVerdict(hiddenResults.map((r) => r.verdict));
            finalVerdict = worstVerdict;
        }
        const maxTime = Math.max(...results.map((r) => r.timeTakenMs ?? 0));
        const maxMemory = Math.max(...results.map((r) => r.memoryUsedKb ?? 0));
        const compileOutput = results.find((r) => r.compileOutput)?.compileOutput ?? null;
        await Submission.findByIdAndUpdate(submissionId, {
            verdict: finalVerdict,
            score: totalScore,
            totalScore: totalPossible,
            timeTakenMs: maxTime || null,
            memoryUsedKb: maxMemory || null,
            compilationOutput: compileOutput,
            testCaseResults,
            judgedAt: new Date(),
        });
        logger.info('Submission judged', { submissionId, verdict: finalVerdict, score: totalScore });
        // Emit verdict to user
        if (io) {
            const userId = submission.userId.toString();
            io.to(`user:${userId}`).emit('submission:verdict', {
                submissionId,
                battleId: submission.battleId?.toString() ?? null,
                userId,
                verdict: finalVerdict,
                score: totalScore,
            });
        }
        // Handle battle scoring
        if (submission.battleId) {
            await scoringService.handleSubmissionResult(submission.battleId.toString(), submission.userId.toString(), submissionId, finalVerdict, totalScore, new Date(), io);
        }
    }
    catch (err) {
        logger.error('Judge processing error', { submissionId, error: err.message });
        await Submission.findByIdAndUpdate(submissionId, {
            verdict: 'INTERNAL_ERROR',
            judgedAt: new Date(),
        });
        if (io) {
            io.to(`user:${submission.userId.toString()}`).emit('submission:verdict', {
                submissionId,
                battleId: submission.battleId?.toString() ?? null,
                userId: submission.userId.toString(),
                verdict: 'INTERNAL_ERROR',
                score: 0,
            });
        }
    }
}
function getWorstVerdict(verdicts) {
    const order = [
        'WRONG_ANSWER', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED',
        'RUNTIME_ERROR', 'INTERNAL_ERROR',
    ];
    for (const v of order) {
        if (verdicts.includes(v))
            return v;
    }
    return 'WRONG_ANSWER';
}
