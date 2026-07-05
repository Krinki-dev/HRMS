import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/adminApi';
import { THEME } from '../../utils/uiConstants';
import '../admin/AdminLayout.css';

const PLAN_COLOR = {
  free: '#94a3b8',
  starter: '#3b82f6',
  pro: '#8b5cf6',
  enterprise: '#f59e0b',
};

const BADGE = {
  true: <span className="badge badge-active">Active</span>,
  false: <span className="badge badge-suspended">Inactive</span>,
};

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="stat-card" style={{ borderTop: color ? `3px solid ${color}` : undefined }}>
      <div className="stat-card__top">
        <div className="stat-label">{label}</div>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <div className="stat-value" style={{ color: color || 'var(--admin-text)' }}>{value ?? '—'}</div>
      {sub && <div className="stat-hint">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
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

      const bp = stats.byPlan;
      chartInstance.current = new Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Free', 'Starter', 'Pro', 'Enterprise'],
          datasets: [{
            data: [bp.free, bp.starter, bp.pro, bp.enterprise],
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
    <div className="admin-empty-state">Loading dashboard…</div>
  );

  if (error) return (
    <div className="card admin-panel-body" style={{ color: 'var(--admin-danger)', fontSize: 12 }}>
      Failed to load stats: {error.message}
    </div>
  );

  const bp = stats.byPlan || {};
  const totalActive = stats.active || 0;

  return (
    <div>
      <div className="stats-grid-4">
        <StatCard label="Total companies" value={stats.totalTenants} sub="registered" icon="🏢" />
        <StatCard label="Active now" value={stats.activeSubs} color="#16a34a" sub="subscriptions" icon="✅" />
        <StatCard label="New this week" value={stats.newThisWeek} color="#3b82f6" icon="✨" />
        <StatCard label="Expiring soon" value={stats.expiringSoon} color={stats.expiringSoon > 0 ? '#f59e0b' : undefined} sub="within 7 days" icon="⏳" />
      </div>

      <div className="admin-page-grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Recent sign-ups</div>
              <div className="card-sub">Last 10 registered companies</div>
            </div>
            <Link to="/platform/tenants" className="btn-sm">View all {THEME.ICONS.FORWARD}</Link>
          </div>
          <div className="admin-panel-body admin-table-scroll">
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
                      <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{t.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--admin-text-soft)' }}>{t.adminEmail}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{t.subdomain}.syntern.in</td>
                    <td>
                      <span className="admin-pill admin-pill--accent" style={{ background: `${PLAN_COLOR[t.plan]}22`, color: PLAN_COLOR[t.plan] }}>
                        {t.plan?.toUpperCase()}
                      </span>
                    </td>
                    <td>{BADGE[String(!!t.isActive)]}</td>
                    <td style={{ fontSize: 10, color: 'var(--admin-text-soft)' }}>
                      {t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—'}
                    </td>
                    <td>
                      <Link to={`/platform/tenants/${t.id}`} className="btn-sm">Open</Link>
                    </td>
                  </tr>
                ))}
                {!stats.recentTenants?.length && (
                  <tr><td colSpan={6} className="admin-empty-state">No companies yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card admin-chart-card">
          <div className="stat-label" style={{ marginBottom: 16 }}>Market Share</div>
          <div className="admin-chart-shell">
            <canvas ref={chartRef} role="img" aria-label={`Plan distribution: ${totalActive} active clients`} />
            <div className="admin-chart-center">
              <strong>{totalActive}</strong>
              <span>active</span>
            </div>
          </div>
          <div className="admin-chart-list">
            {[
              { label: 'Free', key: 'free' },
              { label: 'Starter', key: 'starter' },
              { label: 'Pro', key: 'pro' },
              { label: 'Enterprise', key: 'enterprise' },
            ].map(({ label, key }) => (
              <div key={key} className="admin-chart-row">
                <div className="admin-chart-label">
                  <span className="admin-chart-dot" style={{ background: PLAN_COLOR[key] }} />
                  <span>{label}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text)' }}>{bp[key] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats.expiringSoon > 0 && (
        <div className="admin-alert admin-alert--warning">
          <span>⚠</span>
          <span><strong>{stats.expiringSoon} subscription{stats.expiringSoon !== 1 ? 's' : ''}</strong> expiring within 7 days. <Link to="/platform/tenants?status=active" style={{ color: 'inherit', fontWeight: 700 }}>Review now →</Link></span>
        </div>
      )}
      {stats.suspended > 0 && (
        <div className="admin-alert admin-alert--danger" style={{ marginTop: 8 }}>
          <span>⛔</span>
          <span><strong>{stats.suspended} account{stats.suspended !== 1 ? 's' : ''}</strong> currently suspended. <Link to="/platform/tenants?status=suspended" style={{ color: 'inherit', fontWeight: 700 }}>View →</Link></span>
        </div>
      )}
    </div>
  );
}
