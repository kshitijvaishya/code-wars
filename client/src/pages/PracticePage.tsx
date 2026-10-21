import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { problemApi } from '../api/problem.api';
import { submissionApi } from '../api/submission.api';
import { CodeEditor } from '../components/editor/CodeEditor';
import { LANGUAGE_MAP } from '../components/editor/languageMap';
import { ProblemPanel } from '../components/problem/ProblemPanel';
import { Spinner } from '../components/ui/Spinner';
import type { Language, Problem, RunResult } from '../types';

const DEFAULT_CODE: Record<string, string> = {
  python: 'import sys\n\n# Write your solution here\n',
  javascript: '// Write your solution here\n',
  java: 'import java.io.*;\nimport java.util.*;\n\npublic class Main {\n  public static void main(String[] args) throws Exception {\n    // Write your solution here\n  }\n}\n',
  cpp: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n  // Write your solution here\n}\n',
  typescript: '// Write your solution here\n',
};

export default function PracticePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languageId, setLanguageId] = useState(71);
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [results, setResults] = useState<RunResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([problemApi.get(slug), submissionApi.getLanguages()])
      .then(([loadedProblem, loadedLanguages]) => {
        setProblem(loadedProblem);
        setLanguages(loadedLanguages);
        const firstSupported = loadedLanguages.find((language) =>
          loadedProblem.supportedLanguages.includes(language.id),
        )?.id ?? loadedProblem.supportedLanguages[0] ?? 71;
        setLanguageId(firstSupported);
      })
      .catch(() => {
        toast.error('Problem not found');
        navigate('/problems');
      })
      .finally(() => setLoading(false));
  }, [navigate, slug]);

  const monacoLanguage = LANGUAGE_MAP[languageId] ?? 'python';
  const supportedLanguages = useMemo(
    () => languages.filter((language) => problem?.supportedLanguages.includes(language.id)),
    [languages, problem?.supportedLanguages],
  );

  useEffect(() => {
    if (!problem) return;
    const storageKey = `cw-practice-${problem.id}-${languageId}`;
    setCode(localStorage.getItem(storageKey) ?? DEFAULT_CODE[monacoLanguage] ?? '');
  }, [languageId, monacoLanguage, problem]);

  useEffect(() => {
    if (!problem || !code) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(`cw-practice-${problem.id}-${languageId}`, code);
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [code, languageId, problem]);

  const runCode = async () => {
    if (!problem || !code.trim()) {
      toast.error('Write some code before running it.');
      return;
    }
    setRunning(true);
    try {
      setResults(await submissionApi.run({
        problemId: problem.id,
        languageId,
        sourceCode: code,
        customInput: customInput || undefined,
      }));
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })
        .response?.data?.error?.message ?? 'Run failed. Please try again.';
      toast.error(message);
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!problem) return null;

  return (
    <div className="flex h-[calc(100vh-56px)] flex-col bg-dark-950">
      <div className="flex items-center justify-between border-b border-dark-600 bg-dark-800 px-4 py-2">
        <h1 className="font-semibold text-gray-200">Practice: {problem.title}</h1>
        <div className="flex items-center gap-3">
          <select
            className="input py-1 text-sm"
            value={languageId}
            onChange={(event) => setLanguageId(Number(event.target.value))}
          >
            {supportedLanguages.map((language) => (
              <option key={language.id} value={language.id}>{language.name}</option>
            ))}
          </select>
          <button onClick={runCode} disabled={running} className="btn-primary px-4 py-1.5">
            {running ? <Spinner size="sm" /> : 'Run'}
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="w-[420px] flex-shrink-0 overflow-hidden border-r border-dark-600">
          <ProblemPanel problem={problem} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <CodeEditor value={code} onChange={setCode} language={monacoLanguage} />
          </div>
          <div className="grid h-40 grid-cols-2 gap-3 border-t border-dark-600 bg-dark-800 p-3">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Custom input (optional)</label>
              <textarea
                className="input h-24 resize-none font-mono text-xs"
                value={customInput}
                onChange={(event) => setCustomInput(event.target.value)}
                placeholder="Input for a custom run"
              />
            </div>
            <div className="overflow-auto">
              <p className="mb-1 text-xs text-gray-400">Results</p>
              {results.length === 0 ? (
                <p className="text-xs text-gray-500">Run your solution to see results.</p>
              ) : results.map((result, index) => (
                <div key={result.testCaseId || index} className="mb-1 text-xs text-gray-300">
                  Example {index + 1}: <span className={result.verdict === 'ACCEPTED' ? 'text-accent-green' : 'text-accent-red'}>{result.verdict}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
