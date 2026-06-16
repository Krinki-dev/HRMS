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

function downloadCSV(rows, headers, filename) {
  const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ESIPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [challan, setChallan] = useState(null);

  const { data: esiData, isLoading } = useQuery({
    queryKey: ['esi-summary', month, year],
    queryFn:  () => complianceApi.esiSummary(month, year),
  });

  const challanMutation = useMutation({
    mutationFn: () => complianceApi.generateESIChallan(month, year),
    onSuccess:  (res) => { setChallan(res.data); toast.success('Challan generated!'); },
    onError:    (e)   => toast.error(e.response?.data?.message || 'Failed.'),
  });

  const esi = esiData?.data;

  const exportCSV = () => {
    if (!esi?.employees?.length) return;
    const headers = ['Code','Name','IP Number','Gross Wages (₹)','Employee ESI (₹)','Employer ESI (₹)','Total (₹)'];
    const rows = esi.employees.map(e => [
      e.employeeCode, e.name, e.ipNumber || 'NOT SET',
      Math.round(e.gross/100), Math.round(e.esiEmployee/100),
      Math.round(e.esiEmployer/100), Math.round(e.total/100),
    ]);
    downloadCSV(rows, headers, `ESI_${year}_${String(month).padStart(2,'0')}.csv`);
  };

  return (
    <div>
      <PageHeader
        title="ESI — Employee State Insurance"
        subtitle="Monthly ESI contributions (applicable for gross ≤ ₹21,000)"
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
            <Button variant="outline" onClick={exportCSV} disabled={!esi?.employees?.length}>⬇ Export</Button>
            <Button onClick={() => challanMutation.mutate()} loading={challanMutation.isPending}
              disabled={!esi?.hasPayroll || esi?.summary?.payrollStatus === 'draft'}>
              📄 Generate Challan
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !esi?.hasPayroll ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-3xl mb-3">🏥</p>
          <p className="font-semibold text-gray-800">No payroll for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
        </div>
      ) : (
        <>
          {}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'ESI-covered Employees', value: esi.summary.totalEmployees },
              { label: 'Total ESI Wages',        value: `₹${Math.round(esi.summary.totalESIWages/100).toLocaleString('en-IN')}` },
              { label: 'Employee ESI (0.75%)',   value: `₹${Math.round(esi.summary.totalESIEmployee/100).toLocaleString('en-IN')}` },
              { label: 'Employer ESI (3.25%)',   value: `₹${Math.round(esi.summary.totalESIEmployer/100).toLocaleString('en-IN')}` },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.label}</p>
              </div>
            ))}
          </div>

          {}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 flex justify-between items-center">
            <p className="font-semibold text-green-800">Total ESI Payable</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{Math.round(esi.summary.grandTotal/100).toLocaleString('en-IN')}
            </p>
          </div>

          {}
          {challan && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-5">
              <h3 className="font-bold text-blue-900 mb-3">📄 ESI Challan</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-blue-700 font-medium">Period</p><p className="font-bold">{challan.period}</p></div>
                <div><p className="text-blue-700 font-medium">Due Date</p><p className="font-bold">{challan.dueDate}</p></div>
                <div><p className="text-blue-700 font-medium">Employees</p><p className="font-bold">{challan.employeeCount}</p></div>
                <div><p className="text-blue-700 font-medium">Total Payable</p><p className="font-bold text-lg">₹{challan.totalESI?.toLocaleString('en-IN')}</p></div>
              </div>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">ESI Contribution Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Code','Name','IP Number','Gross Wages','Employee ESI','Employer ESI','Total'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {esi.employees.map(e => (
                    <tr key={e.employeeId} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{e.employeeCode}</td>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{e.name}</td>
                      <td className="px-4 py-2.5 text-xs font-mono text-gray-600">{e.ipNumber || <span className="text-red-500">Not set</span>}</td>
                      <td className="px-4 py-2.5 font-mono">₹{Math.round(e.gross/100).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 font-mono text-blue-700">₹{Math.round(e.esiEmployee/100).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 font-mono text-purple-700">₹{Math.round(e.esiEmployer/100).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 font-mono font-semibold">₹{Math.round(e.total/100).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-green-50 font-semibold border-t-2 border-green-100">
                  <tr>
                    <td colSpan="4" className="px-4 py-2 text-green-800">Total</td>
                    <td className="px-4 py-2 font-mono text-blue-800">₹{Math.round(esi.summary.totalESIEmployee/100).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 font-mono text-purple-800">₹{Math.round(esi.summary.totalESIEmployer/100).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2 font-mono text-green-800">₹{Math.round(esi.summary.grandTotal/100).toLocaleString('en-IN')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

