import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getPayrollDashboard,
  listPayrollRuns, createPayrollRun,
  getPayrollRun, processPayrollRun,
  lockPayrollRun, publishPayrollRun, deletePayrollRun,
  listPayslips,
  getMonthlyReport, getBankTransferReport,
  formatINR, monthName,
} from '../../services/payrollApi';
import '../../components/hr/HRLayout.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const now    = new Date();

const RUN_STATUS = {
  draft:     { label: 'Draft',     bg: '#f1f5f9', color: '#475569' },
  processed: { label: 'Processed', bg: '#fef9c3', color: '#a16207' },
  locked:    { label: 'Locked',    bg: '#dbeafe', color: '#1d4ed8' },
  published: { label: 'Published', bg: '#dcfce7', color: '#15803d' },
};

function RunBadge({ status }) {
  const s = RUN_STATUS[status] || RUN_STATUS.draft;
  return <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4 }}>{s.label}</span>;
}

function Rupee({ paise, bold, color }) {
  const r = formatINR(paise);
  return <span style={{ fontWeight: bold ? 600 : 400, color }}>{r}</span>;
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ fontSize: 18, color }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function PayslipDrawer({ payslip, onClose }) {
  if (!payslip) return null;
  const e    = payslip.employee || {};
  const name = `${e.first_name || ''} ${e.last_name || ''}`.trim();
  const bank = e.bank_accounts?.[0];

  const Row = ({ label, val, red }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 500, color: red ? '#dc2626' : undefined }}>{formatINR(val)}</span>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}>
      <div style={{ width: 420, background: '#fff', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid rgba(0,0,0,0.09)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Payslip — {monthName(payslip.month)} {payslip.year}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{name} · {e.employee_code}</div>
          </div>
          <button style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: 20, flex: 1 }}>
          {}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
            {[
              ['Department', e.department?.name],
              ['Designation', e.designation?.name],
              ['Working days', payslip.working_days],
              ['Present days', payslip.present_days],
              ['LOP days', payslip.lop_days || 0],
              ['Paid days', payslip.paid_days],
            ].map(([l, v]) => (
              <div key={l}>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{v ?? '—'}</div>
              </div>
            ))}
          </div>

          {}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Earnings</div>
          <Row label="Basic"              val={payslip.basic} />
          <Row label="HRA"                val={payslip.hra} />
          {payslip.da              > 0 && <Row label="Dearness allowance"  val={payslip.da} />}
          {payslip.ta              > 0 && <Row label="Travel allowance"    val={payslip.ta} />}
          {payslip.special_allowance > 0 && <Row label="Special allowance" val={payslip.special_allowance} />}
          {payslip.other_earnings  > 0 && <Row label="Other earnings"      val={payslip.other_earnings} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontWeight: 700, fontSize: 13, marginTop: 4 }}>
            <span>Gross salary</span>
            <Rupee paise={payslip.gross} bold />
          </div>

          <div style={{ margin: '12px 0', borderTop: '0.5px solid rgba(0,0,0,0.09)' }} />

          {}
          <div style={{ fontSize: 11, fontWeight: 600, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Deductions</div>
          <Row label="PF (employee 12%)"  val={payslip.pf_employee}    red />
          <Row label="ESI (employee 0.75%)" val={payslip.esi_employee} red />
          {payslip.pt          > 0 && <Row label="Professional tax"  val={payslip.pt}          red />}
          {payslip.tds         > 0 && <Row label="TDS"               val={payslip.tds}         red />}
          {payslip.lwf_employee > 0 && <Row label="LWF (employee)"   val={payslip.lwf_employee} red />}
          {payslip.other_deductions > 0 && <Row label="Other deductions" val={payslip.other_deductions} red />}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontWeight: 700, fontSize: 13, color: '#dc2626', marginTop: 4 }}>
            <span>Total deductions</span>
            <Rupee paise={payslip.total_deductions} bold color="#dc2626" />
          </div>

          <div style={{ margin: '12px 0', borderTop: '2px solid #0f172a' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
            <span>Net salary</span>
            <Rupee paise={payslip.net_salary} bold color="#16a34a" />
          </div>

          {}
          {bank && (
            <div style={{ marginTop: 16, padding: '10px 12px', background: '#f0fdf4', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 600, marginBottom: 6 }}>Transfer to</div>
              <div style={{ fontSize: 12 }}>{bank.bank_name}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                A/C: ••••{(bank.account_number || '').slice(-4)} · IFSC: {bank.ifsc_code}
              </div>
            </div>
          )}

          {}
          <div style={{ marginTop: 16, padding: '10px 12px', background: '#eff6ff', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: '#1d4ed8', fontWeight: 600, marginBottom: 6 }}>Employer contributions (not deducted)</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: '#64748b' }}>PF (employer 12%)</span>
              <span>{formatINR(payslip.pf_employer)}</span>
            </div>
            {payslip.esi_employer > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 3 }}>
                <span style={{ color: '#64748b' }}>ESI (employer 3.25%)</span>
                <span>{formatINR(payslip.esi_employer)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HRPayroll() {
  const qc  = useQueryClient();
  const [tab, setTab]           = useState('run');
  const [selectedRun, setSelectedRun] = useState(null); 
  const [drawerPayslip, setDrawerPayslip] = useState(null);

  const [createMonth, setCreateMonth] = useState(now.getMonth() + 1);
  const [createYear,  setCreateYear]  = useState(now.getFullYear());

  const [repMonth, setRepMonth] = useState(now.getMonth() + 1);
  const [repYear,  setRepYear]  = useState(now.getFullYear());
  const [repType,  setRepType]  = useState('monthly');

  const { data: dashRes } = useQuery({
    queryKey: ['payroll-dash'],
    queryFn:  getPayrollDashboard,
    staleTime: 60_000,
  });
  const dash = dashRes?.data || {};
  const cur  = dash.currentMonth || {};
  const last = dash.lastMonth    || {};

  const { data: runsRes, isLoading: runsLoading } = useQuery({
    queryKey: ['payroll-runs'],
    queryFn:  () => listPayrollRuns({ limit: 12 }),
    enabled:  tab === 'history' || tab === 'run',
    staleTime: 30_000,
  });
  const runs = runsRes?.data?.data || [];

  const { data: payslipsRes, isLoading: payslipsLoading } = useQuery({
    queryKey: ['payslips', selectedRun],
    queryFn:  () => listPayslips(selectedRun, { limit: 200 }),
    enabled:  !!selectedRun,
    staleTime: 30_000,
  });
  const payslips = payslipsRes?.data?.payslips || payslipsRes?.data || [];

  const { data: reportRes, isLoading: reportLoading } = useQuery({
    queryKey: ['payroll-report', repType, repMonth, repYear],
    queryFn:  () => repType === 'monthly'
      ? getMonthlyReport(repMonth, repYear)
      : getBankTransferReport(repMonth, repYear),
    enabled:  tab === 'reports',
    staleTime: 60_000,
  });
  const reportRows = reportRes?.data?.records || reportRes?.data || [];

  const createM = useMutation({
    mutationFn: () => createPayrollRun(createMonth, createYear),
    onSuccess:  (r) => {
      toast.success(`Payroll run created for ${monthName(createMonth)} ${createYear}`);
      qc.invalidateQueries({ queryKey: ['payroll-runs'] });
      qc.invalidateQueries({ queryKey: ['payroll-dash'] });
      setSelectedRun(r?.data?.id || null);
      setTab('run');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create run'),
  });

  const processM = useMutation({
    mutationFn: (id) => processPayrollRun(id),
    onSuccess:  () => { toast.success('Payroll processed'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }); qc.invalidateQueries({ queryKey: ['payroll-dash'] }); qc.invalidateQueries({ queryKey: ['payslips', selectedRun] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Process failed'),
  });

  const lockM = useMutation({
    mutationFn: (id) => lockPayrollRun(id),
    onSuccess:  () => { toast.success('Payroll locked'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }); qc.invalidateQueries({ queryKey: ['payroll-dash'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Lock failed'),
  });

  const publishM = useMutation({
    mutationFn: (id) => publishPayrollRun(id),
    onSuccess:  () => { toast.success('Payslips published to employees'); qc.invalidateQueries({ queryKey: ['payroll-runs'] }); qc.invalidateQueries({ queryKey: ['payroll-dash'] }); qc.invalidateQueries({ queryKey: ['payslips', selectedRun] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Publish failed'),
  });

  const deleteRunM = useMutation({
    mutationFn: (id) => deletePayrollRun(id),
    onSuccess:  () => { toast.success('Run deleted'); if (selectedRun) setSelectedRun(null); qc.invalidateQueries({ queryKey: ['payroll-runs'] }); qc.invalidateQueries({ queryKey: ['payroll-dash'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Delete failed'),
  });

  function exportCSV() {
    if (!payslips.length) { toast.error('No payslips to export'); return; }
    const header = 'Employee,Code,Department,Gross,PF (Emp),ESI (Emp),PT,TDS,Total Deductions,Net Salary';
    const rows   = payslips.map(p => {
      const name = `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`.trim();
      return [
        `"${name}"`,
        p.employee?.employee_code || '',
        `"${p.employee?.department?.name || ''}"`,
        (p.gross            / 100).toFixed(2),
        (p.pf_employee      / 100).toFixed(2),
        (p.esi_employee     / 100).toFixed(2),
        (p.pt               / 100).toFixed(2),
        (p.tds              / 100).toFixed(2),
        (p.total_deductions / 100).toFixed(2),
        (p.net_salary       / 100).toFixed(2),
      ].join(',');
    });
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    const run  = runs.find(r => r.id === selectedRun);
    a.download = `payroll_${monthName(run?.month)}_${run?.year}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success('CSV downloaded');
  }

  const activeRun = selectedRun
    ? runs.find(r => r.id === selectedRun)
    : runs[0] || null;

  const TABS = [
    { key: 'run',     label: 'Current run'  },
    { key: 'history', label: 'Run history'  },
    { key: 'reports', label: 'Reports'      },
  ];

  return (
    <div>
      {}
      <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.08)', marginBottom: 16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
            padding: '7px 14px', border: 'none', background: 'none', cursor: 'pointer',
            color: tab === t.key ? '#1d4ed8' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {}
      {tab === 'run' && (
        <div>
          {}
          <div className="stats-grid-4" style={{ marginBottom: 14 }}>
            <StatCard
              label={`${monthName(cur.month)} ${cur.year} status`}
              value={cur.status ? RUN_STATUS[cur.status]?.label || cur.status : 'Not started'}
              color={cur.status === 'published' ? '#16a34a' : cur.status === 'locked' ? '#1d4ed8' : undefined}
            />
            <StatCard label="Active employees"     value={dash.totalEmployees}                             />
            <StatCard label="No salary set"        value={dash.pendingSalaries}  color={dash.pendingSalaries > 0 ? '#f59e0b' : undefined} sub="employees without salary record" />
            <StatCard label={`${monthName(last.month)} net paid`} value={last.totalNet > 0 ? formatINR(last.totalNet) : '—'} sub="last month total" />
          </div>

          {}
          {!cur.run && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 14, borderStyle: 'dashed', borderColor: '#bfdbfe' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Start new payroll run</div>
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>
                No payroll run exists for {monthName(createMonth)} {createYear}. Create one to begin processing.
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <label className="form-label">Month</label>
                  <select className="form-input" style={{ width: 130 }} value={createMonth} onChange={e => setCreateMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Year</label>
                  <select className="form-input" style={{ width: 90 }} value={createYear} onChange={e => setCreateYear(Number(e.target.value))}>
                    {[createYear - 1, createYear, createYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={() => createM.mutate()} disabled={createM.isPending}>
                  {createM.isPending ? 'Creating…' : `Create run for ${monthName(createMonth)} ${createYear}`}
                </button>
              </div>
            </div>
          )}

          {}
          {activeRun && (
            <>
              <div className="card" style={{ padding: '14px 18px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {monthName(activeRun.month)} {activeRun.year} payroll
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Run ID: <span style={{ fontFamily: 'monospace' }}>{activeRun.id?.slice(0, 8)}…</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <RunBadge status={activeRun.status} />

                    {}
                    {activeRun.status === 'draft' && (
                      <button className="btn-primary" onClick={() => processM.mutate(activeRun.id)} disabled={processM.isPending}>
                        {processM.isPending ? 'Processing…' : '▶ Process payroll'}
                      </button>
                    )}
                    {activeRun.status === 'processed' && (
                      <>
                        <button className="btn-sm" onClick={() => processM.mutate(activeRun.id)} disabled={processM.isPending}>
                          ↺ Reprocess
                        </button>
                        <button className="btn-primary" onClick={() => lockM.mutate(activeRun.id)} disabled={lockM.isPending}>
                          {lockM.isPending ? 'Locking…' : '🔒 Lock run'}
                        </button>
                      </>
                    )}
                    {activeRun.status === 'locked' && (
                      <button className="btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={() => { if (window.confirm('Publish payslips to all employees?')) publishM.mutate(activeRun.id); }} disabled={publishM.isPending}>
                        {publishM.isPending ? 'Publishing…' : '📤 Publish payslips'}
                      </button>
                    )}
                    {activeRun.status === 'published' && (
                      <button className="btn-sm" onClick={exportCSV}>⬇ Export CSV</button>
                    )}
                    {['draft', 'processed'].includes(activeRun.status) && (
                      <button className="btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }}
                        onClick={() => { if (window.confirm('Delete this payroll run?')) deleteRunM.mutate(activeRun.id); }}
                        disabled={deleteRunM.isPending}>
                        {deleteRunM.isPending ? '…' : 'Delete'}
                      </button>
                    )}

                    {}
                    {runs.length > 1 && (
                      <select className="form-input" style={{ width: 160, fontSize: 11 }} value={selectedRun || ''} onChange={e => setSelectedRun(e.target.value || null)}>
                        <option value="">Latest run</option>
                        {runs.map(r => <option key={r.id} value={r.id}>{monthName(r.month)} {r.year} — {RUN_STATUS[r.status]?.label}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {}
                {activeRun.total_gross > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
                    {[
                      { label: 'Total gross',      val: activeRun.total_gross,      color: '#0f172a'  },
                      { label: 'Total deductions', val: activeRun.total_deductions, color: '#dc2626'  },
                      { label: 'Net payable',      val: activeRun.total_net,        color: '#16a34a'  },
                      { label: 'Total PF',         val: activeRun.total_pf,         color: '#1d4ed8'  },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#f8fafc', borderRadius: 7, padding: '10px 12px' }}>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: s.color }}>
                          {formatINR(s.val)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {}
              <div style={{ display: 'flex', gap: 0, marginBottom: 14, background: '#f8fafc', borderRadius: 8, padding: '8px 14px', alignItems: 'center' }}>
                {['draft', 'processed', 'locked', 'published'].map((s, i) => {
                  const done    = ['draft','processed','locked','published'].indexOf(activeRun.status) > i;
                  const current = activeRun.status === s;
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: done ? '#16a34a' : current ? '#3b82f6' : '#e2e8f0', color: (done || current) ? '#fff' : '#94a3b8', flexShrink: 0 }}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span style={{ fontSize: 11, fontWeight: current ? 600 : 400, color: current ? '#1d4ed8' : done ? '#16a34a' : '#94a3b8', textTransform: 'capitalize' }}>
                          {s === 'draft' ? 'Created' : s}
                        </span>
                      </div>
                      {i < 3 && <div style={{ width: 30, height: 1, background: done ? '#16a34a' : '#e2e8f0', margin: '0 6px' }} />}
                    </div>
                  );
                })}
              </div>

              {}
              {(activeRun.status !== 'draft') && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Payslips — {monthName(activeRun.month)} {activeRun.year}</div>
                      <div className="card-sub">{payslips.length} employee{payslips.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {payslips.length > 0 && <button className="btn-sm" onClick={exportCSV}>⬇ CSV</button>}
                    </div>
                  </div>
                  {payslipsLoading
                    ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading payslips…</div>
                    : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Employee</th>
                              <th>Dept</th>
                              <th style={{ textAlign: 'right' }}>Gross</th>
                              <th style={{ textAlign: 'right' }}>Deductions</th>
                              <th style={{ textAlign: 'right' }}>Net salary</th>
                              <th style={{ textAlign: 'center' }}>Published</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {payslips.map(p => {
                              const name = `${p.employee?.first_name || ''} ${p.employee?.last_name || ''}`.trim();
                              return (
                                <tr key={p.id}>
                                  <td>
                                    <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{p.employee?.employee_code}</div>
                                  </td>
                                  <td style={{ fontSize: 11, color: '#64748b' }}>{p.employee?.department?.name || '—'}</td>
                                  <td style={{ textAlign: 'right', fontSize: 12 }}>{formatINR(p.gross)}</td>
                                  <td style={{ textAlign: 'right', fontSize: 12, color: '#dc2626' }}>−{formatINR(p.total_deductions)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, color: '#16a34a' }}>{formatINR(p.net_salary)}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    {p.is_published
                                      ? <span style={{ color: '#16a34a', fontSize: 12 }}>✓</span>
                                      : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                                    }
                                  </td>
                                  <td>
                                    <button className="btn-sm" onClick={() => setDrawerPayslip(p)}>View</button>
                                  </td>
                                </tr>
                              );
                            })}
                            {payslips.length === 0 && (
                              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 11 }}>
                                Process the run to generate payslips
                              </td></tr>
                            )}
                          </tbody>
                          {payslips.length > 0 && (
                            <tfoot>
                              <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                                <td colSpan={2} style={{ padding: '9px 12px', color: '#0f172a' }}>Total — {payslips.length} employees</td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#0f172a' }}>{formatINR(payslips.reduce((s, p) => s + (p.gross || 0), 0))}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#dc2626' }}>−{formatINR(payslips.reduce((s, p) => s + (p.total_deductions || 0), 0))}</td>
                                <td style={{ padding: '9px 12px', textAlign: 'right', color: '#16a34a' }}>{formatINR(payslips.reduce((s, p) => s + (p.net_salary || 0), 0))}</td>
                                <td /><td />
                              </tr>
                            </tfoot>
                          )}
                        </table>
                      </div>
                    )
                  }
                </div>
              )}
            </>
          )}

          {!activeRun && !cur.run && !runsLoading && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No payroll runs yet. Create the first run above.</div>
            </div>
          )}
        </div>
      )}

      {}
      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Payroll run history</div>
          </div>
          {runsLoading
            ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Total gross</th>
                    <th style={{ textAlign: 'right' }}>Net payable</th>
                    <th style={{ textAlign: 'right' }}>Total PF</th>
                    <th style={{ textAlign: 'right' }}>Total TDS</th>
                    <th>Created</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{monthName(r.month)} {r.year}</td>
                      <td><RunBadge status={r.status} /></td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{r.total_gross ? formatINR(r.total_gross) : '—'}</td>
                      <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 500, color: '#16a34a' }}>{r.total_net ? formatINR(r.total_net) : '—'}</td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{r.total_pf ? formatINR(r.total_pf) : '—'}</td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{r.total_tds ? formatINR(r.total_tds) : '—'}</td>
                      <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '—'}
                      </td>
                      <td>
                        <button className="btn-sm" onClick={() => { setSelectedRun(r.id); setTab('run'); }}>Open →</button>
                      </td>
                    </tr>
                  ))}
                  {runs.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 11 }}>No payroll runs yet</td></tr>
                  )}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {}
      {tab === 'reports' && (
        <div>
          {}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 170 }} value={repType} onChange={e => setRepType(e.target.value)}>
              <option value="monthly">Monthly summary</option>
              <option value="bank">Bank transfer file</option>
            </select>
            <select className="form-input" style={{ width: 130 }} value={repMonth} onChange={e => setRepMonth(Number(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 90 }} value={repYear} onChange={e => setRepYear(Number(e.target.value))}>
              {[repYear - 1, repYear, repYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                {repType === 'monthly' ? 'Monthly payroll summary' : 'Bank transfer report'} — {monthName(repMonth)} {repYear}
              </div>
              <button className="btn-sm" onClick={() => {
                if (!reportRows.length) return;
                const rows = reportRows.map(r => {
                  const name = `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim();
                  if (repType === 'bank') {
                    const bank = r.employee?.bank_accounts?.[0];
                    return [`"${name}"`, r.employee?.employee_code || '', bank?.bank_name || '', bank?.ifsc_code || '', bank?.account_number || '', (r.net_salary / 100).toFixed(2)].join(',');
                  }
                  return [`"${name}"`, r.employee?.employee_code || '', (r.gross/100).toFixed(2), (r.total_deductions/100).toFixed(2), (r.net_salary/100).toFixed(2), (r.tds/100).toFixed(2), (r.pf_employee/100).toFixed(2)].join(',');
                });
                const hdr = repType === 'bank' ? 'Name,Code,Bank,IFSC,Account,Net Amount' : 'Name,Code,Gross,Deductions,Net,TDS,PF';
                const b = new Blob([hdr + '\n' + rows.join('\n')], { type: 'text/csv' });
                const u = URL.createObjectURL(b); const a = document.createElement('a');
                a.href = u; a.download = `${repType}_${monthName(repMonth)}_${repYear}.csv`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(u), 2000);
                toast.success('CSV downloaded');
              }}>
                ⬇ Export CSV
              </button>
            </div>
            {reportLoading
              ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      {repType === 'monthly' ? (
                        <tr><th>Employee</th><th>Dept</th><th style={{ textAlign:'right' }}>Gross</th><th style={{ textAlign:'right' }}>Deductions</th><th style={{ textAlign:'right' }}>Net salary</th><th style={{ textAlign:'right' }}>TDS</th><th style={{ textAlign:'right' }}>PF (emp)</th></tr>
                      ) : (
                        <tr><th>Employee</th><th>Bank</th><th>IFSC</th><th>Account</th><th style={{ textAlign:'right' }}>Net amount</th></tr>
                      )}
                    </thead>
                    <tbody>
                      {reportRows.map((r, i) => {
                        const name = `${r.employee?.first_name || r.employeeName || ''} ${r.employee?.last_name || ''}`.trim();
                        const bank = r.employee?.bank_accounts?.[0];
                        return repType === 'monthly' ? (
                          <tr key={i}>
                            <td><div style={{ fontWeight: 500, fontSize: 12 }}>{name || '—'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{r.employee?.employee_code}</div></td>
                            <td style={{ fontSize: 11, color: '#64748b' }}>{r.employee?.department?.name || r.department || '—'}</td>
                            <td style={{ textAlign: 'right', fontSize: 12 }}>{formatINR(r.gross)}</td>
                            <td style={{ textAlign: 'right', fontSize: 12, color: '#dc2626' }}>{formatINR(r.total_deductions)}</td>
                            <td style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{formatINR(r.net_salary)}</td>
                            <td style={{ textAlign: 'right', fontSize: 12 }}>{formatINR(r.tds)}</td>
                            <td style={{ textAlign: 'right', fontSize: 12 }}>{formatINR(r.pf_employee)}</td>
                          </tr>
                        ) : (
                          <tr key={i}>
                            <td><div style={{ fontWeight: 500, fontSize: 12 }}>{name || '—'}</div><div style={{ fontSize: 10, color: '#94a3b8' }}>{r.employee?.employee_code}</div></td>
                            <td style={{ fontSize: 11 }}>{bank?.bank_name || r.bankName || '—'}</td>
                            <td style={{ fontSize: 11, fontFamily: 'monospace' }}>{bank?.ifsc_code || r.ifscCode || '—'}</td>
                            <td style={{ fontSize: 11, fontFamily: 'monospace' }}>••••{(bank?.account_number || r.accountNumber || '').slice(-4)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12, color: '#16a34a' }}>{formatINR(r.net_salary)}</td>
                          </tr>
                        );
                      })}
                      {reportRows.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 11 }}>
                          No payroll data for {monthName(repMonth)} {repYear}. Process a run first.
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )
            }
          </div>
        </div>
      )}

      {}
      {drawerPayslip && (
        <PayslipDrawer payslip={drawerPayslip} onClose={() => setDrawerPayslip(null)} />
      )}
    </div>
  );
}

