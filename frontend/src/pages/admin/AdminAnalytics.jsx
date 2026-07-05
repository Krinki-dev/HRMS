import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import '../admin/AdminLayout.css';

export default function AdminAnalytics() {
  const growRef = useRef(null);
  const planRef = useRef(null);
  let growChart, planChart;

  const { data: statsRes } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn:  () => api.get('/platform/admin/analytics').then(res => res.data),
    staleTime: 60_000,
  });
  const stats = statsRes?.data || {};
  const bp    = stats.byPlan  || {};

  // Fetch plans to calculate MRR dynamically
  const { data: plansRes } = useQuery({
    queryKey: ['plans-catalog'],
    queryFn: () => api.get('/platform/admin/plans').then(res => res.data),
  });
  const catalog = plansRes?.plans || [];

  useEffect(() => {
    if (!growRef.current) return;
    let destroyed = false;
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (destroyed) return;
      growChart?.destroy();

      const gc = 'rgba(0,0,0,0.06)';
      const tc = '#64748b';

      growChart = new Chart(growRef.current, {
        type: 'bar',
        data: {
          labels: ['Trial', 'Starter', 'Pro', 'Enterprise'],
          datasets: [{
            label: 'Clients',
            data:  [bp.trial || 0, bp.starter || 0, bp.pro || 0, bp.enterprise || 0],
            backgroundColor: ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b'],
            borderRadius: 5,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 } } },
            y: { grid: { color: gc }, ticks: { color: tc, font: { size: 11 } }, beginAtZero: true },
          },
        },
      });
    }
    build();
    return () => { destroyed = true; growChart?.destroy(); };
  }, [bp.starter, bp.pro, bp.enterprise, bp.trial]);

  useEffect(() => {
    if (!planRef.current) return;
    let destroyed = false;
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (destroyed) return;
      planChart?.destroy();

      const total = stats.total || 1;
      const paid  = (bp.starter || 0) + (bp.pro || 0) + (bp.enterprise || 0);

      planChart = new Chart(planRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Free', 'Trial', 'Paid'],
          datasets: [{
            data:  [bp.free || 0, bp.trial || 0, paid],
            backgroundColor: ['#f1f5f9', '#22c55e', '#2563eb'],
            borderWidth: 0,
            hoverOffset: 4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          cutout: '65%',
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#64748b', padding: 14 } } },
        },
      });
    }
    build();
    return () => { destroyed = true; planChart?.destroy(); };
  }, [stats.total, bp.free, bp.trial]);

  const total = stats.total || 0;
  const paid  = (bp.starter || 0) + (bp.pro || 0) + (bp.enterprise || 0);
  const convPct = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Soft-coded MRR calculation based on backend catalog
  const MRR = catalog.reduce((sum, plan) => {
    const count = bp[plan.id] || 0;
    // Default fallback values if plan price is null (Enterprise)
    const price = plan.price || (plan.id === 'enterprise' ? 15000 : 0);
    return sum + (count * price);
  }, 0);

  function fmt(n) {
    if (n >= 10_00_000) return `₹${(n/10_00_000).toFixed(1)}L`;
    if (n >= 1_000)     return `₹${(n/1_000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  return (
    <div>
      <div className="stats-grid-4">
        <div className="stat-card"><div className="stat-label">Total clients</div><div className="stat-value">{total}</div></div>
        <div className="stat-card"><div className="stat-label">Paid conversion</div><div className="stat-value" style={{ color: convPct > 50 ? 'var(--admin-success)' : 'var(--admin-warning)' }}>{convPct}%</div><div className="stat-hint">{paid} of {total} clients</div></div>
        <div className="stat-card"><div className="stat-label">MRR</div><div className="stat-value" style={{ color: 'var(--admin-success)' }}>{fmt(MRR)}</div></div>
        <div className="stat-card"><div className="stat-label">New this week</div><div className="stat-value" style={{ color: 'var(--admin-accent)' }}>{stats.newThisWeek || 0}</div></div>
      </div>

      <div className="admin-page-grid-2">
        <div className="card admin-panel-body">
          <div className="card-title" style={{ marginBottom: 14 }}>Clients by plan</div>
          <div style={{ height: 200 }}><canvas ref={growRef} /></div>
        </div>
        <div className="card admin-panel-body">
          <div className="card-title" style={{ marginBottom: 14 }}>Free vs Trial vs Paid</div>
          <div style={{ height: 200 }}><canvas ref={planRef} /></div>
        </div>
      </div>

      <div className="card admin-panel-body" style={{ marginTop: 14 }}>
        <div className="card-title" style={{ marginBottom: 14 }}>Conversion funnel</div>
        {[
          { label: 'Registered', count: total, color: 'var(--admin-text-soft)', pct: 100 },
          { label: 'Started trial', count: bp.trial || 0, color: 'var(--admin-success)', pct: total > 0 ? Math.round(((bp.trial || 0) / total) * 100) : 0 },
          { label: 'Converted to paid', count: paid, color: 'var(--admin-accent)', pct: total > 0 ? Math.round((paid / total) * 100) : 0 },
        ].map((s, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{s.label}</span>
              <span style={{ color: 'var(--admin-text-muted)' }}>{s.count} ({s.pct}%)</span>
            </div>
            <div style={{ height: 8, background: 'var(--admin-surface-muted)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 4, transition: 'width 0.4s' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

