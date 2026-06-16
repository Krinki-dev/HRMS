import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import '../admin/AdminLayout.css';
import { adminApi } from '../../services/adminApi';

const PLAN_COLOR = {
  free:       '#94a3b8',
  starter:    '#3b82f6',
  pro:        '#8b5cf6',
  enterprise: '#f59e0b',
};

export default function AdminClients() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search,  setSearch]  = useState(searchParams.get('search') || '');
  const [planF,   setPlanF]   = useState(searchParams.get('plan')   || '');
  const [statusF, setStatusF] = useState(searchParams.get('status') || 'active');
  const [cursor,  setCursor]  = useState(null);
  const [history, setHistory] = useState([null]);
  const [suspendModal, setSuspendModal] = useState(null); 
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteBackup, setDeleteBackup] = useState(true);
  const [deleteConfirmExternal, setDeleteConfirmExternal] = useState(false);

  const reset = useCallback(() => { setCursor(null); setHistory([null]); }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey:        ['admin-tenants', { search, planF, statusF, cursor }],
    queryFn:         () => adminApi.listTenants({ search, plan: planF, status: statusF, cursor, limit: 20 }),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });

  const tenants  = data?.tenants  || [];
  const hasMore  = data?.hasMore  || false;
  const nextCursor = data?.cursor || null;

  const suspendM = useMutation({
    mutationFn: ({ id, reason }) => adminApi.suspendTenant(id, reason),
    onSuccess: () => {
      toast.success('Account suspended');
      setSuspendModal(null);
      setSuspendReason('');
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to suspend'),
  });

  const activateM = useMutation({
    mutationFn: (id) => adminApi.activateTenant(id),
    onSuccess: () => {
      toast.success('Account activated');
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to activate'),
  });

  const deleteM = useMutation({
    mutationFn: ({ id, password, reason, backup, confirmExternalDelete }) =>
      adminApi.deleteTenantPermanent(id, { password, reason, backup, confirmExternalDelete }),
    onSuccess: () => {
      toast.success('Company permanently deleted');
      setDeleteModal(null);
      qc.invalidateQueries({ queryKey: ['admin-tenants'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Deletion failed'),
  });

  function handleSearch(e) {
    e.preventDefault();
    reset();
    setSearchParams({ search, plan: planF, status: statusF });
  }

  function goNext() {
    setHistory(h => [...h, cursor]);
    setCursor(nextCursor);
  }

  function goBack() {
    const h = [...history];
    const prev = h[h.length - 2] ?? null;
    h.pop();
    setHistory(h);
    setCursor(prev);
  }

  return (
    <div>
      {}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          placeholder="Search company, email, GSTIN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select className="form-input" style={{ width: 140 }} value={planF} onChange={e => { setPlanF(e.target.value); reset(); }}>
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select className="form-input" style={{ width: 140 }} value={statusF} onChange={e => { setStatusF(e.target.value); reset(); }}>
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button type="submit" className="btn-sm" style={{ padding: '7px 14px' }}>Search</button>
      </form>

      {}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Subdomain</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Admin</th>
                <th>State</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Loading…</td></tr>
              )}
              {!isLoading && tenants.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>No companies found</td></tr>
              )}
              {tenants.map(t => (
                <tr key={t.id} style={{ opacity: isFetching ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 500, color: '#0f172a' }}>{t.name}</div>
                    {t.gstin && <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>{t.gstin}</div>}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569' }}>
                    {t.subdomain}.syntern.in
                    {t.customDomain && <div style={{ color: '#3b82f6' }}>{t.customDomain}</div>}
                  </td>
                  <td>
                    <span style={{
                      background: `${PLAN_COLOR[t.plan] || '#94a3b8'}22`,
                      color: PLAN_COLOR[t.plan] || '#94a3b8',
                      fontSize: 10, fontWeight: 600,
                      padding: '2px 7px', borderRadius: 4,
                    }}>
                      {(t.plan || 'free').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.isActive ? 'badge-active' : 'badge-suspended'}`}>
                      {t.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 11 }}>{t.adminName || '—'}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.adminEmail}</div>
                  </td>
                  <td style={{ fontSize: 11, color: '#64748b' }}>{t.state || '—'}</td>
                  <td style={{ fontSize: 10, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link to={`/admin/clients/${t.id}`} className="btn-sm" style={{ padding: '4px 10px' }}>Open</Link>
                      {t.isActive ? (
                        <button
                          className="btn-sm"
                          style={{ color: '#b91c1c', borderColor: '#fecaca', padding: '4px 10px' }}
                          onClick={() => { setSuspendModal(t); setSuspendReason(''); }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="btn-sm"
                          style={{ color: '#15803d', borderColor: '#86efac', padding: '4px 10px' }}
                          onClick={() => activateM.mutate(t.id)}
                          disabled={activateM.isPending}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="btn-sm"
                        style={{ color: '#991b1b', borderColor: '#fecaca', marginLeft: 4, padding: '4px 10px' }}
                        onClick={() => { setDeleteModal(t); setDeletePassword(''); setDeleteBackup(true); setDeleteConfirmExternal(false); }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderTop: '0.5px solid rgba(0,0,0,0.06)', fontSize: 11, color: '#64748b' }}>
          <span>{tenants.length} shown</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" onClick={goBack} disabled={history.length <= 1 || isLoading}>← Prev</button>
            <button className="btn-sm" onClick={goNext} disabled={!hasMore || isLoading}>Next →</button>
          </div>
        </div>
      </div>

      {}
      {suspendModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 360, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Suspend account</div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
              This will immediately block all logins for <strong>{suspendModal.name}</strong>.
            </div>
            <div className="form-group">
              <label className="form-label">Reason (shown to admin on login)</label>
              <input
                className="form-input"
                placeholder="e.g. Payment overdue"
                value={suspendReason}
                onChange={e => setSuspendReason(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setSuspendModal(null)}>Cancel</button>
              <button
                className="btn-sm"
                style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}
                onClick={() => suspendM.mutate({ id: suspendModal.id, reason: suspendReason })}
                disabled={suspendM.isPending}
              >
                {suspendM.isPending ? 'Suspending…' : 'Confirm suspend'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div className="card" style={{ width: 420, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>
              ⚠ Permanently delete {deleteModal.name}?
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              This will delete all employee data, payroll history, and documents. <br/>
              <strong>This action cannot be undone.</strong> 
              {deleteBackup && ' A backup will be saved before deletion.'}
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Super Admin delete password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter password to confirm"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                autoFocus
              />
            </div>
            {deleteModal?.dbMode === 'cloud' && (
              <div style={{ marginBottom: 12, fontSize: 12, color: '#1e293b' }}>
                This tenant is hosted on our managed cloud database. A backup is required and will be applied before deletion.
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={deleteBackup}
                onChange={e => setDeleteBackup(e.target.checked)}
                disabled={deleteModal?.dbMode === 'cloud'}
              />
              Backup database before deletion
            </label>
            {['external_cloud', 'local', 'hybrid'].includes(deleteModal?.dbMode) && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 16 }}>
                <input
                  type="checkbox"
                  checked={deleteConfirmExternal}
                  onChange={e => setDeleteConfirmExternal(e.target.checked)}
                />
                I confirm this tenant uses a dedicated or external database and I want to permanently delete it.
              </label>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setDeleteModal(null)}>Cancel</button>
              <button
                className="btn-sm"
                style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fecaca' }}
                disabled={
                  !deletePassword ||
                  deleteM.isPending ||
                  (['external_cloud', 'local', 'hybrid'].includes(deleteModal?.dbMode) && !deleteConfirmExternal)
                }
                onClick={() => deleteM.mutate({
                  id: deleteModal.id,
                  password: deletePassword,
                  reason: '',
                  backup: deleteBackup,
                  confirmExternalDelete: deleteConfirmExternal,
                })}
              >
                {deleteM.isPending ? 'Deleting…' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
