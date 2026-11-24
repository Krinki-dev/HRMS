'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { matchesSubscriptionOrderSnapshot } = require('../shared/utils/subscriptionPaymentVerification');

const snapshot = {
  planSlug: 'pro',
  selectedAddons: ['Recruitment', 'Reports'],
  billingMonths: 12,
  employeeCount: 45,
  promoCode: 'YEARLY10',
  renewalMode: 'manual',
};

const request = {
  planSlug: 'pro',
  selectedAddons: ['Reports', 'Recruitment'],
  billingMonths: 12,
  employeeCount: 45,
  promoCode: 'YEARLY10',
  renewalMode: 'manual',
};

test('accepts an exact server-created subscription selection independent of add-on order', () => {
  assert.equal(matchesSubscriptionOrderSnapshot({ snapshot, request, amountPaise: 125000 }), true);
});

test('rejects a changed plan, billing term, employee count, promo, or renewal mode', () => {
  for (const changed of [
    { planSlug: 'starter' },
    { billingMonths: 1 },
    { employeeCount: 46 },
    { promoCode: 'OTHER' },
    { renewalMode: 'automatic' },
  ]) {
    assert.equal(matchesSubscriptionOrderSnapshot({
      snapshot,
      request: { ...request, ...changed },
      amountPaise: 125000,
    }), false);
  }
});

test('rejects missing, added, or changed add-ons', () => {
  for (const selectedAddons of [[], ['Reports'], ['Reports', 'Assets'], ['Reports', 'recruitment']]) {
    assert.equal(matchesSubscriptionOrderSnapshot({
      snapshot,
      request: { ...request, selectedAddons },
      amountPaise: 125000,
    }), false);
  }
});

test('rejects missing snapshots and zero, negative, fractional, or unsafe amounts', () => {
  assert.equal(matchesSubscriptionOrderSnapshot({ snapshot: null, request, amountPaise: 125000 }), false);
  for (const amountPaise of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, 'not-a-number']) {
    assert.equal(matchesSubscriptionOrderSnapshot({ snapshot, request, amountPaise }), false);
  }
});

test('supports the documented default renewal mode when both sides omit it', () => {
  const noModeSnapshot = { ...snapshot };
  delete noModeSnapshot.renewalMode;
  const noModeRequest = { ...request };
  delete noModeRequest.renewalMode;
  assert.equal(matchesSubscriptionOrderSnapshot({
    snapshot: noModeSnapshot,
    request: noModeRequest,
    amountPaise: 125000,
  }), true);
});
