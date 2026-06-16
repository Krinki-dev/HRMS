import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { leaveApi } from '../../services/attendanceLeaveApi';
import '../../components/hr/HRLayout.css';

const fmt = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const fmtShort = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  : '—';

const STATUS_BADGE = {
  pending:   'badge-pending',
  approved:  'badge-active',
  rejected:  'badge-suspended',
  cancelled: 'badge-gray',
};

const ACCRUAL_OPTS = [
  { v: 'monthly',   l: 'Monthly' },
  { v: 'quarterly', l: 'Quarterly' },
  { v: 'yearly',    l: 'Yearly' },
  { v: 'none',      l: 'No accrual' },
];

function Av({ name, size = 28 }) {
  const ini = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: '#dbeafe', color: '#1d4ed8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 600,
    }}>{ini}</div>
  );
}

function RejectModal({ app, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  const name = app ? `${app.employee?.first_name || ''} ${app.employee?.last_name || ''}`.trim() : '';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div className="card" style={{ width: 380, padding: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Reject leave request</div>
        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
          {name} · {app?.leave_type?.name} · {fmtShort(app?.from_date)} – {fmtShort(app?.to_date)} ({app?.days} day{app?.days !== 1 ? 's' : ''})
        </div>
        <div className="form-group">
          <label className="form-label">Reason for rejection *</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Please provide a reason…"
            value={reason}
            onChange={e => setReason(e.target.value)}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-sm" onClick={onCancel}>Cancel</button>
          <button
            className="btn-sm"
            style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
          >
            {loading ? 'Rejecting…' : 'Confirm reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HRLeaves() {
  const qc  = useQueryClient();
  const [tab, setTab] = useState('approvals');

  const { data: pendingRes, isLoading: pendingLoading } = useQuery({
    queryKey: ['leave-pending'],
    queryFn:  leaveApi.getPendingApprovals,
    enabled:  tab === 'approvals',
    staleTime: 30_000,
  });
  const pending = pendingRes?.data || [];

  const [rejectModal, setRejectModal] = useState(null); 

  const approveM = useMutation({
    mutationFn: (id) => leaveApi.approve(id),
    onSuccess:  () => { toast.success('Leave approved'); qc.invalidateQueries({ queryKey: ['leave-pending'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to approve'),
  });

  const rejectM = useMutation({
    mutationFn: ({ id, reason }) => leaveApi.reject(id, reason),
    onSuccess:  () => { toast.success('Leave rejected'); setRejectModal(null); qc.invalidateQueries({ queryKey: ['leave-pending'] }); qc.invalidateQueries({ queryKey: ['dashboard-summary'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to reject'),
  });

  const [histStatus, setHistStatus] = useState('');
  const { data: allRes, isLoading: allLoading } = useQuery({
    queryKey: ['leave-all', histStatus],
    queryFn:  () => leaveApi.list({ status: histStatus || undefined, limit: 30 }),
    enabled:  tab === 'history',
    staleTime: 30_000,
  });
  const allApps = allRes?.data || [];

  const { data: typesRes } = useQuery({
    queryKey: ['leave-types'],
    queryFn:  leaveApi.getLeaveTypes,
    enabled:  tab === 'types',
  });
  const leaveTypes = typesRes?.data || [];

  const [typeForm, setTypeForm]       = useState({ name: '', code: '', accrualType: 'yearly', accrualDays: 0, isPaid: true, carryForward: false, encashable: false, maxBalance: '' });
  const [editingType, setEditingType] = useState(null);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [deletingType, setDeletingType] = useState(null);

  const typeM = useMutation({
    mutationFn: (d) => editingType ? leaveApi.updateLeaveType(editingType, d) : leaveApi.createLeaveType(d),
    onSuccess:  () => {
      toast.success(editingType ? 'Leave type updated' : 'Leave type created');
      setShowTypeForm(false); setEditingType(null);
      setTypeForm({ name: '', code: '', accrualType: 'yearly', accrualDays: 0, isPaid: true, carryForward: false, encashable: false, maxBalance: '' });
      qc.invalidateQueries({ queryKey: ['leave-types'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteType(id) {
    setDeletingType(id);
    try { await leaveApi.deleteLeaveType(id); toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['leave-types'] }); }
    catch (e) { toast.error(e.response?.data?.message || 'Cannot delete — may be in use'); }
    finally { setDeletingType(null); }
  }

  const [balYear, setBalYear] = useState(new Date().getFullYear());
  const { data: balRes, isLoading: balLoading } = useQuery({
    queryKey: ['leave-balances-all', balYear],
    queryFn:  () => leaveApi.getAllBalances({ year: balYear }),
    enabled:  tab === 'balances',
    staleTime: 60_000,
  });
  const balances = balRes?.data || [];

  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1);
  const [calYear,  setCalYear]  = useState(today.getFullYear());

  const { data: calRes } = useQuery({
    queryKey: ['leave-calendar', calMonth, calYear],
    queryFn:  () => leaveApi.calendar({ month: calMonth, year: calYear }),
    enabled:  tab === 'calendar',
    staleTime: 60_000,
  });
  const calEvents = calRes?.data?.events || calRes?.data || [];

  const TABS = [
    { key: 'approvals', label: 'Pending approvals', badge: pending.length },
    { key: 'history',   label: 'All requests' },
    { key: 'types',     label: 'Leave types' },
    { key: 'balances',  label: 'Team balances' },
    { key: 'calendar',  label: 'Calendar' },
  ];

  return (
    <div>

      {}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '0.5px solid rgba(0,0,0,0.08)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              fontSize: 12, fontWeight: tab === t.key ? 600 : 400,
              padding: '7px 14px', border: 'none', background: 'none', cursor: 'pointer',
              color: tab === t.key ? '#1d4ed8' : '#64748b',
              borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {t.label}
            {t.badge > 0 && (
              <span style={{ background: '#fee2e2', color: '#b91c1c', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {}
      {tab === 'approvals' && (
        <div>
          {pendingLoading && <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>}

          {!pendingLoading && pending.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>All caught up</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No pending leave requests</div>
            </div>
          )}

          {pending.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Pending leave requests</div>
                  <div className="card-sub">{pending.length} request{pending.length !== 1 ? 's' : ''} waiting for action</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Applied</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map(a => {
                    const name = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim();
                    const busy = approveM.isPending && approveM.variables === a.id;
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Av name={name} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.employee?.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: 12 }}>{a.leave_type?.name || '—'}</div>
                          {a.leave_type?.is_paid === false && <div style={{ fontSize: 9, color: '#f59e0b' }}>Unpaid</div>}
                        </td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(a.from_date)}</td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(a.to_date)}</td>
                        <td style={{ fontWeight: 600, textAlign: 'center' }}>{a.days}</td>
                        <td style={{ fontSize: 11, color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {a.reason || '—'}
                        </td>
                        <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtShort(a.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn-sm"
                              style={{ color: '#15803d', borderColor: '#86efac' }}
                              onClick={() => approveM.mutate(a.id)}
                              disabled={busy || rejectM.isPending}
                            >
                              {busy ? '…' : '✓ Approve'}
                            </button>
                            <button
                              className="btn-sm"
                              style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                              onClick={() => setRejectModal(a)}
                              disabled={busy || rejectM.isPending}
                            >
                              ✗ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {}
      {tab === 'history' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">All leave requests</div>
            <select className="form-input" style={{ width: 140, fontSize: 11 }} value={histStatus} onChange={e => setHistStatus(e.target.value)}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {allLoading
            ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            : (
              <table className="data-table">
                <thead>
                  <tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Status</th><th>Applied</th></tr>
                </thead>
                <tbody>
                  {allApps.map(a => {
                    const name = `${a.employee?.first_name || ''} ${a.employee?.last_name || ''}`.trim();
                    return (
                      <tr key={a.id}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{name || '—'}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{a.employee?.employee_code}</div>
                        </td>
                        <td style={{ fontSize: 11 }}>{a.leave_type?.name || '—'}</td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(a.from_date)}</td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtShort(a.to_date)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.days}</td>
                        <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{a.status}</span></td>
                        <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>{fmtShort(a.created_at)}</td>
                      </tr>
                    );
                  })}
                  {allApps.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No records found</td></tr>}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {}
      {tab === 'types' && (
        <div className="card card-p">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="card-title">Leave types</div>
              <div className="card-sub">{leaveTypes.length} type{leaveTypes.length !== 1 ? 's' : ''} configured</div>
            </div>
            <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowTypeForm(true); setEditingType(null); setTypeForm({ name: '', code: '', accrualType: 'yearly', accrualDays: 0, isPaid: true, carryForward: false, encashable: false, maxBalance: '' }); }}>
              + Add leave type
            </button>
          </div>

          {}
          {showTypeForm && (
            <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 12 }}>
                {editingType ? 'Edit leave type' : 'New leave type'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Name *</label>
                  <input className="form-input" style={{ fontSize: 11 }} placeholder="e.g. Casual Leave" value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Code</label>
                  <input className="form-input" style={{ fontSize: 11, textTransform: 'uppercase' }} placeholder="CL" value={typeForm.code} onChange={e => setTypeForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} maxLength={6} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Accrual type</label>
                  <select className="form-input" style={{ fontSize: 11 }} value={typeForm.accrualType} onChange={e => setTypeForm(f => ({ ...f, accrualType: e.target.value }))}>
                    {ACCRUAL_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Days per year</label>
                  <input className="form-input" style={{ fontSize: 11 }} type="number" min="0" step="0.5" value={typeForm.accrualDays} onChange={e => setTypeForm(f => ({ ...f, accrualDays: e.target.value }))} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Max balance (blank = unlimited)</label>
                  <input className="form-input" style={{ fontSize: 11 }} type="number" min="0" placeholder="No limit" value={typeForm.maxBalance} onChange={e => setTypeForm(f => ({ ...f, maxBalance: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
                {[
                  { key: 'isPaid',       label: 'Paid leave' },
                  { key: 'carryForward', label: 'Allow carry forward' },
                  { key: 'encashable',   label: 'Encashable' },
                ].map(f => (
                  <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!typeForm[f.key]} onChange={e => setTypeForm(fm => ({ ...fm, [f.key]: e.target.checked }))} />
                    {f.label}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-sm" style={{ background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8', padding: '5px 14px' }} onClick={() => typeM.mutate(typeForm)} disabled={typeM.isPending || !typeForm.name}>
                  {typeM.isPending ? 'Saving…' : 'Save'}
                </button>
                <button className="btn-sm" onClick={() => { setShowTypeForm(false); setEditingType(null); }}>Cancel</button>
              </div>
            </div>
          )}

          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Days/year</th><th>Accrual</th><th>Paid</th><th>Carry fwd</th><th>Encash</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            </thead>
            <tbody>
              {leaveTypes.map(lt => (
                <tr key={lt.id}>
                  <td style={{ fontWeight: 500 }}>{lt.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{lt.code || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{lt.accrual_days ?? '—'}</td>
                  <td style={{ fontSize: 11 }}>{lt.accrual_type || '—'}</td>
                  <td>{lt.is_paid ? <span className="badge badge-active" style={{ fontSize: 9 }}>Paid</span> : <span className="badge badge-gray" style={{ fontSize: 9 }}>Unpaid</span>}</td>
                  <td>{lt.carry_forward ? '✓' : '—'}</td>
                  <td>{lt.encashable   ? '✓' : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <button className="btn-sm" onClick={() => {
                        setEditingType(lt.id);
                        setTypeForm({ name: lt.name, code: lt.code || '', accrualType: lt.accrual_type || 'yearly', accrualDays: lt.accrual_days || 0, isPaid: lt.is_paid !== false, carryForward: lt.carry_forward || false, encashable: lt.encashable || false, maxBalance: lt.max_balance || '' });
                        setShowTypeForm(true);
                      }}>Edit</button>
                      <button className="btn-sm" style={{ color: '#b91c1c', borderColor: '#fecaca' }} onClick={() => { if (window.confirm(`Delete "${lt.name}"?`)) deleteType(lt.id); }} disabled={deletingType === lt.id}>{deletingType === lt.id ? '…' : '✕'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {leaveTypes.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>No leave types configured yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {}
      {tab === 'balances' && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Team leave balances</div>
              <div className="card-sub">Remaining days per employee</div>
            </div>
            <select className="form-input" style={{ width: 100, fontSize: 11 }} value={balYear} onChange={e => setBalYear(Number(e.target.value))}>
              {[balYear - 1, balYear, balYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {balLoading
            ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Leave type</th>
                      <th style={{ textAlign: 'center' }}>Total</th>
                      <th style={{ textAlign: 'center' }}>Used</th>
                      <th style={{ textAlign: 'center' }}>Remaining</th>
                      <th>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balances.map((b, i) => {
                      const name = `${b.employee?.first_name || ''} ${b.employee?.last_name || ''}`.trim();
                      const usedPct = b.totalDays > 0 ? Math.min(100, Math.round((b.usedDays / b.totalDays) * 100)) : 0;
                      return (
                        <tr key={i}>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: 12 }}>{name || b.employeeName || '—'}</div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>{b.employee?.employee_code}</div>
                          </td>
                          <td style={{ fontSize: 11 }}>{b.leaveType?.name || b.leave_type?.name || '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12 }}>{b.totalDays ?? b.total_days ?? '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: 12, color: '#dc2626' }}>{b.usedDays ?? b.used_days ?? 0}</td>
                          <td style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: (b.remainingDays ?? b.remaining_days ?? 0) <= 1 ? '#dc2626' : '#16a34a' }}>
                            {b.remainingDays ?? b.remaining_days ?? 0}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${usedPct}%`, height: '100%', background: usedPct > 80 ? '#ef4444' : '#2563eb', borderRadius: 3, transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize: 9, color: '#94a3b8', minWidth: 26 }}>{usedPct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {balances.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 11 }}>No balance data for {balYear}. Run manual accrual or wait for the next accrual cycle.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {}
      {tab === 'calendar' && (
        <div className="card card-p">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div className="card-title">
              {new Date(calYear, calMonth - 1).toLocaleString('en-IN', { month: 'long' })} {calYear}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn-sm" onClick={() => { let m = calMonth - 1; let y = calYear; if (m < 1) { m = 12; y--; } setCalMonth(m); setCalYear(y); }}>←</button>
              <button className="btn-sm" onClick={() => { let m = calMonth + 1; let y = calYear; if (m > 12) { m = 1; y++; } setCalMonth(m); setCalYear(y); }}>→</button>
            </div>
          </div>

          {calEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 12 }}>
              No approved leaves in this month
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {calEvents.map((ev, i) => {
                const name = `${ev.employee?.first_name || ev.employeeName || ''} ${ev.employee?.last_name || ''}`.trim();
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: '#eff6ff', borderRadius: 7, borderLeft: '3px solid #2563eb' }}>
                    <Av name={name} size={26} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{name}</div>
                      <div style={{ fontSize: 10, color: '#64748b' }}>{ev.leave_type?.name || ev.leaveType || 'Leave'}</div>
                    </div>
                    <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 500 }}>
                      {fmtShort(ev.from_date || ev.fromDate)} – {fmtShort(ev.to_date || ev.toDate)}
                    </div>
                    <span className="badge badge-info" style={{ fontSize: 9 }}>{ev.days} day{ev.days !== 1 ? 's' : ''}</span>
                    <span className={`badge ${STATUS_BADGE[ev.status] || 'badge-active'}`} style={{ fontSize: 9, textTransform: 'capitalize' }}>{ev.status || 'approved'}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {}
      {rejectModal && (
        <RejectModal
          app={rejectModal}
          onConfirm={(reason) => rejectM.mutate({ id: rejectModal.id, reason })}
          onCancel={() => setRejectModal(null)}
          loading={rejectM.isPending}
        />
      )}
    </div>
  );
}

