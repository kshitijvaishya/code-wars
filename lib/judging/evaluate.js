import { executeCode, getLanguageConfig } from './piston';
import { Submission, Question } from '../db/models';
import { connectDB } from '../db/connection';
export async function evaluateSubmission(submissionId) {
    await connectDB();
    const submission = await Submission.findById(submissionId);
    if (!submission) {
        throw new Error('Submission not found');
    }
    const question = await Question.findById(submission.questionId)
        .select('+hiddenTests');
    if (!question) {
        throw new Error('Question not found');
    }
    try {
        submission.status = 'judging';
        await submission.save();
        const testCases = question.hiddenTests || [];
        if (testCases.length === 0) {
            throw new Error('No test cases configured');
        }
        const langConfig = getLanguageConfig(submission.language);
        const timeLimit = question.executionLimits?.timeLimit || 3000;
        let passedTests = 0;
        let totalExecutionTime = 0;
        for (const testCase of testCases) {
            try {
                const result = await executeCode({
                    language: langConfig.language,
                    version: langConfig.version,
                    files: [{ content: submission.sourceCode }],
                    stdin: testCase.input,
                    run_timeout: timeLimit,
                    compile_timeout: 10000,
                });
                // Check for compilation error
                if (result.compile && result.compile.code !== 0) {
                    submission.status = 'completed';
                    submission.verdict = 'Compilation Error';
                    submission.score = 0;
                    submission.passedTests = 0;
                    submission.totalTests = testCases.length;
                    submission.judgedAt = new Date();
                    await submission.save();
                    return {
                        verdict: 'Compilation Error',
                        score: 0,
                        passedTests: 0,
                        totalTests: testCases.length,
                    };
                }
                // Check runtime exit code
                if (result.run.code !== 0) {
                    // Runtime error, continue to next test
                    continue;
                }
                // Compare output
                const actualOutput = result.run.stdout.trim();
                const expectedOutput = testCase.output.trim();
                if (actualOutput === expectedOutput) {
                    passedTests++;
                }
            }
            catch (error) {
                console.error('Test case execution error:', error);
                // Continue to next test
            }
        }
        // Calculate verdict and score
        const totalTests = testCases.length;
        let verdict;
        let score;
        if (passedTests === totalTests) {
            verdict = 'Accepted';
            score = question.maxPoints;
        }
        else if (passedTests === 0) {
            verdict = 'Wrong Answer';
            score = 0;
        }
        else {
            verdict = 'Wrong Answer'; // Partial credit as wrong answer
            score = Math.floor((passedTests / totalTests) * question.maxPoints);
        }
        // Update submission
        submission.status = 'completed';
        submission.verdict = verdict;
        submission.score = score;
        submission.passedTests = passedTests;
        submission.totalTests = totalTests;
        submission.judgedAt = new Date();
        await submission.save();
        return {
            verdict,
            score,
            passedTests,
            totalTests,
        };
    }
    catch (error) {
        console.error('Evaluation error:', error);
        submission.status = 'failed';
        submission.verdict = 'Runtime Error';
        submission.judgedAt = new Date();
        await submission.save();
        throw error;
    }
}
