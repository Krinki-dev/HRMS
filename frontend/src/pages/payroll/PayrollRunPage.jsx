import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
  getPayrollRun,
  listPayslips,
  processPayrollRun,
  lockPayrollRun,
  publishPayrollRun,
  formatINR,
  monthName,
} from '../../services/payrollApi';
import { PageHeader, Button, Spinner, Badge, Modal, Input, Table } from '../../components/ui';

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  processed: { label: 'Processed', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-400' },
  locked: { label: 'Locked', color: 'bg-green-100 text-green-700', dot: 'bg-green-400' },
  published: { label: 'Published', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-400' },
};

export default function PayrollRunPage() {
  const { runId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const { data: runRes, isLoading: runLoading } = useQuery({
    queryKey: ['payrollRun', runId],
    queryFn: () => getPayrollRun(runId),
  });

  const { data: payslipsRes, isLoading: payslipsLoading } = useQuery({
    queryKey: ['payslips', runId],
    queryFn: () => listPayslips(runId, { limit: 500 }),
  });

  const runAction = useMutation({
    mutationFn: async ({ action, id }) => {
      if (action === 'process') return processPayrollRun(id);
      if (action === 'lock') return lockPayrollRun(id);
      if (action === 'publish') return publishPayrollRun(id);
    },
    onSuccess: (_, { action }) => {
      toast.success(`Payroll run ${action}ed successfully`);
      queryClient.invalidateQueries(['payrollRun', runId]);
      queryClient.invalidateQueries(['payslips', runId]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Action failed');
    },
  });

  const run = runRes?.data;
  const payslips = payslipsRes?.data || [];
  const status = STATUS_CONFIG[run?.status] || STATUS_CONFIG.draft;

  const filtered = payslips.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    const name = `${p.employee?.first_name} ${p.employee?.last_name}`.toLowerCase();
    return name.includes(s) || p.employee?.employee_code?.toLowerCase().includes(s);
  });

  if (runLoading) return <div className="p-12 flex justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title={`${MONTH_NAMES[run?.month]} ${run?.year} Payroll`}
        subtitle={`${run?.total_employees} employees · ${formatINR(run?.total_net)} total payout`}
        actions={
          <div className="flex gap-2 items-center">
            <button onClick={() => navigate('/payroll')}
              className="text-sm text-gray-500 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg">
              ← Back
            </button>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
            {run?.status === 'draft' && (
              <Button
                variant="primary"
                loading={runAction.isPending && runAction.variables?.action === 'process'}
                onClick={() => runAction.mutate({ action: 'process', id: runId })}
              >
                Process Run
              </Button>
            )}
            {run?.status === 'processed' && (
              <Button
                variant="success"
                loading={runAction.isPending && runAction.variables?.action === 'lock'}
                onClick={() => runAction.mutate({ action: 'lock', id: runId })}
              >
                Lock Payroll
              </Button>
            )}
            {run?.status === 'locked' && (
              <Button
                variant="primary"
                loading={runAction.isPending && runAction.variables?.action === 'publish'}
                onClick={() => runAction.mutate({ action: 'publish', id: runId })}
              >
                Publish Payslips
              </Button>
            )}
            {(run?.status === 'locked' || run?.status === 'published') && (
              <Button variant="outline" onClick={() => navigate(`/payroll/reports/${run?.month}/${run?.year}`)}>
                Reports
              </Button>
            )}
          </div>
        }
      />

      {}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Gross Total" value={formatINR(run?.total_gross)} />
        <SummaryCard label="PF (Employer)" value={formatINR(payslips.reduce((s, p) => s + (p.pf_employer || 0), 0))} color="text-orange-600" />
        <SummaryCard label="Total Deductions" value={formatINR(run?.total_deductions)} color="text-red-500" />
        <SummaryCard label="Net Payout" value={formatINR(run?.total_net)} color="text-green-600" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <Input
            placeholder="Search by name or code..."
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="text-sm text-gray-500 font-medium">
            Showing {filtered.length} of {payslips.length} records
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-4 py-4 text-right">Days</th>
                <th className="px-4 py-4 text-right text-red-500">LOP</th>
                <th className="px-4 py-4 text-right">Gross</th>
                <th className="px-4 py-4 text-right text-red-500">PF/ESI</th>
                <th className="px-4 py-4 text-right text-red-500">TDS/PT</th>
                <th className="px-4 py-4 text-right font-bold text-gray-900">Net Salary</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{p.employee?.first_name} {p.employee?.last_name}</div>
                    <div className="text-xs text-gray-500">{p.employee?.employee_code} · {p.employee?.department?.name}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-medium">{p.present_days}/{p.working_days}</td>
                  <td className="px-4 py-4 text-right text-red-500">{p.lop_days || '-'}</td>
                  <td className="px-4 py-4 text-right font-medium">{formatINR(p.gross)}</td>
                  <td className="px-4 py-4 text-right text-xs text-gray-500">
                    <div>PF: {formatINR(p.pf_employee)}</div>
                    <div>ESI: {formatINR(p.esi_employee)}</div>
                  </td>
                  <td className="px-4 py-4 text-right text-xs text-gray-500">
                    <div>TDS: {formatINR(p.tds)}</div>
                    <div>PT: {formatINR(p.pt)}</div>
                  </td>
                  <td className="px-4 py-4 text-right font-bold text-green-700">{formatINR(p.net_salary)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => setSelectedPayslip(p)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-xs"
                    >
                      VIEW
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPayslip && (
        <PayslipModal
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color = "text-gray-900" }) {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function PayslipModal({ payslip: p, onClose }) {
  const emp = p.employee;
  return (
    <Modal open={true} onClose={onClose} title="Payslip Details" size="lg">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 border-b pb-1">Earnings</h3>
          <div className="space-y-2">
            <Line label="Basic Salary" value={p.basic} />
            <Line label="HRA" value={p.hra} />
            {p.da > 0 && <Line label="DA" value={p.da} />}
            {p.ta > 0 && <Line label="TA" value={p.ta} />}
            {p.special_allowance > 0 && <Line label="Special Allowance" value={p.special_allowance} />}
            {p.other_earnings > 0 && <Line label="Bonus/Other" value={p.other_earnings} color="text-green-600" />}
            <div className="pt-2 border-t font-bold">
              <Line label="Gross Earnings" value={p.gross} />
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-400 uppercase mb-4 border-b pb-1">Deductions</h3>
          <div className="space-y-2 text-red-600">
            <Line label="PF (Employee)" value={p.pf_employee} />
            <Line label="ESI (Employee)" value={p.esi_employee} />
            <Line label="Professional Tax" value={p.pt} />
            <Line label="TDS" value={p.tds} />
            {p.other_deductions > 0 && <Line label="Other Deductions" value={p.other_deductions} />}
            <div className="pt-2 border-t font-bold">
              <Line label="Total Deductions" value={p.total_deductions} />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-green-50 p-6 rounded-xl flex justify-between items-center border border-green-100">
        <div>
          <div className="text-green-600 text-sm font-semibold uppercase">Net Take Home</div>
          <div className="text-3xl font-black text-green-700">{formatINR(p.net_salary)}</div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>Working Days: {p.working_days}</div>
          <div>Present Days: {p.present_days}</div>
          <div className="text-red-500 font-bold">LOP Days: {p.lop_days || 0}</div>
        </div>
      </div>
    </Modal>
  );
}

function Line({ label, value, color = "text-gray-700" }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${color}`}>{formatINR(value)}</span>
    </div>
  );
}