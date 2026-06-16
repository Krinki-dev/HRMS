import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../../services/complianceApi';
import { PageHeader, Button, Spinner } from '../../components/ui/Common';

const MONTHS = [
  {value:1,label:'January'},{value:2,label:'February'},{value:3,label:'March'},
  {value:4,label:'April'},{value:5,label:'May'},{value:6,label:'June'},
  {value:7,label:'July'},{value:8,label:'August'},{value:9,label:'September'},
  {value:10,label:'October'},{value:11,label:'November'},{value:12,label:'December'},
];

export function PTPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [challan, setChallan] = useState(null);

  const { data: ptData, isLoading } = useQuery({
    queryKey: ['pt-summary', month, year],
    queryFn:  () => complianceApi.ptSummary(month, year),
  });

  const challanMutation = useMutation({
    mutationFn: () => complianceApi.generatePTChallan(month, year),
    onSuccess:  (res) => { setChallan(res.data); toast.success('PT Challan generated!'); },
    onError:    (e)   => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const pt = ptData?.data;

  return (
    <div>
      <PageHeader
        title="Professional Tax (PT)"
        subtitle="State-wise PT deductions from payroll"
        actions={
          <div className="flex gap-2">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <Button onClick={() => challanMutation.mutate()} loading={challanMutation.isPending}
              disabled={!pt?.hasPayroll}>
              📄 Generate Challan
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !pt?.hasPayroll ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-semibold text-gray-800">No payroll for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
        </div>
      ) : pt?.employees?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">📋</p>
          <p className="font-semibold text-gray-800">No PT deductions this month</p>
          <p className="text-sm text-gray-500 mt-1">PT slabs may not be configured or no employees crossed the threshold.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{pt.summary.totalEmployees}</p>
              <p className="text-sm text-gray-500">Employees with PT</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">
                ₹{Math.round(pt.summary.totalPT/100).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-gray-500">Total PT Payable</p>
            </div>
          </div>

          {challan && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-5">
              <h3 className="font-bold text-purple-900 mb-2">📄 PT Challan Generated</h3>
              <p className="text-sm text-purple-800">
                Period: {challan.period} · Employees: {challan.employeeCount} · Total: ₹{challan.totalPT?.toLocaleString('en-IN')}
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">PT Deduction Details</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code','Name','Gross Wages (₹)','PT (₹)'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pt.employees.map(e => (
                  <tr key={e.employeeId} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{e.employeeCode}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{e.name}</td>
                    <td className="px-4 py-2.5 font-mono">₹{Math.round(e.gross/100).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-purple-700">₹{Math.round(e.pt/100).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-50 font-semibold border-t-2 border-purple-100">
                <tr>
                  <td colSpan="3" className="px-4 py-2 text-purple-800">Total</td>
                  <td className="px-4 py-2 font-mono text-purple-800">₹{Math.round(pt.summary.totalPT/100).toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function LWFPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const { data: lwfData, isLoading } = useQuery({
    queryKey: ['lwf-summary', month, year],
    queryFn:  () => complianceApi.lwfSummary(month, year),
  });

  const lwf = lwfData?.data;
  const isLWFMonth = [6, 12].includes(month);

  return (
    <div>
      <PageHeader
        title="Labour Welfare Fund (LWF)"
        subtitle="Deducted in June and December every year"
        actions={
          <div className="flex gap-2">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        }
      />

      {!isLWFMonth && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-800">
          ℹ️ LWF is deducted only in <strong>June</strong> and <strong>December</strong>. Select one of those months to view LWF data.
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !lwf?.hasPayroll || !isLWFMonth ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">🤝</p>
          <p className="font-semibold text-gray-800">
            {!isLWFMonth ? 'Select June or December for LWF data' : 'No payroll for selected period'}
          </p>
        </div>
      ) : lwf?.employees?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">🤝</p>
          <p className="font-semibold text-gray-800">No LWF deductions found</p>
          <p className="text-sm text-gray-500 mt-1">LWF rules may not be configured for your state.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">{lwf.summary.totalEmployees}</p>
              <p className="text-sm text-gray-500">Employees</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(lwf.summary.totalLWFEmployee/100).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500">Employee Contribution</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(lwf.summary.grandTotal/100).toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500">Total LWF</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Code','Name','Employee LWF (₹)','Employer LWF (₹)'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lwf.employees.map(e => (
                  <tr key={e.employeeId}>
                    <td className="px-4 py-2.5 text-xs font-mono">{e.employeeCode}</td>
                    <td className="px-4 py-2.5 font-medium">{e.name}</td>
                    <td className="px-4 py-2.5 font-mono">₹{Math.round(e.lwfEmployee/100).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 font-mono">₹{Math.round(e.lwfEmployer/100).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TYPE_COLORS = {
  pf_ecr:      'bg-blue-100 text-blue-800 border-blue-200',
  esi_challan: 'bg-green-100 text-green-800 border-green-200',
  pt_challan:  'bg-purple-100 text-purple-800 border-purple-200',
  tds:         'bg-orange-100 text-orange-800 border-orange-200',
  lwf:         'bg-teal-100 text-teal-800 border-teal-200',
  form16:      'bg-indigo-100 text-indigo-800 border-indigo-200',
};

export function ComplianceCalendarPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['compliance-calendar', year],
    queryFn:  () => complianceApi.calendar(year),
  });

  const events = data?.data?.events || [];

  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: MONTH_NAMES[i],
    events: events.filter(e => e.periodMonth === i + 1),
  }));

  return (
    <div>
      <PageHeader
        title="Compliance Calendar"
        subtitle="All due dates at a glance"
        actions={
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
            {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        }
      />

      {}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(TYPE_COLORS).map(([type, cls]) => (
          <span key={type} className={`text-xs px-2 py-1 rounded border font-medium ${cls}`}>
            {{pf_ecr:'PF ECR (15th)',esi_challan:'ESI Challan (21st)',pt_challan:'PT (15th)',
              tds:'TDS (7th)',lwf:'LWF (Jun/Dec)',form16:'Form 16 (June 15)'}[type]}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {byMonth.map(({ month, label, events }) => (
            <div key={month} className={`bg-white rounded-xl border p-4 ${
              month === new Date().getMonth() + 1 ? 'border-blue-400 shadow-sm' : 'border-gray-200'
            }`}>
              <p className="font-bold text-gray-800 mb-3">
                {label} {year}
                {month === new Date().getMonth() + 1 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Current</span>
                )}
              </p>
              {events.length === 0 ? (
                <p className="text-xs text-gray-400 italic">{[6,12].includes(month) ? 'LWF month' : 'No special filings'}</p>
              ) : (
                <div className="space-y-2">
                  {events.map(e => (
                    <div key={e.id} className={`text-xs px-2 py-1.5 rounded border ${TYPE_COLORS[e.filingType] || 'bg-gray-100'} flex justify-between items-center`}>
                      <span className="font-medium">{e.label}</span>
                      <div className="flex items-center gap-2">
                        {e.dueDate && (
                          <span className="opacity-70">
                            {new Date(e.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {e.status === 'filed'   && <span>✓</span>}
                        {e.status === 'overdue' && <span>🔴</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

