import { useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import '../admin/AdminLayout.css';
import { adminApi } from '../../services/adminApi';

const PLAN_COLOR = {
  free: '#94a3b8',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  enterprise: '#f59e0b',
};

export default function AdminClients() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [planF, setPlanF] = useState(searchParams.get('plan') || '');
  const [statusF, setStatusF] = useState(searchParams.get('status') || 'active');
  const [cursor, setCursor] = useState(null);
  const [history, setHistory] = useState([null]);
  const [suspendModal, setSuspendModal] = useState(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmExternal, setDeleteConfirmExternal] = useState(false);
  const [backupProvider, setBackupProvider] = useState('');
  const [backupClientId, setBackupClientId] = useState('');
  const [backupClientSecret, setBackupClientSecret] = useState('');
  const [backupRefreshToken, setBackupRefreshToken] = useState('');
  const [backupFolderId, setBackupFolderId] = useState('root');
  const [backupTenantId, setBackupTenantId] = useState('common');
  const [backupFolderPath, setBackupFolderPath] = useState('/HRMS_Backups');

  const reset = useCallback(() => { setCursor(null); setHistory([null]); }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-tenants', { search, planF, statusF, cursor }],
    queryFn: () => adminApi.listTenants({ search, plan: planF, status: statusF, cursor, limit: 20 }),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const tenants = data?.tenants || [];
  const hasMore = data?.hasMore || false;
  const nextCursor = data?.cursor || null;

  const { data: deleteReadinessRes } = useQuery({
    queryKey: ['admin-delete-readiness', deleteModal?.id],
    queryFn: () => adminApi.getDeleteReadiness(deleteModal.id),
    enabled: !!deleteModal?.id,
    staleTime: 15_000,
  });

  const deleteReadiness = deleteReadinessRes?.data;
  const backupNeedsSetup = !!deleteReadiness?.backup?.needsSetup;

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
    mutationFn: ({ id, password, reason, confirmExternalDelete, backupConfig }) =>
      adminApi.deleteTenantPermanent(id, { password, reason, confirmExternalDelete, backupConfig }),
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
      <form onSubmit={handleSearch} className="admin-toolbar">
        <input
          className="form-input"
          placeholder="Search company, email, GSTIN…"
          value={search}
          onChange={e => setSearch(e.target.value)}
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
        <button type="submit" className="btn-sm">Search</button>
      </form>

      <div className="card">
        <div className="admin-table-scroll">
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
                <tr><td colSpan={8} className="admin-empty-state">Loading…</td></tr>
              )}
              {!isLoading && tenants.length === 0 && (
                <tr><td colSpan={8} className="admin-empty-state">No companies found</td></tr>
              )}
              {tenants.map(t => (
                <tr key={t.id} style={{ opacity: isFetching ? 0.6 : 1 }}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{t.name}</div>
                    {t.gstin && <div style={{ fontSize: 10, color: 'var(--admin-text-soft)', fontFamily: 'monospace' }}>{t.gstin}</div>}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--admin-text-secondary)' }}>
                    {t.subdomain}.syntern.in
                    {t.customDomain && <div style={{ color: 'var(--admin-accent)' }}>{t.customDomain}</div>}
                  </td>
                  <td>
                    <span className="admin-pill admin-pill--accent" style={{ background: `${PLAN_COLOR[t.plan] || '#94a3b8'}22`, color: PLAN_COLOR[t.plan] || '#94a3b8' }}>
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
                    <div style={{ fontSize: 10, color: 'var(--admin-text-soft)' }}>{t.adminEmail}</div>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--admin-text-secondary)' }}>{t.state || '—'}</td>
                  <td style={{ fontSize: 10, color: 'var(--admin-text-soft)', whiteSpace: 'nowrap' }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      <Link to={`/admin/clients/${t.id}`} className="btn-sm">Open</Link>
                      {t.isActive ? (
                        <button
                          className="btn-sm"
                          style={{ color: 'var(--admin-danger)', borderColor: 'rgba(220,38,38,0.24)' }}
                          onClick={() => { setSuspendModal(t); setSuspendReason(''); }}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          className="btn-sm"
                          style={{ color: 'var(--admin-success)', borderColor: 'rgba(22,163,74,0.24)' }}
                          onClick={() => activateM.mutate(t.id)}
                          disabled={activateM.isPending}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        className="btn-sm"
                        style={{ color: 'var(--admin-danger)', borderColor: 'rgba(220,38,38,0.24)', marginLeft: 4 }}
                        onClick={() => {
                          setDeleteModal(t);
                          setDeletePassword('');
                          setDeleteConfirmExternal(false);
                          setBackupProvider('');
                          setBackupClientId('');
                          setBackupClientSecret('');
                          setBackupRefreshToken('');
                          setBackupFolderId('root');
                          setBackupTenantId('common');
                          setBackupFolderPath('/HRMS_Backups');
                        }}
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

        <div className="admin-table-footer">
          <span>{tenants.length} shown</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn-sm" onClick={goBack} disabled={history.length <= 1 || isLoading}>← Prev</button>
            <button className="btn-sm" onClick={goNext} disabled={!hasMore || isLoading}>Next →</button>
          </div>
        </div>
      </div>

      {suspendModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card">
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Suspend account</div>
            <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 14 }}>
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
                style={{ background: 'rgba(220,38,38,0.12)', color: 'var(--admin-danger)', borderColor: 'rgba(220,38,38,0.24)' }}
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
        <div className="admin-modal-backdrop" style={{ zIndex: 60 }}>
          <div className="admin-modal-card" style={{ width: 420 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--admin-danger)', marginBottom: 8 }}>
              ⚠ Permanently delete {deleteModal.name}?
            </div>
            <div style={{ fontSize: 12, color: 'var(--admin-text-soft)', marginBottom: 16 }}>
              This will delete all employee data, payroll history, and documents. <br/>
              <strong>This action cannot be undone.</strong> 
              {' A successful cloud backup is mandatory before deletion.'}
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
            <div style={{ marginBottom: 12, fontSize: 12, color: 'var(--admin-text)' }}>
              Backup status: {deleteReadiness?.backup?.configured ? `Configured (${deleteReadiness.backup.provider})` : 'Not configured'}
            </div>
            {backupNeedsSetup && (
              <div style={{ border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: 10, marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--admin-text)', marginBottom: 8 }}>
                  Backup credentials were not set during onboarding. Configure now to continue deletion.
                </div>
                <div className="form-group" style={{ marginBottom: 8 }}>
                  <label className="form-label">Backup provider</label>
                  <select className="form-input" value={backupProvider} onChange={e => setBackupProvider(e.target.value)}>
                    <option value="">Select provider</option>
                    <option value="gdrive">Google Drive</option>
                    <option value="onedrive">OneDrive</option>
                  </select>
                </div>
                {backupProvider && (
                  <>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label">Client ID</label>
                      <input className="form-input" value={backupClientId} onChange={e => setBackupClientId(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label">Client Secret</label>
                      <input type="password" className="form-input" value={backupClientSecret} onChange={e => setBackupClientSecret(e.target.value)} />
                    </div>
                    {backupProvider === 'gdrive' && (
                      <>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <label className="form-label">Refresh Token</label>
                          <input type="password" className="form-input" value={backupRefreshToken} onChange={e => setBackupRefreshToken(e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Folder ID (optional)</label>
                          <input className="form-input" value={backupFolderId} onChange={e => setBackupFolderId(e.target.value)} placeholder="root" />
                        </div>
                      </>
                    )}
                    {backupProvider === 'onedrive' && (
                      <>
                        <div className="form-group" style={{ marginBottom: 8 }}>
                          <label className="form-label">Tenant ID (optional)</label>
                          <input className="form-input" value={backupTenantId} onChange={e => setBackupTenantId(e.target.value)} placeholder="common" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Folder Path (optional)</label>
                          <input className="form-input" value={backupFolderPath} onChange={e => setBackupFolderPath(e.target.value)} placeholder="/HRMS_Backups" />
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            )}
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
                style={{ background: 'var(--admin-danger-soft)', color: 'var(--admin-danger)', borderColor: 'rgba(220,38,38,0.24)' }}
                disabled={
                  !deletePassword ||
                  deleteM.isPending ||
                  (backupNeedsSetup && (
                    !backupProvider ||
                    !backupClientId ||
                    !backupClientSecret ||
                    (backupProvider === 'gdrive' && !backupRefreshToken)
                  )) ||
                  (['external_cloud', 'local', 'hybrid'].includes(deleteModal?.dbMode) && !deleteConfirmExternal)
                }
                onClick={() => deleteM.mutate({
                  id: deleteModal.id,
                  password: deletePassword,
                  reason: '',
                  confirmExternalDelete: deleteConfirmExternal,
                  backupConfig: backupNeedsSetup ? {
                    provider: backupProvider,
                    clientId: backupClientId,
                    clientSecret: backupClientSecret,
                    refreshToken: backupProvider === 'gdrive' ? backupRefreshToken : undefined,
                    folderId: backupProvider === 'gdrive' ? backupFolderId : undefined,
                    tenantId: backupProvider === 'onedrive' ? backupTenantId : undefined,
                    folderPath: backupProvider === 'onedrive' ? backupFolderPath : undefined,
                  } : null,
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
