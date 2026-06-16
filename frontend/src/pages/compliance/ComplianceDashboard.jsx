import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../../services/complianceApi';
import { PageHeader, Button, Spinner, Modal } from '../../components/ui/Common';

const MONTH_NAMES = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TYPE_META = {
  pf_ecr:      { label: 'PF ECR',       icon: '🏦', color: 'blue',   path: '/compliance/pf' },
  esi_challan: { label: 'ESI Challan',   icon: '🏥', color: 'green',  path: '/compliance/esi' },
  pt_challan:  { label: 'PT Challan',    icon: '📋', color: 'purple', path: '/compliance/pt' },
  tds:         { label: 'TDS Challan',   icon: '💰', color: 'orange', path: '/compliance/tds' },
  lwf:         { label: 'LWF Return',    icon: '🤝', color: 'teal',   path: '/compliance/lwf' },
  form16:      { label: 'Form 16',       icon: '📄', color: 'indigo', path: '/compliance/tds' },
};

const STATUS_STYLE = {
  filed:   'bg-green-100 text-green-700 border-green-200',
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
};

function FilingCard({ filing, onMarkFiled }) {
  const meta = TYPE_META[filing.filingType] || {};
  const navigate = useNavigate();

  return (
    <div className={`bg-white rounded-xl border p-4 ${
      filing.status === 'overdue' ? 'border-red-300 shadow-sm shadow-red-100' :
      filing.status === 'filed'   ? 'border-green-200' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon || '📌'}</span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{filing.label}</p>
            <p className="text-xs text-gray-500">
              {MONTH_NAMES[filing.periodMonth]} {filing.periodYear}
            </p>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${STATUS_STYLE[filing.status] || 'bg-gray-100 text-gray-600'}`}>
          {filing.status === 'overdue' ? '🔴 Overdue' : filing.status === 'filed' ? '✓ Filed' : '🟡 Pending'}
        </span>
      </div>

      {filing.dueDate && (
        <p className={`text-xs mb-3 ${filing.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          Due: {new Date(filing.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      {filing.status !== 'filed' && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => navigate(meta.path || '/compliance')}>
            View Details
          </Button>
          <Button size="sm" onClick={() => onMarkFiled(filing)}>
            ✓ Mark Filed
          </Button>
        </div>
      )}
      {filing.status === 'filed' && filing.filedAt && (
        <p className="text-xs text-green-600">
          Filed on {new Date(filing.filedAt).toLocaleDateString('en-IN')}
          {filing.ackNumber && ` · Ack: ${filing.ackNumber}`}
        </p>
      )}
    </div>
  );
}

export default function ComplianceDashboard() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [markFilingModal, setMarkFilingModal] = useState(null);
  const [ackNumber, setAckNumber]   = useState('');
  const [challanNo, setChallanNo]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-dashboard'],
    queryFn:  complianceApi.dashboard,
  });

  const markFiledMutation = useMutation({
    mutationFn: ({ id, ackNumber, challanNumber }) =>
      complianceApi.markFiled(id, { ackNumber, challanNumber }),
    onSuccess: () => {
      toast.success('Marked as filed!');
      queryClient.invalidateQueries(['compliance-dashboard']);
      setMarkFilingModal(null);
      setAckNumber('');
      setChallanNo('');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const d = data?.data;

  if (isLoading) return (
    <div className="flex justify-center items-center h-64"><Spinner size="lg" /></div>
  );

  return (
    <div>
      <PageHeader
        title="Compliance"
        subtitle="Statutory filings — PF · ESI · PT · TDS · LWF"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/compliance/calendar')}>📅 Calendar</Button>
          </div>
        }
      />

      {}
      {d?.payrollStats && (
        <div className={`rounded-xl p-4 mb-5 flex items-center justify-between ${
          d.payrollStats.payrollStatus === 'locked' || d.payrollStats.payrollStatus === 'published'
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {d.payrollStats.payrollStatus === 'locked' || d.payrollStats.payrollStatus === 'published' ? '✅' : '⚠️'}
            </span>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {MONTH_NAMES[d.month]} {d.year} Payroll — {d.payrollStats.payrollStatus?.toUpperCase()}
              </p>
              <p className="text-xs text-gray-500">
                {d.payrollStats.employeeCount} employees ·
                PF: ₹{Math.round(d.payrollStats.totalPF / 100).toLocaleString('en-IN')} ·
                ESI: ₹{Math.round(d.payrollStats.totalESI / 100).toLocaleString('en-IN')} ·
                TDS: ₹{Math.round(d.payrollStats.totalTDS / 100).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          {(d.payrollStats.payrollStatus === 'draft' || !d.payrollStats.payrollStatus) && (
            <Button size="sm" onClick={() => navigate('/payroll')}>Process Payroll →</Button>
          )}
        </div>
      )}

      {}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Overdue',   value: d?.overdue?.length  || 0, color: 'border-red-400 text-red-700',    bg: 'bg-red-50' },
          { label: 'Due Soon',  value: d?.dueSoon?.length  || 0, color: 'border-yellow-400 text-yellow-700', bg: 'bg-yellow-50' },
          { label: 'Upcoming',  value: d?.upcoming?.length || 0, color: 'border-blue-300 text-blue-700',  bg: 'bg-blue-50' },
          { label: 'Filed',     value: d?.filed?.length    || 0, color: 'border-green-400 text-green-700', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border-2 ${s.color} p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color.split(' ')[1]}`}>{s.value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {}
      {d?.overdue?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 font-bold text-red-700 mb-3">
            🔴 Overdue <span className="text-sm font-normal text-gray-500">— action required immediately</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.overdue.map(f => <FilingCard key={f.id} filing={f} onMarkFiled={setMarkFilingModal} />)}
          </div>
        </section>
      )}

      {}
      {d?.dueSoon?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 font-bold text-yellow-700 mb-3">
            🟡 Due Soon <span className="text-sm font-normal text-gray-500">— due within 15 days</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.dueSoon.map(f => <FilingCard key={f.id} filing={f} onMarkFiled={setMarkFilingModal} />)}
          </div>
        </section>
      )}

      {}
      {d?.upcoming?.length > 0 && (
        <section className="mb-6">
          <h2 className="flex items-center gap-2 font-bold text-blue-700 mb-3">
            📅 Upcoming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {d.upcoming.map(f => <FilingCard key={f.id} filing={f} onMarkFiled={setMarkFilingModal} />)}
          </div>
        </section>
      )}

      {}
      <section>
        <h2 className="font-bold text-gray-700 mb-3">Compliance Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(TYPE_META).filter(([k]) => k !== 'form16').map(([key, meta]) => (
            <button
              key={key}
              onClick={() => navigate(meta.path)}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="text-3xl mb-2">{meta.icon}</div>
              <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
            </button>
          ))}
        </div>
      </section>

      {}
      <Modal
        open={!!markFilingModal}
        onClose={() => { setMarkFilingModal(null); setAckNumber(''); setChallanNo(''); }}
        title={`Mark as Filed — ${markFilingModal?.label}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setMarkFilingModal(null)}>Cancel</Button>
            <Button
              onClick={() => markFiledMutation.mutate({ id: markFilingModal.id, ackNumber, challanNumber: challanNo })}
              loading={markFiledMutation.isPending}
            >
              Confirm Filed
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Optionally enter acknowledgement or challan details for records.
          </p>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Acknowledgement Number</label>
            <input value={ackNumber} onChange={e => setAckNumber(e.target.value)}
              placeholder="e.g. ECR2024031500001"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Challan / Reference Number</label>
            <input value={challanNo} onChange={e => setChallanNo(e.target.value)}
              placeholder="e.g. 123456789"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
      </Modal>
    </div>
  );
}

