import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import { THEME } from '../../utils/uiConstants';
import '../admin/AdminLayout.css';

const PLAN_COLOR = {
  free:       '#94a3b8',
  starter:    '#3b82f6',
  pro:        '#8b5cf6',
  enterprise: '#f59e0b',
};

const BADGE = {
  true:  <span className="badge badge-active">Active</span>,
  false: <span className="badge badge-suspended">Inactive</span>,
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: color || '#0f172a', lineHeight: 1, letterSpacing: '-0.03em' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey:  ['admin-stats'],
    queryFn:   adminApi.getStats,
    staleTime: 60_000,
  });

  const stats = data?.data || {};

  useEffect(() => {
    if (!stats.byPlan || !chartRef.current) return;
    let destroyed = false;

    async function buildChart() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (destroyed || !chartRef.current) return;

      chartInstance.current?.destroy();

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const gc = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
      const tc = isDark ? '#94a3b8' : '#64748b';

      const bp = stats.byPlan;
      chartInstance.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Free', 'Starter', 'Pro', 'Enterprise'],
          datasets: [{
            data:            [bp.free, bp.starter, bp.pro, bp.enterprise],
            backgroundColor: [PLAN_COLOR.free, PLAN_COLOR.starter, PLAN_COLOR.pro, PLAN_COLOR.enterprise],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} clients`,
              },
            },
          },
        },
      });
    }

    buildChart();
    return () => {
      destroyed = true;
      chartInstance.current?.destroy();
    };
  }, [stats.byPlan]);

  if (isLoading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ fontSize: 12, color: '#64748b' }}>Loading dashboard…</div>
    </div>
  );

  if (error) return (
    <div className="card" style={{ padding: 20, color: '#dc2626', fontSize: 12 }}>
      Failed to load stats: {error.message}
    </div>
  );

  const bp = stats.byPlan || {};
  const totalActive = stats.active || 0;

  return (
    <div>

      {}
      <div className="stats-grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Total companies"    value={stats.totalTenants} sub="registered" icon="🏢" />
        <StatCard label="Active now"         value={stats.activeSubs}   color="#16a34a" sub="subscriptions" icon="✅" />
        <StatCard label="New this week"      value={stats.newThisWeek} color="#3b82f6" icon="✨" />
        <StatCard label="Expiring soon"      value={stats.expiringSoon} color={stats.expiringSoon > 0 ? '#f59e0b' : undefined} sub="within 7 days" icon="⏳" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12, marginBottom: 16 }}>

        {}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent sign-ups</div>
              <div className="card-sub">Last 10 registered companies</div>
            </div>
            <Link to="/platform/tenants" className="btn-sm">View all {THEME.ICONS.FORWARD}</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Subdomain</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentTenants || []).map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.adminEmail}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{t.subdomain}.syntern.in</td>
                    <td>
                      <span style={{ background: `${PLAN_COLOR[t.plan]}22`, color: PLAN_COLOR[t.plan], fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 6, textTransform: 'uppercase' }}>
                        {t.plan?.toUpperCase()}
                      </span>
                    </td>
                    <td>{BADGE[String(!!t.isActive)]}</td>
                    <td style={{ fontSize: 10, color: '#94a3b8' }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td>
                      <Link to={`/platform/tenants/${t.id}`} className="btn-sm" style={{ padding: '4px 10px' }}>Open</Link>
                    </td>
                  </tr>
                ))}
                {!stats.recentTenants?.length && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No companies yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Market Share</div>
          <div style={{ position: 'relative', height: 160 }}>
            <canvas ref={chartRef} role="img" aria-label={`Plan distribution: ${totalActive} active clients`} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{totalActive}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>active</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Free',       key: 'free' },
              { label: 'Starter',    key: 'starter' },
              { label: 'Pro',        key: 'pro' },
              { label: 'Enterprise', key: 'enterprise' },
            ].map(({ label, key }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: PLAN_COLOR[key] }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{bp[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      {stats.expiringSoon > 0 && (
        <div style={{ background: '#fffbeb', border: '0.5px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⚠</span>
          <span><strong>{stats.expiringSoon} subscription{stats.expiringSoon !== 1 ? 's' : ''}</strong> expiring within 7 days. <Link to="/platform/tenants?status=active" style={{ color: '#b45309' }}>Review now →</Link></span>
        </div>
      )}
      {stats.suspended > 0 && (
        <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#991b1b', marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⛔</span>
          <span><strong>{stats.suspended} account{stats.suspended !== 1 ? 's' : ''}</strong> currently suspended. <Link to="/platform/tenants?status=suspended" style={{ color: '#b91c1c' }}>View →</Link></span>
        </div>
      )}
    </div>
  );
}
