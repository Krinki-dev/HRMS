﻿import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { THEME } from '../../utils/uiConstants';
import { adminApi } from '../../services/adminApi';
import '../admin/AdminLayout.css';
import './AdminPlans.css';


const PLAN_COLORS = {
  free:       '#94a3b8',
  trial:      '#22c55e',
  starter:    '#3b82f6',
  pro:        '#8b5cf6',
  enterprise: '#f59e0b',
};

export default function AdminPlans() {
  const qc = useQueryClient();
  const [editPlan, setEditPlan] = useState(null);


  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  adminApi.getStats,
    staleTime: 60_000,
  });
  const stats = statsRes?.data || {};
  const bp    = stats.byPlan || {};


  const { data: plansRes } = useQuery({
    queryKey: ['plans'],
    queryFn:  () => import('../../services/api').then(m => m.default.get('/platform/admin/plans').then(r => r.data)),
    staleTime: 3600_000,
  });
  const catalogPlans = plansRes?.plans || [];
  const gstRate = plansRes?.gstRate || 0;


  const MRR = {
    free:       0,
    trial:      0,
    starter:    (bp.starter || 0) * (catalogPlans.find(p => p.id === 'starter')?.price || 1499),
    pro:        (bp.pro     || 0) * (catalogPlans.find(p => p.id === 'pro')?.price || 4999),
    enterprise: (bp.enterprise || 0) * 15000,
  };
  const totalMRR = Object.values(MRR).reduce((s, v) => s + v, 0);
  const ARR      = totalMRR * 12;


  function fmt(n) {
    if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
    if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}K`;
    return `₹${n.toLocaleString('en-IN')}`;
  }


  return (
    <div>
      {/* ── Revenue KPI cards ── */}
      <div className="stats-grid-4" style={{ marginBottom: 16 }}>

        {/* ARR */}
        <div className="stat-card">
          <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a', letterSpacing: '-0.02em' }}>{fmt(ARR)}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>Annualised revenue</div>
        </div>

        {/* MRR */}
        <div className="stat-card">
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb', letterSpacing: '-0.02em' }}>{fmt(totalMRR)}</div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>Monthly recurring revenue</div>
        </div>

        {/* Paid clients */}
        <div className="stat-card">
          <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.02em' }}>
            {(bp.starter || 0) + (bp.pro || 0) + (bp.enterprise || 0)}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>Paid clients</div>
        </div>

        {/* ARPU */}
        <div className="stat-card">
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0891b2', letterSpacing: '-0.02em' }}>
            {(() => {
              const paid = (bp.starter || 0) + (bp.pro || 0) + (bp.enterprise || 0);
              return paid > 0 ? fmt(Math.round(totalMRR / paid)) : '—';
            })()}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>Avg. revenue / client</div>
        </div>

      </div>

      {/* ── Market Share bar chart ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div className="form-label" style={{ marginBottom: 16 }}>Market Share</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 80, marginBottom: 8 }}>
          {[
            { key: 'free',       label: 'Free' },
            { key: 'trial',      label: 'Trial' },
            { key: 'starter',    label: 'Starter' },
            { key: 'pro',        label: 'Pro' },
            { key: 'enterprise', label: 'Enterprise' },
          ].map(({ key, label }) => {
            const count = bp[key] || 0;
            const max   = Math.max(...Object.values(bp || {}), 1);
            const pct   = Math.round((count / max) * 100);
            return (
              <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: PLAN_COLORS[key] }}>{count}</div>
                <div style={{
                  width: '100%',
                  height: `${Math.max(pct, 4)}%`,
                  background: PLAN_COLORS[key],
                  borderRadius: '3px 3px 0 0',
                  opacity: 0.85,
                  transition: 'height 0.3s',
                  minHeight: 4,
                }} />
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'space-around' }}>
          {[
            { key: 'free',       label: 'Free' },
            { key: 'trial',      label: 'Trial' },
            { key: 'starter',    label: 'Starter' },
            { key: 'pro',        label: 'Pro' },
            { key: 'enterprise', label: 'Enterprise' },
          ].map(({ key, label }) => (
            <div key={key} style={{ flex: 1, textAlign: 'center', fontSize: 9, color: '#94a3b8' }}>{label}</div>
          ))}
        </div>
      </div>


      {/* ── Plan cards ── */}
      <div className="plans-grid">
        {catalogPlans.filter(p => p.id !== 'trial').map(plan => {
          const count = bp[plan.id] || 0;
          const rev   = MRR[plan.id] || 0;
          const color = PLAN_COLORS[plan.id] || '#94a3b8';
          const isEdit = editPlan === plan.id;

          return (
            <div key={plan.id} className={`plan-card${plan.highlight ? ' featured' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{plan.name}</div>
                  {plan.tag && <span className="badge badge-info" style={{ fontSize: 9, marginTop: 3, display: 'inline-block' }}>{plan.tag}</span>}
                </div>
                <span style={{ background: `${color}18`, color, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                  {count} client{count !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
                {plan.price ? `₹${plan.price.toLocaleString('en-IN')}` : 'Custom'}
                {plan.period && <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>/{plan.period}</span>}
              </div>

              {rev > 0 && (
                <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 10, fontWeight: 600 }}>
                  MRR: {fmt(rev)}
                </div>
              )}

              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.07)', paddingTop: 10, marginBottom: 10 }}>
                {(plan.features || []).map((f, i) => (
                  <div key={i} style={{ display: 'flex', gap: 5, fontSize: 11, color: '#475569', padding: '2px 0' }}>
                    <span style={{ color: '#16a34a' }}>✓</span> {f}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                  {plan.maxEmployees ? `Up to ${plan.maxEmployees} employees` : 'Unlimited employees'}
                </span>
                <button className="btn-sm"
                  onClick={() => setEditPlan(isEdit ? null : plan.id)}>
                  {isEdit ? 'Cancel' : 'Edit plan'}
                </button>
              </div>

              {/* Edit plan inline panel */}
              {isEdit && (
                <div style={{ marginTop: 12, padding: '12px 14px', background: '#eff6ff', borderRadius: 8, border: '0.5px solid #bfdbfe' }}>
                  <div style={{ fontSize: 11, color: '#1d4ed8', fontWeight: 600, marginBottom: 8 }}>Edit plan config</div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
                    Global plan pricing and features are now managed dynamically. 
                    To modify the standard catalog, go to <strong>Platform Settings → Subscription Plans</strong>.
                    <br /><br />
                    To manage custom discounts or enterprise overrides for a specific client, use the <strong>Billing & Pricing</strong> tab in the Client Details page.
                  </div>
                  <button className="btn-sm" style={{ marginTop: 8 }} onClick={() => setEditPlan(null)}>Close</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Trial notice ── */}
      {(bp.trial || 0) > 0 && (
        <div className="card" style={{ padding: '12px 16px', marginTop: 14 }}>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            <strong>{bp.trial} client{bp.trial !== 1 ? 's' : ''}</strong> currently on 14-day trial.
            These are potential conversions — reach out before their trial expires.
            <a href="/admin/clients?plan=trial" style={{ color: '#2563eb', marginLeft: 8 }}>View trial clients →</a>
          </div>
        </div>
      )}
    </div>
  );
}
