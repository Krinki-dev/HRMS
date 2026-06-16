﻿import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/adminApi';
import BillingConfigTab from '../platform/BillingConfigTab';
import '../admin/AdminLayout.css';

const PLAN_COLOR = { free: '#94a3b8', starter: '#3b82f6', pro: '#8b5cf6', enterprise: '#f59e0b' };
const PLAN_OPTS  = ['free', 'starter', 'pro', 'enterprise'];

const MODULE_LABELS = {
  employees:     'Employee management',
  attendance:    'Attendance & time',
  leave:         'Leave management',
  payroll:       'Payroll processing',
  compliance:    'Statutory compliance',
  recruitment:   'Recruitment',
  performance:   'Performance management',
  training:      'Training & development',
  assets:        'Assets management',
  expenses:      'Expense management',
  reports:       'Reports & analytics',
  automation:    'Browser automation (KYC/GST)',
  notifications: 'Notifications',
  settings:      'Settings',
  documents:     'Document management',
};

const MODULE_ALWAYS_ON = ['employees', 'settings', 'notifications'];

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value || '—'}</span>
    </div>
  );
}

export default function AdminClientDetail() {
  const { id }  = useParams();
  const qc      = useQueryClient();
  const [tab, setTab] = useState('overview');

  const { data: tenantRes, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn:  () => adminApi.getTenant(id),
    enabled:  !!id,
  });
  const t = tenantRes;

  const { data: modsRes } = useQuery({
    queryKey: ['admin-tenant-modules', id],
    queryFn:  () => adminApi.getModules(id),
    enabled:  !!id && tab === 'modules',
  });
  const modules = modsRes?.modules || [];

  const { data: notifRes } = useQuery({
    queryKey: ['admin-tenant-notif', id],
    queryFn:  () => adminApi.getNotifications(id),
    enabled:  !!id && tab === 'email',
  });
  const notifCfg = notifRes?.config || {};

  const [planEdit, setPlanEdit] = useState(false);
  const [planVal,  setPlanVal]  = useState('');
  const updateM = useMutation({
    mutationFn: (data) => adminApi.updateTenant(id, data),
    onSuccess:  () => { toast.success('Updated'); setPlanEdit(false); qc.invalidateQueries({ queryKey: ['admin-tenant', id] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const suspendM = useMutation({
    mutationFn: () => adminApi.suspendTenant(id, ''),
    onSuccess:  () => { toast.success('Suspended'); qc.invalidateQueries({ queryKey: ['admin-tenant', id] }); qc.invalidateQueries({ queryKey: ['admin-tenants'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const activateM = useMutation({
    mutationFn: () => adminApi.activateTenant(id),
    onSuccess:  () => { toast.success('Activated'); qc.invalidateQueries({ queryKey: ['admin-tenant', id] }); qc.invalidateQueries({ queryKey: ['admin-tenants'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const modM = useMutation({
    mutationFn: (mods) => adminApi.updateModules(id, mods),
    onSuccess:  () => { toast.success('Modules saved'); qc.invalidateQueries({ queryKey: ['admin-tenant-modules', id] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  function toggleModule(name, currentVal) {
    if (MODULE_ALWAYS_ON.includes(name)) return;
    modM.mutate([{ name, isActive: !currentVal }]);
  }

  const [smtp, setSmtp] = useState({});
  const [smtpChanged, setSmtpChanged] = useState(false);
  const notifM = useMutation({
    mutationFn: (data) => adminApi.saveNotifications(id, data),
    onSuccess:  () => { toast.success('Email config saved'); setSmtpChanged(false); qc.invalidateQueries({ queryKey: ['admin-tenant-notif', id] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed'),
  });
  const testEmailM = useMutation({
    mutationFn: () => adminApi.testEmail(id, t?.adminEmail),
    onSuccess:  (r) => { toast.success(`Test email sent to ${r?.sentTo || r?.data?.sentTo}`); qc.invalidateQueries({ queryKey: ['admin-tenant-notif', id] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'SMTP test failed'),
  });

  function smtpField(key, defaultVal = '') {
    return smtp[key] !== undefined ? smtp[key] : (notifCfg[key] ?? defaultVal);
  }
  function setSmtpField(key, val) {
    setSmtp(s => ({ ...s, [key]: val }));
    setSmtpChanged(true);
  }
  function saveSmtp() {
    const merged = { ...notifCfg, ...smtp };
    notifM.mutate({
      emailHost: merged.emailHost, emailPort: merged.emailPort,
      emailUser: merged.emailUser, emailPass: merged.emailPass || undefined,
      emailFrom: merged.emailFrom, emailSsl: merged.emailSsl,
    });
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'modules',  label: 'Modules'  },
    { key: 'billing',  label: 'Billing & Pricing' },
    { key: 'email',    label: 'Email config' },
  ];

  if (isLoading) return <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Loading…</div>;
  if (!t) return <div style={{ padding: 40, textAlign: 'center', color: '#dc2626', fontSize: 12 }}>Client not found. <Link to="/admin/clients">← Back</Link></div>;

  return (
    <div>

      {}
      <div style={{ marginBottom: 12 }}>
        <Link to="/admin/clients" style={{ fontSize: 11, color: '#64748b', textDecoration: 'none' }}>← All clients</Link>
      </div>

      {}
      <div className="card" style={{ padding: '14px 18px', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 600, color: '#1d4ed8' }}>
              {(t.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{t.subdomain}.syntern.in</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>

            {}
            {planEdit ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <select
                  className="form-input"
                  style={{ width: 130, fontSize: 11 }}
                  defaultValue={t.plan}
                  onChange={e => setPlanVal(e.target.value)}
                >
                  {PLAN_OPTS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <button className="btn-sm" style={{ color: '#15803d', borderColor: '#86efac' }}
                  onClick={() => updateM.mutate({ plan: planVal || t.plan })}
                  disabled={updateM.isPending}>
                  {updateM.isPending ? '…' : 'Save'}
                </button>
                <button className="btn-sm" onClick={() => setPlanEdit(false)}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ background: `${PLAN_COLOR[t.plan] || '#94a3b8'}22`, color: PLAN_COLOR[t.plan] || '#94a3b8', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 4 }}>
                  {(t.plan || 'free').toUpperCase()}
                </span>
                <button className="btn-sm" onClick={() => { setPlanEdit(true); setPlanVal(t.plan); }}>Change plan</button>
              </div>
            )}

            <span className={`badge ${t.isActive ? 'badge-active' : 'badge-suspended'}`}>
              {t.isActive ? 'Active' : 'Suspended'}
            </span>

            {t.isActive ? (
              <button className="btn-sm" style={{ color: '#b91c1c', borderColor: '#fecaca' }}
                onClick={() => { if (window.confirm('Suspend this account?')) suspendM.mutate(); }}
                disabled={suspendM.isPending}>
                {suspendM.isPending ? '…' : 'Suspend'}
              </button>
            ) : (
              <button className="btn-sm" style={{ color: '#15803d', borderColor: '#86efac' }}
                onClick={() => activateM.mutate()}
                disabled={activateM.isPending}>
                {activateM.isPending ? '…' : 'Activate'}
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      <div style={{ display: 'flex', gap: 2, marginBottom: 12, borderBottom: '0.5px solid rgba(0,0,0,0.08)', paddingBottom: 0 }}>
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            style={{
              fontSize: 12, fontWeight: tab === tb.key ? 600 : 400,
              padding: '7px 14px', border: 'none', background: 'none', cursor: 'pointer',
              color: tab === tb.key ? '#1d4ed8' : '#64748b',
              borderBottom: tab === tb.key ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Company details</div>
            <Row label="Legal name"   value={t.legalName} />
            <Row label="GSTIN"        value={t.gstin} />
            <Row label="PAN"          value={t.pan} />
            <Row label="State"        value={t.state} />
            <Row label="City"         value={t.city} />
            <Row label="Address"      value={t.address} />
            <Row label="Pincode"      value={t.pincode} />
            <Row label="GST status"   value={t.gstStatus} />
            <Row label="Constitution" value={t.constitution} />
            <Row label="DB mode"      value={t.dbMode} />
            <Row label="Setup done"   value={t.isSetupComplete ? 'Yes' : 'No'} />
          </div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="card-title" style={{ marginBottom: 10 }}>Admin contact</div>
            <Row label="Name"         value={t.adminName} />
            <Row label="Email"        value={t.adminEmail} />
            <Row label="Phone"        value={t.adminPhone} />
            <Row label="Subdomain"    value={`${t.subdomain}.syntern.in`} />
            {t.customDomain && <Row label="Custom domain" value={t.customDomain} />}
            <Row label="Plan"         value={t.plan} />
            <Row label="Plan expires" value={t.planExpiresAt ? new Date(t.planExpiresAt).toLocaleDateString('en-IN') : 'No expiry set'} />
            <Row label="Joined"       value={t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'} />
            {t.suspendedAt && <Row label="Suspended at" value={new Date(t.suspendedAt).toLocaleDateString('en-IN')} />}
            {t.suspensionReason && <Row label="Suspension reason" value={t.suspensionReason} />}
          </div>
        </div>
      )}

      {}
      {tab === 'billing' && (
        <BillingConfigTab tenantId={id} />
      )}

      {}
      {tab === 'modules' && (
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <div className="card-title">Module access</div>
              <div className="card-sub">Toggle which modules this company can access</div>
            </div>
            {modM.isPending && <span style={{ fontSize: 11, color: '#94a3b8' }}>Saving…</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {modules.map(m => {
              const locked  = MODULE_ALWAYS_ON.includes(m.name);
              const checked = m.isActive;
              return (
                <div
                  key={m.name}
                  onClick={() => !locked && toggleModule(m.name, checked)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 6,
                    border: `0.5px solid ${checked ? 'rgba(22,163,74,0.3)' : 'rgba(0,0,0,0.09)'}`,
                    background: checked ? 'rgba(22,163,74,0.04)' : 'transparent',
                    cursor: locked ? 'default' : 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    background: checked ? '#16a34a' : '#e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff', fontWeight: 700,
                  }}>
                    {checked ? '✓' : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: checked ? 500 : 400 }}>{MODULE_LABELS[m.name] || m.name}</div>
                    {locked && <div style={{ fontSize: 10, color: '#94a3b8' }}>Always enabled</div>}
                    {!locked && m.isActive && m.enabledAt && (
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        Enabled {new Date(m.enabledAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {modules.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>
                Loading modules…
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {tab === 'email' && (
        <div className="card" style={{ padding: '14px 18px', maxWidth: 560 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div className="card-title">Email / SMTP configuration</div>
              <div className="card-sub">Credentials used to send emails from this tenant&apos;s domain</div>
            </div>
            {notifCfg.emailVerified && (
              <span className="badge badge-active" style={{ fontSize: 10 }}>✓ Verified</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">SMTP host *</label>
              <input className="form-input" placeholder="smtp.gmail.com" value={smtpField('emailHost')} onChange={e => setSmtpField('emailHost', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Port</label>
              <input className="form-input" type="number" placeholder="587" value={smtpField('emailPort', 587)} onChange={e => setSmtpField('emailPort', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">SSL / TLS</label>
              <select className="form-input" value={smtpField('emailSsl', false) ? 'true' : 'false'} onChange={e => setSmtpField('emailSsl', e.target.value === 'true')}>
                <option value="false">STARTTLS (port 587)</option>
                <option value="true">SSL (port 465)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">SMTP username *</label>
              <input className="form-input" placeholder="user@company.com" value={smtpField('emailUser')} onChange={e => setSmtpField('emailUser', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">SMTP password {notifCfg.hasEmailPass ? '(leave blank to keep existing)' : ''}</label>
              <input className="form-input" type="password" placeholder={notifCfg.hasEmailPass ? '••••••••' : 'Enter password'} onChange={e => setSmtpField('emailPass', e.target.value)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">From address</label>
              <input className="form-input" placeholder="HR Team <hr@company.com>" value={smtpField('emailFrom')} onChange={e => setSmtpField('emailFrom', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button
              className="btn-sm"
              style={{ padding: '7px 16px', background: smtpChanged ? '#16a34a' : undefined, color: smtpChanged ? '#fff' : undefined, borderColor: smtpChanged ? '#16a34a' : undefined }}
              onClick={saveSmtp}
              disabled={notifM.isPending}
            >
              {notifM.isPending ? 'Saving…' : smtpChanged ? 'Save changes' : 'Save'}
            </button>
            <button
              className="btn-sm"
              onClick={() => testEmailM.mutate()}
              disabled={testEmailM.isPending || (!notifCfg.emailHost && !smtp.emailHost)}
            >
              {testEmailM.isPending ? 'Sending test…' : `Send test email → ${t?.adminEmail}`}
            </button>
          </div>

          {notifCfg.emailVerified && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: 11, color: '#15803d' }}>
              ✓ SMTP verified — emails are working
            </div>
          )}
          {notifCfg.emailHost && !notifCfg.emailVerified && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: '#fffbeb', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
              ⚠ SMTP saved but not yet verified. Click &quot;Send test email&quot; to verify.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
