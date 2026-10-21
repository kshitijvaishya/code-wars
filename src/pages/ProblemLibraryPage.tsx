import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemApi } from '../services/problem.api';
import type { Problem, PaginatedResult, Difficulty } from '../types';
import { DifficultyBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';

const DIFFICULTIES: Array<{ value: Difficulty | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function ProblemLibraryPage() {
  const [data, setData] = useState<PaginatedResult<Problem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    problemApi.list({
      difficulty: difficulty || undefined,
      search: search || undefined,
      page,
      pageSize: 20,
    })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [difficulty, search, page]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">📚 Problem Library</h1>
        <p className="text-gray-400 text-sm mt-1">Practice problems to sharpen your skills</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          className="input max-w-xs text-sm"
          placeholder="Search problems..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className="flex gap-1">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => { setDifficulty(d.value); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                difficulty === d.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-dark-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-dark-700 border-b border-dark-600 text-xs text-gray-500 font-semibold uppercase tracking-wide">
            <div className="col-span-6">Problem</div>
            <div className="col-span-3">Tags</div>
            <div className="col-span-3 text-right">Limits</div>
          </div>

          {data?.items.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-2">🔍</div>
              <p>No problems found</p>
            </div>
          ) : (
            data?.items.map((problem) => (
              <Link
                key={problem.id}
                to={`/problems/${problem.slug}`}
                className="grid grid-cols-12 gap-2 px-4 py-3.5 border-b border-dark-700 hover:bg-dark-700 transition-colors items-center"
              >
                <div className="col-span-6 flex items-center gap-3">
                  <DifficultyBadge difficulty={problem.difficulty} />
                  <span className="text-sm font-medium text-gray-200 hover:text-brand-400 transition-colors">
                    {problem.title}
                  </span>
                </div>
                <div className="col-span-3 flex flex-wrap gap-1">
                  {problem.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="text-xs bg-dark-600 text-gray-500 px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="col-span-3 text-right text-xs text-gray-500">
                  {problem.timeLimitMs}ms · {problem.memoryLimitMb}MB
                </div>
              </Link>
            ))
          )}

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 p-4">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-1.5 text-sm">← Prev</button>
              <span className="text-sm text-gray-400">{page} / {data.totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} className="btn-secondary px-4 py-1.5 text-sm">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
