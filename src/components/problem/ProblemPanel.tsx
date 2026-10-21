import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Problem } from '../../types';
import { DifficultyBadge } from '../ui/Badge';

interface ProblemPanelProps {
  problem: Problem | null;
  loading?: boolean;
  error?: string | null;
}

export function ProblemPanel({ problem, loading, error }: ProblemPanelProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6 animate-pulse">
        <div className="skeleton h-6 w-2/3" />
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-32 w-full" />
        <div className="skeleton h-20 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-accent-red">Unable to load problem</p>
          <p className="mt-2 text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }
  if (!problem) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-gray-500">
        The battle problem is not available yet.
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-5 border-b border-dark-600">
        <h1 className="text-xl font-bold text-gray-100 mb-2">{problem.title}</h1>
        <div className="flex flex-wrap gap-2">
          <DifficultyBadge difficulty={problem.difficulty} />
          {problem.tags.map((tag) => (
            <span key={tag} className="badge bg-dark-600 text-gray-400 border border-dark-500">{tag}</span>
          ))}
        </div>
      </div>

      <div className="p-5 prose prose-invert prose-sm max-w-none">
        <Section title="Problem">
          <MarkdownContent content={problem.description} />
        </Section>

        <Section title="Input Format">
          <MarkdownContent content={problem.inputFormat} />
        </Section>

        <Section title="Output Format">
          <MarkdownContent content={problem.outputFormat} />
        </Section>

        <Section title="Constraints">
          <MarkdownContent content={problem.constraints} />
        </Section>

        {problem.sampleTestCases.length > 0 && (
          <Section title="Examples">
            {problem.sampleTestCases.map((tc, i) => (
              <div key={tc.id ?? i} className="mb-4">
                <p className="text-xs font-semibold text-gray-400 mb-2">Example {i + 1}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Input</p>
                    <pre className="bg-dark-900 border border-dark-500 rounded p-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-auto">{tc.input}</pre>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Output</p>
                    <pre className="bg-dark-900 border border-dark-500 rounded p-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-auto">{tc.expectedOutput}</pre>
                  </div>
                </div>
                {tc.explanation && (
                  <div className="mt-2 text-xs text-gray-400 bg-dark-800 border border-dark-600 rounded p-2">
                    <strong>Explanation:</strong> {tc.explanation}
                  </div>
                )}
              </div>
            ))}
          </Section>
        )}

        {problem.notes && (
          <Section title="Notes">
            <MarkdownContent content={problem.notes} />
          </Section>
        )}

        <div className="mt-4 flex gap-4 text-xs text-gray-500">
          <span>⏱ Time limit: {problem.timeLimitMs}ms</span>
          <span>💾 Memory: {problem.memoryLimitMb}MB</span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">{title}</h3>
      {children}
    </div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ children, className }) => {
          const isBlock = className?.includes('language-');
          return isBlock ? (
            <pre className="bg-dark-900 border border-dark-500 rounded p-3 overflow-auto">
              <code className="text-xs font-mono text-gray-300">{children}</code>
            </pre>
          ) : (
            <code className="bg-dark-600 text-accent-cyan px-1 rounded text-xs font-mono">{children}</code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
