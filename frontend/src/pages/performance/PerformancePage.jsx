import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { performanceApi } from '../../services/moduleApis';
import { PageHeader, Button, Spinner, Tabs, Modal, Input, Select } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';

const TABS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'goals', label: 'My Goals', icon: '🎯' },
  { id: 'appraisal', label: 'My Appraisal', icon: '📝' },
  { id: 'team', label: 'Team', icon: '👥' },
  { id: 'cycles', label: 'Cycles (HR)', icon: '⚙️' },
];

const CATEGORY_LABELS = { kra: 'KRA', kpi: 'KPI', okr: 'OKR' };
const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  approved: 'bg-green-100 text-green-700',
  submitted: 'bg-blue-100 text-blue-700',
  final: 'bg-purple-100 text-purple-700',
};

const EMPTY_GOAL = { title: '', description: '', category: 'kra', target: '', weightage: '', targetDate: '', cycleId: '' };
const EMPTY_CYCLE = { name: '', periodStart: '', periodEnd: '', goalSettingEnd: '', selfAppraisalStart: '', selfAppraisalEnd: '', managerReviewEnd: '', ratingScale: 5 };

export default function PerformancePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [goalModal, setGoalModal] = useState(false);
  const [cycleModal, setCycleModal] = useState(false);
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL);
  const [cycleForm, setCycleForm] = useState(EMPTY_CYCLE);
  const [selfRatings, setSelfRatings] = useState({});
  const [selfComment, setSelfComment] = useState('');

  const GF = (f) => ({ value: goalForm[f], onChange: e => setGoalForm(p => ({ ...p, [f]: e.target.value })) });
  const CF = (f) => ({ value: cycleForm[f], onChange: e => setCycleForm(p => ({ ...p, [f]: e.target.value })) });

  const { data: dashData } = useQuery({ queryKey: ['perf-dashboard'], queryFn: performanceApi.dashboard, enabled: tab === 'overview' });
  const { data: goalsData, isLoading: goalsLoading } = useQuery({ queryKey: ['my-goals'], queryFn: () => performanceApi.listMyGoals(), enabled: tab === 'goals' });
  const { data: apprData } = useQuery({ queryKey: ['my-appraisal'], queryFn: () => performanceApi.getMyAppraisal(), enabled: tab === 'appraisal' });
  const { data: teamData } = useQuery({ queryKey: ['team-appraisals'], queryFn: () => performanceApi.getTeamAppraisals(), enabled: tab === 'team' });
  const { data: cyclesData } = useQuery({ queryKey: ['cycles'], queryFn: performanceApi.listCycles, enabled: tab === 'cycles' });

  const invalidate = (...keys) => keys.forEach(k => qc.invalidateQueries({ queryKey: [k] }));

  const createGoalMut = useMutation({
    mutationFn: (d) => performanceApi.createGoal(d),
    onSuccess: () => { toast.success('Goal created!'); invalidate('my-goals'); setGoalModal(false); setGoalForm(EMPTY_GOAL); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const approveGoalMut = useMutation({
    mutationFn: (id) => performanceApi.approveGoal(id),
    onSuccess: () => { toast.success('Goal approved!'); invalidate('my-goals', 'team-appraisals'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const deleteGoalMut = useMutation({
    mutationFn: (id) => performanceApi.deleteGoal(id),
    onSuccess: () => { toast.success('Goal deleted.'); invalidate('my-goals'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const selfAppraisalMut = useMutation({
    mutationFn: (d) => performanceApi.submitSelfAppraisal(d),
    onSuccess: () => { toast.success('Self appraisal submitted!'); invalidate('my-appraisal'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const createCycleMut = useMutation({
    mutationFn: (d) => performanceApi.createCycle(d),
    onSuccess: () => { toast.success('Cycle created!'); invalidate('cycles'); setCycleModal(false); setCycleForm(EMPTY_CYCLE); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const activateCycleMut = useMutation({
    mutationFn: (id) => performanceApi.activateCycle(id),
    onSuccess: () => { toast.success('Cycle activated!'); invalidate('cycles', 'perf-dashboard'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const dash = dashData?.data;
  const goals = goalsData?.data || [];
  const appr = apprData?.data;
  const team = teamData?.data || [];
  const cycles = cyclesData?.data || [];

  const totalWeight = goals.reduce((s, g) => s + (g.weightage || 0), 0);
  const weightLeft = 100 - totalWeight;

  const submitSelf = () => {
    if (!appr?.goals?.length) { toast.error('No goals set for this cycle.'); return; }
    const goalRatings = appr.goals.map(g => ({
      goalId: g.id,
      achievement: parseFloat(selfRatings[g.id] || 0),
    }));
    const avg = goalRatings.reduce((s, r) => s + r.achievement, 0) / goalRatings.length;
    selfAppraisalMut.mutate({ goalRatings, overallRating: avg / 20, comments: selfComment });
  };

  const teamByEmp = {};
  team.forEach(a => {
    if (!teamByEmp[a.employee_id]) teamByEmp[a.employee_id] = { employee: a.employee, self: null, manager: null };
    teamByEmp[a.employee_id][a.type] = a;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Performance Management" subtitle="Goals, appraisals and ratings" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      {tab === 'overview' && (
        <div>
          {!dash?.activeCycle ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <p className="text-4xl mb-3">🎯</p>
              <p className="font-semibold text-gray-800 mb-1">No active appraisal cycle</p>
              <p className="text-sm text-gray-500 mb-4">Go to the Cycles tab to create and activate one</p>
              <Button onClick={() => setTab('cycles')}>Setup Cycle →</Button>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex items-center justify-between shadow-sm">
                <div>
                  <p className="font-bold text-blue-900">{dash.activeCycle.name}</p>
                  <p className="text-sm text-blue-700">
                    {new Date(dash.activeCycle.period_start).toLocaleDateString('en-IN')} – {new Date(dash.activeCycle.period_end).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200 shadow-sm">ACTIVE</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total Goals', value: dash.stats.totalGoals },
                  { label: 'Approved', value: dash.stats.approvedGoals },
                  { label: 'Self Done', value: dash.stats.selfDone },
                  { label: 'Manager Done', value: dash.stats.managerDone },
                  { label: 'Finalized', value: dash.stats.finalized },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
              Weightage used: <strong className="text-gray-900">{totalWeight}%</strong>
              {weightLeft > 0 && <span className="text-blue-600 ml-1">({weightLeft}% available)</span>}
            </div>
            <Button onClick={() => setGoalModal(true)}>+ Add New Goal</Button>
          </div>
          {goalsLoading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div>
            : goals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
                <p className="text-4xl mb-3">🎯</p>
                <p className="font-semibold text-gray-800">No goals defined yet</p>
                <Button variant="outline" className="mt-4" onClick={() => setGoalModal(true)}>Add First Goal</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {goals.map(g => (
                  <div key={g.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                            {CATEGORY_LABELS[g.category] || g.category}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${STATUS_COLORS[g.status] || 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                            {g.status}
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{g.weightage}% Weight</span>
                        </div>
                        <p className="font-bold text-gray-900 text-lg">{g.title}</p>
                        <p className="text-sm text-gray-500 mt-1 leading-relaxed">{g.description || 'No description provided.'}</p>
                        {g.target && <div className="mt-3 text-xs bg-gray-50 inline-block px-2 py-1 rounded text-gray-500 font-medium">Target: {g.target}</div>}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {g.status === 'draft' && <Button size="sm" variant="success" onClick={() => approveGoalMut.mutate(g.id)}>Approve</Button>}
                        {g.status === 'draft' && <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-100" onClick={() => deleteGoalMut.mutate(g.id)}>Delete</Button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {tab === 'appraisal' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {!appr?.cycle ? (
            <div className="text-center py-12 text-gray-400 font-medium">No active appraisal cycle found</div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{appr.cycle.name}</h3>
                  <p className="text-sm text-gray-500 font-medium mt-1">Self Appraisal Period</p>
                </div>
                {appr.selfAppraisal?.status !== 'submitted' ? (
                  <Button onClick={submitSelf} loading={selfAppraisalMut.isPending} className="shadow-lg shadow-blue-100">Submit Appraisal</Button>
                ) : (
                  <span className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm border border-green-200">✓ Submitted</span>
                )}
              </div>
              <div className="space-y-6">
                {appr.goals.map(g => {
                  const existing = appr.goalRatings?.find(r => r.goalId === g.id);
                  const val = selfRatings[g.id] ?? (existing?.achievement || '');
                  return (
                    <div key={g.id} className="bg-gray-50/50 rounded-xl p-5 border border-gray-100 shadow-inner">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-bold text-gray-900">{g.title}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">{CATEGORY_LABELS[g.category]} · {g.weightage}% WEIGHT</p>
                        </div>
                        <div className="w-32">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Achievement %</label>
                          <Input
                            type="number" min="0" max="100"
                            value={val}
                            onChange={e => setSelfRatings(p => ({ ...p, [g.id]: e.target.value }))}
                            disabled={appr.selfAppraisal?.status === 'submitted'}
                            className="text-center font-bold"
                          />
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-1.5 w-full overflow-hidden">
                        <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${Math.min(val || 0, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-8">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Overall Performance Comments</label>
                  <textarea
                    value={selfComment}
                    onChange={e => setSelfComment(e.target.value)}
                    disabled={appr.selfAppraisal?.status === 'submitted'}
                    rows={4}
                    placeholder="Reflect on your achievements, learning and areas for growth..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">Team Performance Overview</h3>
          </div>
          {Object.keys(teamByEmp).length === 0 ? (
            <div className="text-center py-20 text-gray-400 italic">No team reports found for current cycle</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] font-bold tracking-widest">
                  <tr>
                    <th className="text-left px-6 py-3">Employee</th>
                    <th className="px-6 py-3 text-center">Self Status</th>
                    <th className="px-6 py-3 text-center">Review Status</th>
                    <th className="px-6 py-3 text-right">Final Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.values(teamByEmp).map(({ employee, self, manager }) => (
                    <tr key={employee?.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">{employee?.first_name} {employee?.last_name}</p>
                        <p className="text-xs text-gray-500 font-medium">{employee?.employee_code} · {employee?.designation?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${self ? 'bg-green-50 text-green-600 border-green-100' : 'bg-yellow-50 text-yellow-600 border-yellow-100'}`}>
                          {self ? 'SUBMITTED' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${manager ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                          {manager ? 'COMPLETED' : 'NOT STARTED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {manager?.overall_rating ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-lg font-black text-blue-700">{manager.overall_rating.toFixed(1)}</span>
                            <span className="text-gray-300">/ 5.0</span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'cycles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setCycleModal(true)}>Create New Cycle</Button>
          </div>
          {cycles.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-semibold text-gray-800">No appraisal history</p>
              <Button variant="outline" className="mt-4" onClick={() => setCycleModal(true)}>Initiate First Cycle</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {cycles.map(c => (
                <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between shadow-sm shadow-gray-100 hover:border-gray-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-bold text-gray-900 text-lg">{c.name}</p>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                        c.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                        c.status === 'closed' ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>{c.status}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span>{new Date(c.period_start).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} – {new Date(c.period_end).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      <span>Rating Scale: 1.0 – {c.rating_scale}.0</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {c.status === 'upcoming' && <Button size="sm" onClick={() => activateCycleMut.mutate(c.id)}>Activate</Button>}
                    {c.status === 'active' && <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50 border-red-100 font-bold" onClick={() => performanceApi.closeCycle(c.id).then(() => { toast.success('Cycle closed'); invalidate('cycles'); })}>Close Cycle</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Add Performance Goal" size="md">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Target Appraisal Cycle *</label>
            <select value={goalForm.cycleId || ''} onChange={e => setGoalForm(p => ({ ...p, cycleId: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select an active/upcoming cycle</option>
              {cycles.filter(c => c.status !== 'closed').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Goal Title *" placeholder="e.g. Reduce server downtime by 15%" {...GF('title')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Goal Type" options={Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))} {...GF('category')} />
            <Input label="Weightage % *" type="number" min="1" max={weightLeft} placeholder={`Limit: ${weightLeft}%`} {...GF('weightage')} />
          </div>
          <Input label="Measurable Metric" placeholder="e.g. 99.9% availability" {...GF('target')} />
          <Input label="Target Date" type="date" {...GF('targetDate')} />
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Success Criteria / Description</label>
            <textarea rows={3} value={goalForm.description} onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
            <Button variant="outline" onClick={() => setGoalModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!goalForm.title || !goalForm.weightage || !goalForm.cycleId) { toast.error('Required fields missing'); return; }
              createGoalMut.mutate(goalForm);
            }} loading={createGoalMut.isPending}>Add Goal</Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal open={cycleModal} onClose={() => setCycleModal(false)} title="Configure New Appraisal Cycle" size="lg">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
          <Input label="Cycle Name (e.g. H1 2025 Performance Review)" placeholder="Enter name..." {...CF('name')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Review Period Start" type="date" {...CF('periodStart')} />
            <Input label="Review Period End" type="date" {...CF('periodEnd')} />
          </div>
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Workflow Deadlines</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <Input label="Goal Setting Closes" type="date" {...CF('goalSettingEnd')} />
              <Input label="Self Appraisal Opens" type="date" {...CF('selfAppraisalStart')} />
              <Input label="Self Appraisal Closes" type="date" {...CF('selfAppraisalEnd')} />
              <Input label="Manager Review Closes" type="date" {...CF('managerReviewEnd')} />
            </div>
          </div>
          <Input label="Rating Scale (Max Rating, e.g. 5)" type="number" {...CF('ratingScale')} />
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <Button variant="outline" onClick={() => setCycleModal(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!cycleForm.name || !cycleForm.periodStart || !cycleForm.periodEnd) { toast.error('Core details missing'); return; }
              createCycleMut.mutate(cycleForm);
            }} loading={createCycleMut.isPending}>Create Cycle</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

