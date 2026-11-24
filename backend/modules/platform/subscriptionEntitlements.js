'use strict';

/**
 * Convert the active Free plan catalog entry into the exact entitlements and
 * zero-cost billing configuration persisted for a tenant.
 *
 * Kept pure so catalog compatibility can be tested without a database.
 */
function buildFreePlanEntitlements(plan) {
  if (!plan || plan.slug !== 'free' || plan.is_active === false || plan.base_price_paise !== 0) {
    throw new Error('An active zero-price Free plan is required');
  }
  if (!Array.isArray(plan.included_modules) || plan.included_modules.length === 0 ||
      plan.included_modules.some((module) => typeof module !== 'string' || !module.trim())) {
    throw new Error('The Free plan must define included modules');
  }

  const modules = [...new Set(plan.included_modules.map((module) => module.trim()))];
  const employeeCap = plan.employee_cap == null ? null : Number(plan.employee_cap);
  const overagePrice = Number(plan.per_employee_excess_paise ?? 0);
  if ((employeeCap !== null && (!Number.isSafeInteger(employeeCap) || employeeCap < 1)) ||
      !Number.isSafeInteger(overagePrice) || overagePrice < 0) {
    throw new Error('The Free plan has invalid employee pricing limits');
  }

  return {
    modules,
    employeeCap,
    pricingConfig: {
      base_price_paise: 0,
      employee_cap: employeeCap,
      per_employee_excess_paise: overagePrice,
      discount_base_pct: 0,
      discount_module_pct: {},
      discount_bundle_pct: 0,
      bundle_trigger_count: 3,
      discount_tenure_pct: 0,
      tenure_months: 1,
      offer_flat_paise: 0,
      offer_expiry_date: null,
      is_stackable: false,
      final_override_paise: null,
      billing_cycle: 'monthly',
      updated_at: new Date(),
    },
  };
}


/**
 * Validate a selected catalog plan and resolve its trial entitlements.
 * The selected plan's catalog trial_days is eligibility metadata only here:
 * tenant registration owns the already-started trial's expiry.
 */
function buildTrialPlanEntitlements(plan, selectedAddons = []) {
  if (!plan || plan.slug === 'custom' || plan.base_price_paise == null ||
      plan.is_active === false || plan.is_trial_eligible !== true ||
      !Number.isSafeInteger(Number(plan.trial_days)) || Number(plan.trial_days) < 1) {
    throw new Error('The selected plan is not eligible for a free trial');
  }
  if (!Array.isArray(selectedAddons) || selectedAddons.length > 20 ||
      selectedAddons.some((module) => typeof module !== 'string' || !module.trim())) {
    throw new Error('Trial add-ons must be a list of valid module names');
  }
  const requested = selectedAddons.map((module) => module.trim());
  if (new Set(requested).size !== requested.length) throw new Error('Duplicate trial add-ons are not allowed');

  if (!Array.isArray(plan.included_modules) || plan.included_modules.length === 0 ||
      plan.included_modules.some((module) => typeof module !== 'string' || !module.trim())) {
    throw new Error('The selected trial plan must define included modules');
  }
  const included = new Set(plan.included_modules);
  const allowed = new Set(Array.isArray(plan.addon_modules) ? plan.addon_modules : []);
  if (requested.some((module) => included.has(module) || !allowed.has(module))) {
    throw new Error('One or more selected trial add-ons are not available for this plan');
  }

  const modules = [...new Set([...included, ...requested])];
  if (!modules.length) throw new Error('The selected trial plan must define included modules');
  const basePrice = plan.base_price_paise == null ? 0 : Number(plan.base_price_paise);
  const employeeCap = plan.employee_cap == null ? null : Number(plan.employee_cap);
  const overagePrice = Number(plan.per_employee_excess_paise ?? 0);
  if (!Number.isSafeInteger(basePrice) || basePrice < 0 ||
      (employeeCap !== null && (!Number.isSafeInteger(employeeCap) || employeeCap < 1)) ||
      !Number.isSafeInteger(overagePrice) || overagePrice < 0) {
    throw new Error('The selected trial plan has invalid pricing limits');
  }

  return {
    modules,
    employeeCap,
    pricingConfig: {
      base_price_paise: basePrice,
      employee_cap: employeeCap,
      per_employee_excess_paise: overagePrice,
      discount_base_pct: 0,
      discount_module_pct: {},
      discount_bundle_pct: 0,
      bundle_trigger_count: 3,
      discount_tenure_pct: 0,
      tenure_months: 1,
      offer_flat_paise: 0,
      offer_expiry_date: null,
      is_stackable: false,
      final_override_paise: null,
      billing_cycle: 'monthly',
      updated_at: new Date(),
    },
  };
}

module.exports = { buildFreePlanEntitlements, buildTrialPlanEntitlements };
