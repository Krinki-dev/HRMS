import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { attendanceApi } from '../../services/attendanceLeaveApi';
import '../../components/hr/HRLayout.css';

const todayISO = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 330); 
  return now.toISOString().slice(0, 10);
};

const fmtDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const MARK_OPTIONS = ['present', 'absent', 'half_day', 'wfh', 'on_leave', 'week_off', 'holiday'];

const STATUS_STYLE = {
  present:  { bg: '#dcfce7', color: '#15803d' },
  absent:   { bg: '#fee2e2', color: '#b91c1c' },
  half_day: { bg: '#fef9c3', color: '#a16207' },
  wfh:      { bg: '#dbeafe', color: '#1d4ed8' },
  on_leave: { bg: '#ede9fe', color: '#6d28d9' },
  week_off: { bg: '#f1f5f9', color: '#94a3b8' },
  holiday:  { bg: '#fce7f3', color: '#be185d' },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, textTransform: 'capitalize' }}>
      {(status || 'unknown').replace('_', ' ')}
    </span>
  );
}

function Av({ name, size = 28 }) {
  const ini = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 600 }}>
      {ini}
    </div>
  );
}

export default function HRAttendance() {
  const qc  = useQueryClient();
  const [tab, setTab] = useState('mark');

  const [markDate, setMarkDate] = useState(todayISO());
  const [records,  setRecords]  = useState({}); 
  const [saving,   setSaving]   = useState(false);

  const { data: unmarkedRes, isLoading: unmarkedLoading, refetch: refetchUnmarked } = useQuery({
    queryKey: ['att-unmarked', markDate],
    queryFn:  () => attendanceApi.getUnmarked(markDate),
    enabled:  tab === 'mark',
    staleTime: 30_000,
  });
  const unmarked = unmarkedRes?.data || [];

  const { data: markedRes, isLoading: markedLoading } = useQuery({
    queryKey: ['att-list', markDate],
    queryFn:  () => attendanceApi.list({ date: markDate, limit: 100 }),
    enabled:  tab === 'mark',
    staleTime: 30_000,
  });
  const marked = markedRes?.data || [];

  const setRec = useCallback((empId, field, value) => {
    setRecords(r => ({ ...r, [empId]: { ...r[empId], [field]: value } }));
  }, []);

  function bulkSetStatus(status) {
    setRecords(r => {
      const updated = { ...r };
      unmarked.forEach(e => {
        updated[e.id] = { ...(updated[e.id] || {}), status };
      });
      return updated;
    });
  }

  async function saveAttendance() {
    const toSave = unmarked
      .map(e => ({
        employeeId: e.id,
        status:     records[e.id]?.status || 'present',
        checkIn:    records[e.id]?.checkIn  || null,
        checkOut:   records[e.id]?.checkOut || null,
      }));

    if (!toSave.length) { toast.error('No employees to mark'); return; }
    setSaving(true);
    try {
      const r = await attendanceApi.bulkMark({ date: markDate, records: toSave });
      toast.success(r.message || `${r.data?.saved || toSave.length} records saved`);
      setRecords({});
      qc.invalidateQueries({ queryKey: ['att-unmarked', markDate] });
      qc.invalidateQueries({ queryKey: ['att-list', markDate] });
      qc.invalidateQueries({ queryKey: ['dashboard-summary'] });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const now = new Date();
  const [repMonth, setRepMonth] = useState(now.getMonth() + 1);
  const [repYear,  setRepYear]  = useState(now.getFullYear());
  const [exporting, setExporting] = useState(false);

  const { data: reportRes, isLoading: reportLoading } = useQuery({
    queryKey: ['att-report', repMonth, repYear],
    queryFn:  () => attendanceApi.monthlyReport(repMonth, repYear),
    enabled:  tab === 'reports',
    staleTime: 120_000,
  });
  const reportRows = reportRes?.data?.employees || reportRes?.data?.summary || reportRes?.data || [];

  async function exportReport() {
    setExporting(true);
    try {
      const r = reportRes?.data?.employees || reportRes?.data?.summary || [];
      if (!r.length) { toast.error('No data to export'); return; }

      const header = 'Employee,Code,Department,Present,Absent,Half Day,On Leave,Week Off,Working Hours,Attendance %';
      const rows   = r.map(e => {
        const name = `${e.employee?.first_name || ''} ${e.employee?.last_name || ''}`.trim();
        return [
          `"${name}"`,
          e.employee?.employee_code || '',
          `"${e.employee?.department?.name || ''}"`,
          e.present   || 0,
          e.absent    || 0,
          e.halfDay   || e.half_day || 0,
          e.onLeave   || e.on_leave || 0,
          e.weekOff   || e.week_off || 0,
          (e.workingHours || e.working_hours || 0).toFixed(1),
          e.attendancePct || e.attendance_pct || 0,
        ].join(',');
      });

      const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `attendance_${MONTH_NAMES[repMonth - 1]}_${repYear}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('CSV downloaded');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  const { data: regRes, isLoading: regLoading } = useQuery({
    queryKey: ['att-reg-pending'],
    queryFn:  attendanceApi.getPending,
    enabled:  tab === 'regularize',
    staleTime: 30_000,
  });
  const regs = regRes?.data || [];

  const [rejectRegModal, setRejectRegModal] = useState(null);
  const [rejectRegReason, setRejectRegReason] = useState('');

  const approveRegM = useMutation({
    mutationFn: (id) => attendanceApi.approveReg(id),
    onSuccess:  () => { toast.success('Regularization approved'); qc.invalidateQueries({ queryKey: ['att-reg-pending'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const rejectRegM = useMutation({
    mutationFn: ({ id, reason }) => attendanceApi.rejectReg(id, reason),
    onSuccess:  () => { toast.success('Regularization rejected'); setRejectRegModal(null); setRejectRegReason(''); qc.invalidateQueries({ queryKey: ['att-reg-pending'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const { data: dashRes } = useQuery({
    queryKey: ['att-dashboard'],
    queryFn:  () => attendanceApi.dashboard(),
    enabled:  tab === 'mark',
    staleTime: 60_000,
  });
  const dash = dashRes?.data || {};

  const TABS = [
    { key: 'mark',       label: 'Mark attendance' },
    { key: 'reports',    label: 'Monthly report'  },
    { key: 'regularize', label: 'Corrections', badge: regs.length },
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
              <span style={{ background: '#fef9c3', color: '#a16207', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4 }}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {}
      {tab === 'mark' && (
        <div>
          {}
          {dash.totalActive !== undefined && (
            <div className="stats-grid-4" style={{ marginBottom: 14 }}>
              <div className="stat-card"><div className="stat-label">Total active</div><div className="stat-value">{dash.totalActive ?? '—'}</div></div>
              <div className="stat-card"><div className="stat-label">Marked today</div><div className="stat-value" style={{ color: '#16a34a' }}>{dash.markedCount ?? marked.length}</div></div>
              <div className="stat-card"><div className="stat-label">Not marked</div><div className="stat-value" style={{ color: unmarked.length > 0 ? '#f59e0b' : undefined }}>{unmarked.length}</div></div>
              <div className="stat-card"><div className="stat-label">Present today</div><div className="stat-value" style={{ color: '#2563eb' }}>{dash.presentCount ?? '—'}</div></div>
            </div>
          )}

          {}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <label style={{ fontSize: 11, color: '#64748b' }}>Date:</label>
              <input
                type="date"
                className="form-input"
                style={{ width: 150, fontSize: 11 }}
                value={markDate}
                max={todayISO()}
                onChange={e => { setMarkDate(e.target.value); setRecords({}); }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {new Date(markDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long' })}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#64748b' }}>Mark all unmarked as:</span>
              {['present', 'wfh', 'absent', 'week_off'].map(s => (
                <button key={s} className="btn-sm" style={{ textTransform: 'capitalize', fontSize: 10 }} onClick={() => bulkSetStatus(s)}>
                  {s.replace('_', ' ')}
                </button>
              ))}
              <button
                className="btn-primary"
                style={{ fontSize: 11 }}
                onClick={saveAttendance}
                disabled={saving || unmarked.length === 0}
              >
                {saving ? 'Saving…' : `Save attendance (${unmarked.length})`}
              </button>
            </div>
          </div>

          {}
          {unmarked.length > 0 && (
            <div className="card" style={{ marginBottom: 12 }}>
              <div className="card-header">
                <div>
                  <div className="card-title">Not yet marked — {markDate}</div>
                  <div className="card-sub">{unmarked.length} employee{unmarked.length !== 1 ? 's' : ''} need marking</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Check in</th>
                    <th>Check out</th>
                  </tr>
                </thead>
                <tbody>
                  {unmarked.map(e => {
                    const name = `${e.first_name || ''} ${e.last_name || ''}`.trim();
                    const rec  = records[e.id] || {};
                    return (
                      <tr key={e.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Av name={name} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: '#64748b' }}>{e.department?.name || '—'}</td>
                        <td>
                          <select
                            className="form-input"
                            style={{ width: 120, fontSize: 11, padding: '4px 8px' }}
                            value={rec.status || 'present'}
                            onChange={ev => setRec(e.id, 'status', ev.target.value)}
                          >
                            {MARK_OPTIONS.map(o => (
                              <option key={o} value={o} style={{ textTransform: 'capitalize' }}>
                                {o.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          {['present', 'half_day', 'wfh'].includes(rec.status || 'present') ? (
                            <input
                              type="time"
                              className="form-input"
                              style={{ width: 110, fontSize: 11, padding: '4px 8px' }}
                              value={rec.checkIn || '09:30'}
                              onChange={ev => setRec(e.id, 'checkIn', ev.target.value)}
                            />
                          ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                        </td>
                        <td>
                          {['present', 'half_day', 'wfh'].includes(rec.status || 'present') ? (
                            <input
                              type="time"
                              className="form-input"
                              style={{ width: 110, fontSize: 11, padding: '4px 8px' }}
                              value={rec.checkOut || '18:30'}
                              onChange={ev => setRec(e.id, 'checkOut', ev.target.value)}
                            />
                          ) : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {}
          {marked.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Already marked — {markDate}</div>
                <div className="card-sub">{marked.length} records</div>
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>Employee</th><th>Status</th><th>Check in</th><th>Check out</th><th>Hours</th></tr>
                </thead>
                <tbody>
                  {marked.map(r => {
                    const name = `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim();
                    const hours = r.check_in && r.check_out
                      ? ((new Date(r.check_out) - new Date(r.check_in)) / 3600000).toFixed(1)
                      : null;
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.employee?.employee_code}</div>
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                        <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {r.check_in ? new Date(r.check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                        </td>
                        <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {r.check_out ? new Date(r.check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                        </td>
                        <td style={{ fontSize: 11, color: '#64748b' }}>{hours ? `${hours}h` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!unmarkedLoading && !markedLoading && unmarked.length === 0 && marked.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>No active employees or no records for this date</div>
            </div>
          )}
        </div>
      )}

      {}
      {tab === 'reports' && (
        <div>
          {}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <select className="form-input" style={{ width: 130 }} value={repMonth} onChange={e => setRepMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="form-input" style={{ width: 90 }} value={repYear} onChange={e => setRepYear(Number(e.target.value))}>
              {[repYear - 1, repYear, repYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="btn-sm" onClick={exportReport} disabled={exporting || reportLoading}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>

          {}
          {reportRes?.data && (
            <div className="stats-grid-4" style={{ marginBottom: 14 }}>
              <div className="stat-card"><div className="stat-label">Total employees</div><div className="stat-value">{reportRows.length}</div></div>
              <div className="stat-card"><div className="stat-label">Avg attendance</div><div className="stat-value" style={{ color: '#16a34a' }}>{reportRows.length ? Math.round(reportRows.reduce((s, r) => s + (r.attendancePct || r.attendance_pct || 0), 0) / reportRows.length) : 0}%</div></div>
              <div className="stat-card"><div className="stat-label">Total absences</div><div className="stat-value" style={{ color: '#dc2626' }}>{reportRows.reduce((s, r) => s + (r.absent || 0), 0)}</div></div>
              <div className="stat-card"><div className="stat-label">WFH days</div><div className="stat-value" style={{ color: '#2563eb' }}>{reportRows.reduce((s, r) => s + (r.wfh || 0), 0)}</div></div>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title">Employee attendance — {MONTH_NAMES[repMonth - 1]} {repYear}</div>
            </div>
            {reportLoading
              ? <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading report…</div>
              : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Dept</th>
                        <th style={{ textAlign: 'center' }}>Present</th>
                        <th style={{ textAlign: 'center' }}>Absent</th>
                        <th style={{ textAlign: 'center' }}>WFH</th>
                        <th style={{ textAlign: 'center' }}>Half day</th>
                        <th style={{ textAlign: 'center' }}>On leave</th>
                        <th style={{ textAlign: 'center' }}>Hours</th>
                        <th style={{ textAlign: 'center' }}>Att %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((r, i) => {
                        const name = `${r.employee?.first_name || r.employeeName || ''} ${r.employee?.last_name || ''}`.trim();
                        const pct  = r.attendancePct ?? r.attendance_pct ?? 0;
                        return (
                          <tr key={i}>
                            <td>
                              <div style={{ fontWeight: 500, fontSize: 12 }}>{name || '—'}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.employee?.employee_code}</div>
                            </td>
                            <td style={{ fontSize: 11, color: '#64748b' }}>{r.employee?.department?.name || '—'}</td>
                            <td style={{ textAlign: 'center', color: '#16a34a', fontWeight: 500 }}>{r.present ?? 0}</td>
                            <td style={{ textAlign: 'center', color: (r.absent ?? 0) > 3 ? '#dc2626' : undefined, fontWeight: (r.absent ?? 0) > 3 ? 600 : 400 }}>{r.absent ?? 0}</td>
                            <td style={{ textAlign: 'center', color: '#2563eb' }}>{r.wfh ?? 0}</td>
                            <td style={{ textAlign: 'center', color: '#a16207' }}>{r.halfDay ?? r.half_day ?? 0}</td>
                            <td style={{ textAlign: 'center', color: '#6d28d9' }}>{r.onLeave ?? r.on_leave ?? 0}</td>
                            <td style={{ textAlign: 'center', fontSize: 11, fontFamily: 'monospace' }}>{(r.workingHours ?? r.working_hours ?? 0).toFixed(1)}h</td>
                            <td style={{ textAlign: 'center' }}>
                              <span style={{
                                background: pct >= 90 ? '#dcfce7' : pct >= 75 ? '#fef9c3' : '#fee2e2',
                                color:      pct >= 90 ? '#15803d' : pct >= 75 ? '#a16207' : '#b91c1c',
                                fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                              }}>
                                {Math.round(pct)}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {reportRows.length === 0 && (
                        <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 11 }}>No attendance data for {MONTH_NAMES[repMonth - 1]} {repYear}</td></tr>
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
      {tab === 'regularize' && (
        <div>
          {regLoading && <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>}

          {!regLoading && regs.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#16a34a' }}>All caught up</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>No pending attendance corrections</div>
            </div>
          )}

          {regs.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Attendance correction requests</div>
                  <div className="card-sub">{regs.length} pending</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Requested status</th>
                    <th>Requested times</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {regs.map(r => {
                    const name   = `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}`.trim();
                    const busyA  = approveRegM.isPending && approveRegM.variables === r.id;
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Av name={name} />
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                              <div style={{ fontSize: 10, color: '#94a3b8' }}>{r.employee?.employee_code}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, whiteSpace: 'nowrap' }}>{fmtDate(r.date)}</td>
                        <td><StatusBadge status={r.requested_status} /></td>
                        <td style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {r.requested_check_in
                            ? `${new Date('1970-01-01T' + r.requested_check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} – ${new Date('1970-01-01T' + r.requested_check_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                            : '—'}
                        </td>
                        <td style={{ fontSize: 11, color: '#64748b', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.reason || '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button
                              className="btn-sm"
                              style={{ color: '#15803d', borderColor: '#86efac' }}
                              onClick={() => approveRegM.mutate(r.id)}
                              disabled={busyA}
                            >
                              {busyA ? '…' : '✓ Approve'}
                            </button>
                            <button
                              className="btn-sm"
                              style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                              onClick={() => { setRejectRegModal(r); setRejectRegReason(''); }}
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
      {rejectRegModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 380, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Reject correction</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              {`${rejectRegModal.employee?.first_name || ''} ${rejectRegModal.employee?.last_name || ''}`.trim()} · {fmtDate(rejectRegModal.date)}
            </div>
            <div className="form-group">
              <label className="form-label">Reason *</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Reason for rejection…"
                value={rejectRegReason}
                onChange={e => setRejectRegReason(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setRejectRegModal(null)}>Cancel</button>
              <button
                className="btn-sm"
                style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}
                onClick={() => rejectRegM.mutate({ id: rejectRegModal.id, reason: rejectRegReason })}
                disabled={!rejectRegReason.trim() || rejectRegM.isPending}
              >
                {rejectRegM.isPending ? '…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

