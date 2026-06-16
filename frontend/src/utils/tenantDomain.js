const hostname = window.location.hostname;
const searchParams = new URLSearchParams(window.location.search);
const devModeParam = searchParams.get('devmode')?.trim();
const envDevMode = import.meta.env.VITE_DEV_SUBDOMAIN?.trim();
const devMode = devModeParam || envDevMode || null;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isDevTenant = isLocalhost && devMode && devMode !== 'root';
const isPlatformRoot = hostname === 'syntern.in' || hostname === 'www.syntern.in' || (isLocalhost && !isDevTenant);
const isTenantSubdomain = isDevTenant
  ? devMode !== 'custom'
  : (!isPlatformRoot && (hostname.endsWith('.syntern.in') || hostname.endsWith('.localhost')));
const tenantSubdomain = isTenantSubdomain ? (isDevTenant ? devMode : hostname.split('.')[0]) : null;
const isCustomDomain = isDevTenant
  ? devMode === 'custom'
  : (!isPlatformRoot && !isTenantSubdomain);
const isTenantDomain = !isPlatformRoot;

function getTenantDomain() {
  return {
    hostname,
    devMode,
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
  devMode,
  isLocalhost,
  isPlatformRoot,
  isTenantDomain,
  isTenantSubdomain,
  isCustomDomain,
  tenantSubdomain,
  getTenantDomain,
};
