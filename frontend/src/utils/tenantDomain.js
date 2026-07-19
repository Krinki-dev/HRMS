// Simplified tenant-domain detection based on the two supported modes:
// 1) platform hosts such as hrms.syntern.in
// 2) dedicated tenant hosts such as hrms.client-domain.com
const hostname = window.location.hostname.toLowerCase();

const isPlatformRoot =
  hostname === 'syntern.in' ||
  hostname === 'www.syntern.in' ||
  hostname === 'hrms.syntern.in' ||
  hostname === 'www.hrms.syntern.in' ||
  hostname === 'localhost' ||
  hostname === '127.0.0.1';

const isTenantSubdomain = false;
const tenantSubdomain = null;
const isCustomDomain = !isPlatformRoot;
const isTenantDomain = !isPlatformRoot;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

function getTenantDomain() {
  return {
    hostname,
    isLocalhost,
    isPlatformRoot,
    isTenantDomain,
    isTenantSubdomain,
    isCustomDomain,
    tenantSubdomain,
  };
}

export {
  hostname,
  isLocalhost,
  isPlatformRoot,
  isTenantDomain,
  isTenantSubdomain,
  isCustomDomain,
  tenantSubdomain,
  getTenantDomain,
};
