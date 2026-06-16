import '../admin/AdminLayout.css';
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './AdminSettings.css';

const SECTIONS = ['Platform', 'Email / SMTP', 'SMS gateway', 'GST settings', 'Security'];

const FORM_SCHEMA = {
  'Platform': [
    { key: 'platformName',  label: 'Platform name',        type: 'text',     placeholder: 'Syntern HRMS',        envKey: 'PRODUCT_NAME' },
    { key: 'primaryDomain', label: 'Primary domain',        type: 'text',     placeholder: 'syntern.in',          envKey: 'PRODUCT_DOMAIN' },
    { key: 'supportEmail',  label: 'Support email',         type: 'email',    placeholder: 'support@syntern.in',  envKey: 'SUPPORT_EMAIL' },
    { key: 'trialDays',     label: 'Default trial days',    type: 'select',   placeholder: '14',
      options: [{ v:'7', l:'7 days' }, { v:'14', l:'14 days' }, { v:'30', l:'30 days' }],
      envKey: 'DEFAULT_TRIAL_DAYS' },
  ],
  'Email / SMTP': [
    { key: 'smtpHost',   label: 'SMTP host',       type: 'text',     placeholder: 'smtp.gmail.com',       envKey: 'SMTP_HOST' },
    { key: 'smtpPort',   label: 'SMTP port',       type: 'text',     placeholder: '587',                  envKey: 'SMTP_PORT' },
    { key: 'smtpUser',   label: 'SMTP username',   type: 'text',     placeholder: 'admin@syntern.in',     envKey: 'SMTP_USER' },
    { key: 'smtpPass',   label: 'SMTP password',   type: 'password', placeholder: '(leave blank to keep)', envKey: 'SMTP_PASS' },
    { key: 'smtpFrom',   label: 'From address',    type: 'email',    placeholder: 'noreply@syntern.in',   envKey: 'SMTP_FROM' },
    { key: 'smtpSecure', label: 'SSL / TLS',       type: 'select',   placeholder: 'false',
      options: [{ v:'false', l:'STARTTLS (587)' }, { v:'true', l:'SSL (465)' }],
      envKey: 'SMTP_SECURE' },
  ],
  'SMS gateway': [
    { key: 'smsProvider', label: 'Default provider', type: 'select', placeholder: 'fast2sms',
      options: [{ v:'fast2sms', l:'Fast2SMS' }, { v:'msg91', l:'MSG91' }, { v:'none', l:'Disabled' }],
      envKey: 'SMS_PROVIDER' },
    { key: 'smsApiKey',   label: 'API key (platform fallback)', type: 'password', placeholder: '(leave blank to keep)', envKey: 'SMS_API_KEY' },
    { key: 'smsSender',   label: 'Default sender ID',           type: 'text',     placeholder: 'SYNTRN',               envKey: 'SMS_SENDER' },
  ],
  'GST settings': [
    { key: 'gstScrapeMode', label: 'Fetch method', type: 'select', placeholder: 'playwright',
      options: [{ v:'playwright', l:'Playwright automation (free)' }, { v:'gsp', l:'GSP API (paid key required)' }],
      envKey: 'GST_SCRAPE_MODE' },
    { key: 'gstCacheDays',  label: 'Cache TTL (days)', type: 'text', placeholder: '30', envKey: 'GST_CACHE_DAYS' },
  ],
  'Security': [
    { key: 'jwtExpiry',    label: 'Access token TTL', type: 'select', placeholder: '15m',
      options: [{ v:'15m', l:'15 minutes (recommended)' }, { v:'30m', l:'30 minutes' }, { v:'1h', l:'1 hour' }],
      envKey: 'JWT_ACCESS_EXPIRES' },
    { key: 'maxLoginAttempts', label: 'Max login attempts (per 15 min)', type: 'select', placeholder: '5',
      options: [{ v:'3', l:'3' }, { v:'5', l:'5 (default)' }, { v:'10', l:'10' }],
      envKey: 'MAX_LOGIN_ATTEMPTS' },
    { key: 'rateLimit',    label: 'Global rate limit (req / 15 min)', type: 'text', placeholder: '100', envKey: 'RATE_LIMIT' },
  ],
};

