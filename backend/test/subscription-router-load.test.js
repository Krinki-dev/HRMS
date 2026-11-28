'use strict';

// PrismaClient validates its datasource URL at construction time. This
// placeholder is never connected to; the tests exercise route wiring only.
process.env.CENTRAL_DATABASE_URL ||= 'postgresql://test:test@127.0.0.1:5432/hrms_test?schema=public';

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


test('Razorpay webhook fails closed when the separate webhook secret is missing', async () => {
  const paymentController = require('../modules/platform/payment.controller');
  const previous = process.env.RAZORPAY_WEBHOOK_SECRET;
  delete process.env.RAZORPAY_WEBHOOK_SECRET;
  let statusCode = 200;
  let body;
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  try {
    await paymentController.handleWebhook({ headers: {}, rawBody: Buffer.from('{}') }, res);
    assert.equal(statusCode, 503);
    assert.equal(body.success, false);
  } finally {
    if (previous === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = previous;
  }
});

test('Razorpay webhook rejects an invalid signature before database access', async () => {
  const paymentController = require('../modules/platform/payment.controller');
  const previous = process.env.RAZORPAY_WEBHOOK_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = 'webhook-test-secret';
  let statusCode = 200;
  let body;
  const rawBody = Buffer.from('{"event":"payment.captured","payload":{}}');
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; },
  };
  try {
    await paymentController.handleWebhook({
      headers: {
        'x-razorpay-event-id': 'evt_invalid_signature_test',
        'x-razorpay-signature': '0'.repeat(64),
      },
      rawBody,
    }, res);
    assert.equal(statusCode, 400);
    assert.equal(body.message, 'Invalid webhook signature.');
  } finally {
    if (previous === undefined) delete process.env.RAZORPAY_WEBHOOK_SECRET;
    else process.env.RAZORPAY_WEBHOOK_SECRET = previous;
  }
});
