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
      {}
      <div className="stats-grid-4" style={{ marginBottom: 14 }}>
        <div className="stat-card"><div className="stat-label">Custom domains</div><div className="stat-value">{withDomain.length}</div></div>
        <div className="stat-card"><div className="stat-label">Eligible (no domain yet)</div><div className="stat-value" style={{ color: '#f59e0b' }}>{withoutDomain.length}</div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Starter+ clients</div></div>
        <div className="stat-card"><div className="stat-label">SSL active</div><div className="stat-value" style={{ color: '#16a34a' }}>{withDomain.length}</div><div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>via Certbot auto-renew</div></div>
      </div>

      {}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Active custom domains</div>
            <div className="card-sub">Enterprise/Pro clients using their own domain</div>
          </div>
          <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => setAddModal(true)}>+ Map domain</button>
        </div>
        {isLoading
          ? <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>
          : (
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
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#2563eb' }}>{t.customDomain}</td>
                    <td style={{ fontWeight: 500, fontSize: 12 }}>{t.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{t.subdomain}.syntern.in</td>
                    <td>
                      <span style={{ fontSize: 10, fontWeight: 600, background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: 4, textTransform: 'uppercase' }}>{t.plan}</span>
                    </td>
                    <td><span className="badge badge-active" style={{ fontSize: 9 }}>Active</span></td>
                    <td style={{ fontSize: 10, color: '#94a3b8' }}>
                      CNAME → <span style={{ fontFamily: 'monospace', color: '#475569' }}>syntern.in</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }}
                        onClick={() => { if (window.confirm(`Remove custom domain "${t.customDomain}"?`)) removeM.mutate(t.id); }}
                        disabled={removeM.isPending}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {withDomain.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>No custom domains configured yet.</td></tr>
                )}
              </tbody>
            </table>
          )
        }
      </div>

      {}
      {withoutDomain.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Eligible — no custom domain yet</div>
            <div className="card-sub">Starter+ clients who could have their own domain</div>
          </div>
          <table className="data-table">
            <thead><tr><th>Company</th><th>Subdomain</th><th>Plan</th><th style={{ textAlign: 'right' }}>Setup</th></tr></thead>
            <tbody>
              {withoutDomain.slice(0, 10).map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{t.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{t.subdomain}.syntern.in</td>
                  <td><span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{t.plan}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn-sm" onClick={() => { setForm({ tenantId: t.id, customDomain: '' }); setAddModal(true); }}>Add domain</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {}
      <div className="card" style={{ padding: '14px 18px', marginTop: 14 }}>
        <div className="card-title" style={{ marginBottom: 8 }}>DNS setup instructions (send to client)</div>
        <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, lineHeight: 2 }}>
          <div style={{ color: '#64748b' }}># In your DNS provider, add:</div>
          <div>Type: <strong>CNAME</strong></div>
          <div>Host: <strong>hr</strong> (or whatever subdomain you want)</div>
          <div>Value: <strong>syntern.in</strong></div>
          <div>TTL: <strong>3600</strong></div>
          <div style={{ marginTop: 8, color: '#64748b' }}># Result: hr.yourcompany.com → syntern.in</div>
          <div style={{ color: '#64748b' }}># SSL is auto-provisioned via Let&apos;s Encrypt within 60 seconds</div>
        </div>
      </div>

      {/* Add domain modal */}
      {addModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 420, padding: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Map custom domain</div>
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
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>Client must add a CNAME record pointing to syntern.in first</div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setAddModal(false)}>Cancel</button>
              <button className="btn-sm" style={{ background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8' }}
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

