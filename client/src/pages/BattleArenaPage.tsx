import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useBattleStore } from '../store/battleStore';
import { battleApi } from '../api/battle.api';
import { submissionApi } from '../api/submission.api';
import { getSocket } from '../hooks/useSocket';
import { useBattleSocket } from '../hooks/useBattleSocket';
import { CodeEditor } from '../components/editor/CodeEditor';
import { LANGUAGE_MAP } from '../components/editor/languageMap';
import { ProblemPanel } from '../components/problem/ProblemPanel';
import { OpponentStatus } from '../components/battle/OpponentStatus';
import { VerdictBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { loadProblemCode, saveProblemCode } from '../utils/codePersistence';
import type { RunResult, Submission, Language } from '../types';
import toast from 'react-hot-toast';

const DEFAULT_CODE: Record<string, string> = {
  python: '# Write your solution here\nimport sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nsolve()\n',
  javascript: '// Write your solution here\nconst lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n',
  java: 'import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws IOException {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        // your solution\n    }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    // your solution\n    return 0;\n}\n',
  typescript: '// Write your solution here\nconst lines = require("fs").readFileSync("/dev/stdin","utf8").trim().split("\\n");\n\n',
};

export default function BattleArenaPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { battle, problem, secondsRemaining, setBattle } = useBattleStore();

  const [languageId, setLanguageId] = useState(71); // Python3
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [runResults, setRunResults] = useState<RunResult[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [activeTab, setActiveTab] = useState<'testcases' | 'custom' | 'submissions'>('testcases');
  const [fontSize, setFontSize] = useState(14);
  const [fullscreen, setFullscreen] = useState(false);
  const [battleLoading, setBattleLoading] = useState(true);
  const [battleError, setBattleError] = useState<string | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  const { problemLoading, problemError } = useBattleSocket(id);

  // Load battle & languages
  useEffect(() => {
    if (!id) return;
    setBattleLoading(true);
    battleApi.get(id)
      .then(setBattle)
      .catch((error: unknown) => {
        setBattleError(error instanceof Error ? error.message : 'Unable to load battle');
      })
      .finally(() => setBattleLoading(false));
    submissionApi.getLanguages()
      .then(setLanguages)
      .catch(console.error);
  }, [id, setBattle]);

  // Set default code when language changes
  useEffect(() => {
    const monacoLang = LANGUAGE_MAP[languageId] ?? 'python';
    const saved = problem
      ? loadProblemCode(problem.id, languageId)
      : null;
    setCode(saved ?? DEFAULT_CODE[monacoLang] ?? '');
  }, [languageId, problem]);

  // Autosave
  useEffect(() => {
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (problem?.id && code) {
        saveProblemCode(problem.id, languageId, code);
      }
    }, 2000);
    return () => clearTimeout(autoSaveRef.current);
  }, [code, languageId, problem?.id]);

  // Emit coding status
  useEffect(() => {
    if (battle?.state === 'ACTIVE' && id) {
      const socket = getSocket();
      socket?.emit('battle:status_update', { battleId: id, status: 'coding' });
    }
  }, [battle?.state, id]);

  const handleRun = useCallback(async () => {
    if (!problem || !id) return;
    setRunLoading(true);
    setActiveTab('testcases');
    try {
      const results = await submissionApi.run({
        problemId: problem.id,
        languageId,
        sourceCode: code,
        customInput: customInput || undefined,
      });
      setRunResults(results);
    } catch {
      toast.error('Run failed. Please try again.');
    } finally {
      setRunLoading(false);
    }
  }, [problem, id, languageId, code, customInput]);

  const handleSubmit = useCallback(async () => {
    if (!problem || !id || submitLoading) return;
    setSubmitLoading(true);
    try {
      const { submissionId } = await submissionApi.submit({
        problemId: problem.id,
        battleId: id,
        languageId,
        sourceCode: code,
      });

      toast('📨 Submitted! Judging...', { duration: 3000 });
      const socket = getSocket();
      socket?.emit('battle:status_update', { battleId: id, status: 'submitted' });

      // Poll for result
      const poll = setInterval(async () => {
        try {
          const sub = await submissionApi.get(submissionId);
          if (sub.verdict !== 'PENDING' && sub.verdict !== 'PROCESSING') {
            clearInterval(poll);
            setLastSubmission(sub);
            setActiveTab('submissions');
          }
        } catch { clearInterval(poll); }
      }, 1500);

      setTimeout(() => clearInterval(poll), 60000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  }, [problem, id, languageId, code, submitLoading]);

  // Keyboard shortcut for run (Ctrl+Enter)
  useEffect(() => {
    const handler = () => handleRun();
    window.addEventListener('editor:run', handler);
    return () => window.removeEventListener('editor:run', handler);
  }, [handleRun]);

  if (battleLoading) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (battleError || !battle) {
    return <div className="flex h-screen items-center justify-center p-6 text-center text-accent-red">{battleError ?? 'Battle not found'}</div>;
  }

  const me = battle.participants.find((p) => p.userId === user?.id);
  const opponent = battle.participants.find((p) => p.userId !== user?.id);
  const monacoLang = LANGUAGE_MAP[languageId] ?? 'python';
  const filteredLanguages = languages.length > 0
    ? languages.filter((l) => problem?.supportedLanguages.includes(l.id) ?? true)
    : [{ id: 71, name: 'Python (3.8.1)' }, { id: 62, name: 'Java (OpenJDK 13)' },
       { id: 63, name: 'JavaScript (Node.js 12)' }, { id: 54, name: 'C++ (GCC 9.2)' }];

  return (
    <div className={`flex flex-col bg-dark-950 ${fullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-56px)]'}`}>
      {/* Top bar: opponent status + timer */}
      <OpponentStatus opponent={opponent} me={me} secondsRemaining={secondsRemaining} />

      {/* Main split: problem | editor+console */}
      <div className="flex flex-1 overflow-hidden">
        {/* Problem panel */}
        <div className="w-[420px] flex-shrink-0 border-r border-dark-600 overflow-hidden flex flex-col">
          <ProblemPanel problem={problem} loading={problemLoading} error={problemError} />
        </div>

        {/* Editor + console */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-dark-800 border-b border-dark-600">
            <div className="flex items-center gap-3">
              {/* Language selector */}
              <select
                value={languageId}
                onChange={(e) => setLanguageId(Number(e.target.value))}
                className="bg-dark-700 border border-dark-500 text-gray-200 text-xs rounded px-2 py-1 focus:outline-none focus:border-brand-500"
              >
                {filteredLanguages.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              {/* Font size */}
              <div className="flex items-center gap-1">
                <button onClick={() => setFontSize((f) => Math.max(10, f - 2))} className="btn-ghost text-xs px-1.5 py-0.5">A-</button>
                <span className="text-xs text-gray-400 w-6 text-center">{fontSize}</span>
                <button onClick={() => setFontSize((f) => Math.min(22, f + 2))} className="btn-ghost text-xs px-1.5 py-0.5">A+</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen toggle */}
              <button
                onClick={() => setFullscreen((f) => !f)}
                className="btn-ghost text-xs px-2 py-1"
                title="Toggle fullscreen"
              >
                {fullscreen ? '↙' : '↗'}
              </button>

              <button
                onClick={handleRun}
                disabled={runLoading || !problem}
                className="btn-secondary text-xs px-3 py-1.5"
                title="Ctrl+Enter"
              >
                {runLoading ? <Spinner size="sm" /> : '▶ Run'}
              </button>

              <button
                onClick={handleSubmit}
                disabled={submitLoading || !problem || battle.state !== 'ACTIVE'}
                className="btn-primary text-xs px-3 py-1.5"
              >
                {submitLoading ? <Spinner size="sm" /> : '📨 Submit'}
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={monacoLang}
              fontSize={fontSize}
              height="100%"
            />
          </div>

          {/* Console tabs */}
          <div className="h-52 flex flex-col border-t border-dark-600 bg-dark-800">
            <div className="flex items-center gap-0 border-b border-dark-600 px-2">
              {(['testcases', 'custom', 'submissions'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-brand-400 border-b-2 border-brand-400'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab === 'testcases' ? 'Test Results' : tab}
                </button>
              ))}
              {runLoading && <Spinner size="sm" className="ml-2" />}
            </div>

            <div className="flex-1 overflow-auto p-3">
              {activeTab === 'testcases' && <TestResultsPane results={runResults} />}
              {activeTab === 'custom' && (
                <div className="flex flex-col h-full gap-2">
                  <textarea
                    className="input flex-1 font-mono text-xs resize-none"
                    placeholder="Enter custom input here..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                  />
                </div>
              )}
              {activeTab === 'submissions' && (
                <SubmissionPane submission={lastSubmission} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestResultsPane({ results }: { results: RunResult[] }) {
  if (results.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-500">
        Click "Run" to test your code against sample cases (Ctrl+Enter)
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {results.map((r, i) => (
        <div key={r.testCaseId} className={`rounded p-2 text-xs border ${
          r.verdict === 'ACCEPTED' ? 'border-green-800/50 bg-green-900/10' : 'border-red-800/50 bg-red-900/10'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={r.verdict === 'ACCEPTED' ? 'text-accent-green' : 'text-accent-red'}>
              {r.verdict === 'ACCEPTED' ? '✓' : '✗'}
            </span>
            <span className="font-medium text-gray-300">
              {r.isSample ? `Sample ${i + 1}` : 'Custom Input'}
            </span>
            {r.timeTakenMs && <span className="text-gray-500">{r.timeTakenMs}ms</span>}
          </div>
          {r.stdout && (
            <div className="font-mono text-gray-300 bg-dark-900 rounded p-1.5 mt-1 whitespace-pre-wrap">
              {r.stdout.slice(0, 500)}{r.stdout.length > 500 ? '...' : ''}
            </div>
          )}
          {r.expectedOutput && r.verdict !== 'ACCEPTED' && (
            <div className="mt-1 text-gray-500">
              Expected: <span className="font-mono text-gray-300">{r.expectedOutput.slice(0, 100)}</span>
            </div>
          )}
          {r.stderr && (
            <div className="font-mono text-accent-red bg-dark-900 rounded p-1.5 mt-1 whitespace-pre-wrap text-xs">
              {r.stderr.slice(0, 300)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SubmissionPane({ submission }: { submission: Submission | null }) {
  if (!submission) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-500">
        Your submission results will appear here
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <VerdictBadge verdict={submission.verdict} />
        {submission.totalScore > 0 && (
          <span className="text-xs text-gray-400">
            Score: <span className="text-brand-400 font-bold">{submission.score}/{submission.totalScore}</span>
          </span>
        )}
        {submission.timeTakenMs && (
          <span className="text-xs text-gray-500">{submission.timeTakenMs}ms</span>
        )}
        {submission.memoryUsedKb && (
          <span className="text-xs text-gray-500">{(submission.memoryUsedKb / 1024).toFixed(1)}MB</span>
        )}
      </div>

      {submission.compilationOutput && (
        <pre className="text-xs text-accent-orange bg-dark-900 rounded p-2 overflow-auto font-mono whitespace-pre-wrap">
          {submission.compilationOutput}
        </pre>
      )}

      <div className="space-y-1">
        {submission.testCaseResults.map((r, i) => (
          <div key={r.testCaseId} className="flex items-center gap-2 text-xs text-gray-400">
            <span className={r.verdict === 'ACCEPTED' ? 'text-accent-green' : 'text-accent-red'}>
              {r.verdict === 'ACCEPTED' ? '✓' : '✗'}
            </span>
            <span>{r.isSample ? `Sample ${i + 1}` : `Test ${i + 1}`}</span>
            <span className="text-gray-600">{r.verdict.replace(/_/g, ' ')}</span>
            {r.timeTakenMs && <span className="text-gray-600">{r.timeTakenMs}ms</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
