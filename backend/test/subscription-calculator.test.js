'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateSubscription } = require('../modules/platform/subscriptionCalculator');

function config(overrides = {}) {
  return {
    final_override_paise: null,
    base_price_paise: 100000,
    employee_cap: null,
    per_employee_excess_paise: 0,
    discount_base_pct: 0,
    discount_module_pct: {},
    discount_bundle_pct: 0,
    bundle_trigger_count: 3,
    discount_tenure_pct: 0,
    is_stackable: false,
    offer_flat_paise: 10000,
    offer_expiry_date: null,
    ...overrides,
  };
}

test('does not apply a flat offer after its expiry date', () => {
  const result = calculateSubscription(config({
    offer_expiry_date: new Date('2020-01-01T00:00:00.000Z'),
  }), [], 0);
  assert.equal(result.breakDown.discounts.flat, 0);
  assert.equal(result.finalPrice, 118000);
});

test('applies a flat offer while its expiry date is in the future', () => {
  const result = calculateSubscription(config({
    offer_expiry_date: new Date('2999-01-01T00:00:00.000Z'),
  }), [], 0);
  assert.equal(result.breakDown.discounts.flat, 10000);
  assert.equal(result.finalPrice, 106200);
});

test('keeps a deliberately non-expiring flat offer active when no expiry is configured', () => {
  const result = calculateSubscription(config(), [], 0);
  assert.equal(result.breakDown.discounts.flat, 10000);
  assert.equal(result.finalPrice, 106200);
});

test('fails closed for an invalid offer expiry date', () => {
  const result = calculateSubscription(config({ offer_expiry_date: 'not-a-date' }), [], 0);
  assert.equal(result.breakDown.discounts.flat, 0);
  assert.equal(result.finalPrice, 118000);
});
