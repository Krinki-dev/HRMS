import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { complianceApi } from '../../services/complianceApi';
import { PageHeader, Button, Spinner, Tabs, Input } from '../../components/ui/Common';
import { useAuthStore } from '../../store/authStore';

const MONTHS = [
  {value:1,label:'Jan'},{value:2,label:'Feb'},{value:3,label:'Mar'},
  {value:4,label:'Apr'},{value:5,label:'May'},{value:6,label:'Jun'},
  {value:7,label:'Jul'},{value:8,label:'Aug'},{value:9,label:'Sep'},
  {value:10,label:'Oct'},{value:11,label:'Nov'},{value:12,label:'Dec'},
];

const TABS = [
  { id: 'summary',     label: 'TDS Summary',         icon: '📊' },
  { id: 'declaration', label: 'Investment Declaration', icon: '📝' },
  { id: 'form16',      label: 'Form 16',              icon: '📄' },
];

function getCurrentFY() {
  const now = new Date();
  const m = now.getMonth() + 1, y = now.getFullYear();
  return m >= 4 ? `${y}-${y+1}` : `${y-1}-${y}`;
}

function downloadCSV(rows, headers, filename) {
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}

const toRupees = (paise) => Math.round((paise||0) / 100);
const toPaise  = (r)     => Math.round(parseFloat(r||0) * 100);

