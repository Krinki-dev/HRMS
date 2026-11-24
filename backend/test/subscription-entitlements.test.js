'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFreePlanEntitlements } = require('../modules/platform/subscriptionEntitlements');

const freePlan = () => ({
  slug: 'free',
  is_active: true,
  base_price_paise: 0,
  employee_cap: 200,
  per_employee_excess_paise: 5000,
  included_modules: ['employees', 'attendance', 'leave', 'payroll', 'reports', 'automation'],
});

test('builds permanent Free entitlements and a zero-cost pricing configuration', () => {
  const result = buildFreePlanEntitlements(freePlan());
  assert.deepEqual(result.modules, ['employees', 'attendance', 'leave', 'payroll', 'reports', 'automation']);
  assert.equal(result.employeeCap, 200);
  assert.equal(result.pricingConfig.base_price_paise, 0);
  assert.equal(result.pricingConfig.employee_cap, 200);
  assert.equal(result.pricingConfig.offer_flat_paise, 0);
  assert.equal(result.pricingConfig.offer_expiry_date, null);
  assert.equal(result.pricingConfig.final_override_paise, null);
});

test('deduplicates included module names without changing their order', () => {
  const plan = freePlan();
  plan.included_modules = ['employees', 'attendance', 'employees'];
  assert.deepEqual(buildFreePlanEntitlements(plan).modules, ['employees', 'attendance']);
});

test('rejects paid, custom, inactive or non-Free catalog entries', () => {
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), slug: 'pro' }), /active zero-price Free plan/);
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), base_price_paise: null }), /active zero-price Free plan/);
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), is_active: false }), /active zero-price Free plan/);
});

test('rejects missing modules and invalid employee limits', () => {
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), included_modules: [] }), /included modules/);
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), employee_cap: 0 }), /employee pricing limits/);
  assert.throws(() => buildFreePlanEntitlements({ ...freePlan(), per_employee_excess_paise: -1 }), /employee pricing limits/);
});

test('builds trial entitlements from an eligible catalog plan and selected add-ons', () => {
  const plan = {
    slug: 'pro',
    is_active: true,
    is_trial_eligible: true,
    trial_days: 30,
    base_price_paise: 349900,
    employee_cap: null,
    per_employee_excess_paise: 4000,
    included_modules: ['employees', 'payroll'],
    addon_modules: ['fieldforce'],
  };
  const result = require('../modules/platform/subscriptionEntitlements')
    .buildTrialPlanEntitlements(plan, ['fieldforce']);
  assert.deepEqual(result.modules, ['employees', 'payroll', 'fieldforce']);
  assert.equal(result.pricingConfig.base_price_paise, 349900);
  assert.equal(result.pricingConfig.offer_flat_paise, 0);
});

test('rejects ineligible plans and trial add-ons not offered by the selected plan', () => {
  const plan = {
    slug: 'custom',
    is_active: true,
    is_trial_eligible: false,
    trial_days: 0,
    base_price_paise: null,
    included_modules: [],
    addon_modules: [],
  };
  const { buildTrialPlanEntitlements } = require('../modules/platform/subscriptionEntitlements');
  assert.throws(() => buildTrialPlanEntitlements(plan, []), /not eligible/);
  assert.throws(() => buildTrialPlanEntitlements({
    ...plan, slug: 'custom', is_trial_eligible: true, trial_days: 30,
  }, []), /not eligible/);
  const eligible = {
    ...plan, slug: 'pro', is_trial_eligible: true, trial_days: 30,
    base_price_paise: 1000, included_modules: ['employees'], addon_modules: ['payroll'],
  };
  assert.throws(() => buildTrialPlanEntitlements(eligible, ['not-offered']), /not available/);
  assert.throws(() => buildTrialPlanEntitlements(eligible, ['payroll', 'payroll']), /Duplicate/);
});
