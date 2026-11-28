'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.CENTRAL_DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/hrms_test?schema=public';

test('payment controller dependency graph loads without syntax or configuration errors', () => {
  const modules = [
    '../shared/utils/centralPrisma',
    '../shared/utils/response',
    '../shared/utils/logger',
    '../shared/utils/uiConstants',
    '../shared/utils/encryption',
    '../shared/utils/billingEmailer',
    '../modules/platform/plans.service',
    '../shared/services/billingLogger',
    '../modules/platform/paidStorageGuard',
    '../shared/utils/razorpayPaymentVerification',
    '../shared/utils/subscriptionPaymentVerification',
    '../modules/platform/billingRenewal',
    '../shared/utils/phonepeStandardCheckout',
    '../shared/utils/rlsContext',
    '../shared/utils/tenantResolver',
    '../modules/platform/payment.controller',
  ];

  for (const modulePath of modules) {
    try {
      require(modulePath);
    } catch (error) {
      assert.fail(`Failed to load ${modulePath}: ${error.stack || error.message}`);
    }
  }
});