export default function TDSPage() {
  const now = new Date();
  const { user } = useAuthStore();
  const hasEmployee = !!(user?.employee?.id || user?.employeeId);
  const queryClient  = useQueryClient();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [tab,   setTab]   = useState('summary');
  const [form16Year, setForm16Year] = useState(getCurrentFY());

  const [decl, setDecl] = useState({
    regime: 'new', financialYear: getCurrentFY(),
    hraRent: '', landlordPan: '', section80c: '', section80d: '',
    section80g: '', homeLoanInterest: '', lta: '',
  });
  const D = (field) => ({ value: decl[field], onChange: e => setDecl(p => ({ ...p, [field]: e.target.value })) });

  const { data: tdsData, isLoading } = useQuery({
    queryKey: ['tds-summary', month, year],
    queryFn:  () => complianceApi.tdsSummary(month, year),
    enabled:  tab === 'summary',
  });

  const { data: myDeclData } = useQuery({
    queryKey: ['my-declaration', decl.financialYear],
    queryFn:  () => complianceApi.getMyDeclaration(decl.financialYear),
    enabled:  tab === 'declaration' && hasEmployee,
    onSuccess: (res) => {
      if (res?.data) {
        const d = res.data;
        setDecl(prev => ({
          ...prev,
          regime:           d.regime || 'new',
          hraRent:          toRupees(d.hra_rent),
          landlordPan:      d.landlord_pan || '',
          section80c:       toRupees(d.section_80c),
          section80d:       toRupees(d.section_80d),
          section80g:       toRupees(d.section_80g),
          homeLoanInterest: toRupees(d.home_loan_interest),
          lta:              toRupees(d.lta),
        }));
      }
    },
  });

  const saveDeclMutation = useMutation({
    mutationFn: () => complianceApi.saveDeclaration(decl),
    onSuccess:  () => {
      toast.success('Declaration saved!');
      queryClient.invalidateQueries(['my-declaration']);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to save.'),
  });

  const form16Mutation = useMutation({
    mutationFn: () => complianceApi.generateForm16(form16Year),
    onSuccess: (res) => {
      const d = res.data;
      const headers = ['Code','Name','PAN','Gross Salary (₹)','Basic (₹)','HRA (₹)','PF (₹)','PT (₹)','TDS (₹)','Net Salary (₹)'];
      const rows = d.employees.map(e => [
        e.employeeCode, e.name, e.pan, e.grossSalary, e.basicSalary, e.hra,
        e.pfDeduction, e.ptDeduction, e.totalTDS, e.netSalary,
      ]);
      downloadCSV(rows, headers, `Form16_${form16Year.replace('-','_')}.csv`);
      toast.success(`Form 16 data for ${d.total} employees downloaded!`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const tds = tdsData?.data;

  return (
    <div>
      <PageHeader title="TDS — Tax Deducted at Source" subtitle="Monthly TDS deductions and investment declarations" />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {}
      {tab === 'summary' && (
        <div>
          <div className="flex gap-2 mb-4">
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
              {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20"><Spinner size="lg" /></div>
          ) : !tds?.hasPayroll ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-3xl mb-3">💰</p>
              <p className="font-semibold text-gray-800">No payroll for selected period</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-2xl font-bold text-gray-900">{tds.summary.totalEmployees}</p>
                  <p className="text-sm text-gray-500">Employees with TDS</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{Math.round(tds.summary.totalTDS/100).toLocaleString('en-IN')}
                  </p>
                  <p className="text-sm text-gray-500">Total TDS This Month</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">TDS Deduction Details</h3>
                  <Button size="sm" variant="outline" onClick={() => {
                    const headers = ['Code','Name','PAN','Gross (₹)','TDS (₹)'];
                    const rows = tds.employees.map(e => [
                      e.employeeCode, e.name, e.pan || 'N/A',
                      Math.round(e.gross/100), Math.round(e.tds/100),
                    ]);
                    downloadCSV(rows, headers, `TDS_${year}_${String(month).padStart(2,'0')}.csv`);
                  }}>⬇ Export</Button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Code','Name','PAN','Gross (₹)','TDS (₹)'].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tds.employees.map(e => (
                      <tr key={e.employeeId} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{e.employeeCode}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{e.name}</td>
                        <td className="px-4 py-2.5 text-xs font-mono">{e.pan || <span className="text-red-500">Not set</span>}</td>
                        <td className="px-4 py-2.5 font-mono">₹{Math.round(e.gross/100).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-orange-700">₹{Math.round(e.tds/100).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {}
      {tab === 'declaration' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {!hasEmployee ? (
            <div className="text-center py-10">
              <p className="text-3xl mb-2">📝</p>
              <p className="font-semibold text-gray-800">Investment Declaration</p>
              <p className="text-sm text-gray-500 mt-1">This section is for employees to declare their investments for TDS calculation.</p>
              <p className="text-sm text-gray-400 mt-1">Admin accounts can view declarations from the TDS summary.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-gray-900">Investment Declaration — {decl.financialYear}</h3>
                  <p className="text-sm text-gray-500">Your investments are used to calculate monthly TDS deductions</p>
                </div>
                <div className="flex gap-2 items-center">
                  <select value={decl.financialYear}
                    onChange={e => setDecl(p => ({ ...p, financialYear: e.target.value }))}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                    {['2024-2025','2025-2026'].map(fy => <option key={fy} value={fy}>{fy}</option>)}
                  </select>
                  <Button onClick={() => saveDeclMutation.mutate()} loading={saveDeclMutation.isPending}>
                    Save Declaration
                  </Button>
                </div>
              </div>

              {}
              <div className="mb-5 bg-blue-50 rounded-xl p-4">
                <p className="font-semibold text-gray-800 mb-3">Tax Regime</p>
                <div className="flex gap-4">
                  {['old', 'new'].map(r => (
                    <label key={r} className={`flex items-center gap-3 border-2 rounded-xl p-3 cursor-pointer flex-1 ${
                      decl.regime === r ? 'border-blue-500 bg-white' : 'border-gray-200 bg-white'
                    }`}>
                      <input type="radio" value={r} checked={decl.regime === r}
                        onChange={() => setDecl(p => ({ ...p, regime: r }))} className="w-4 h-4" />
                      <div>
                        <p className="font-semibold capitalize">{r} Regime</p>
                        <p className="text-xs text-gray-500">
                          {r === 'old' ? 'Deductions allowed (80C, 80D, HRA etc.)' : 'Lower slab rates, no deductions'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {}
              {decl.regime === 'old' && (
                <div className="space-y-5">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">HRA Exemption</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Monthly Rent Paid (₹)" type="number" placeholder="15000" {...D('hraRent')} />
                      <Input label="Landlord PAN" placeholder="ABCDE1234F" {...D('landlordPan')} />
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Section 80C (Max ₹1,50,000)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Total 80C Investments (₹)" type="number"
                        placeholder="EPF + PPF + ELSS + LIC + Tuition..." {...D('section80c')} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Include: EPF, PPF, ELSS, NSC, LIC, Tuition fees, Home loan principal</p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-700 mb-3">Other Deductions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Section 80D — Medical Insurance (₹)" type="number" placeholder="25000" {...D('section80d')} />
                      <Input label="Home Loan Interest — Sec 24b (₹)" type="number" placeholder="200000" {...D('homeLoanInterest')} />
                      <Input label="LTA — Leave Travel Allowance (₹)" type="number" placeholder="0" {...D('lta')} />
                      <Input label="Section 80G — Donations (₹)" type="number" placeholder="0" {...D('section80g')} />
                    </div>
                  </div>
                </div>
              )}

              {decl.regime === 'new' && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  Under the <strong>New Tax Regime</strong>, no deductions (80C, HRA, etc.) are applicable.
                  TDS will be calculated directly on your gross salary using the new slab rates.
                  Standard deduction of ₹50,000 is automatically applied.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {}
      {tab === 'form16' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900">Form 16 — Annual TDS Certificate</h3>
              <p className="text-sm text-gray-500 mt-0.5">Issue to all employees by June 15 each year</p>
            </div>
            <div className="flex gap-2 items-center">
              <select value={form16Year} onChange={e => setForm16Year(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white">
                {['2023-2024','2024-2025','2025-2026'].map(fy => <option key={fy} value={fy}>{fy}</option>)}
              </select>
              <Button onClick={() => form16Mutation.mutate()} loading={form16Mutation.isPending}>
                📄 Generate & Download
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-1">What this generates:</p>
            <ul className="text-blue-800 space-y-1 list-disc list-inside">
              <li>Annual salary summary for all employees</li>
              <li>Total earnings, deductions (PF, PT), and TDS for the financial year</li>
              <li>CSV format — ready to share with employees or CA</li>
              <li>Covers Apr {form16Year.split('-')[0]} to Mar {form16Year.split('-')[1]}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

