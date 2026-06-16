import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../../services/employeeApi';
import '../../components/hr/HRLayout.css';

const STATUS_BADGE = {
  active:      'badge-active',
  probation:   'badge-pending',
  notice:      'badge-pending',
  terminated:  'badge-suspended',
  absconding:  'badge-suspended',
};

function Avatar({ name }) {
  const initials = name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      background: '#dbeafe', color: '#1d4ed8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 600,
    }}>
      {initials}
    </div>
  );
}

export default function HREmployees() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [dept,   setDept]   = useState('');
  const [status, setStatus] = useState('active');
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([null]);

  const { data: res, isLoading, isFetching } = useQuery({
    queryKey:        ['employees', { search, dept, status, cursor, limit: 15 }],
    queryFn:         () => employeeApi.list({ search, departmentId: dept || undefined, status: status || undefined, cursor, limit: 15 }),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });

  const { data: deptsData } = useQuery({ queryKey: ['depts'], queryFn: employeeApi.getDepartments });
  const depts = Array.isArray(deptsData?.data) ? deptsData.data : (Array.isArray(deptsData) ? deptsData : []);

  const employees = res?.data?.employees || res?.data || [];
  const hasMore   = res?.data?.hasMore || false;
  const nextCursor = res?.data?.cursor || null;

  function goNext() { setHistory(h => [...h, cursor]); setCursor(nextCursor); }
  function goBack() { const h = [...history]; const prev = h[h.length - 2] ?? null; h.pop(); setHistory(h); setCursor(prev); }
  function reset()  { setCursor(null); setHistory([null]); }

  return (
    <div>

      {}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <input
          style={{ flex: 1, minWidth: 160 }}
          className="form-input"
          placeholder="Search name, ID, phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); reset(); }}
        />
        <select className="form-input" style={{ width: 150 }} value={dept} onChange={e => { setDept(e.target.value); reset(); }}>
          <option value="">All departments</option>
          {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="form-input" style={{ width: 130 }} value={status} onChange={e => { setStatus(e.target.value); reset(); }}>
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="probation">On probation</option>
          <option value="notice">On notice</option>
          <option value="terminated">Terminated</option>
        </select>
        <Link to="/employees/add" className="btn-primary" style={{ whiteSpace: 'nowrap', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', padding: '6px 12px' }}>
          + Add employee
        </Link>
        <Link to="/employees/import" className="btn-sm" style={{ whiteSpace: 'nowrap', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          Bulk import
        </Link>
        <Link to="/employees" className="btn-sm" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          Full view →
        </Link>
      </div>

      {}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading…</td></tr>
              )}
              {!isLoading && employees.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 30 }}>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>No employees found</div>
                    <Link to="/employees/add" className="btn-primary" style={{ fontSize: 11, textDecoration: 'none' }}>Add first employee</Link>
                  </td>
                </tr>
              )}
              {employees.map(e => {
                const name = [e.first_name, e.last_name].filter(Boolean).join(' ');
                const dept  = e.department?.name || '—';
                const desig = e.designation?.name || '—';
                return (
                  <tr key={e.id} style={{ opacity: isFetching ? 0.6 : 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={name} />
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 12 }}>{name}</div>
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>{e.work_email || e.personal_email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{e.employee_code || '—'}</td>
                    <td style={{ fontSize: 11 }}>{dept}</td>
                    <td style={{ fontSize: 11 }}>{desig}</td>
                    <td style={{ fontSize: 11 }}>{e.phone || '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[e.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>
                        {e.status || 'active'}
                      </span>
                    </td>
                    <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {e.date_of_joining ? new Date(e.date_of_joining).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Link to={`/employees/${e.id}`} className="btn-sm" style={{ textDecoration: 'none' }}>View</Link>
                        <Link to={`/employees/${e.id}/edit`} className="btn-sm" style={{ textDecoration: 'none' }}>Edit</Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderTop: '0.5px solid rgba(0,0,0,0.06)', fontSize: 11, color: '#64748b' }}>
          <span>{employees.length} shown</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" onClick={goBack} disabled={history.length <= 1}>← Prev</button>
            <button className="btn-sm" onClick={goNext} disabled={!hasMore}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

