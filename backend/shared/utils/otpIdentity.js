'use strict';

/**
 * Namespaces OTP records by immutable Central tenant identity. The operational
 * public schema is shared by Free/Trial tenants, so email + purpose alone is
 * not a sufficient OTP key.
 */
function buildOtpIdentifier(tenantId, email) {
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new Error('OTP tenant context is required');
  }
  if (typeof email !== 'string' || !email.trim()) {
    throw new Error('OTP email is required');
  }
  return `tenant:${tenantId.trim().toLowerCase()}:email:${email.trim().toLowerCase()}`;
}

module.exports = { buildOtpIdentifier };
