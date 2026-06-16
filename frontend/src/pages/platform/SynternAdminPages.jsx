﻿﻿﻿export function SynternAdminLayout() {
  const { Outlet, Link, useLocation, useNavigate } = require('react-router-dom');
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = require('../../store/authStore').useAuthStore();

  const nav = [
    { path: '/platform', label: 'Dashboard', icon: '◉' },
    { path: '/platform/tenants', label: 'Companies', icon: '⊞' },
    { path: '/platform/plans', label: 'Revenue & MRR', icon: '📊' },
    { path: '/platform/pricing', label: 'Pricing Manager', icon: '🏷️' },
    { path: '/platform/marketing', label: 'Marketing', icon: '📣' },
    { path: '/platform/subscriptions', label: 'Subscriptions', icon: '₹' },
    { path: '/platform/kyc-cache', label: 'KYC cache', icon: '⊛' },
    { path: '/platform/automation', label: 'Automation', icon: '⟳' },
    { path: '/platform/settings', label: 'Platform settings', icon: '⚙' },
  ];

  const S = {
    shell: { display: 'flex', minHeight: '100vh', background: '#040C1A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
    sidebar: { width: 220, background: '#0A1628', borderRight: '1px solid rgba(99,120,255,0.1)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    sideTop: { padding: '20px 16px 12px', borderBottom: '1px solid rgba(99,120,255,0.08)' },
    brand: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
    brandMark: { width: 28, height: 28, background: '#2563EB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff' },
    brandLabel: { fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.2px' },
    platformBadge: { fontSize: 10, color: '#60A5FA', background: 'rgba(37,99,235,0.15)', padding: '2px 7px', borderRadius: 8, fontWeight: 600, marginLeft: 36, display: 'inline-block' },
    sideNav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
    navItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
      borderRadius: 8, cursor: 'pointer', textDecoration: 'none', fontSize: 13,
      background: active ? 'rgba(37,99,235,0.15)' : 'transparent',
      color: active ? '#60A5FA' : '#64748B',
      fontWeight: active ? 600 : 400,
      transition: 'all 0.15s',
    }),
    sideBottom: { padding: '12px 8px', borderTop: '1px solid rgba(99,120,255,0.08)' },
    main: { flex: 1, display: 'flex', flexDirection: 'column' },
    topBar: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', height: 52, borderBottom: '1px solid rgba(99,120,255,0.08)',
      background: '#040C1A',
    },
    content: { flex: 1, padding: 24, overflowY: 'auto' },
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={S.shell}>
      <aside style={S.sidebar}>
        <div style={S.sideTop}>
          <div style={S.brand}>
            <div style={S.brandMark}>S</div>
            <span style={S.brandLabel}>Syntern</span>
          </div>
          <span style={S.platformBadge}>Platform Admin</span>
        </div>

        <nav style={S.sideNav}>
          {nav.map(item => {
            const active = item.path === '/platform'
              ? location.pathname === '/platform'
              : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} style={S.navItem(active)}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(99,120,255,0.05)'; e.currentTarget.style.color = '#94A3CE'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; } }}>
                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={S.sideBottom}>
          <div style={{ fontSize: 12, color: '#374151', marginBottom: 8, padding: '0 2px' }}>
            {user?.email || 'admin@syntern.in'}
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '7px 10px', background: 'none', border: '1px solid rgba(99,120,255,0.15)', borderRadius: 7, color: '#64748B', fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.target.style.borderColor = 'rgba(220,38,38,0.3)'; e.target.style.color = '#F87171'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'rgba(99,120,255,0.15)'; e.target.style.color = '#64748B'; }}>
            Sign out
          </button>
        </div>
      </aside>

      <div style={S.main}>
        <div style={S.topBar}>
          <div style={{ fontSize: 14, color: '#64748B' }}>
            Platform Admin · syntern.in
          </div>
          <div style={{ fontSize: 12, color: '#374151', display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
            All systems operational
          </div>
        </div>

        <div style={S.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function SynternSettingsPage() {
  const { useState } = require('react');
  const { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');
  const api = require('../../services/api').default;
  const { toast } = require('react-hot-toast');

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('Email / SMTP');

  // 1. Fetch settings (Triggers the backend log you were looking for)
  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const res = await api.get('/platform/admin/settings');
      return res.data;
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      await api.put('/platform/admin/settings', { section: activeTab, values });
    },
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries(['platform-settings']);
    }
  });

  const testSmtpMutation = useMutation({
    mutationFn: async (toEmail) => {
      await api.post('/platform/admin/test-smtp', { toEmail, ...settings?.[activeTab] });
    },
    onSuccess: () => toast.success('Test email sent!'),
    onError: (err) => toast.error(err.response?.data?.message || 'SMTP test failed')
  });

  if (isLoading) return <div style={{ color: '#64748B', padding: 24 }}>Loading platform settings...</div>;

  const sections = ['Email / SMTP', 'SMS gateway', 'GST settings', 'Platform', 'Security', 'Subscription Plans'];
  const current = settings?.[activeTab] || {};

  const handleSave = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const vals = Object.fromEntries(fd.entries());
    if (activeTab === 'Email / SMTP' && e.target.smtpSecure) vals.smtpSecure = e.target.smtpSecure.checked;

    // Handle JSON parsing for complex configurations like Plans
    if (activeTab === 'Subscription Plans' && vals.plans) {
      try {
        vals.plans = JSON.parse(vals.plans);
      } catch (err) {
        return toast.error('Invalid JSON format in Plans configuration');
      }
    }
    saveMutation.mutate(vals);
  };

  const S = {
    card: { background: '#0A1628', border: '1px solid rgba(99,120,255,0.1)', borderRadius: 12, overflow: 'hidden' },
    tabs: { display: 'flex', background: '#0D1A30', borderBottom: '1px solid rgba(99,120,255,0.06)' },
    tab: (active) => ({ padding: '12px 20px', fontSize: 13, fontWeight: 600, color: active ? '#60A5FA' : '#64748B', borderBottom: `2px solid ${active ? '#2563EB' : 'transparent'}`, cursor: 'pointer', transition: '0.2s' }),
    form: { padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
    field: { display: 'flex', flexDirection: 'column', gap: 6 },
    label: { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: { background: '#040C1A', border: '1px solid rgba(99,120,255,0.15)', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 14, outline: 'none' },
    btn: { padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', marginTop: 12 }
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Platform Settings</h1>
      <div style={S.card}>
        <div style={S.tabs}>
          {sections.map(s => <div key={s} style={S.tab(activeTab === s)} onClick={() => setActiveTab(s)}>{s}</div>)}
        </div>
        <form style={S.form} onSubmit={handleSave}>
          {Object.entries(current).map(([key, val]) => (key.startsWith('has') ? null : (
            <div key={key} style={{ ...S.field, gridColumn: (Array.isArray(val) || typeof val === 'object') ? 'span 2' : undefined }}>
              <label style={S.label}>{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}</label>
              {typeof val === 'boolean' ? (
                <input type="checkbox" name={key} defaultChecked={val} />
              ) : (Array.isArray(val) || typeof val === 'object') ? (
                <textarea name={key} defaultValue={JSON.stringify(val, null, 2)} style={{ ...S.input, minHeight: 180, fontFamily: 'monospace', fontSize: 12 }} />
              ) : (
                <input type={key.toLowerCase().includes('pass') || key.toLowerCase().includes('key') ? 'password' : 'text'} name={key} defaultValue={val} style={S.input} />
              )}
            </div>
          )))}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
            <button type="submit" style={S.btn}>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
            {activeTab === 'Email / SMTP' && <button type="button" style={{ ...S.btn, background: 'transparent', border: '1px solid #2563EB', color: '#60A5FA' }} onClick={() => { const email = prompt('Test email:'); if (email) testSmtpMutation.mutate(email); }}>Test SMTP</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

export function SynternDashboardPage() {
  const { useState, useEffect } = require('react');
  const { useQuery } = require('@tanstack/react-query');
  const api = require('../../services/api').default;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await api.get('/platform/admin/stats');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const { data: tenants } = useQuery({
    queryKey: ['platform-tenants-recent'],
    queryFn: async () => {
      const res = await api.get('/platform/admin/tenants?limit=5&sort=created_at');
      return res.data;
    },
  });

  const S = {
    h1: { fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 24px', letterSpacing: '-0.3px' },
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    statCard: { background: '#0A1628', border: '1px solid rgba(99,120,255,0.1)', borderRadius: 12, padding: '20px' },
    statNum: { fontSize: 36, fontWeight: 800, color: '#fff', letterSpacing: '-1px', lineHeight: 1 },
    statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 500 },
    statDelta: (positive) => ({ fontSize: 11, color: positive ? '#22C55E' : '#F87171', marginTop: 4 }),
    card: { background: '#0A1628', border: '1px solid rgba(99,120,255,0.1)', borderRadius: 12, padding: '20px' },
    cardTitle: { fontSize: 14, fontWeight: 600, color: '#E8EEFF', marginBottom: 16 },
    tableRow: { display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(99,120,255,0.06)', gap: 12, fontSize: 13 },
    badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${color}18`, color }),
  };

  const STAT_CARDS = [
    { key: 'totalTenants', label: 'Total companies', delta: '+2 this week', positive: true, icon: '⊞' },
    { key: 'activeSubs', label: 'Active subscriptions', delta: '₹' + (stats?.mrr?.toLocaleString('en-IN') || '0') + ' MRR', positive: true, icon: '₹' },
    { key: 'totalEmployees', label: 'Employees (all tenants)', delta: 'Across all companies', positive: true, icon: '◉' },
    { key: 'kycRecords', label: 'KYC cache records', delta: 'Central DB', positive: true, icon: '⊛' },
  ];

  return (
    <div>
      <h1 style={S.h1}>Platform overview</h1>

      {}
      <div style={S.grid4}>
        {STAT_CARDS.map(sc => (
          <div key={sc.key} style={S.statCard}>
            <div style={{ fontSize: 20, marginBottom: 12 }}>{sc.icon}</div>
            <div style={S.statNum}>
              {isLoading ? '—' : (stats?.[sc.key] || 0).toLocaleString('en-IN')}
            </div>
            <div style={S.statLabel}>{sc.label}</div>
            <div style={S.statDelta(sc.positive)}>{sc.delta}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        {}
        <div style={S.card}>
          <div style={S.cardTitle}>Recent company registrations</div>
          {!tenants?.length && (
            <div style={{ fontSize: 13, color: '#374151', textAlign: 'center', padding: '20px 0' }}>
              No companies registered yet
            </div>
          )}
          {tenants?.map(t => (
            <div key={t.id} style={S.tableRow}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(37,99,235,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#60A5FA', flexShrink: 0 }}>
                {t.name?.[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E8EEFF', fontWeight: 500 }}>{t.name}</div>
                <div style={{ color: '#374151', fontSize: 11 }}>{t.subdomain}.syntern.in · {new Date(t.created_at).toLocaleDateString('en-IN')}</div>
              </div>
              <span style={S.badge(t.is_active ? '#22C55E' : '#F87171')}>{t.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
        </div>

        {}
        <div style={S.card}>
          <div style={S.cardTitle}>System health</div>
          {[
            { name: 'Central DB (Supabase)', status: 'operational', color: '#22C55E' },
            { name: 'Tenant DBs', status: 'operational', color: '#22C55E' },
            { name: 'Automation queue', status: 'operational', color: '#22C55E' },
            { name: 'Email service', status: 'not configured', color: '#F59E0B' },
            { name: 'MinIO storage', status: 'local disk', color: '#F59E0B' },
            { name: 'Redis / BullMQ', status: 'in-process mode', color: '#F59E0B' },
          ].map(item => (
            <div key={item.name} style={{ ...S.tableRow, borderBottom: '1px solid rgba(99,120,255,0.04)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: '#94A3CE' }}>{item.name}</span>
              <span style={{ fontSize: 11, color: item.color }}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SynternTenantsPage() {
  const { useQuery } = require('@tanstack/react-query');
  const api = require('../../services/api').default;

  const { data, isLoading } = useQuery({
    queryKey: ['platform-tenants-all'],
    queryFn: async () => {
      const res = await api.get('/platform/admin/tenants?limit=50');
      // Fix: Backend returns { tenants: [], cursor, hasMore }
      return res.data?.data || res.data;
    },
  });

  const S = {
    h1: { fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 20px' },
    card: { background: '#0A1628', border: '1px solid rgba(99,120,255,0.1)', borderRadius: 12, overflow: 'hidden' },
    tableHead: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 16, padding: '10px 20px', background: '#0D1A30', fontSize: 11, fontWeight: 600, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' },
    tableRow: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 80px', gap: 16, padding: '12px 20px', borderTop: '1px solid rgba(99,120,255,0.06)', fontSize: 13, alignItems: 'center' },
    badge: (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${color}18`, color }),
    btnSmall: { padding: '4px 12px', background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 6, color: '#60A5FA', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' },
  };

  return (
    <div>
      <h1 style={S.h1}>Companies ({data?.length || 0})</h1>
      <div style={S.card}>
        <div style={S.tableHead}>
          <span>Company</span>
          <span>Plan</span>
          <span>DB mode</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {isLoading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#374151', fontSize: 13 }}>Loading...</div>
        )}
        {data?.tenants?.map(t => (
          <div key={t.id} style={S.tableRow}>
            <div>
              <div style={{ color: '#E8EEFF', fontWeight: 500 }}>{t.name}</div>
              <div style={{ color: '#374151', fontSize: 11 }}>{t.subdomain}.syntern.in{t.custom_domain ? ` · ${t.custom_domain}` : ''}</div>
            </div>
            <span style={S.badge('#A78BFA')}>{t.plan || 'free'}</span>
            <span style={{ color: '#64748B' }}>{t.db_mode || 'cloud'}</span>
            <span style={S.badge(t.is_active ? '#22C55E' : '#F87171')}>
              {t.is_active ? 'Active' : 'Suspended'}
            </span>
            <button style={S.btnSmall}>Manage</button>
          </div>
        ))}
      </div>
    </div>
  );
}
