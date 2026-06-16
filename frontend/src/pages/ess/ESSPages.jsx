import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { leaveApi } from '../../services/attendanceLeaveApi';
import api from '../../services/api';
import '../../components/hr/HRLayout.css';
import './ESSLayout.css';

const fmtINR = (paise) => {
  if (!paise && paise !== 0) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fmtShort = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  : '—';

const STATUS_STYLE = {
  present:  { bg: '#dcfce7', color: '#15803d' },
  absent:   { bg: '#fee2e2', color: '#b91c1c' },
  half_day: { bg: '#fef9c3', color: '#a16207' },
  wfh:      { bg: '#dbeafe', color: '#1d4ed8' },
  on_leave: { bg: '#ede9fe', color: '#6d28d9' },
  week_off: { bg: '#f1f5f9', color: '#94a3b8' },
};

export function ESSDashboard() {
  const { user } = useAuthStore();
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const { data: balRes } = useQuery({
    queryKey: ['ess-balances'],
    queryFn:  () => leaveApi.getBalances(),
    staleTime: 300_000,
  });
  const balances = balRes?.data || [];

  const { data: myLeavesRes } = useQuery({
    queryKey: ['ess-my-leaves'],
    queryFn:  () => leaveApi.myApplications({ limit: 5 }),
    staleTime: 60_000,
  });
  const myLeaves = myLeavesRes?.data || [];

  const mondayDate = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const sundayDate = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const { data: attRes } = useQuery({
    queryKey: ['ess-att-week'],
    queryFn:  () => api.get('/attendance', { params: { employeeId: user?.employeeId, from: mondayDate, to: sundayDate, limit: 7 } }).then(r => r.data),
    staleTime: 60_000,
    enabled: !!user?.employeeId,
  });
  const weekAtt = attRes?.data || [];

  const { data: payRes } = useQuery({
    queryKey: ['ess-latest-payslip'],
    queryFn:  () => api.get('/payroll/my-payslip').then(r => r.data).catch(() => null),
    staleTime: 300_000,
  });
  const latestPayslip = payRes?.data;

  const totalLeaveAvailable = balances.reduce((s, b) => s + (b.remainingDays ?? b.remaining_days ?? 0), 0);
  const pendingLeaves = myLeaves.filter(l => l.status === 'pending').length;

  return (
    <div>
      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: `Attendance (${new Date().toLocaleString('en-IN',{month:'short'})})`, value: weekAtt.filter(r=>r.status==='present'||r.status==='wfh').length || '—', hint: 'days this week present' },
          { label: 'Leaves available',   value: totalLeaveAvailable || '—', hint: `across ${balances.length} leave types` },
          { label: 'Pending requests',   value: pendingLeaves || 0, hint: 'awaiting approval' },
          { label: 'Last net pay',       value: latestPayslip ? fmtINR(latestPayslip.net_salary) : '—', hint: latestPayslip ? `${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][(latestPayslip.month||1)-1]} ${latestPayslip.year}` : 'not available yet' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#0f172a' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{s.hint}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>Leave balance</div>
          {balances.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 16 }}>No leave balances yet</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {balances.slice(0, 4).map((b, i) => {
              const total    = b.totalDays ?? b.total_days ?? 0;
              const used     = b.usedDays  ?? b.used_days  ?? 0;
              const rem      = b.remainingDays ?? b.remaining_days ?? (total - used);
              const pct      = total > 0 ? Math.round(((total - used) / total) * 100) : 0;
              const typeName = b.leaveType?.name || b.leave_type?.name || b.leaveTypeName || 'Leave';
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
                    <span style={{ color: '#334155' }}>{typeName}</span>
                    <span style={{ color: '#64748b' }}>{rem} / {total} remaining</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: pct > 50 ? '#7c3aed' : pct > 20 ? '#f59e0b' : '#ef4444', borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {balances.length > 4 && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 10 }}>+{balances.length - 4} more types</div>}
        </div>

        {}
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 14 }}>This week</div>
          {weekAtt.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 16 }}>No attendance data this week</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {weekAtt.map((a, i) => {
              const s = STATUS_STYLE[a.status] || { bg: '#f1f5f9', color: '#94a3b8' };
              const ci = a.check_in  ? new Date(a.check_in ).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
              const co = a.check_out ? new Date(a.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < weekAtt.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
                  <span style={{ fontSize: 11, color: '#334155' }}>
                    {new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                  </span>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {ci && <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b' }}>{ci}{co ? ` – ${co}` : ''}</span>}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 500, background: s.bg, color: s.color, textTransform: 'capitalize' }}>
                      {(a.status || '—').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Link to="/ess/leave-apply" style={{ fontSize: 11, padding: '8px 16px', background: '#7c3aed', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>+ Apply leave</Link>
        <Link to="/ess/payslips"    style={{ fontSize: 11, padding: '8px 16px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, textDecoration: 'none', color: '#334155' }}>Download payslip</Link>
        {user?.employeeId && (
          <Link to={`/employees/${user.employeeId}`} style={{ fontSize: 11, padding: '8px 16px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, textDecoration: 'none', color: '#334155' }}>View my profile</Link>
        )}
      </div>
    </div>
  );
}

export function ESSLeaveApply() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    leaveTypeId: '', dayType: 'full', fromDate: '', toDate: '', reason: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const { data: typesRes } = useQuery({
    queryKey: ['leave-types'],
    queryFn:  leaveApi.getLeaveTypes,
    staleTime: 300_000,
  });
  const types = typesRes?.data || [];

  const { data: balRes } = useQuery({
    queryKey: ['ess-balances'],
    queryFn:  leaveApi.getBalances,
    staleTime: 60_000,
  });
  const balances = balRes?.data || [];

  const { data: myRes } = useQuery({
    queryKey: ['ess-my-leaves'],
    queryFn:  () => leaveApi.myApplications({ limit: 10 }),
    staleTime: 30_000,
  });
  const myApps = myRes?.data || [];

  const applyM = useMutation({
    mutationFn: (d) => leaveApi.apply(d),
    onSuccess: () => {
      toast.success('Leave request submitted!');
      setSubmitted(true);
      setForm({ leaveTypeId: '', dayType: 'full', fromDate: '', toDate: '', reason: '' });
      qc.invalidateQueries({ queryKey: ['ess-my-leaves'] });
      qc.invalidateQueries({ queryKey: ['ess-balances'] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to submit'),
  });

  const cancelM = useMutation({
    mutationFn: (id) => leaveApi.cancel(id),
    onSuccess:  () => { toast.success('Leave cancelled'); qc.invalidateQueries({ queryKey: ['ess-my-leaves'] }); qc.invalidateQueries({ queryKey: ['ess-balances'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const daysCount = form.fromDate && form.toDate
    ? Math.max(0, Math.ceil((new Date(form.toDate) - new Date(form.fromDate)) / 86400000) + 1)
    : null;

  const selectedBalance = balances.find(b => (b.leaveType?.id || b.leave_type?.id) === form.leaveTypeId);
  const remaining = selectedBalance ? (selectedBalance.remainingDays ?? selectedBalance.remaining_days ?? 0) : null;

  const STATUS_BADGE = {
    pending:   { bg: '#fef9c3', color: '#a16207' },
    approved:  { bg: '#dcfce7', color: '#15803d' },
    rejected:  { bg: '#fee2e2', color: '#b91c1c' },
    cancelled: { bg: '#f1f5f9', color: '#94a3b8' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 14 }}>
      {}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 16 }}>Submit leave request</div>

        {submitted && (
          <div style={{ background: '#f0fdf4', border: '0.5px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#15803d' }}>
            ✓ Your request was submitted successfully. Your manager will review it shortly.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Leave type *</label>
            <select
              style={{ width: '100%', padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, background: '#fff', color: '#0f172a', outline: 'none' }}
              value={form.leaveTypeId}
              onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))}
            >
              <option value="">— select type —</option>
              {types.map(t => {
                const bal = balances.find(b => (b.leaveType?.id || b.leave_type?.id) === t.id);
                const rem = bal ? (bal.remainingDays ?? bal.remaining_days ?? 0) : null;
                return <option key={t.id} value={t.id}>{t.name}{rem !== null ? ` (${rem} remaining)` : ''}</option>;
              })}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Day type</label>
            <select
              style={{ width: '100%', padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, background: '#fff', color: '#0f172a', outline: 'none' }}
              value={form.dayType}
              onChange={e => setForm(f => ({ ...f, dayType: e.target.value }))}
            >
              <option value="full">Full day</option>
              <option value="first_half">First half</option>
              <option value="second_half">Second half</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>From date *</label>
            <input
              type="date"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, outline: 'none' }}
              value={form.fromDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, fromDate: e.target.value, toDate: f.toDate || e.target.value }))}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>To date *</label>
            <input
              type="date"
              style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, outline: 'none' }}
              value={form.toDate}
              min={form.fromDate || new Date().toISOString().slice(0, 10)}
              onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 4 }}>Reason *</label>
          <textarea
            style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, fontSize: 12, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
            rows={3}
            placeholder="Briefly describe the reason for leave…"
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
          />
        </div>

        {}
        {daysCount !== null && (
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: 6, fontSize: 11 }}>
            <span style={{ color: '#64748b' }}>Duration: </span>
            <span style={{ fontWeight: 600 }}>{daysCount} day{daysCount !== 1 ? 's' : ''}</span>
            {remaining !== null && (
              <span style={{ marginLeft: 12, color: daysCount > remaining ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                {daysCount > remaining ? `⚠ Exceeds balance (${remaining} available)` : `✓ Sufficient balance (${remaining} available)`}
              </span>
            )}
          </div>
        )}

        <button
          style={{ fontSize: 11, padding: '9px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' }}
          onClick={() => {
            if (!form.leaveTypeId || !form.fromDate || !form.toDate || !form.reason) {
              toast.error('Please fill all required fields'); return;
            }
            setSubmitted(false);
            applyM.mutate({ leaveTypeId: form.leaveTypeId, fromDate: form.fromDate, toDate: form.toDate, reason: form.reason, dayType: form.dayType });
          }}
          disabled={applyM.isPending}
        >
          {applyM.isPending ? 'Submitting…' : 'Submit request'}
        </button>
      </div>

      {}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 16, alignSelf: 'start' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 12 }}>My leave history</div>
        {myApps.length === 0 && <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: 16 }}>No leave applications yet</div>}
        {myApps.map((a, i) => {
          const s = STATUS_BADGE[a.status] || STATUS_BADGE.pending;
          return (
            <div key={a.id} style={{ padding: '9px 0', borderBottom: i < myApps.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{a.leave_type?.name || '—'}</div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>
                    {fmtShort(a.from_date)} – {fmtShort(a.to_date)} · {a.days} day{a.days !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 600, background: s.bg, color: s.color, textTransform: 'capitalize' }}>{a.status}</span>
                  {a.status === 'pending' && (
                    <button
                      style={{ fontSize: 9, padding: '2px 6px', background: 'none', border: '0.5px solid #fecaca', borderRadius: 4, color: '#dc2626', cursor: 'pointer' }}
                      onClick={() => { if (window.confirm('Cancel this leave request?')) cancelM.mutate(a.id); }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
              {a.rejection_reason && (
                <div style={{ fontSize: 10, color: '#dc2626', marginTop: 3 }}>Reason: {a.rejection_reason}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ESSPayslips() {
  const { user } = useAuthStore();
  const [drawerPayslip, setDrawerPayslip] = useState(null);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const { data: slipsRes, isLoading } = useQuery({
    queryKey: ['ess-payslips'],
    queryFn:  () => api.get('/payroll/my-payslips').then(r => r.data),
    staleTime: 300_000,
  });
  const payslips = slipsRes?.data || [];

  const { data: salRes } = useQuery({
    queryKey: ['ess-salary', empId],
    queryFn:  () => api.get(`/employees/${empId}`).then(r => r.data).catch(() => null),
    enabled:  !!empId,
    staleTime: 300_000,
  });
  const ctc = salRes?.data?.employee_salary?.ctc;

  const ytdTDS = payslips.reduce((s, p) => s + (p?.tds || 0), 0);
  const latestNet = payslips[0]?.net_salary;

  function downloadCSV(p) {
    const rows = [
      ['Component', 'Amount (₹)'],
      ['Basic', (p.basic/100).toFixed(2)],
      ['HRA', (p.hra/100).toFixed(2)],
      ['Gross', (p.gross/100).toFixed(2)],
      ['PF (employee)', (p.pf_employee/100).toFixed(2)],
      ['ESI (employee)', (p.esi_employee/100).toFixed(2)],
      ['TDS', (p.tds/100).toFixed(2)],
      ['Net salary', (p.net_salary/100).toFixed(2)],
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `payslip_${MONTHS[p.month-1]}_${p.year}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  return (
    <div>
      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Annual CTC</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{ctc ? fmtINR(ctc) : '—'}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>per annum</div>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>Last net pay</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#16a34a' }}>{latestNet ? fmtINR(latestNet) : '—'}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{payslips[0] ? `${MONTHS[(payslips[0].month||1)-1]} ${payslips[0].year}` : ''}</div>
        </div>
        <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>YTD TDS paid</div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{ytdTDS > 0 ? fmtINR(ytdTDS) : '—'}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>FY {new Date().getFullYear()-1}–{String(new Date().getFullYear()).slice(2)}</div>
        </div>
      </div>

      {}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Payslips</div>
        </div>

        {isLoading && <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>}

        {!isLoading && payslips.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            No payslips available yet. Payslips appear here once HR publishes each month's payroll.
          </div>
        )}

        {payslips.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Month', 'Gross salary', 'Deductions', 'Net pay', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontWeight: 500, color: '#64748b', fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payslips.map((p, i) => (
                <tr key={i} style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                  <td style={{ padding: '9px 14px', fontWeight: 500 }}>{MONTHS[(p.month||1)-1]} {p.year}</td>
                  <td style={{ padding: '9px 14px' }}>{fmtINR(p.gross)}</td>
                  <td style={{ padding: '9px 14px', color: '#dc2626' }}>−{fmtINR(p.total_deductions)}</td>
                  <td style={{ padding: '9px 14px', fontWeight: 600, color: '#16a34a' }}>{fmtINR(p.net_salary)}</td>
                  <td style={{ padding: '9px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{ fontSize: 10, padding: '3px 10px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                        onClick={() => setDrawerPayslip(p)}
                      >
                        View
                      </button>
                      <button
                        style={{ fontSize: 10, padding: '3px 10px', background: 'transparent', border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 6, cursor: 'pointer', color: '#334155' }}
                        onClick={() => downloadCSV(p)}
                      >
                        CSV ↓
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payslip detail drawer */}
      {drawerPayslip && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end', zIndex: 50 }}>
          <div style={{ width: 380, background: '#fff', height: '100%', overflowY: 'auto' }}>
            <div style={{ padding: '14px 18px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Payslip — {MONTHS[(drawerPayslip.month||1)-1]} {drawerPayslip.year}</div>
              <button style={{ border: 'none', background: 'none', fontSize: 20, cursor: 'pointer', color: '#64748b' }} onClick={() => setDrawerPayslip(null)}>×</button>
            </div>
            <div style={{ padding: 18 }}>
              {[
                { label: 'Basic',           val: drawerPayslip.basic,            earning: true },
                { label: 'HRA',             val: drawerPayslip.hra,              earning: true },
                { label: 'Other earnings',  val: drawerPayslip.other_earnings,   earning: true },
                { label: 'Gross',           val: drawerPayslip.gross,            bold: true },
                { label: 'PF (employee)',   val: drawerPayslip.pf_employee,      deduct: true },
                { label: 'ESI (employee)',  val: drawerPayslip.esi_employee,     deduct: true },
                { label: 'PT',             val: drawerPayslip.pt,               deduct: true },
                { label: 'TDS',            val: drawerPayslip.tds,              deduct: true },
                { label: 'Total deductions',val: drawerPayslip.total_deductions, deduct: true, bold: true },
              ].map((r, i) => r.val > 0 ? (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)', fontSize: r.bold ? 13 : 12, fontWeight: r.bold ? 700 : 400 }}>
                  <span style={{ color: '#64748b' }}>{r.label}</span>
                  <span style={{ color: r.deduct ? '#dc2626' : '#0f172a' }}>{r.deduct ? '−' : ''}{fmtINR(r.val)}</span>
                </div>
              ) : null)}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 800, marginTop: 4, borderTop: '2px solid #0f172a' }}>
                <span>Net salary</span>
                <span style={{ color: '#16a34a' }}>{fmtINR(drawerPayslip.net_salary)}</span>
              </div>
              <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                <button
                  style={{ flex: 1, padding: '8px', background: '#f1f5f9', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => downloadCSV(drawerPayslip)}
                >
                  Download CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

