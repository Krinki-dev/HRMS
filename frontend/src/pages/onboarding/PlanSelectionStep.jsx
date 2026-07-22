import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const fmt = (paise) => paise != null
  ? `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 0 })}` : '—';

// ── Loading skeleton ──────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="h-8 bg-[var(--surface-subtle)] rounded-xl w-56" />
    <div className="flex gap-2">{[1,2,3,4].map(i => <div key={i} className="h-9 w-24 bg-[var(--surface-subtle)] rounded-xl" />)}</div>
    <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="h-72 bg-[var(--surface-subtle)] rounded-2xl" />)}</div>
  </div>
);

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, selected, onSelect, modulePricing, selectedAddons, onToggleAddon, price, calcLoading }) {
  const isCustom = !plan.base_price_paise;

  return (
    <div
      onClick={() => !isCustom && onSelect(plan.slug)}
      className={`relative flex flex-col rounded-2xl border-2 transition-all p-5 bg-[var(--surface-raised)] shadow-[var(--shadow-card)]
        ${selected ? 'border-[var(--color-primary)] shadow-[0_0_0_4px_var(--accent-soft)]' :
          isCustom ? 'border-[var(--border-color)]' :
          'border-[var(--border-color)] hover:border-[var(--color-primary)] hover:shadow-md cursor-pointer'}`}
    >
      {/* Badge */}
      {plan.is_popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-[var(--text-on-accent)] text-xs font-semibold px-3.5 py-1 rounded-full shadow-sm">
          ⭐ {plan.badge || 'Most Popular'}
        </div>
      )}
      {!plan.is_popular && plan.badge && (
        <div className="absolute -top-3.5 left-5 bg-[var(--warning-soft)] text-[var(--color-warning)] text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[var(--text-primary)]">{plan.name}</h3>
          {selected && <span className="text-[var(--color-primary)] text-base">✓</span>}
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{plan.tagline}</p>
      </div>

      {/* Price */}
      <div className="mb-4 min-h-[3rem]">
        {isCustom ? (
          <div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">Custom</p>
            <p className="text-xs text-[var(--text-secondary)]">Contact us for pricing</p>
          </div>
        ) : calcLoading && selected ? (
          <div className="h-8 bg-[#F1F5F9] rounded-lg animate-pulse w-28" />
        ) : price ? (
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{fmt(price.breakdown?.monthly_subtotal)}</span>
              <span className="text-xs text-[var(--text-secondary)]">/month</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {plan.employee_cap ? `Up to ${plan.employee_cap} employees` : 'Unlimited employees'}
            </p>
            {price.breakdown?.tenure_discount_pct > 0 && (
              <p className="text-xs text-green-600 font-medium mt-0.5">
                Save {price.breakdown.tenure_discount_pct}% on this billing period
              </p>
            )}
          </div>
        ) : (
          <div>
            <p className="text-2xl font-bold text-[#111827]">{fmt(plan.base_price_paise)}</p>
            <p className="text-xs text-[#94A3B8]">/month base</p>
          </div>
        )}
      </div>

      {/* Highlights */}
      {plan.highlights?.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {plan.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--color-success)] mt-0.5 flex-shrink-0 font-bold">✓</span>
              {h}
            </li>
          ))}
        </ul>
      )}

      {/* Addons (selected plan only) */}
      {selected && plan.addon_modules?.length > 0 && (
        <div className="mt-auto pt-4 border-t border-[var(--border-color)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2.5">Add-on Modules</p>
          <div className="space-y-2">
            {plan.addon_modules.map(mod => {
              const mp = modulePricing[mod];
              if (!mp) return null;
              const active = selectedAddons.includes(mod);
              const costLabel = mp.type === 'per_employee'
                ? `${fmt(mp.price_paise)}/emp/mo` : `${fmt(mp.price_paise)}/mo`;
              return (
                <label key={mod} className="flex items-center gap-2 cursor-pointer group">
                  <div
                    onClick={() => onToggleAddon(mod)}
                    className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors
                      ${active ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--border-color)] group-hover:border-[var(--color-primary)]'}`}
                  >
                    {active && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
                  </div>
                  <span className="text-xs text-[var(--text-secondary)] flex-1">{mp.label || mod}</span>
                  <span className="text-xs font-medium text-[var(--color-primary)]">{costLabel}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {isCustom && (
        <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
          <a
            href={`mailto:sales@${window.location.hostname.split('.').slice(-2).join('.')}`}
            className="block text-center text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Contact Sales →
          </a>
        </div>
      )}
    </div>
  );
}

// ── Price Summary ─────────────────────────────────────────────────────────────
function PriceSummary({ price, billingMonths, promoCode, setPromoCode, onValidatePromo, promoStatus }) {
  if (!price || price.isCustomQuote) return null;
  const { breakdown, total_paise } = price;
  return (
    <div className="bg-[var(--surface-raised)] border border-[var(--border-color)] rounded-2xl p-5 shadow-sm">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-sm">Price Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>Base plan</span><span>{fmt(breakdown.base_monthly_paise)}/mo</span>
        </div>
        {breakdown.excess_paise > 0 && (
          <div className="flex justify-between text-[#475569]">
            <span>Employee overage</span><span>+{fmt(breakdown.excess_paise)}/mo</span>
          </div>
        )}
        {breakdown.addons?.map(a => (
          <div key={a.module} className="flex justify-between text-[#475569]">
            <span>{a.label}</span><span>+{fmt(a.monthly_paise)}/mo</span>
          </div>
        ))}
        {billingMonths > 1 && (
          <>
            <div className="border-t border-[var(--border-color)] pt-2 flex justify-between text-[var(--text-secondary)]">
              <span>Subtotal × {billingMonths} months</span><span>{fmt(breakdown.gross_paise)}</span>
            </div>
            {breakdown.total_discount_pct > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({breakdown.total_discount_pct}%)</span>
                <span>−{fmt(breakdown.discount_paise)}</span>
              </div>
            )}
          </>
        )}
        {breakdown.promo_deduction_paise > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Promo: {breakdown.promo?.code}</span>
            <span>−{fmt(breakdown.promo_deduction_paise)}</span>
          </div>
        )}
        <div className="border-t border-[var(--border-color)] pt-2 flex justify-between text-[var(--text-secondary)]">
          <span>Before GST</span><span>{fmt(breakdown.amount_before_tax)}</span>
        </div>
        <div className="flex justify-between text-[var(--text-secondary)]">
          <span>GST 18%</span><span>+{fmt(breakdown.gst_paise)}</span>
        </div>
      </div>
      <div className="border-t border-[var(--border-color)] mt-3 pt-3 flex justify-between">
        <span className="font-semibold text-[var(--text-primary)]">Total</span>
        <div className="text-right">
          <span className="text-xl font-bold text-[var(--text-primary)]">{fmt(total_paise)}</span>
          {billingMonths > 1 && <p className="text-xs text-[var(--text-secondary)]">for {billingMonths} months</p>}
        </div>
      </div>

      {/* Promo input */}
      <div className="mt-4">
        <div className="flex gap-2">
          <input
            value={promoCode}
            onChange={e => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Promo code"
            className="flex-1 border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-primary)] uppercase tracking-wider bg-[var(--surface-muted)]"
          />
          <button
            onClick={onValidatePromo}
            className="px-3 py-2 bg-[var(--surface-subtle)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--bg-hover)]"
          >Apply</button>
        </div>
        {promoStatus === 'valid'   && <p className="text-xs text-green-600 mt-1.5">✓ Promo applied!</p>}
        {promoStatus === 'invalid' && <p className="text-xs text-red-500 mt-1.5">✗ Invalid or expired code</p>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
/**
 * PlanSelectionStep — Drop-in replacement for the 'plan' step in OnboardingWizard.
 *
 * Props:
 *   onNext({ planSlug, selectedAddons, billingMonths, promoCode, priceResult, startTrial })
 *     → pass directly to handlePlanNext in OnboardingWizard
 *   onBack()          optional back button
 *   employeeCount     integer (from a prior step, default 0)
 */
export default function PlanSelectionStep({ onNext, onBack, employeeCount = 0 }) {
  const [catalog,       setCatalog]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [selectedPlan,  setSelectedPlan]  = useState('starter');
  const [selectedAddons,setAddons]        = useState([]);
  const [billingMonths, setBilling]       = useState(1);
  const [renewalMode,  setRenewalMode]    = useState('manual');
  const [promoCode,     setPromoCode]     = useState('');
  const [promoStatus,   setPromoStatus]   = useState(null);
  const [price,         setPrice]         = useState(null);
  const [calcLoading,   setCalcLoading]   = useState(false);
  const [proceeding,    setProceeding]    = useState(false);

  // Load catalog
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/platform/plans');
        const { plans, modulePricing, discounts } = res.data.data;
        setCatalog({ plans, modulePricing, discounts });
        const popular = plans.find(p => p.is_popular) || plans.find(p => p.base_price_paise);
        if (popular) setSelectedPlan(popular.slug);
      } catch { }
      finally { setLoading(false); }
    })();
  }, []);

  // Recalculate on any change
  const recalc = useCallback(async (slug, addons, months, code) => {
    const plan = catalog?.plans?.find(p => p.slug === slug);
    if (!plan?.base_price_paise) { setPrice(null); return; }
    setCalcLoading(true);
    try {
      const res = await api.post('/platform/plans/calculate', {
        planSlug: slug, selectedAddons: addons,
        billingMonths: months, employeeCount,
        promoCode: code || undefined,
      });
      setPrice(res.data.data);
    } catch { setPrice(null); }
    finally { setCalcLoading(false); }
  }, [catalog, employeeCount]);

  useEffect(() => {
    if (catalog) recalc(selectedPlan, selectedAddons, billingMonths, promoStatus === 'valid' ? promoCode : '');
  }, [selectedPlan, selectedAddons, billingMonths, catalog]);

  const handleToggleAddon = (mod) =>
    setAddons(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    try {
      await api.post('/platform/plans/validate-promo', { code: promoCode });
      setPromoStatus('valid');
      recalc(selectedPlan, selectedAddons, billingMonths, promoCode);
    } catch { setPromoStatus('invalid'); }
  };

  const handleProceed = async (startTrial = false) => {
    if (!selectedPlan) return;
    setProceeding(true);
    try {
      await onNext({
        // NEW format — consumed by updated payment.controller.js
        planSlug:      selectedPlan,
        selectedAddons,
        billingMonths,
        renewalMode,
        promoCode:     promoStatus === 'valid' ? promoCode : '',
        priceResult:   price,
        startTrial,
        // LEGACY keys for backward compat with old verifySubscription
        planId:        selectedPlan,
        period:        billingMonths === 12 ? 'yearly' : 'monthly',
        addons:        selectedAddons,
        method:        'razorpay',
      });
    } finally { setProceeding(false); }
  };

  if (loading) return <Skeleton />;

  const { plans = [], modulePricing = {}, discounts = {} } = catalog || {};
  const currentPlan = plans.find(p => p.slug === selectedPlan);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">Choose your plan</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Select a plan that fits your team — basic free forever, configurable add-ons, or full-pro access.</p>
      </div>

      {/* Billing cycle */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Billing Cycle</p>
        <div className="flex gap-2 flex-wrap">
          {(discounts.tenure
            ? [{ months: 1, label: 'Monthly', pct: 0 }, ...discounts.tenure.map(t => ({ months: t.months, label: t.label, pct: t.pct, note: t.note }))]
            : [{ months: 1, label: 'Monthly', pct: 0 }, { months: 12, label: 'Annual', pct: 17, note: '~2 months free' }]
          ).map(opt => (
            <button
              key={opt.months}
              onClick={() => setBilling(opt.months)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                billingMonths === opt.months
                  ? 'border-[var(--color-primary)] bg-[var(--accent-soft)] text-[var(--color-primary)]'
                  : 'border-[var(--border-color)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]'
              }`}
            >
              {opt.label}
              {opt.pct > 0 && (
                <span className={`ml-1.5 text-xs font-semibold ${billingMonths === opt.months ? 'text-[var(--color-success)]' : 'text-[var(--color-success)]'}`}>
                  −{opt.pct}%
                </span>
              )}
              {opt.months === 12 && (
                <span className="absolute -top-2.5 -right-2 bg-[var(--color-success)] text-[var(--text-on-accent)] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Best
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Renewal Mode</p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setRenewalMode('manual')}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              renewalMode === 'manual'
                ? 'border-[var(--color-primary)] bg-[var(--accent-soft)] text-[var(--color-primary)]'
                : 'border-[var(--border-color)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]'
            }`}
          >
            Manual renewal
          </button>
          <button
            type="button"
            onClick={() => setRenewalMode('auto')}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              renewalMode === 'auto'
                ? 'border-[var(--color-primary)] bg-[var(--accent-soft)] text-[var(--color-primary)]'
                : 'border-[var(--border-color)] bg-[var(--surface-raised)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]'
            }`}
          >
            Auto renewal
          </button>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-2">
          {renewalMode === 'auto'
            ? 'Subscription renewal will be attempted automatically on due date.'
            : 'Renewal will stay manual. Admin can approve and pay each cycle.'}
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlan === plan.slug}
            onSelect={setSelectedPlan}
            modulePricing={modulePricing}
            selectedAddons={selectedAddons}
            onToggleAddon={handleToggleAddon}
            price={selectedPlan === plan.slug ? price : null}
            calcLoading={calcLoading && selectedPlan === plan.slug}
          />
        ))}
      </div>

      {/* Bundle discount badge */}
      {discounts.bundle && selectedAddons.length >= (discounts.bundle.trigger_count || 3) && (
        <div className="flex items-center gap-2 bg-[var(--success-soft)] border border-[var(--border-color)] rounded-xl px-4 py-2.5">
          <span>🎁</span>
          <span className="text-sm text-[var(--color-success)] font-medium">
            Bundle discount: {discounts.bundle.pct}% off — {selectedAddons.length} add-ons selected!
          </span>
        </div>
      )}

      {/* Price summary */}
      <PriceSummary
        price={price}
        billingMonths={billingMonths}
        promoCode={promoCode}
        setPromoCode={setPromoCode}
        onValidatePromo={handleValidatePromo}
        promoStatus={promoStatus}
      />

      {/* Trial note */}
      {currentPlan?.is_trial_eligible && (
        <div className="flex items-center gap-2 bg-[var(--accent-soft)] border border-[var(--border-color)] rounded-xl px-4 py-3">
          <span>🎁</span>
          <span className="text-sm text-[var(--color-primary)]">
            Start with a <strong>{currentPlan.trial_days}-day free trial</strong> — no payment needed to begin.
          </span>
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between pt-2">
        {onBack && (
          <button onClick={onBack} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">← Back</button>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {currentPlan?.is_trial_eligible && (
            <button
              onClick={() => handleProceed(true)}
              disabled={proceeding}
              className="text-sm font-medium text-[var(--color-primary)] hover:underline disabled:opacity-50"
            >
              Start free trial instead
            </button>
          )}
          <button
            onClick={() => handleProceed(false)}
            disabled={!selectedPlan || proceeding}
            className="px-6 py-2.5 bg-[var(--color-primary)] text-[var(--text-on-accent)] text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] disabled:opacity-50 flex items-center gap-2"
          >
            {proceeding
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Processing…</>
              : <>Continue to Payment →</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
