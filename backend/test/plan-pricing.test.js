'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculatePriceFromCatalog } = require('../modules/platform/plans.service');

const catalog = () => ({
  plans: [
    {
      id: 'plan-pro',
      slug: 'pro',
      name: 'Pro',
      is_active: true,
      base_price_paise: 349900,
      employee_cap: null,
      per_employee_excess_paise: 4000,
      included_modules: ['employees', 'payroll'],
      addon_modules: ['recruitment', 'fieldforce'],
    },
    {
      id: 'plan-free',
      slug: 'free',
      name: 'Free',
      is_active: true,
      base_price_paise: 0,
      employee_cap: 200,
      per_employee_excess_paise: 5000,
      included_modules: ['employees'],
      addon_modules: ['recruitment'],
    },
    {
      id: 'plan-old',
      slug: 'old',
      name: 'Old',
      is_active: false,
      base_price_paise: 10000,
      included_modules: [],
      addon_modules: ['recruitment'],
    },
    {
      id: 'plan-custom',
      slug: 'custom',
      name: 'Custom',
      is_active: true,
      base_price_paise: null,
      included_modules: [],
      addon_modules: ['recruitment'],
    },
  ],
  modulePricing: {
    recruitment: { price_paise: 120000, type: 'flat', label: 'Recruitment' },
    fieldforce: { price_paise: 2500, type: 'per_employee', label: 'Field Force' },
  },
  discounts: {
    tenure: [{ months: 12, pct: 10 }],
    bundle: { trigger_count: 3, pct: 15, is_stackable: false },
  },
});

function calculate(overrides = {}) {
  return calculatePriceFromCatalog({ ...catalog(), planSlug: 'pro', ...overrides });
}

test('calculates base price and eligible add-ons using paise', () => {
  const result = calculate({ selectedAddons: ['recruitment'] });
  assert.equal(result.breakdown.base_monthly_paise, 349900);
  assert.equal(result.breakdown.addon_total_monthly, 120000);
  assert.equal(result.breakdown.monthly_subtotal, 469900);
  assert.equal(result.total_paise, Math.round(469900 * 1.18));
});

test('applies tenure discount and caps a flat promo at the remaining amount', () => {
  const result = calculate({
    billingMonths: 12,
    promo: { code: 'BIGSAVE', type: 'flat', value_paise: 99999999, is_active: true },
  });
  assert.equal(result.breakdown.tenure_discount_pct, 10);
  assert.equal(result.breakdown.promo_deduction_paise, result.breakdown.after_discount_paise);
  assert.equal(result.total_paise, 0);
});

test('does not charge GST or return a custom quote for the zero-price free plan', () => {
  const result = calculate({ planSlug: 'free', employeeCount: 5 });
  assert.equal(result.isCustomQuote, undefined);
  assert.equal(result.total_paise, 0);
});

test('returns custom quote only for plans whose base price is null', () => {
  const result = calculate({ planSlug: 'custom' });
  assert.equal(result.isCustomQuote, true);
});

test('rejects inactive plans', () => {
  assert.throws(() => calculate({ planSlug: 'old' }), /Selected plan is unavailable/);
});

test('rejects modules included in the plan or not offered as add-ons', () => {
  assert.throws(() => calculate({ selectedAddons: ['payroll'] }), /already included/);
  assert.throws(() => calculate({ selectedAddons: ['ai'] }), /not available as an add-on/);
});

test('rejects invalid billing periods, employee counts and duplicate add-ons', () => {
  assert.throws(() => calculate({ billingMonths: 3 }), /Billing period/);
  assert.throws(() => calculate({ employeeCount: -1 }), /Employee count/);
  assert.throws(() => calculate({ employeeCount: '12' }), /Employee count/);
  assert.throws(() => calculate({ selectedAddons: ['recruitment', 'recruitment'] }), /Duplicate add-ons/);
});

test('rejects malformed add-on prices and discount configuration', () => {
  const brokenPricing = { recruitment: { price_paise: -1, type: 'flat' } };
  assert.throws(() => calculate({ selectedAddons: ['recruitment'], modulePricing: brokenPricing }), /Pricing is not configured/);
  assert.throws(() => calculate({ discounts: { tenure: [{ months: 12, pct: 150 }], bundle: {} }, billingMonths: 12 }), /Discount configuration/);
});
