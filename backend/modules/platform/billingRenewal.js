'use strict';

function addCalendarMonthsClamped(value, months = 1) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || !Number.isInteger(months) || months < 1) {
    throw new TypeError('A valid date and positive whole-month duration are required.');
  }
  const day = date.getUTCDate();
  const targetMonth = date.getUTCMonth() + months;
  const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  date.setUTCDate(1);
  date.setUTCFullYear(targetYear, normalizedMonth, Math.min(day, lastDay));
  return date;
}

function getMonthlyRenewalPeriod(planExpiresAt, now = new Date()) {
  if (planExpiresAt === null || planExpiresAt === undefined || planExpiresAt === '') return null;
  const startAt = new Date(planExpiresAt);
  const current = new Date(now);
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(current.getTime())) return null;
  if (startAt.getTime() > current.getTime()) return null;

  const expiresAt = addCalendarMonthsClamped(startAt, 1);
  const periodEndInstant = new Date(expiresAt.getTime() - 1);
  const asUtcDate = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return {
    startAt,
    expiresAt,
    periodStart: asUtcDate(startAt),
    periodEnd: asUtcDate(periodEndInstant),
  };
}

function buildRenewalInvoiceNumber(subdomain, periodStart) {
  const slug = String(subdomain || 'tenant').replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 18) || 'TENANT';
  const date = new Date(periodStart);
  if (!Number.isFinite(date.getTime())) throw new TypeError('A valid renewal period start is required.');
  const ymd = date.getUTCFullYear() + String(date.getUTCMonth() + 1).padStart(2, '0') + String(date.getUTCDate()).padStart(2, '0');
  return 'REN-' + slug + '-' + ymd;
}

function getLaterExpiry(currentExpiry, requestedExpiry) {
  const requested = new Date(requestedExpiry);
  if (!Number.isFinite(requested.getTime())) throw new TypeError('Renewal expiry snapshot is invalid.');
  if (currentExpiry === null || currentExpiry === undefined) return requested;
  const current = new Date(currentExpiry);
  if (!Number.isFinite(current.getTime())) return requested;
  return current.getTime() > requested.getTime() ? current : requested;
}

module.exports = {
  addCalendarMonthsClamped,
  getMonthlyRenewalPeriod,
  buildRenewalInvoiceNumber,
  getLaterExpiry,
};
