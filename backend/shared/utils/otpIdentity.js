'use strict';

/**
 * Namespaces OTP records by immutable Central tenant and operational company
 * identity. The public operational schema is shared, so email + purpose alone
 * is not a sufficient OTP key.
 */
function buildOtpIdentifier(tenantId, companyId, email) {
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new Error('OTP tenant context is required');
  }
  if (typeof companyId !== 'string' || !companyId.trim()) {
    throw new Error('OTP company context is required');
  }
  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('OTP email is required');
  }
  return `tenant:${tenantId.trim().toLowerCase()}:company:${companyId.trim().toLowerCase()}:email:${email.trim().toLowerCase()}`;
}

module.exports = { buildOtpIdentifier };
