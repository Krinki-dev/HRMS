import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import '../admin/AdminLayout.css';

export default function AdminDomains() {
  const qc = useQueryClient();
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ tenantId: '', customDomain: '' });

  const { data: res, isLoading } = useQuery({
    queryKey: ['admin-tenants-domains'],
    queryFn:  () => adminApi.listTenants({ limit: 100, status: 'all' }),
    staleTime: 60_000,
  });
  const allTenants  = res?.tenants || [];
  const withDomain  = allTenants.filter(t => t.customDomain);
  const withoutDomain = allTenants.filter(t => !t.customDomain && t.plan !== 'free' && t.plan !== 'trial');

  const updateM = useMutation({
    mutationFn: ({ id, customDomain }) => adminApi.updateTenant(id, { customDomain }),
    onSuccess:  () => { toast.success('Custom domain saved'); setAddModal(false); setForm({ tenantId: '', customDomain: '' }); qc.invalidateQueries({ queryKey: ['admin-tenants-domains'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const removeM = useMutation({
    mutationFn: (id) => adminApi.updateTenant(id, { customDomain: null }),
    onSuccess:  () => { toast.success('Custom domain removed'); qc.invalidateQueries({ queryKey: ['admin-tenants-domains'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div>
      <div className="stats-grid-4">
        <div className="stat-card"><div className="stat-label">Custom domains</div><div className="stat-value">{withDomain.length}</div></div>
        <div className="stat-card"><div className="stat-label">Eligible (no domain yet)</div><div className="stat-value" style={{ color: 'var(--admin-warning)' }}>{withoutDomain.length}</div><div className="stat-hint">Starter+ clients</div></div>
        <div className="stat-card"><div className="stat-label">SSL active</div><div className="stat-value" style={{ color: 'var(--admin-success)' }}>{withDomain.length}</div><div className="stat-hint">via Certbot auto-renew</div></div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Active custom domains</div>
            <div className="card-sub">Enterprise/Pro clients using their own domain</div>
          </div>
          <button className="btn-primary" onClick={() => setAddModal(true)}>+ Map domain</button>
        </div>
        {isLoading
          ? <div className="admin-empty-state">Loading…</div>
          : (
            <div className="admin-table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Custom domain</th>
                    <th>Company</th>
                    <th>Subdomain</th>
                    <th>Plan</th>
                    <th>SSL</th>
                    <th>DNS instruction</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withDomain.map(t => (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--admin-accent)' }}>{t.customDomain}</td>
                      <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--admin-text)' }}>{t.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--admin-text-muted)' }}>{t.subdomain}.syntern.in</td>
                      <td>
                        <span className="admin-pill admin-pill--accent" style={{ textTransform: 'uppercase' }}>{t.plan}</span>
                      </td>
                      <td><span className="badge badge-active" style={{ fontSize: 9 }}>Active</span></td>
                      <td style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>
                        CNAME → <span style={{ fontFamily: 'monospace', color: 'var(--admin-text-secondary)' }}>syntern.in</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-sm" style={{ color: 'var(--admin-danger)', borderColor: 'rgba(220,38,38,0.24)' }}
                          onClick={() => { if (window.confirm(`Remove custom domain "${t.customDomain}"?`)) removeM.mutate(t.id); }}
                          disabled={removeM.isPending}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {withDomain.length === 0 && (
                    <tr><td colSpan={7} className="admin-empty-state">No custom domains configured yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {withoutDomain.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Eligible — no custom domain yet</div>
            <div className="card-sub">Starter+ clients who could have their own domain</div>
          </div>
          <div className="admin-table-scroll">
            <table className="data-table">
              <thead><tr><th>Company</th><th>Subdomain</th><th>Plan</th><th style={{ textAlign: 'right' }}>Setup</th></tr></thead>
              <tbody>
                {withoutDomain.slice(0, 10).map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600, fontSize: 12, color: 'var(--admin-text)' }}>{t.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--admin-text-muted)' }}>{t.subdomain}.syntern.in</td>
                    <td><span className="admin-pill admin-pill--accent" style={{ textTransform: 'uppercase' }}>{t.plan}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-sm" onClick={() => { setForm({ tenantId: t.id, customDomain: '' }); setAddModal(true); }}>Add domain</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card admin-panel-body" style={{ marginTop: 14 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>DNS setup instructions (send to client)</div>
        <div style={{ background: 'var(--admin-surface-muted)', borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, lineHeight: 2 }}>
          <div style={{ color: 'var(--admin-text-muted)' }}># In your DNS provider, add:</div>
          <div>Type: <strong>CNAME</strong></div>
          <div>Host: <strong>hr</strong> (or whatever subdomain you want)</div>
          <div>Value: <strong>syntern.in</strong></div>
          <div>TTL: <strong>3600</strong></div>
          <div style={{ marginTop: 8, color: 'var(--admin-text-muted)' }}># Result: hr.yourcompany.com → syntern.in</div>
          <div style={{ color: 'var(--admin-text-muted)' }}># SSL is auto-provisioned via Let&apos;s Encrypt within 60 seconds</div>
        </div>
      </div>

      {addModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-card" style={{ width: 420 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Map custom domain</div>
            <div className="form-group">
              <label className="form-label">Company *</label>
              <select className="form-input" value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))}>
                <option value="">— select company —</option>
                {allTenants.filter(t => !t.customDomain).map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.subdomain})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Custom domain *</label>
              <input className="form-input" placeholder="hr.clientcompany.com" value={form.customDomain} onChange={e => setForm(f => ({ ...f, customDomain: e.target.value }))} />
              <div style={{ fontSize: 10, color: 'var(--admin-text-muted)', marginTop: 4 }}>Client must add a CNAME record pointing to syntern.in first</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-sm" style={{ background: 'var(--admin-accent)', color: '#fff', borderColor: 'var(--admin-accent)' }}
                onClick={() => updateM.mutate({ id: form.tenantId, customDomain: form.customDomain })}
                disabled={!form.tenantId || !form.customDomain || updateM.isPending}>
                {updateM.isPending ? 'Saving…' : 'Save mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

