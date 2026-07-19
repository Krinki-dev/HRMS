import { useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { THEME } from '../../utils/theme';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { DEFAULT_PLAN_CATALOG, normalizePlanCatalog } from './planCatalog';

const C = {
  blue: THEME.colors.accent,
  green: THEME.colors.success,
  amber: THEME.colors.warning,
  purple: '#7c3aed',
  red: THEME.colors.error,
  muted: THEME.colors.textMuted,
  border: 'var(--border-color)',
  surface: 'var(--surface-raised)',
  surfaceAlt: 'var(--surface-muted)',
};

const PLAN_META = {
  free:         { color: THEME.plan?.free?.accent || C.green, label: 'Basic / Free', background: THEME.plan?.free?.badgeBg || 'var(--accent-soft)', note: 'Free forever • up to 200 employees • DB optional' },
  trial:        { color: THEME.plan?.trial?.accent || C.green, label: '14-Day Trial', background: THEME.plan?.trial?.badgeBg || 'var(--success-soft)', note: 'Try the full product before billing' },
  starter:      { color: THEME.plan?.custom?.accent || C.blue, label: 'Custom / Add-on', background: THEME.plan?.custom?.badgeBg || 'var(--accent-soft)', note: 'Choose add-ons and modules on demand' },
  professional: { color: THEME.plan?.pro?.accent || C.purple, label: 'Pro', background: THEME.plan?.pro?.badgeBg || 'var(--accent-soft)', note: 'Full access, automation, and support' },
  pro:          { color: THEME.plan?.pro?.accent || C.purple, label: 'Pro', background: THEME.plan?.pro?.badgeBg || 'var(--accent-soft)', note: 'Full access, automation, and support' },
  enterprise:   { color: THEME.plan?.pro?.accent || C.amber, label: 'Pro', background: THEME.plan?.pro?.badgeBg || 'var(--warning-soft)', note: 'Scale without employee limits' },
};

function PlanBadge({ plan }) {
  const m = PLAN_META[plan] || PLAN_META.free;
  return (
    <span style={{ background: m.background || 'var(--accent-soft)', color: m.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6 }}>
      {m.label}
    </span>
  );
}

export default function BillingPage() {
  const { user, setPlan } = useAuthStore();
  const [selectedPlan,   setSelectedPlan]   = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [paying, setPaying] = useState(false);

  const { data: planRes, isLoading: planLoading, refetch } = useQuery({
    queryKey: ['my-plan'],
    queryFn:  () => api.get('/platform/my-plan').then(r => r.data),
    staleTime: 60_000,
  });
  const planData = planRes?.data?.plan || {};

  const { data: plansRes } = useQuery({
    queryKey: ['plans'],
    queryFn:  () => api.get('/platform/plans').then(r => r.data),
    staleTime: 3600_000,
  });
  const plans = useMemo(() => {
    const payload = plansRes?.data || plansRes || {};
    const normalized = normalizePlanCatalog(payload, DEFAULT_PLAN_CATALOG);
    return normalized.filter(p => p.slug !== 'trial');
  }, [plansRes]);

  const trialM = useMutation({
    mutationFn: () => api.post('/platform/subscribe/trial'),
    onSuccess:  (r) => {
      toast.success('14-day free trial activated!');
      setPlan('trial', r.data?.data?.expiresAt);
      refetch();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function handleUpgrade(planId, period) {
    if (paying) return;
    setPaying(true);
    try {
      const r = await api.post('/platform/subscribe/order', { planId, period });
      const o = r.data?.data;

      if (o.mock) {
        
        await api.post('/platform/subscribe/verify', { planId, period, mock: true });
        toast.success('Plan activated (dev mode)');
        setPlan(planId, null);
        refetch();
        setPaying(false);
        return;
      }

      if (!window.Razorpay) {
        await new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = res; s.onerror = rej;
          document.head.appendChild(s);
        });
      }

      const plan = plans.find(p => p.id === planId);
      const rzp  = new window.Razorpay({
        key:         o.keyId,
        amount:      o.amount,
        currency:    o.currency,
        name:        'Syntern HRMS',
        description: `${plan?.name} — ${period}`,
        order_id:    o.orderId,
        prefill:     { email: user?.email, name: user?.name },
        theme:       { color: C.blue },
        handler: async (resp) => {
          try {
            await api.post('/platform/subscribe/verify', {
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              planId, period,
            });
            toast.success(`${plan?.name} plan activated!`);
            setPlan(planId, null);
            refetch();
          } catch { toast.error('Payment verification failed'); }
          finally  { setPaying(false); }
        },
        modal: { ondismiss: () => { toast.error('Payment cancelled'); setPaying(false); } },
      });
      rzp.open();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed');
      setPaying(false);
    }
  }

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const daysLeft = planData.daysLeft;
  const expired  = planData.expired;
  const isFree   = !planData.id || planData.id === 'free';

  return (
    <div>
      {}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 20, background: 'var(--surface-raised)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>CURRENT PLAN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{planData.name || 'Free'}</div>
              <PlanBadge plan={planData.id || 'free'} />
              {expired && <span style={{ fontSize: 11, background: 'var(--danger-soft)', color: 'var(--color-danger)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>Expired</span>}
            </div>
            {planData.expiresAt && (
              <div style={{ fontSize: 11, color: expired ? 'var(--color-danger)' : 'var(--text-secondary)', marginTop: 4 }}>
                {expired ? 'Expired on' : 'Renews on'}: {fmt(planData.expiresAt)}
                {!expired && daysLeft <= 14 && (
                  <span style={{ color: daysLeft <= 3 ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 600, marginLeft: 8 }}>
                    ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {isFree && (
              <button
                style={{ padding: '8px 18px', background: 'var(--color-success)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                onClick={() => trialM.mutate()}
                disabled={trialM.isPending}
              >
                {trialM.isPending ? 'Activating…' : 'Start 14-day free trial →'}
              </button>
            )}
          </div>
        </div>

        {}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 18 }}>
          {[
            { label: 'Max employees',  value: planData.maxEmployees === 999999 || !planData.maxEmployees ? 'Unlimited' : planData.maxEmployees },
            { label: 'Plan joined',    value: fmt(planData.joinedAt) },
            { label: 'Modules',        value: Array.isArray(planData.modules) ? (planData.modules.includes('*') ? 'All modules' : `${planData.modules.length} modules`) : '—' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface-muted)', borderRadius: 7, padding: '10px 12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="card-title" style={{ marginBottom: 12, padding: '0 4px', color: 'var(--text-primary)' }}>
        {expired ? 'Reactivate your plan' : 'Choose a plan'}
      </div>

      {}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { id: 'monthly', label: 'Monthly' },
          { id: 'yearly',  label: 'Yearly  (2 months free)' },
        ].map(p => (
          <button key={p.id}
            onClick={() => setSelectedPeriod(p.id)}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: selectedPeriod === p.id ? 600 : 400,
              background: selectedPeriod === p.id ? 'var(--accent-soft)' : 'var(--surface-muted)',
              color: selectedPeriod === p.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: `1px solid ${selectedPeriod === p.id ? 'var(--color-primary)' : 'var(--border-color)'}`,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
        {plans.map(plan => {
          const isCustom = plan.price === null;
          const months   = selectedPeriod === 'yearly' ? 12 : 1;
          const yearlyDiscount = selectedPeriod === 'yearly' && typeof plan.price === 'number' ? Math.max(plan.price * 2, 0) : 0;
          const total    = typeof plan.price === 'number' ? (plan.price * months) - yearlyDiscount : null;
          const isCurrentPlan = planData.id === plan.id && !expired;

          return (
            <div key={plan.id}
              style={{
                background: 'var(--surface-raised)', border: `2px solid ${plan.highlight ? 'var(--color-primary)' : 'var(--border-color)'}`,
                borderRadius: 12, padding: '18px 16px', position: 'relative', boxShadow: 'var(--shadow-card)',
              }}
            >
              {plan.tag && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: C.purple, color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 10px', borderRadius: 10, whiteSpace: 'nowrap' }}>
                  {String(plan.tag).toUpperCase()}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
                {PLAN_META[plan.slug]?.note || PLAN_META[plan.id]?.note || plan.desc || 'Flexible subscription options with configurable modules.'}
              </div>

              {typeof plan.price === 'number' ? (
                <div style={{ marginBottom: 14 }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
                    ₹{total?.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{selectedPeriod === 'yearly' ? 'year' : 'month'}</span>
                  {selectedPeriod === 'yearly' && (
                    <div style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>Save ₹{yearlyDiscount.toLocaleString()}</div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>Custom quote</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {(plan.features || []).map(f => (
                  <div key={f} style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              {isCurrentPlan ? (
                <div style={{ padding: '8px', background: 'var(--success-soft)', borderRadius: 6, textAlign: 'center', fontSize: 12, color: 'var(--color-success)', fontWeight: 600 }}>
                  ✓ Current plan
                </div>
              ) : plan.price !== null ? (
                <button
                  style={{ width: '100%', padding: '9px', background: plan.highlight ? 'var(--color-primary)' : 'var(--color-primary)', color: 'var(--text-on-accent)', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: paying ? 'not-allowed' : 'pointer' }}
                  onClick={() => handleUpgrade(plan.id, selectedPeriod)}
                  disabled={paying}
                >
                  {paying ? 'Processing…' : `Upgrade to ${plan.name} →`}
                </button>
              ) : (
                <a href="mailto:sales@syntern.in?subject=Custom plan enquiry"
                  style={{ display: 'block', width: '100%', padding: '9px', background: '#fef3c7', color: C.amber, border: '1px solid #fde68a', borderRadius: 7, fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>
                  Contact sales →
                </a>
              )}
            </div>
          );
        })}
      </div>

      {}
      <div className="card" style={{ padding: '14px 18px', background: 'var(--surface-raised)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <strong>All plans include:</strong> Employee management · Attendance · Leave · Payroll · Compliance (PF/ESI/PT/TDS/LWF) · KYC & GST automation · No per-seat charges · Unlimited employees on Pro+
          <br />
          <strong>Questions?</strong> Email us at <a href="mailto:support@syntern.in" style={{ color: 'var(--color-primary)' }}>support@syntern.in</a> or WhatsApp us.
        </div>
      </div>
    </div>
  );
}

