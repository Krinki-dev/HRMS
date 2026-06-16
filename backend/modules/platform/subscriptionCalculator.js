﻿const modulePricing = require('./modulePricing');

/**
 * Calculates the monthly subscription price for a tenant.
 * @param {Object} config - The row from tenant_pricing_configs
 * @param {Array} activeModules - List of module objects { module_name, custom_price_paise }
 * @param {Number} employeeCount - Current total employee count
 * @returns {Object} Final price in Paise and a detailed breakdown
 */
function calculateSubscription(config, activeModules = [], employeeCount = 0) {
  // 0. Manual Override (Enterprise Deals)
  if (config.final_override_paise !== null && config.final_override_paise !== undefined) {
    return { 
      finalPrice: config.final_override_paise, 
      breakDown: { isOverride: true, final: config.final_override_paise } 
    };
  }

  // 1. Base Price & Base Discount
  let basePrice = config.base_price_paise;
  const baseDiscount = Number(config.discount_base_pct) || 0;
  const finalBasePrice = Math.round(basePrice * (1 - baseDiscount / 100));

  // 2. Excess Employee Charges (Option 1: Shared Cloud only)
  let excessCharges = 0;
  if (config.employee_cap && employeeCount > config.employee_cap) {
    const excess = employeeCount - config.employee_cap;
    excessCharges = excess * (config.per_employee_excess_paise || 5000);
  }

  // 3. Module Pricing (with individual discounts)
  let modulesTotal = 0;
  const moduleDetails = [];
  const discountModulePct = config.discount_module_pct || {};

  activeModules.forEach(mod => {
    const moduleName = typeof mod === 'string' ? mod : mod.module_name;
    const standard = modulePricing[moduleName];
    if (!standard) return;

    // Use custom price if set, otherwise standard
    const unitPrice = mod.custom_price_paise || standard.price;
    let originalCost = standard.type === 'per_employee' ? unitPrice * employeeCount : unitPrice;

    // Apply module-specific discount
    const modDisc = Number(discountModulePct[moduleName]) || 0;
    const discountedCost = Math.round(originalCost * (1 - modDisc / 100));
    
    modulesTotal += discountedCost;
    moduleDetails.push({ 
      name: moduleName, 
      type: standard.type,
      original: originalCost, 
      discount: modDisc, 
      final: discountedCost 
    });
  });

  // 4. Subtotal before Global/Campaign Discounts
  const subtotal = finalBasePrice + excessCharges + modulesTotal;

  // 5. Global Discounts (Bundle + Tenure)
  let bundleDiscount = 0;
  if (activeModules.length >= (config.bundle_trigger_count || 3)) {
    bundleDiscount = Number(config.discount_bundle_pct) || 0;
  }

  const tenureDiscount = Number(config.discount_tenure_pct) || 0;
  
  let totalPercentageDiscount = 0;
  if (config.is_stackable) {
    totalPercentageDiscount = bundleDiscount + tenureDiscount;
  } else {
    totalPercentageDiscount = Math.max(bundleDiscount, tenureDiscount);
  }

  const globalDiscountAmount = Math.round(subtotal * (totalPercentageDiscount / 100));
  
  // 6. Final Flat Offer (e.g. ₹500 off first month)
  const flatOffer = config.offer_flat_paise || 0;

  const amountBeforeTax = Math.max(0, subtotal - globalDiscountAmount - flatOffer);
  
  const taxAmount = Math.round(amountBeforeTax * 0.18); // 18% GST
  const finalPrice = amountBeforeTax + taxAmount;

  return {
    finalPrice,
    currency: 'INR',
    breakDown: {
      base: { original: basePrice, discount: baseDiscount, final: finalBasePrice },
      excessCharges,
      modules: { total: modulesTotal, list: moduleDetails },
      discounts: { percentage: totalPercentageDiscount, amount: globalDiscountAmount, flat: flatOffer },
      tax: { rate: 18, amount: taxAmount }
    }
  };
}

module.exports = { calculateSubscription };
