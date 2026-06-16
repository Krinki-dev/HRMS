'use strict';
/**
 * @file plans.service.js
 * Platform plan catalog — fully DB-driven via platform_settings.
 * Falls back to hardcoded defaults on first run.
 * FROZEN: uses stable slugs + fixed UUIDs so IDs never drift between restarts.
 */
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { v4: uuidv4 }    = require('uuid');
const logger            = require('../../shared/utils/logger');

// ── DB storage keys ──────────────────────────────────────────────────────────
const KEY = {
  PLANS:     'platform_plans',
  PRICING:   'module_pricing',
  DISCOUNTS: 'discount_config',
  PROMOS:    'promo_codes',
};

// ── STABLE default UUIDs (hardcoded so they never change between restarts) ───
const DEFAULT_PLANS = [
  {
    id: 'a1b2c3d4-0001-4000-8000-000000000001',
    slug: 'starter',
    name: 'Starter',
    tagline: 'Core HR for small businesses',
    badge: null,
    is_active: true,
    is_popular: false,
    sort_order: 1,
    base_price_paise: 149900,
    employee_cap: 25,
    per_employee_excess_paise: 5000,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation'],
    addon_modules: ['recruitment','performance','training','expenses','assets','fieldforce','ai'],
    highlights: [
      'Core HR Foundation',
      'Attendance & Leave',
      'Payroll & Compliance (ALL plans)',
      'Browser Automation (EPFO/GST/KYC)',
      'Standard email support',
    ],
    is_trial_eligible: true,
    trial_days: 90,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    slug: 'professional',
    name: 'Professional',
    tagline: 'Full HRMS for growing teams',
    badge: 'Most Popular',
    is_active: true,
    is_popular: true,
    sort_order: 2,
    base_price_paise: 349900,
    employee_cap: 100,
    per_employee_excess_paise: 4000,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation','recruitment','performance','training'],
    addon_modules: ['expenses','assets','fieldforce','ai'],
    highlights: [
      'Everything in Starter',
      'Recruitment ATS + Kanban',
      'Performance & Training modules',
      'Priority support',
    ],
    is_trial_eligible: true,
    trial_days: 30,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    slug: 'enterprise',
    name: 'Enterprise',
    tagline: 'Unlimited scale, own infrastructure',
    badge: 'Custom',
    is_active: true,
    is_popular: false,
    sort_order: 3,
    base_price_paise: null,
    employee_cap: null,
    per_employee_excess_paise: 0,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation','recruitment','performance','training','expenses','assets'],
    addon_modules: ['fieldforce','ai'],
    highlights: [
      'No employee limits',
      'Own server / dedicated cloud',
      'All modules included',
      'Dedicated account manager',
      'SLA 99.9%',
    ],
    is_trial_eligible: false,
    trial_days: 0,
  },
];

const DEFAULT_MODULE_PRICING = {
  payroll:     { price_paise: 3000,   type: 'per_employee', label: 'Payroll',         desc: 'Automated payroll, TDS, salary slip'     },
  compliance:  { price_paise: 1800,   type: 'per_employee', label: 'Compliance',       desc: 'PF ECR, ESI, PT, LWF auto-filing'        },
  fieldforce:  { price_paise: 2500,   type: 'per_employee', label: 'Field Force',      desc: 'GPS tracking, geo-fenced attendance'      },
  recruitment: { price_paise: 120000, type: 'flat',         label: 'Recruitment ATS',  desc: 'Pipeline, Kanban, job board posting'      },
  performance: { price_paise: 90000,  type: 'flat',         label: 'Performance',      desc: 'KRA/KPI, appraisal cycles, reviews'       },
  training:    { price_paise: 70000,  type: 'flat',         label: 'Training',         desc: 'Programs, nominations, certificates'      },
  expenses:    { price_paise: 60000,  type: 'flat',         label: 'Expenses',         desc: 'Claims, approval workflow, receipts'      },
  assets:      { price_paise: 50000,  type: 'flat',         label: 'Asset Management', desc: 'Asset register, allocation, tracking'     },
  ai:          { price_paise: 75000,  type: 'flat',         label: 'AI Features',      desc: 'Smart insights, anomaly detection'        },
};

