'use strict';

function normalizeAddons(addons) {
  return Array.isArray(addons) ? addons.map(String).sort() : [];
}

function matchesSubscriptionOrderSnapshot({ snapshot, request, amountPaise } = {}) {
  if (!snapshot || !request || !Number.isSafeInteger(Number(amountPaise)) || Number(amountPaise) <= 0) {
    return false;
  }
  return String(snapshot.planSlug || '') === String(request.planSlug || '') &&
    Number(snapshot.billingMonths) === Number(request.billingMonths) &&
    Number(snapshot.employeeCount || 0) === Number(request.employeeCount || 0) &&
    String(snapshot.promoCode || '') === String(request.promoCode || '') &&
    String(snapshot.renewalMode || 'manual') === String(request.renewalMode || 'manual') &&
    JSON.stringify(normalizeAddons(snapshot.selectedAddons)) === JSON.stringify(normalizeAddons(request.selectedAddons));
}

module.exports = { matchesSubscriptionOrderSnapshot };
