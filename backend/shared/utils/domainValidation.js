'use strict';

const TENANT_SUBDOMAIN_PATTERN = /^(?=.{1,63}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function normalizeTenantSubdomain(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return TENANT_SUBDOMAIN_PATTERN.test(normalized) ? normalized : null;
}

function normalizeCustomDomain(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized || normalized.length > 253) return null;
  const labels = normalized.split('.');
  if (labels.length < 2 || labels.some((label) => !DOMAIN_LABEL_PATTERN.test(label))) return null;
  return normalized;
}

module.exports = { normalizeTenantSubdomain, normalizeCustomDomain };
