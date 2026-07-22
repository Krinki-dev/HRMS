// Tenant-domain detection for platform hosts, tenant subdomains, local dev tenants,
// and custom domains.
const hostname = window.location.hostname.toLowerCase().trim();
const PLATFORM_ROOTS = new Set([
  'syntern.in',
  'www.syntern.in',
  'hrms.syntern.in',
  'www.hrms.syntern.in',
  'localhost',
  '127.0.0.1',
  'app.syntern.in',
  'app.localhost',
  'hrms.localhost',
]);

const isPlatformRoot = PLATFORM_ROOTS.has(hostname);
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isLocalTenantSubdomain = hostname.endsWith('.localhost') && hostname !== 'localhost';
const isLocalTenantHost = hostname.endsWith('.127.0.0.1') && hostname !== '127.0.0.1';
const isPreviewHost = hostname.endsWith('.github.dev') || hostname.endsWith('.githubpreview.dev') || hostname.endsWith('.railway.app') || hostname.endsWith('.vercel.app');
const isTenantDomain = !isPlatformRoot;
const isTenantSubdomain = isTenantDomain && (
  (hostname.endsWith('.syntern.in') && !hostname.startsWith('hrms.')) ||
  isLocalTenantSubdomain ||
  isLocalTenantHost
);
const tenantSubdomain = isTenantSubdomain ? hostname.split('.')[0] : null;
const isCustomDomain = isTenantDomain && !isTenantSubdomain;

function getTenantDomain() {
  return {
    hostname,
    isLocalhost,
    isPreviewHost,
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
  isPreviewHost,
  isPlatformRoot,
  isTenantDomain,
  isTenantSubdomain,
  isCustomDomain,
  tenantSubdomain,
  getTenantDomain,
};
