'use strict';
/**
 * @file plans.service.js
 * Platform plan catalog — fully DB-driven via platform_settings.
 * Falls back to hardcoded defaults on first run.
 * FROZEN: uses stable slugs + fixed UUIDs so IDs never drift between restarts.
 */
const { centralPrisma } = require('../../shared/utils/centralPrisma');
const { withPlatformAdminRLS } = require('../../shared/utils/rlsContext');
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
    slug: 'free',
    name: 'Basic / Free',
    tagline: 'Free forever for small teams',
    badge: null,
    is_active: true,
    is_popular: false,
    sort_order: 1,
    base_price_paise: 0,
    employee_cap: 200,
    per_employee_excess_paise: 5000,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation'],
    addon_modules: ['recruitment','performance','training','expenses','assets','fieldforce','ai'],
    highlights: [
      'Core HR foundation',
      'Attendance & leave',
      'Payroll & compliance essentials',
      'Optional database setup',
    ],
    is_trial_eligible: true,
    trial_days: 14,
  },
  {
    id: 'a1b2c3d4-0002-4000-8000-000000000002',
    slug: 'custom',
    name: 'Custom / Add-on',
    tagline: 'Pick add-ons and modules as you grow',
    badge: 'Custom',
    is_active: true,
    is_popular: false,
    sort_order: 2,
    base_price_paise: null,
    employee_cap: null,
    per_employee_excess_paise: 0,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation','recruitment','performance','training'],
    addon_modules: ['expenses','assets','fieldforce','ai'],
    highlights: [
      'Choose add-ons on demand',
      'Recruitment, performance, and training modules',
      'Tailored implementation and support',
    ],
    is_trial_eligible: false,
    trial_days: 0,
  },
  {
    id: 'a1b2c3d4-0003-4000-8000-000000000003',
    slug: 'pro',
    name: 'Pro',
    tagline: 'Full HRMS access with automation and support',
    badge: 'Most Popular',
    is_active: true,
    is_popular: true,
    sort_order: 3,
    base_price_paise: 349900,
    employee_cap: null,
    per_employee_excess_paise: 4000,
    included_modules: ['employees','attendance','leave','payroll','compliance','reports','automation','recruitment','performance','training','expenses','assets'],
    addon_modules: ['fieldforce','ai'],
    highlights: [
      'Unlimited employee access',
      'Automation & compliance workflows',
      'Priority support and onboarding',
    ],
    is_trial_eligible: true,
    trial_days: 30,
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
    const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
      SELECT values FROM platform_settings WHERE id = ${key} LIMIT 1
    `);
    return rows[0]?.values || null;
  } catch (e) {
    logger.warn(`[plans.service] DB read "${key}" failed — using defaults:`, e.message);
    return null;
  }
}

/**
 * Read-modify-write operations must not fall back to defaults when the database
 * is unavailable. Doing so could replace a live catalog with defaults.
 */
async function _readForWrite(key) {
  const rows = await withPlatformAdminRLS(centralPrisma, (tx) => tx.$queryRaw`
    SELECT values FROM platform_settings WHERE id = ${key} LIMIT 1
  `);
  return rows[0]?.values || null;
}

async function _write(key, payload) {
  const json = JSON.stringify(payload);
  await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
    INSERT INTO platform_settings (id, values, updated_at)
    VALUES (${key}, ${json}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
      SET values     = ${json}::jsonb,
          updated_at = NOW()
  `);
}

// ── Plans ─────────────────────────────────────────────────────────────────────
async function getPlans({ includeInactive = false } = {}) {
  const data  = await _read(KEY.PLANS);
  let plans   = data?.plans || DEFAULT_PLANS;
  if (!includeInactive) plans = plans.filter(p => p.is_active);
  return plans.sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
}

