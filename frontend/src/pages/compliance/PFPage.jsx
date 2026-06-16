import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../../services/complianceApi';
import { PageHeader, Button, Spinner, Tabs } from '../../components/ui/Common';

const MONTHS = [
  {value:1,label:'January'},{value:2,label:'February'},{value:3,label:'March'},
  {value:4,label:'April'},{value:5,label:'May'},{value:6,label:'June'},
  {value:7,label:'July'},{value:8,label:'August'},{value:9,label:'September'},
  {value:10,label:'October'},{value:11,label:'November'},{value:12,label:'December'},
];

const TABS = [
  { id: 'summary',  label: 'PF Summary',   icon: '📊' },
  { id: 'uan',      label: 'Missing UAN',  icon: '🔍' },
];

function MonthYearSelector({ month, year, onChange }) {
  const years = [2023, 2024, 2025, 2026];
  return (
    <div className="flex gap-2">
      <select value={month} onChange={e => onChange(parseInt(e.target.value), year)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
      <select value={year} onChange={e => onChange(month, parseInt(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
}

function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(rows, headers, filename) {
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function PFPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [tab,   setTab]   = useState('summary');
  const [uanEdits, setUanEdits] = useState({});

  const handlePeriodChange = (m, y) => { setMonth(m); setYear(y); };

  const { data: pfData, isLoading } = useQuery({
    queryKey: ['pf-summary', month, year],
    queryFn:  () => complianceApi.pfSummary(month, year),
    enabled:  tab === 'summary',
  });

  const { data: missingData, isLoading: missingLoading } = useQuery({
    queryKey: ['missing-uan'],
    queryFn:  complianceApi.missingUAN,
    enabled:  tab === 'uan',
  });

  const ecrMutation = useMutation({
    mutationFn: () => complianceApi.generateECR(month, year),
    onSuccess: (res) => {
      downloadText(res.data.content, res.data.fileName);
      toast.success(`ECR downloaded — ${res.data.totalRecords} records`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'ECR generation failed.'),
  });

  const uanMutation = useMutation({
    mutationFn: (updates) => complianceApi.updateUAN(updates),
    onSuccess: () => toast.success('UAN numbers saved!'),
    onError: () => toast.error('Failed to save UAN.'),
  });

  const pf   = pfData?.data;
  const missing = missingData?.data || [];

  const exportPFStatement = () => {
    if (!pf?.employees?.length) return;
    const headers = ['Employee Code','Name','UAN','PF Wages (₹)','Employee PF (₹)','Employer PF (₹)','EPS (₹)','EDLI (₹)'];
    const rows = pf.employees.map(e => [
      e.employeeCode, e.name, e.uan || 'NOT SET',
      Math.round(e.pfWages/100), Math.round(e.pfEmployee/100),
      Math.round(e.pfEmployer/100), Math.round(e.eps/100), Math.round(e.edli/100),
    ]);
    downloadCSV(rows, headers, `PF_Statement_${year}_${String(month).padStart(2,'0')}.csv`);
  };

  const saveUANEdits = () => {
    const updates = Object.entries(uanEdits)
      .filter(([, v]) => v.trim())
      .map(([employeeId, uanNumber]) => ({ employeeId, uanNumber }));
    if (!updates.length) { toast.error('No UAN values entered.'); return; }
    uanMutation.mutate(updates);
  };

  return (
    <div>
      <PageHeader
        title="Provident Fund (PF)"
        subtitle="Monthly PF summary and ECR file generation"
        actions={
          tab === 'summary' ? (
            <div className="flex gap-2">
              <MonthYearSelector month={month} year={year} onChange={handlePeriodChange} />
              <Button variant="outline" onClick={exportPFStatement} disabled={!pf?.employees?.length}>
                ⬇ Export CSV
              </Button>
              <Button onClick={() => ecrMutation.mutate()} loading={ecrMutation.isPending}
                disabled={!pf?.hasPayroll || pf?.summary?.payrollStatus === 'draft'}>
                📄 Download ECR
              </Button>
            </div>
          ) : null
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {}
      {tab === 'summary' && (
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !pf?.hasPayroll ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-3xl mb-3">📊</p>
              <p className="font-semibold text-gray-800">No payroll for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
              <p className="text-sm text-gray-500 mt-1">Process payroll first to generate PF summary.</p>
            </div>
          ) : (
            <>
              {}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Employees under PF',  value: pf.summary.totalEmployees,
                    display: pf.summary.totalEmployees, unit: '' },
                  { label: 'Employee PF (12%)',    value: pf.summary.totalPFEmployee,
                    display: `₹${Math.round(pf.summary.totalPFEmployee/100).toLocaleString('en-IN')}` },
                  { label: 'Employer PF (12%)',    value: pf.summary.totalPFEmployer,
                    display: `₹${Math.round(pf.summary.totalPFEmployer/100).toLocaleString('en-IN')}` },
                  { label: 'Total PF Payable',     value: pf.summary.grandTotal,
                    display: `₹${Math.round(pf.summary.grandTotal/100).toLocaleString('en-IN')}` },
                ].map((c, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                    <p className="text-2xl font-bold text-gray-900">{c.display || c.value}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
                  </div>
                ))}
              </div>

              {}
              {pf.summary.payrollStatus === 'draft' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
                  ⚠️ Payroll is still in <strong>draft</strong>. Lock payroll before downloading ECR.
                </div>
              )}

              {}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Employee PF Statement</h3>
                  <span className="text-xs text-gray-400">
                    {pf.employees.filter(e => !e.uan).length} employees missing UAN
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Code','Name','UAN','PF Wages','Employee PF','Employer PF','EPS','EDLI'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pf.employees.map(e => (
                        <tr key={e.employeeId} className={!e.uan ? 'bg-red-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{e.employeeCode}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-900">{e.name}</td>
                          <td className="px-4 py-2.5">
                            {e.uan ? (
                              <span className="text-gray-700 font-mono text-xs">{e.uan}</span>
                            ) : (
                              <span className="text-xs text-red-600 font-medium">⚠️ Not set</span>
                            )}
                          </td>
                          {[e.pfWages, e.pfEmployee, e.pfEmployer, e.eps, e.edli].map((v, i) => (
                            <td key={i} className="px-4 py-2.5 text-gray-700 font-mono">
                              ₹{Math.round(v/100).toLocaleString('en-IN')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-blue-50 font-semibold border-t-2 border-blue-100">
                      <tr>
                        <td colSpan="3" className="px-4 py-2 text-blue-800">Total</td>
                        <td className="px-4 py-2 text-blue-800 font-mono">
                          ₹{Math.round(pf.employees.reduce((s,e)=>s+e.pfWages,0)/100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-blue-800 font-mono">
                          ₹{Math.round(pf.summary.totalPFEmployee/100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-blue-800 font-mono">
                          ₹{Math.round(pf.summary.totalPFEmployer/100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-blue-800 font-mono">
                          ₹{Math.round(pf.employees.reduce((s,e)=>s+e.eps,0)/100).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-blue-800 font-mono">
                          ₹{Math.round(pf.employees.reduce((s,e)=>s+e.edli,0)/100).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {}
      {tab === 'uan' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Employees Missing UAN</h3>
              <p className="text-xs text-gray-500 mt-0.5">Enter UAN numbers for employees to include them in ECR file</p>
            </div>
            <Button onClick={saveUANEdits} loading={uanMutation.isPending}>
              Save UAN Numbers
            </Button>
          </div>

          {missingLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : missing.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">✅</p>
              <p className="font-semibold text-gray-800">All employees have UAN numbers!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {missing.map(emp => (
                <div key={emp.id} className="flex items-center px-5 py-3 gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-gray-400">{emp.employee_code} · {emp.department?.name || '—'}</p>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter 12-digit UAN"
                    maxLength={12}
                    value={uanEdits[emp.id] || ''}
                    onChange={e => setUanEdits(prev => ({ ...prev, [emp.id]: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-44 font-mono"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

