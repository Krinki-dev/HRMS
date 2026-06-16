import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getPayrollDashboard, listPayrollRuns, createPayrollRun,
  processPayrollRun, lockPayrollRun, publishPayrollRun, deletePayrollRun,
  formatINR, monthName,
} from '../../services/payrollApi';

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const statusConfig = {
  not_started: { label: 'Not Started', color: 'bg-gray-100 text-gray-600' },
  draft:       { label: 'Draft',       color: 'bg-yellow-100 text-yellow-700' },
  processed:   { label: 'Processed',   color: 'bg-blue-100 text-blue-700' },
  locked:      { label: 'Locked',      color: 'bg-green-100 text-green-700' },
  published:   { label: 'Published ✓', color: 'bg-purple-100 text-purple-700' },
};

export default function PayrollDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [runs, setRuns]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [toast, setToast]           = useState(null);

  const now    = new Date();
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);
  const [newYear,  setNewYear]  = useState(now.getFullYear());

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      setLoading(true);
      const [dash, runsRes] = await Promise.all([
        getPayrollDashboard(),
        listPayrollRuns({ limit: 12 }),
      ]);
      setDashboard(dash.data);
      setRuns(runsRes.data || []);
    } catch (e) {
      showToast('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function handleCreate() {
    try {
      setActionLoading('create');
      await createPayrollRun(newMonth, newYear);
      showToast(`Payroll run created for ${MONTH_NAMES[newMonth]} ${newYear}`);
      setShowCreate(false);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to create run', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAction(runId, action) {
    const labels = { process: 'Processing...', lock: 'Locking...', publish: 'Publishing...', delete: 'Deleting...' };
    try {
      setActionLoading(runId + action);
      if (action === 'process') await processPayrollRun(runId);
      if (action === 'lock')    await lockPayrollRun(runId);
      if (action === 'publish') await publishPayrollRun(runId);
      if (action === 'delete')  await deletePayrollRun(runId);
      showToast(`Payroll run ${action}ed successfully`);
      load();
    } catch (e) {
      showToast(e.response?.data?.message || `Failed to ${action} run`, 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const curr = dashboard?.currentMonth;
  const last = dashboard?.lastMonth;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500 mt-0.5">Process salaries, manage runs, generate reports</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <span className="text-lg leading-none">+</span> New Payroll Run
        </button>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Employees" value={dashboard?.totalEmployees || 0} sub="active employees" color="blue" />
        <StatCard label="No Salary Assigned" value={dashboard?.pendingSalaries || 0} sub="need setup" color="orange" />
        <StatCard label={`${monthName(last?.month)} Net Payout`} value={formatINR(last?.run?.total_net)} sub={`${last?.run?.total_employees || 0} employees`} color="green" />
        <StatCard label="This Month" value={statusConfig[curr?.status]?.label || 'Not Started'} sub={`${MONTH_NAMES[curr?.month]} ${curr?.year}`} color="purple" />
      </div>

      {}
      {curr?.run && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">
                {MONTH_NAMES[curr.month]} {curr.year} — Current Run
              </h2>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[curr.run.status]?.color}`}>
                {statusConfig[curr.run.status]?.label}
              </span>
            </div>
            <div className="flex gap-2">
              {curr.run.status === 'draft' && (
                <ActionBtn label="Process Payroll" loading={actionLoading === curr.run.id+'process'}
                  color="blue" onClick={() => handleAction(curr.run.id, 'process')} />
              )}
              {curr.run.status === 'processed' && (
                <>
                  <ActionBtn label="View Payslips" color="gray" onClick={() => navigate(`/payroll/runs/${curr.run.id}`)} />
                  <ActionBtn label="Lock Run" loading={actionLoading === curr.run.id+'lock'}
                    color="green" onClick={() => handleAction(curr.run.id, 'lock')} />
                </>
              )}
              {curr.run.status === 'locked' && (
                <>
                  <ActionBtn label="View Payslips" color="gray" onClick={() => navigate(`/payroll/runs/${curr.run.id}`)} />
                  <ActionBtn label="Publish to Employees" loading={actionLoading === curr.run.id+'publish'}
                    color="blue" onClick={() => handleAction(curr.run.id, 'publish')} />
                </>
              )}
              {curr.run.status === 'published' && (
                <>
                  <ActionBtn label="View Payslips" color="gray" onClick={() => navigate(`/payroll/runs/${curr.run.id}`)} />
                  <ActionBtn label="Download Reports" color="green" onClick={() => navigate(`/payroll/reports/${curr.run.month}/${curr.run.year}`)} />
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div><p className="text-xs text-gray-400">Employees</p><p className="font-semibold text-gray-800">{curr.run.total_employees}</p></div>
            <div><p className="text-xs text-gray-400">Gross Payout</p><p className="font-semibold text-gray-800">{formatINR(curr.run.total_gross)}</p></div>
            <div><p className="text-xs text-gray-400">Net Payout</p><p className="font-semibold text-green-700">{formatINR(curr.run.total_net)}</p></div>
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Payroll History</h2>
        </div>
        {runs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-2">💰</div>
            <p className="font-medium">No payroll runs yet</p>
            <p className="text-sm">Create your first payroll run to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 text-left">Period</th>
                <th className="px-5 py-3 text-right">Employees</th>
                <th className="px-5 py-3 text-right">Gross</th>
                <th className="px-5 py-3 text-right">Deductions</th>
                <th className="px-5 py-3 text-right">Net Payout</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {runs.map(run => (
                <tr key={run.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {MONTH_NAMES[run.month]} {run.year}
                  </td>
                  <td className="px-5 py-3 text-right text-gray-600">{run.total_employees}</td>
                  <td className="px-5 py-3 text-right text-gray-600">{formatINR(run.total_gross)}</td>
                  <td className="px-5 py-3 text-right text-red-500">{formatINR(run.total_deductions)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">{formatINR(run.total_net)}</td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusConfig[run.status]?.color}`}>
                      {statusConfig[run.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/payroll/runs/${run.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</button>
                      {run.status === 'draft' && (
                        <button onClick={() => handleAction(run.id, 'delete')}
                          className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                      )}
                      {run.status === 'draft' && (
                        <button onClick={() => handleAction(run.id, 'process')}
                          className="text-green-600 hover:text-green-800 text-xs font-medium">Process</button>
                      )}
                      {run.status === 'processed' && (
                        <button onClick={() => handleAction(run.id, 'lock')}
                          className="text-green-600 hover:text-green-800 text-xs font-medium">Lock</button>
                      )}
                      {run.status === 'locked' && (
                        <button onClick={() => navigate(`/payroll/reports/${run.month}/${run.year}`)}
                          className="text-purple-600 hover:text-purple-800 text-xs font-medium">Reports</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">New Payroll Run</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select value={newMonth} onChange={e => setNewMonth(+e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                  {MONTH_NAMES.slice(1).map((m, i) => (
                    <option key={i+1} value={i+1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select value={newYear} onChange={e => setNewYear(+e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={actionLoading === 'create'}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                {actionLoading === 'create' ? 'Creating...' : 'Create Run'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${colors[color]?.split(' ')[1]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

function ActionBtn({ label, onClick, color, loading }) {
  const colors = {
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    green: 'bg-green-600 text-white hover:bg-green-700',
    gray: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
  };
  return (
    <button onClick={onClick} disabled={loading}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${colors[color]}`}>
      {loading ? 'Working...' : label}
    </button>
  );
}