async function savePlan(planData) {
  const data = await _readForWrite(KEY.PLANS);
  const plans = data?.plans || DEFAULT_PLANS;
  const isNew = !planData.id;
  const existingIndex = isNew ? -1 : plans.findIndex((plan) => plan.id === planData.id);
  if (!isNew && existingIndex === -1) throw new Error('Plan not found');

  const candidate = isNew
    ? { ...planData, id: uuidv4() }
    : { ...plans[existingIndex], ...planData, id: plans[existingIndex].id };

  candidate.name = String(candidate.name || '').trim();
  candidate.slug = String(candidate.slug || '').trim().toLowerCase();
  if (!candidate.name || candidate.name.length > 80) throw new Error('Plan name must be 1–80 characters');
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(candidate.slug)) throw new Error('Plan slug must contain only lowercase letters, numbers, and hyphens');
  if (plans.some((plan) => plan.slug === candidate.slug && plan.id !== candidate.id)) throw new Error('Plan slug already exists');

  const integerField = (value, label, { nullable = false, min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
    if (nullable && (value === null || value === '')) return null;
    const number = Number(value);
    if (!Number.isSafeInteger(number) || number < min || number > max) throw new Error(`${label} must be a whole number between ${min} and ${max}`);
    return number;
  };
  candidate.base_price_paise = integerField(candidate.base_price_paise, 'Base price', { nullable: true });
  candidate.employee_cap = integerField(candidate.employee_cap, 'Employee cap', { nullable: true, min: 1, max: 10000000 });
  candidate.per_employee_excess_paise = integerField(candidate.per_employee_excess_paise ?? 5000, 'Employee overage price');
  candidate.trial_days = integerField(candidate.trial_days ?? 0, 'Trial days', { min: 0, max: 365 });
  candidate.sort_order = integerField(candidate.sort_order ?? 99, 'Sort order', { min: 0, max: 100000 });
  const allowedModules = new Set(['employees','attendance','leave','payroll','compliance','reports','automation','recruitment','performance','training','expenses','assets','fieldforce','ai','notifications','settings','documents']);
  for (const field of ['included_modules', 'addon_modules']) {
    if (!Array.isArray(candidate[field]) || candidate[field].some((module) => typeof module !== 'string' || !allowedModules.has(module))) {
      throw new Error(`${field} contains an unsupported module`);
    }
    candidate[field] = [...new Set(candidate[field])];
  }
  if (candidate.included_modules.some((module) => candidate.addon_modules.includes(module))) {
    throw new Error('A module cannot be both included and an add-on');
  }
  candidate.is_active = candidate.is_active !== false;
  candidate.is_popular = candidate.is_popular === true;
  candidate.is_trial_eligible = candidate.is_trial_eligible === true;

  const nextPlans = [...plans];
  if (isNew) nextPlans.push(candidate);
  else nextPlans[existingIndex] = candidate;
  await _write(KEY.PLANS, { plans: nextPlans });
  return candidate;
}

async function deletePlan(id) {
  const data = await _readForWrite(KEY.PLANS);
  const plans = [...(data?.plans || DEFAULT_PLANS)];
  const index = plans.findIndex((plan) => plan.id === id);
  if (index === -1) throw new Error('Plan not found');
  if (plans[index].slug === 'free') throw new Error('The free baseline plan cannot be removed; deactivate or edit other plans instead.');
  // Retain the catalog record for historical subscription references and auditability.
  plans[index] = { ...plans[index], is_active: false };
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
  const data  = await _readForWrite(KEY.PROMOS);
  let codes   = data?.codes || [];
  const isNew = !codes.find(c => c.code === code.code);
  if (isNew) { code.created_at = new Date().toISOString(); codes.push(code); }
  else codes = codes.map(c => (c.code === code.code ? { ...c, ...code } : c));
  await _write(KEY.PROMOS, { codes });
  return code;
}

