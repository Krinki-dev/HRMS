'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('subscription router loads and every registered route handler is callable', () => {
  const router = require('../modules/platform/subscription.routes');
  assert.equal(typeof router, 'function');

  const routes = router.stack.filter((layer) => layer.route);
  assert.ok(routes.length > 0, 'subscription router should register routes');

  for (const layer of routes) {
    for (const routeLayer of layer.route.stack) {
      assert.equal(
        typeof routeLayer.handle,
        'function',
        `route ${layer.route.path} contains a missing handler`
      );
    }
  }

  const webhook = routes.find((layer) => layer.route.path === '/razorpay-webhook');
  assert.ok(webhook, 'Razorpay webhook route should be mounted');
  assert.equal(typeof webhook.route.stack.at(-1).handle, 'function');
});

test('payment controller exports the Razorpay webhook handler', () => {
  const paymentController = require('../modules/platform/payment.controller');
  assert.equal(typeof paymentController.handleWebhook, 'function');
});