const DEFAULT_DISCOUNTS = {
  tenure: [
    { months: 6,  label: '6 Months', pct: 5,  note: '5% off'         },
    { months: 12, label: '1 Year',   pct: 17, note: '~2 months free'  },
    { months: 24, label: '2 Years',  pct: 20, note: '~5 months free'  },
  ],
  bundle: {
    trigger_count: 3,
    pct:           15,
    note:          '15% off when 3+ add-ons selected',
    is_stackable:  false,
  },
};

// ── Generic DB helpers ────────────────────────────────────────────────────────
async function _read(key) {
  try {
    const rows = await centralPrisma.$queryRaw`
      SELECT values FROM platform_settings WHERE id = ${key} LIMIT 1
    `;
    return rows[0]?.values || null;
  } catch (e) {
    logger.warn(`[plans.service] DB read "${key}" failed — using defaults:`, e.message);
    return null;
  }
}

async function _write(key, payload) {
  const json = JSON.stringify(payload);
  await centralPrisma.$executeRaw`
    INSERT INTO platform_settings (id, values, updated_at)
    VALUES (${key}, ${json}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
      SET values     = ${json}::jsonb,
          updated_at = NOW()
  `;
}

// ── Plans ─────────────────────────────────────────────────────────────────────
async function getPlans({ includeInactive = false } = {}) {
  const data  = await _read(KEY.PLANS);
  let plans   = data?.plans || DEFAULT_PLANS;
  if (!includeInactive) plans = plans.filter(p => p.is_active);
  return plans.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

async function savePlan(planData) {
  const data  = await _read(KEY.PLANS);
  let plans   = data?.plans || DEFAULT_PLANS;
  const isNew = !planData.id;

  if (isNew) {
    planData.id = uuidv4();
    plans.push(planData);
  } else {
    const idx = plans.findIndex(p => p.id === planData.id);
    if (idx === -1) throw new Error('Plan not found');
    plans[idx] = { ...plans[idx], ...planData };
  }
  await _write(KEY.PLANS, { plans });
  return planData;
}

async function deletePlan(id) {
  const data  = await _read(KEY.PLANS);
  const plans = (data?.plans || DEFAULT_PLANS).filter(p => p.id !== id);
  await _write(KEY.PLANS, { plans });
}

// ── Module Pricing ────────────────────────────────────────────────────────────
async function getModulePricing() {
  const data = await _read(KEY.PRICING);
  return { ...DEFAULT_MODULE_PRICING, ...(data?.pricing || {}) };
}

async function saveModulePricing(pricing) {
  await _write(KEY.PRICING, { pricing });
  return pricing;
}

// ── Discounts ─────────────────────────────────────────────────────────────────
async function getDiscounts() {
  const data = await _read(KEY.DISCOUNTS);
  return data?.discounts || DEFAULT_DISCOUNTS;
}

async function saveDiscounts(discounts) {
  await _write(KEY.DISCOUNTS, { discounts });
  return discounts;
}

// ── Promo Codes ───────────────────────────────────────────────────────────────
async function getPromoCodes() {
  const data = await _read(KEY.PROMOS);
  return data?.codes || [];
}

async function savePromoCode(code) {
  const data  = await _read(KEY.PROMOS);
  let codes   = data?.codes || [];
  const isNew = !codes.find(c => c.code === code.code);
  if (isNew) { code.created_at = new Date().toISOString(); codes.push(code); }
  else codes = codes.map(c => (c.code === code.code ? { ...c, ...code } : c));
  await _write(KEY.PROMOS, { codes });
  return code;
}

async function deletePromoCode(code) {
  const data  = await _read(KEY.PROMOS);
  const codes = (data?.codes || []).filter(c => c.code !== code);
  await _write(KEY.PROMOS, { codes });
}

async function validatePromoCode(code) {
  const codes = await getPromoCodes();
  return codes.find(c =>
    c.code.toUpperCase() === code.toUpperCase() &&
    c.is_active &&
    (!c.expiry || new Date(c.expiry) > new Date())
  ) || null;
}

// ── Price Calculator ──────────────────────────────────────────────────────────
/**
 * Calculates the full price for a plan selection.
 * Called by /plans/calculate API (real-time) and by payment.controller.js (on order creation).
 *
 * @param {object} opts
 * @param {string}   opts.planSlug        e.g. "starter"
 * @param {string[]} opts.selectedAddons  e.g. ["recruitment","performance"]
 * @param {number}   opts.billingMonths   1 | 6 | 12 | 24
 * @param {number}   opts.employeeCount   for excess employee calculation
 * @param {string}   [opts.promoCode]     optional promo code
 * @returns {object} Full price breakdown + total_paise
 */
async function calculatePrice({ planSlug, selectedAddons = [], billingMonths = 1, employeeCount = 0, promoCode } = {}) {
  const [plans, modulePricing, discounts] = await Promise.all([
    getPlans({ includeInactive: true }),
    getModulePricing(),
    getDiscounts(),
  ]);

  const plan = plans.find(p => p.slug === planSlug || p.id === planSlug);
  if (!plan)               throw new Error(`Plan "${planSlug}" not found`);
  if (!plan.base_price_paise) return { isCustomQuote: true, plan: plan.name };

  // 1. Base price (monthly unit cost)
  const baseUnit = plan.base_price_paise;

  // 2. Excess employee charges
  let excessPaise = 0;
  if (plan.employee_cap && employeeCount > plan.employee_cap) {
    excessPaise = (employeeCount - plan.employee_cap) * (plan.per_employee_excess_paise || 5000);
  }

  // 3. Addon module costs (monthly)
  let addonTotalMonthly = 0;
  const addonDetails = [];
  for (const mod of selectedAddons) {
    const mp = modulePricing[mod];
    if (!mp) continue;
    const monthlyCost = mp.type === 'per_employee'
      ? mp.price_paise * Math.max(employeeCount, 1)
      : mp.price_paise;
    addonDetails.push({ module: mod, label: mp.label, type: mp.type, unit_paise: mp.price_paise, monthly_paise: monthlyCost });
    addonTotalMonthly += monthlyCost;
  }

  const monthlySubtotal = baseUnit + excessPaise + addonTotalMonthly;

  // 4. Tenure discount
  const tenureRow   = discounts.tenure?.find(t => t.months === billingMonths);
  const tenurePct   = tenureRow?.pct || 0;

  // 5. Bundle discount
  const bundlePct   = (selectedAddons.length >= (discounts.bundle?.trigger_count || 3))
    ? (discounts.bundle?.pct || 0) : 0;
  const isStackable = discounts.bundle?.is_stackable || false;
  const totalDiscPct = isStackable ? tenurePct + bundlePct : Math.max(tenurePct, bundlePct);

  // 6. Gross (all months before discounts)
  const gross          = monthlySubtotal * billingMonths;
  const discountAmount = Math.round(gross * totalDiscPct / 100);
  const afterDiscount  = gross - discountAmount;

  // 7. Promo code
  let promoInfo = null, promoDeduction = 0;
  if (promoCode) {
    const promo = await validatePromoCode(promoCode);
    if (promo) {
      promoInfo = promo;
      promoDeduction = promo.type === 'flat'
        ? promo.value_paise
        : Math.round(afterDiscount * promo.value_pct / 100);
    }
  }

  const amountBeforeTax = Math.max(0, afterDiscount - promoDeduction);
  const gstAmount       = Math.round(amountBeforeTax * 0.18);
  const totalPaise      = amountBeforeTax + gstAmount;

  return {
    plan:              { id: plan.id, slug: plan.slug, name: plan.name },
    billingMonths,
    employeeCount,
    breakdown: {
      base_monthly_paise:    baseUnit,
      excess_paise:          excessPaise,
      addons:                addonDetails,
      addon_total_monthly:   addonTotalMonthly,
      monthly_subtotal:      monthlySubtotal,
      gross_paise:           gross,
      tenure_discount_pct:   tenurePct,
      bundle_discount_pct:   bundlePct,
      total_discount_pct:    totalDiscPct,
      discount_paise:        discountAmount,
      after_discount_paise:  afterDiscount,
      promo:                 promoInfo,
      promo_deduction_paise: promoDeduction,
      amount_before_tax:     amountBeforeTax,
      gst_rate:              18,
      gst_paise:             gstAmount,
    },
    total_paise: totalPaise,
    total_inr:   (totalPaise / 100).toFixed(2),
  };
}

/**
 * saveSelectionToTenantConfig
 * Called by payment.controller.js AFTER successful payment verification.
 * Translates the plan selection into a tenant_pricing_configs row so the
 * monthly billing cron (billing.cron.js + subscriptionCalculator.js) can
 * correctly re-bill the tenant automatically next month.
 *
 * @param {string} tenantId
 * @param {object} priceResult — return value of calculatePrice()
 */
async function saveSelectionToTenantConfig(tenantId, priceResult) {
  if (!tenantId || !priceResult || priceResult.isCustomQuote) return;
  const { breakdown, plan, billingMonths } = priceResult;

  // Map tenure months → discount pct for subscriptionCalculator
  const tenurePct = breakdown.tenure_discount_pct || 0;

  const json = JSON.stringify({
    base_price_paise:           breakdown.base_monthly_paise,
    employee_cap:               null,          // billed for actual count by billing cron
    per_employee_excess_paise:  5000,
    discount_base_pct:          0,
    discount_module_pct:        {},
    discount_bundle_pct:        breakdown.bundle_discount_pct || 0,
    bundle_trigger_count:       3,
    discount_tenure_pct:        tenurePct,
    tenure_months:              billingMonths,
    is_stackable:               false,
    offer_flat_paise:           breakdown.promo_deduction_paise || 0,
    billing_cycle:              billingMonths === 1 ? 'monthly' : `${billingMonths}_months`,
  });

  await centralPrisma.$executeRaw`
    INSERT INTO tenant_pricing_configs (
      tenant_id,
      base_price_paise, per_employee_excess_paise,
      discount_base_pct, discount_module_pct,
      discount_bundle_pct, bundle_trigger_count,
      discount_tenure_pct, tenure_months,
      is_stackable, offer_flat_paise,
      billing_cycle, updated_at
    )
    VALUES (
      ${tenantId}::uuid,
      ${breakdown.base_monthly_paise}, 5000,
      0, '{}'::jsonb,
      ${breakdown.bundle_discount_pct || 0}, 3,
      ${tenurePct}, ${billingMonths},
      false, ${breakdown.promo_deduction_paise || 0},
      ${billingMonths === 1 ? 'monthly' : `${billingMonths}_months`},
      NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE
      SET base_price_paise          = ${breakdown.base_monthly_paise},
          discount_bundle_pct       = ${breakdown.bundle_discount_pct || 0},
          discount_tenure_pct       = ${tenurePct},
          tenure_months             = ${billingMonths},
          offer_flat_paise          = ${breakdown.promo_deduction_paise || 0},
          billing_cycle             = ${billingMonths === 1 ? 'monthly' : `${billingMonths}_months`},
          updated_at                = NOW()
  `;

  logger.info(`[plans.service] Saved pricing config for tenant ${tenantId} → plan "${plan.slug}", ${billingMonths}mo, total ₹${priceResult.total_inr}`);
}

module.exports = {
  getPlans, savePlan, deletePlan,
  getModulePricing, saveModulePricing,
  getDiscounts, saveDiscounts,
  getPromoCodes, savePromoCode, deletePromoCode, validatePromoCode,
  calculatePrice,
  saveSelectionToTenantConfig,
  DEFAULT_MODULE_PRICING,
};

/**
 * Saves a completed plan selection to tenant_pricing_configs
 * so billing.cron.js picks up the correct price for future invoice runs.
 * Called by payment.controller.js after successful payment verification.
 * @param {string} tenantId
 * @param {object} priceResult - output from calculatePrice()
 */
async function saveSelectionToTenantConfig(tenantId, priceResult) {
  const { breakdown, billingMonths } = priceResult;

  await centralPrisma.$executeRaw`
    INSERT INTO tenant_pricing_configs (
      id, tenant_id,
      base_price_paise, discount_tenure_pct, discount_bundle_pct,
      tenure_months, offer_flat_paise, is_stackable, billing_cycle, updated_at
    )
    VALUES (
      gen_random_uuid(), ${tenantId}::uuid,
      ${breakdown.base_monthly_paise},
      ${breakdown.tenure_discount_pct || 0},
      ${breakdown.bundle_discount_pct || 0},
      ${billingMonths},
      ${breakdown.promo_deduction_paise || 0},
      false,
      ${billingMonths === 1 ? 'monthly' : 'custom'},
      NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      base_price_paise    = ${breakdown.base_monthly_paise},
      discount_tenure_pct = ${breakdown.tenure_discount_pct || 0},
      discount_bundle_pct = ${breakdown.bundle_discount_pct || 0},
      tenure_months       = ${billingMonths},
      offer_flat_paise    = ${breakdown.promo_deduction_paise || 0},
      is_stackable        = false,
      billing_cycle       = ${billingMonths === 1 ? 'monthly' : 'custom'},
      updated_at          = NOW()
  `;
}