export default function AdminSettings() {
  const [active, setActive] = useState('Platform');
  const [values, setValues] = useState({});
  const [testEmail, setTestEmail] = useState('');

  // 1. Fetch settings from DB (Live Override) or .env (Fallback)
  const { data: serverData, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => api.get('/platform/admin/settings').then(res => res.data),
  });

  const saveM = useMutation({
    mutationFn: (data) => api.put('/platform/admin/settings', data),
    onSuccess:  () => toast.success('Settings saved'),
    onError:    (e) => toast.error(e.response?.data?.message || 'Failed to save'),
  });

  const testSmtpM = useMutation({
    mutationFn: () => api.post('/platform/admin/test-smtp', { toEmail: testEmail }),
    onSuccess:  (r) => toast.success(`Test email sent to ${r.data?.sentTo || testEmail}`),
    onError:    (e) => toast.error(e.response?.data?.message || 'SMTP test failed'),
  });

  const fields = FORM_SCHEMA[active] || [];

  const currentValues = serverData?.[active] || {};

  function set(key, val) {
    setValues(v => ({ ...v, [key]: val }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveM.mutate({ section: active, values: { ...currentValues, ...values } });
  }

  if (isLoading) return <div className="p-10 text-center text-gray-400">Loading configurations...</div>;

  return (
    <div className="hr-settings-layout">

      {}
      <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
        <div className="card-header">
          <div className="card-title">Platform settings</div>
        </div>
        {SECTIONS.map(s => (
          <button
            key={s}
            className={`hr-settings-btn${active === s ? ' active' : ''}`}
            onClick={() => setActive(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {}
      <div className="card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{active}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {active === 'Platform' && 'Global platform identity and branding settings.'}
              {active === 'Email / SMTP' && 'Platform-level SMTP for system emails (new company welcome, billing). Tenant-specific SMTP is set per client.'}
              {active === 'SMS gateway' && 'Platform fallback SMS provider. Individual clients configure their own in their settings.'}
              {active === 'GST settings' && 'How GST numbers are verified during company registration.'}
              {active === 'Security' && 'Global auth and security policies applied to all tenants.'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {fields.map(f => (
              <div key={f.key} className="form-group" style={{ gridColumn: f.type === 'password' && f.key === 'smtpPass' ? '1/-1' : undefined, margin: 0 }}>
                <label className="form-label">
                  {f.label}
                  <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 6 }}>env: {f.envKey}</span>
                </label>
                {f.type === 'select' ? (
                  <select
                    className="form-input"
                    defaultValue={currentValues[f.key] || f.placeholder}
                    onChange={e => set(f.key, e.target.value)}
                  >
                    {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                ) : (
                  <input
                    className="form-input"
                    type={f.type}
                    placeholder={f.placeholder}
                    defaultValue={currentValues[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>

          {}
          {active === 'Email / SMTP' && (
            <div style={{ marginTop: 14, padding: '12px 14px', background: '#f8fafc', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Send a test email to</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@syntern.in"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="btn-sm"
                style={{ padding: '7px 14px', whiteSpace: 'nowrap' }}
                onClick={() => testSmtpM.mutate()}
                disabled={testSmtpM.isPending || !testEmail}
              >
                {testSmtpM.isPending ? 'Sending…' : 'Test SMTP'}
              </button>
            </div>
          )}

          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="submit"
              className="btn-sm"
              style={{ padding: '8px 20px', background: '#16a34a', color: '#fff', borderColor: '#16a34a' }}
              disabled={saveM.isPending}
            >
              {saveM.isPending ? 'Saving…' : 'Save settings'}
            </button>
            {saveM.isSuccess && <span style={{ fontSize: 11, color: '#16a34a' }}>✓ Saved</span>}
          </div>

          {}
          <div style={{ marginTop: 14, padding: '10px 12px', background: '#fffbeb', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
            <strong>Note:</strong> Platform settings that map to .env variables (JWT secret, SMTP credentials) require a server restart to take effect after saving. Settings are stored in the central DB and applied on next startup.
          </div>
        </form>
      </div>
    </div>
  );
}

