'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  addCalendarMonthsClamped,
  getMonthlyRenewalPeriod,
  buildRenewalInvoiceNumber,
  getLaterExpiry,
} = require('../modules/platform/billingRenewal');

test('does not create a renewal invoice before paid-through time', () => {
  assert.equal(getMonthlyRenewalPeriod('2026-12-01T12:00:00.000Z', '2026-12-01T11:59:59.999Z'), null);
});

test('does not invent a renewal period for legacy paid tenants with no expiry', () => {
  assert.equal(getMonthlyRenewalPeriod(null, '2026-12-01T00:00:00.000Z'), null);
});

test('anchors a renewal period to a mid-month paid-through timestamp', () => {
  const period = getMonthlyRenewalPeriod('2026-11-25T10:30:00.000Z', '2026-11-25T10:30:00.000Z');
  assert.equal(period.startAt.toISOString(), '2026-11-25T10:30:00.000Z');
  assert.equal(period.expiresAt.toISOString(), '2026-12-25T10:30:00.000Z');
  assert.equal(period.periodStart.toISOString(), '2026-11-25T00:00:00.000Z');
  assert.equal(period.periodEnd.toISOString(), '2026-12-25T00:00:00.000Z');
});

test('clamps month-end renewal dates instead of overflowing into the following month', () => {
  assert.equal(addCalendarMonthsClamped('2026-01-31T09:00:00.000Z', 1).toISOString(), '2026-02-28T09:00:00.000Z');
  assert.equal(addCalendarMonthsClamped('2028-01-31T09:00:00.000Z', 1).toISOString(), '2028-02-29T09:00:00.000Z');
});

test('uses a deterministic invoice number for duplicate daily cron runs', () => {
  const first = buildRenewalInvoiceNumber('acme-india', '2026-11-25T00:00:00.000Z');
  const second = buildRenewalInvoiceNumber('acme-india', '2026-11-25T00:00:00.000Z');
  assert.equal(first, 'REN-ACMEINDIA-20261125');
  assert.equal(second, first);
});

test('extends from the later of current paid-through date and invoice snapshot', () => {
  assert.equal(
    getLaterExpiry('2026-12-25T00:00:00.000Z', '2026-12-20T00:00:00.000Z').toISOString(),
    '2026-12-25T00:00:00.000Z'
  );
  assert.equal(
    getLaterExpiry('2026-11-25T00:00:00.000Z', '2026-12-25T00:00:00.000Z').toISOString(),
    '2026-12-25T00:00:00.000Z'
  );
});
