import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, extractData } from '../api/client';
import { problemApi } from '../api/problem.api';
import type { Problem, PaginatedResult } from '../types';
import { DifficultyBadge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeBattles: number;
  totalBattles: number;
  totalSubmissions: number;
  publishedProblems: number;
  draftProblems: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [problems, setProblems] = useState<PaginatedResult<Problem> | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'problems' | 'users'>('overview');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/admin/stats').then(extractData<AdminStats>),
      problemApi.adminList({ pageSize: 20, search: search || undefined, status: statusFilter || undefined }),
    ]).then(([s, p]) => {
      setStats(s);
      setProblems(p);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const togglePublish = async (problem: Problem) => {
    try {
      await problemApi.update(problem.id, { isPublished: !problem.isPublished });
      setProblems((prev) => prev ? {
        ...prev,
        items: prev.items.map((p) => p.id === problem.id ? { ...p, isPublished: !p.isPublished } : p),
      } : null);
      toast.success(problem.isPublished ? 'Problem unpublished' : 'Problem published');
    } catch {
      toast.error('Failed to update problem');
    }
  };

  const deleteProblem = async (id: string) => {
    if (!confirm('Delete this problem? This cannot be undone.')) return;
    try {
      await problemApi.delete(id);
      setProblems((prev) => prev ? { ...prev, items: prev.items.filter((p) => p.id !== id) } : null);
      toast.success('Problem deleted');
    } catch {
      toast.error('Failed to delete problem');
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🛡️ Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Manage problems, users, and platform settings</p>
        </div>
        <Link to="/admin/problems/new" className="btn-primary">+ New Problem</Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-dark-600">
        {(['overview', 'problems', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-brand-400 border-b-2 border-brand-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <>
          {activeTab === 'overview' && stats && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Published Problems', value: stats.publishedProblems, icon: '📗', color: 'text-accent-green' },
                { label: 'Draft Problems', value: stats.draftProblems, icon: '📝', color: 'text-accent-yellow' },
                { label: 'Active Battles', value: stats.activeBattles, icon: '⚔️', color: 'text-brand-400' },
                { label: 'Submissions', value: stats.totalSubmissions, icon: '📨', color: 'text-accent-purple' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} className="card p-5">
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className={`text-3xl font-bold ${color} font-mono`}>{value}</div>
                  <div className="text-sm text-gray-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'problems' && problems && (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap gap-3 p-4 border-b border-dark-600">
                <input
                  className="input flex-1 min-w-52 text-sm"
                  placeholder="Search problems..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <select className="input w-40 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="px-4 py-3 bg-dark-700 border-b border-dark-600 grid grid-cols-12 gap-2 text-xs text-gray-500 font-semibold uppercase">
                <div className="col-span-5">Problem</div>
                <div className="col-span-2">Difficulty</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>
              {problems.items.map((problem) => (
                <div key={problem.id} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-dark-700 items-center hover:bg-dark-700/50">
                  <div className="col-span-5">
                    <div className="text-sm font-medium text-gray-200">{problem.title}</div>
                    <div className="text-xs text-gray-500">{problem.tags.slice(0, 3).join(', ')}</div>
                  </div>
                  <div className="col-span-2">
                    <DifficultyBadge difficulty={problem.difficulty} />
                  </div>
                  <div className="col-span-2">
                    <span className={`badge ${problem.isPublished ? 'bg-green-900/40 text-green-400 border border-green-800/50' : 'bg-dark-600 text-gray-400 border border-dark-500'}`}>
                      {problem.status ?? (problem.isPublished ? 'published' : 'draft')}
                    </span>
                  </div>
                  <div className="col-span-3 flex gap-2 justify-end">
                    <Link to={`/admin/problems/${problem.id}`} className="btn-ghost text-xs px-2 py-1">Edit</Link>
                    <button onClick={() => togglePublish(problem)} className="btn-secondary text-xs px-2 py-1">
                      {problem.status === 'archived' ? 'Restore' : problem.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    {problem.status !== 'archived' && (
                      <button
                        onClick={() => problemApi.update(problem.id, { status: 'archived' }).then(() => {
                          setProblems((prev) => prev ? {
                            ...prev,
                            items: prev.items.map((item) => item.id === problem.id
                              ? { ...item, status: 'archived', isPublished: false }
                              : item),
                          } : null);
                          toast.success('Problem archived');
                        }).catch(() => toast.error('Failed to archive problem'))}
                        className="btn-secondary text-xs px-2 py-1"
                      >
                        Archive
                      </button>
                    )}
                    <button onClick={() => deleteProblem(problem.id)} className="btn-danger text-xs px-2 py-1">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="card p-8 text-center text-gray-500">
              User management available via API. Full UI coming soon.
            </div>
          )}
        </>
      )}
    </div>
  );
}
