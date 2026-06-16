import { useState } from 'react';
import {
  getMonthlyReport, getBankTransferReport, getPFStatement, getESIStatement,
  formatINR,
} from '../../services/payrollApi';

const MONTH_NAMES = ['','January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const REPORTS = [
  { id: 'monthly',      label: 'Monthly Summary',     icon: '📊', desc: 'Full payroll summary with all components' },
  { id: 'bank',         label: 'Bank Transfer',        icon: '🏦', desc: 'Bank account and net salary for transfers' },
  { id: 'pf',           label: 'PF Statement',         icon: '🔵', desc: 'EPF contributions — employee & employer' },
  { id: 'esi',          label: 'ESI Statement',        icon: '🟢', desc: 'ESIC contributions — employee & employer' },
];

export default function PayrollReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [active, setActive] = useState('monthly');
  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast]   = useState(null);

  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadReport() {
    try {
      setLoading(true);
      setData(null);
      let res;
      if (active === 'monthly') res = await getMonthlyReport(month, year);
      if (active === 'bank')    res = await getBankTransferReport(month, year);
      if (active === 'pf')      res = await getPFStatement(month, year);
      if (active === 'esi')     res = await getESIStatement(month, year);
      setData(res.data);
    } catch (e) {
      showToast(e.response?.data?.message || 'No payroll data found for this period');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate compliance and payment reports</p>
      </div>

      {}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => { setActive(r.id); setData(null); }}
            className={`p-4 rounded-xl border text-left transition-all ${
              active === r.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'}`}>
            <div className="text-2xl mb-1">{r.icon}</div>
            <p className={`text-sm font-semibold ${active === r.id ? 'text-blue-700' : 'text-gray-800'}`}>{r.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>

      {}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Month:</label>
          <select value={month} onChange={e => setMonth(+e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {MONTH_NAMES.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Year:</label>
          <select value={year} onChange={e => setYear(+e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500">
            {[2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={loadReport} disabled={loading}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {loading ? 'Loading...' : 'Generate Report'}
        </button>
        {data && (
          <button onClick={() => window.print()}
            className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            🖨 Print
          </button>
        )}
      </div>

      {}
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {data && !loading && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div>
              <h2 className="font-semibold text-gray-900">
                {REPORTS.find(r => r.id === active)?.label} — {MONTH_NAMES[month]} {year}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Status: {data.run?.status} · {data.payslips?.length} records
              </p>
            </div>
            <div className="flex gap-6 text-right">
              {active === 'monthly' && (
                <>
                  <SumCell label="Gross" val={formatINR(data.run?.total_gross)} />
                  <SumCell label="Deductions" val={formatINR(data.run?.total_deductions)} color="text-red-500" />
                  <SumCell label="Net" val={formatINR(data.run?.total_net)} color="text-green-600" />
                </>
              )}
              {active === 'pf' && (
                <>
                  <SumCell label="Employee PF" val={formatINR(data.totalEmployee)} />
                  <SumCell label="Employer PF" val={formatINR(data.totalEmployer)} />
                  <SumCell label="Total" val={formatINR((data.totalEmployee||0)+(data.totalEmployer||0))} color="text-blue-600" />
                </>
              )}
              {active === 'esi' && (
                <>
                  <SumCell label="Employee ESI" val={formatINR(data.totalEmployee)} />
                  <SumCell label="Employer ESI" val={formatINR(data.totalEmployer)} />
                  <SumCell label="Total" val={formatINR((data.totalEmployee||0)+(data.totalEmployer||0))} color="text-green-600" />
                </>
              )}
              {active === 'bank' && (
                <SumCell label="Total Transfer" val={formatINR(data.run?.total_net)} color="text-blue-600" />
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {active === 'monthly' && <MonthlyTable payslips={data.payslips} />}
            {active === 'bank'    && <BankTable    payslips={data.payslips} />}
            {active === 'pf'      && <PFTable      payslips={data.payslips} />}
            {active === 'esi'     && <ESITable     payslips={data.payslips} />}
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-gray-200">
          <div className="text-4xl mb-2">📋</div>
          <p className="font-medium">Select a report type and period</p>
          <p className="text-sm">Then click Generate Report</p>
        </div>
      )}
    </div>
  );
}

function SumCell({ label, val, color }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`text-sm font-bold ${color || 'text-gray-800'}`}>{val}</p>
    </div>
  );
}

function MonthlyTable({ payslips }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-5 py-3 text-left">Employee</th>
          <th className="px-4 py-3 text-right">Basic</th>
          <th className="px-4 py-3 text-right">HRA</th>
          <th className="px-4 py-3 text-right">Other</th>
          <th className="px-4 py-3 text-right">Gross</th>
          <th className="px-4 py-3 text-right">PF</th>
          <th className="px-4 py-3 text-right">ESI</th>
          <th className="px-4 py-3 text-right">PT</th>
          <th className="px-4 py-3 text-right">TDS</th>
          <th className="px-4 py-3 text-right font-semibold text-gray-700">Net</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {payslips?.map(p => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-2.5 font-medium text-gray-900">
              {p.employee?.first_name} {p.employee?.last_name}
              <span className="text-xs text-gray-400 ml-1">({p.employee?.employee_code})</span>
            </td>
            <td className="px-4 py-2.5 text-right text-gray-600">{formatINR(p.basic)}</td>
            <td className="px-4 py-2.5 text-right text-gray-600">{formatINR(p.hra)}</td>
            <td className="px-4 py-2.5 text-right text-gray-600">{formatINR(p.special_allowance + (p.ta||0) + (p.da||0))}</td>
            <td className="px-4 py-2.5 text-right text-gray-700 font-medium">{formatINR(p.gross)}</td>
            <td className="px-4 py-2.5 text-right text-red-400 text-xs">{formatINR(p.pf_employee)}</td>
            <td className="px-4 py-2.5 text-right text-red-400 text-xs">{formatINR(p.esi_employee)}</td>
            <td className="px-4 py-2.5 text-right text-red-400 text-xs">{formatINR(p.pt)}</td>
            <td className="px-4 py-2.5 text-right text-red-400 text-xs">{formatINR(p.tds)}</td>
            <td className="px-4 py-2.5 text-right font-bold text-green-700">{formatINR(p.net_salary)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BankTable({ payslips }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-5 py-3 text-left">#</th>
          <th className="px-5 py-3 text-left">Employee</th>
          <th className="px-5 py-3 text-left">Bank</th>
          <th className="px-5 py-3 text-left">Account No.</th>
          <th className="px-5 py-3 text-left">IFSC</th>
          <th className="px-5 py-3 text-right">Net Salary</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {payslips?.map((p, i) => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-2.5 text-gray-400 text-xs">{i + 1}</td>
            <td className="px-5 py-2.5 font-medium text-gray-900">
              {p.employee?.first_name} {p.employee?.last_name}
              <span className="text-xs text-gray-400 ml-1">({p.employee?.employee_code})</span>
            </td>
            <td className="px-5 py-2.5 text-gray-600">{p.employee?.bank_accounts?.[0]?.bank_name || '—'}</td>
            <td className="px-5 py-2.5 text-gray-600 font-mono text-xs">{p.employee?.bank_accounts?.[0]?.account_number || '—'}</td>
            <td className="px-5 py-2.5 text-gray-600 font-mono text-xs">{p.employee?.bank_accounts?.[0]?.ifsc_code || '—'}</td>
            <td className="px-5 py-2.5 text-right font-bold text-green-700">{formatINR(p.net_salary)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PFTable({ payslips }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-5 py-3 text-left">Employee</th>
          <th className="px-5 py-3 text-left">UAN</th>
          <th className="px-5 py-3 text-right">PF Wages</th>
          <th className="px-5 py-3 text-right">Employee (12%)</th>
          <th className="px-5 py-3 text-right">Employer (12%)</th>
          <th className="px-5 py-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {payslips?.map(p => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-2.5 font-medium text-gray-900">
              {p.employee?.first_name} {p.employee?.last_name}
              <span className="text-xs text-gray-400 ml-1">({p.employee?.employee_code})</span>
            </td>
            <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">{p.employee?.uan_number || '—'}</td>
            <td className="px-5 py-2.5 text-right text-gray-600">{formatINR(p.basic)}</td>
            <td className="px-5 py-2.5 text-right text-blue-600 font-medium">{formatINR(p.pf_employee)}</td>
            <td className="px-5 py-2.5 text-right text-blue-600 font-medium">{formatINR(p.pf_employer)}</td>
            <td className="px-5 py-2.5 text-right font-bold text-gray-800">{formatINR((p.pf_employee||0)+(p.pf_employer||0))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ESITable({ payslips }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
        <tr>
          <th className="px-5 py-3 text-left">Employee</th>
          <th className="px-5 py-3 text-left">IP Number</th>
          <th className="px-5 py-3 text-right">ESI Wages</th>
          <th className="px-5 py-3 text-right">Employee (0.75%)</th>
          <th className="px-5 py-3 text-right">Employer (3.25%)</th>
          <th className="px-5 py-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {payslips?.map(p => (
          <tr key={p.id} className="hover:bg-gray-50">
            <td className="px-5 py-2.5 font-medium text-gray-900">
              {p.employee?.first_name} {p.employee?.last_name}
              <span className="text-xs text-gray-400 ml-1">({p.employee?.employee_code})</span>
            </td>
            <td className="px-5 py-2.5 text-gray-500 font-mono text-xs">{p.employee?.esi_ip_number || '—'}</td>
            <td className="px-5 py-2.5 text-right text-gray-600">{formatINR(p.gross)}</td>
            <td className="px-5 py-2.5 text-right text-green-600 font-medium">{formatINR(p.esi_employee)}</td>
            <td className="px-5 py-2.5 text-right text-green-600 font-medium">{formatINR(p.esi_employer)}</td>
            <td className="px-5 py-2.5 text-right font-bold text-gray-800">{formatINR((p.esi_employee||0)+(p.esi_employer||0))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}