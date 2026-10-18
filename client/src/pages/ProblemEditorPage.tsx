import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemApi } from '../api/problem.api';
import type { Difficulty } from '../types';
import { Spinner } from '../components/ui/Spinner';
import toast from 'react-hot-toast';

interface TestCaseForm {
  input: string;
  expectedOutput: string;
  explanation: string;
  isHidden: boolean;
  score: number;
}

const EMPTY_TC: TestCaseForm = { input: '', expectedOutput: '', explanation: '', isHidden: false, score: 10 };

export default function ProblemEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    difficulty: 'medium' as Difficulty,
    tags: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    notes: '',
    timeLimitMs: 2000,
    memoryLimitMb: 256,
  });
  const [sampleTCs, setSampleTCs] = useState<TestCaseForm[]>([{ ...EMPTY_TC, isHidden: false, score: 0 }]);
  const [hiddenTCs, setHiddenTCs] = useState<TestCaseForm[]>([{ ...EMPTY_TC, isHidden: true, score: 10 }]);

  useEffect(() => {
    if (!isNew && id) {
      problemApi.adminGet(id).then((p) => {
        setForm({
          title: p.title,
          difficulty: p.difficulty,
          tags: p.tags.join(', '),
          description: p.description,
          inputFormat: p.inputFormat,
          outputFormat: p.outputFormat,
          constraints: p.constraints,
          notes: p.notes ?? '',
          timeLimitMs: p.timeLimitMs,
          memoryLimitMb: p.memoryLimitMb,
        });
        setSampleTCs(p.sampleTestCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          explanation: tc.explanation ?? '',
          isHidden: false,
          score: 0,
        })));
      }).catch(() => toast.error('Failed to load problem'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const setField = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const updateTC = (list: TestCaseForm[], setList: (l: TestCaseForm[]) => void, idx: number, field: keyof TestCaseForm, value: string | number | boolean) => {
    const updated = list.map((tc, i) => i === idx ? { ...tc, [field]: value } : tc);
    setList(updated);
  };

  const addTC = (list: TestCaseForm[], setList: (l: TestCaseForm[]) => void, hidden: boolean) =>
    setList([...list, { ...EMPTY_TC, isHidden: hidden, score: hidden ? 10 : 0 }]);

  const removeTC = (list: TestCaseForm[], setList: (l: TestCaseForm[]) => void, idx: number) =>
    setList(list.filter((_, i) => i !== idx));

  const handleSave = async (publish = false) => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        sampleTestCases: sampleTCs.filter((tc) => tc.input.trim()),
        hiddenTestCases: hiddenTCs.filter((tc) => tc.input.trim()).map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          score: tc.score,
        })),
        isPublished: publish,
      };

      if (isNew) {
        const created = await problemApi.create(payload);
        toast.success('Problem created!');
        navigate(`/admin/problems/${created.id}`);
      } else {
        await problemApi.update(id!, payload);
        toast.success('Problem saved!');
      }
    } catch {
      toast.error('Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isNew ? '+ New Problem' : 'Edit Problem'}</h1>
        <div className="flex gap-3">
          <button onClick={() => handleSave(false)} disabled={saving} className="btn-secondary">
            {saving ? <Spinner size="sm" /> : 'Save Draft'}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} className="btn-primary">
            {saving ? <Spinner size="sm" /> : 'Save & Publish'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Problem Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-300 mb-1.5">Title *</label>
              <input className="input" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Two Sum" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Difficulty</label>
              <select className="input" value={form.difficulty} onChange={(e) => setField('difficulty', e.target.value)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Tags (comma-separated)</label>
              <input className="input" value={form.tags} onChange={(e) => setField('tags', e.target.value)} placeholder="arrays, hash-table" />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Time Limit (ms)</label>
              <input type="number" className="input" value={form.timeLimitMs} onChange={(e) => setField('timeLimitMs', Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">Memory Limit (MB)</label>
              <input type="number" className="input" value={form.memoryLimitMb} onChange={(e) => setField('memoryLimitMb', Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Problem statement */}
        <div className="card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Problem Statement (Markdown)</h2>
          {[
            { field: 'description', label: 'Description *', rows: 6 },
            { field: 'inputFormat', label: 'Input Format *', rows: 3 },
            { field: 'outputFormat', label: 'Output Format *', rows: 3 },
            { field: 'constraints', label: 'Constraints *', rows: 3 },
            { field: 'notes', label: 'Notes (optional)', rows: 2 },
          ].map(({ field, label, rows }) => (
            <div key={field}>
              <label className="block text-sm text-gray-300 mb-1.5">{label}</label>
              <textarea
                className="input font-mono text-sm resize-none"
                rows={rows}
                value={(form as Record<string, unknown>)[field] as string}
                onChange={(e) => setField(field, e.target.value)}
                placeholder={`# ${label}\n\nMarkdown supported`}
              />
            </div>
          ))}
        </div>

        {/* Sample test cases */}
        <TestCasesSection
          title="Sample Test Cases"
          subtitle="Visible to participants"
          cases={sampleTCs}
          onUpdate={(idx, field, val) => updateTC(sampleTCs, setSampleTCs, idx, field, val)}
          onAdd={() => addTC(sampleTCs, setSampleTCs, false)}
          onRemove={(idx) => removeTC(sampleTCs, setSampleTCs, idx)}
          showScore={false}
          showExplanation={true}
        />

        {/* Hidden test cases */}
        <TestCasesSection
          title="Hidden Test Cases"
          subtitle="Never exposed to participants — used for final scoring"
          cases={hiddenTCs}
          onUpdate={(idx, field, val) => updateTC(hiddenTCs, setHiddenTCs, idx, field, val)}
          onAdd={() => addTC(hiddenTCs, setHiddenTCs, true)}
          onRemove={(idx) => removeTC(hiddenTCs, setHiddenTCs, idx)}
          showScore={true}
          showExplanation={false}
        />
      </div>
    </div>
  );
}

function TestCasesSection({
  title, subtitle, cases, onUpdate, onAdd, onRemove, showScore, showExplanation,
}: {
  title: string;
  subtitle: string;
  cases: TestCaseForm[];
  onUpdate: (idx: number, field: keyof TestCaseForm, val: string | number | boolean) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  showScore: boolean;
  showExplanation: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">{title}</h2>
        <button onClick={onAdd} className="btn-secondary text-xs px-3 py-1">+ Add</button>
      </div>
      <p className="text-xs text-gray-500 mb-4">{subtitle}</p>
      <div className="space-y-4">
        {cases.map((tc, idx) => (
          <div key={idx} className="bg-dark-700 rounded-lg p-4 relative">
            <button
              onClick={() => onRemove(idx)}
              className="absolute top-3 right-3 text-gray-500 hover:text-accent-red text-xs"
            >✕</button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Input</label>
                <textarea
                  className="input font-mono text-xs resize-none"
                  rows={3}
                  value={tc.input}
                  onChange={(e) => onUpdate(idx, 'input', e.target.value)}
                  placeholder="4&#10;2 7 11 15&#10;9"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Expected Output</label>
                <textarea
                  className="input font-mono text-xs resize-none"
                  rows={3}
                  value={tc.expectedOutput}
                  onChange={(e) => onUpdate(idx, 'expectedOutput', e.target.value)}
                  placeholder="0 1"
                />
              </div>
              {showExplanation && (
                <div className="col-span-2">
                  <label className="block text-xs text-gray-400 mb-1">Explanation</label>
                  <input
                    className="input text-xs"
                    value={tc.explanation}
                    onChange={(e) => onUpdate(idx, 'explanation', e.target.value)}
                    placeholder="nums[0] + nums[1] = 9"
                  />
                </div>
              )}
              {showScore && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Score</label>
                  <input
                    type="number"
                    className="input text-xs"
                    value={tc.score}
                    onChange={(e) => onUpdate(idx, 'score', Number(e.target.value))}
                    min={1}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
