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

module.exports = { buildFreePlanEntitlements };