async function deletePromoCode(code) {
  const data  = await _readForWrite(KEY.PROMOS);
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
function calculatePriceFromCatalog({ plans, modulePricing, discounts, promo, planSlug, selectedAddons = [], billingMonths = 1, employeeCount = 0 } = {}) {
  if (!Array.isArray(plans) || !modulePricing || !discounts) throw new Error('Plan pricing catalog is unavailable');
  if (typeof planSlug !== 'string' || !planSlug.trim()) throw new Error('A valid plan is required');
  if (![1, 6, 12, 24].includes(Number(billingMonths))) throw new Error('Billing period must be 1, 6, 12 or 24 months');
  billingMonths = Number(billingMonths);
  if (!Number.isSafeInteger(employeeCount) || employeeCount < 0 || employeeCount > 1000000) {
    throw new Error('Employee count must be a whole number between 0 and 1,000,000');
  }
  if (!Array.isArray(selectedAddons) || selectedAddons.length > 20 ||
      selectedAddons.some((module) => typeof module !== 'string' || !module.trim())) {
    throw new Error('Selected add-ons must be a list of supported module names');
  }
  const requestedAddonCount = selectedAddons.length;
  selectedAddons = [...new Set(selectedAddons)];
  if (selectedAddons.length !== requestedAddonCount) {
    throw new Error('Duplicate add-ons are not allowed');
  }

  const plan = plans.find((item) => item.slug === planSlug || item.id === planSlug);
  if (!plan || plan.is_active === false) throw new Error('Selected plan is unavailable');
  if (plan.base_price_paise === null || plan.base_price_paise === undefined) {
    return { isCustomQuote: true, plan: plan.name };
  }
  if (!Number.isSafeInteger(plan.base_price_paise) || plan.base_price_paise < 0) {
    throw new Error('Selected plan has an invalid base price');
  }

  const included = new Set(Array.isArray(plan.included_modules) ? plan.included_modules : []);
  const allowedAddons = new Set(Array.isArray(plan.addon_modules) ? plan.addon_modules : []);
  for (const module of selectedAddons) {
    if (included.has(module)) throw new Error(`Module "${module}" is already included in this plan`);
    if (!allowedAddons.has(module)) throw new Error(`Module "${module}" is not available as an add-on for this plan`);
    const price = modulePricing[module];
    if (!price || !Number.isSafeInteger(price.price_paise) || price.price_paise < 0 ||
        !['flat', 'per_employee'].includes(price.type)) {
      throw new Error(`Pricing is not configured correctly for add-on "${module}"`);
    }
  }

  const baseUnit = plan.base_price_paise;
  let excessPaise = 0;
  if (plan.employee_cap != null && employeeCount > plan.employee_cap) {
    if (!Number.isSafeInteger(plan.employee_cap) || plan.employee_cap < 1) throw new Error('Selected plan has an invalid employee cap');
    const overageRate = plan.per_employee_excess_paise ?? 5000;
    if (!Number.isSafeInteger(overageRate) || overageRate < 0) throw new Error('Selected plan has an invalid employee overage price');
    excessPaise = (employeeCount - plan.employee_cap) * overageRate;
  }

  let addonTotalMonthly = 0;
  const addonDetails = [];
  for (const module of selectedAddons) {
    const item = modulePricing[module];
    const monthlyCost = item.type === 'per_employee'
      ? item.price_paise * Math.max(employeeCount, 1)
      : item.price_paise;
    if (!Number.isSafeInteger(monthlyCost)) throw new Error(`Add-on "${module}" price exceeds the supported amount`);
    addonDetails.push({ module, label: item.label || module, type: item.type, unit_paise: item.price_paise, monthly_paise: monthlyCost });
    addonTotalMonthly += monthlyCost;
  }

  const monthlySubtotal = baseUnit + excessPaise + addonTotalMonthly;
  if (!Number.isSafeInteger(monthlySubtotal)) throw new Error('Calculated monthly price exceeds the supported amount');

  const tenureRow = discounts.tenure?.find((item) => Number(item.months) === billingMonths);
  const tenurePct = Number(tenureRow?.pct || 0);
  const bundleConfig = discounts.bundle || {};
  const triggerCount = Number(bundleConfig.trigger_count || 3);
  const bundlePct = selectedAddons.length >= triggerCount ? Number(bundleConfig.pct || 0) : 0;
  if (![tenurePct, bundlePct].every((pct) => Number.isFinite(pct) && pct >= 0 && pct <= 100) ||
      !Number.isSafeInteger(triggerCount) || triggerCount < 1) {
    throw new Error('Discount configuration is invalid');
  }
  const totalDiscPct = bundleConfig.is_stackable ? Math.min(100, tenurePct + bundlePct) : Math.max(tenurePct, bundlePct);
  const gross = monthlySubtotal * billingMonths;
  if (!Number.isSafeInteger(gross)) throw new Error('Calculated subscription price exceeds the supported amount');
  const discountAmount = Math.round(gross * totalDiscPct / 100);
  const afterDiscount = gross - discountAmount;

  let promoInfo = null;
  let promoDeduction = 0;
  if (promo) {
    if (promo.is_active !== true || (promo.expiry && !Number.isFinite(Date.parse(promo.expiry))) ||
        (promo.expiry && new Date(promo.expiry) <= new Date())) {
      throw new Error('Promo code is invalid or expired');
    }
    if (promo.type === 'flat' && Number.isSafeInteger(promo.value_paise) && promo.value_paise > 0) {
      promoDeduction = Math.min(afterDiscount, promo.value_paise);
    } else if (promo.type === 'percent' && Number.isFinite(promo.value_pct) && promo.value_pct > 0 && promo.value_pct <= 100) {
      promoDeduction = Math.round(afterDiscount * promo.value_pct / 100);
    } else {
      throw new Error('Promo code has an invalid discount configuration');
    }
    promoInfo = promo;
  }

  const amountBeforeTax = Math.max(0, afterDiscount - promoDeduction);
  const gstAmount = Math.round(amountBeforeTax * 0.18);
  const totalPaise = amountBeforeTax + gstAmount;
  return {
    plan: { id: plan.id, slug: plan.slug, name: plan.name },
    billingMonths,
    employeeCount,
    breakdown: {
      base_monthly_paise: baseUnit,
      excess_paise: excessPaise,
      addons: addonDetails,
      addon_total_monthly: addonTotalMonthly,
      monthly_subtotal: monthlySubtotal,
      gross_paise: gross,
      tenure_discount_pct: tenurePct,
      bundle_discount_pct: bundlePct,
      total_discount_pct: totalDiscPct,
      discount_paise: discountAmount,
      after_discount_paise: afterDiscount,
      promo: promoInfo,
      promo_deduction_paise: promoDeduction,
      amount_before_tax: amountBeforeTax,
      gst_rate: 18,
      gst_paise: gstAmount,
    },
    total_paise: totalPaise,
    total_inr: (totalPaise / 100).toFixed(2),
  };
}

async function calculatePrice({ planSlug, selectedAddons = [], billingMonths = 1, employeeCount = 0, promoCode } = {}) {
  const [plans, modulePricing, discounts] = await Promise.all([
    getPlans({ includeInactive: true }),
    getModulePricing(),
    getDiscounts(),
  ]);
  const promo = promoCode ? await validatePromoCode(promoCode) : null;
  if (promoCode && !promo) throw new Error('Promo code is invalid or expired');
  return calculatePriceFromCatalog({
    plans, modulePricing, discounts, promo, planSlug, selectedAddons, billingMonths, employeeCount,
  });
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
 * @param {object} [meta]
 * @param {'auto'|'manual'} [meta.renewalMode]
 * @param {string} [meta.paymentMethod]
 */
async function saveSelectionToTenantConfig(tenantId, priceResult, meta = {}, db = centralPrisma) {
  if (!tenantId || !priceResult || priceResult.isCustomQuote) return;
  const { breakdown, plan, billingMonths } = priceResult;

  // Map tenure months → discount pct for subscriptionCalculator
  const tenurePct = breakdown.tenure_discount_pct || 0;

  const moduleDiscountMeta = {
    __renewalMode: meta.renewalMode === 'auto' ? 'auto' : 'manual',
    __paymentMethod: meta.paymentMethod || null,
  };

  const json = JSON.stringify({
    base_price_paise:           breakdown.base_monthly_paise,
    employee_cap:               null,          // billed for actual count by billing cron
    per_employee_excess_paise:  5000,
    discount_base_pct:          0,
    discount_module_pct:        moduleDiscountMeta,
    discount_bundle_pct:        breakdown.bundle_discount_pct || 0,
    bundle_trigger_count:       3,
    discount_tenure_pct:        tenurePct,
    tenure_months:              billingMonths,
    is_stackable:               false,
    offer_flat_paise:           0,
    billing_cycle:              billingMonths === 1 ? 'monthly' : `${billingMonths}_months`,
  });

  await withPlatformAdminRLS(centralPrisma, (tx) => tx.$executeRaw`
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
      0, ${JSON.stringify(moduleDiscountMeta)}::jsonb,
      ${breakdown.bundle_discount_pct || 0}, 3,
      ${tenurePct}, ${billingMonths},
      false, 0,
      ${billingMonths === 1 ? 'monthly' : `${billingMonths}_months`},
      NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE
      SET base_price_paise          = ${breakdown.base_monthly_paise},
          discount_bundle_pct       = ${breakdown.bundle_discount_pct || 0},
          discount_tenure_pct       = ${tenurePct},
          tenure_months             = ${billingMonths},
          offer_flat_paise          = 0,
          billing_cycle             = ${billingMonths === 1 ? 'monthly' : `${billingMonths}_months`},
            discount_module_pct       = ${JSON.stringify(moduleDiscountMeta)}::jsonb,
            updated_at                = NOW()
  `);

  logger.info(`[plans.service] Saved pricing config for tenant ${tenantId} → plan "${plan.slug}", ${billingMonths}mo, total ₹${priceResult.total_inr}`);
}

module.exports = {
  getPlans, savePlan, deletePlan,
  getModulePricing, saveModulePricing,
  getDiscounts, saveDiscounts,
  getPromoCodes, savePromoCode, deletePromoCode, validatePromoCode,
  calculatePrice,
  calculatePriceFromCatalog,
  saveSelectionToTenantConfig,
  DEFAULT_MODULE_PRICING,
};
