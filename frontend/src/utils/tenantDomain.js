// Production-only subdomain detection
const hostname = window.location.hostname;

const isPlatformRoot =
  hostname === 'syntern.in' ||
  hostname === 'www.syntern.in' ||
  hostname === 'localhost' ||
  hostname === '127.0.0.1';

const isTenantSubdomain =
  !isPlatformRoot &&
  (hostname.endsWith('.syntern.in') || hostname.endsWith('.localhost'));

const tenantSubdomain = isTenantSubdomain ? hostname.split('.')[0] : null;

const isCustomDomain = !isPlatformRoot && !isTenantSubdomain;

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
