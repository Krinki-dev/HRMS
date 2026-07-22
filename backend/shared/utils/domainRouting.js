function normalizeHostname(hostname = '') {
  return String(hostname || '').toLowerCase().trim().replace(/^www\./, '');
}

function isPlatformRootHost(hostname = '') {
  const host = normalizeHostname(hostname);
  if (!host) return true;
  const roots = new Set([
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
  return roots.has(host);
}

function buildHostnameCandidates(hostname = '') {
  const host = normalizeHostname(hostname);
  if (!host) return [];
  const candidates = new Set([host]);
  if (host.startsWith('hrms.')) {
    candidates.add(host.slice('hrms.'.length));
  } else {
    candidates.add(`hrms.${host}`);
  }
  if (host.startsWith('hrms.')) {
    candidates.add(`www.${host.slice('hrms.'.length)}`);
  }
  return [...candidates].filter(Boolean);
}

function isPreviewHost(hostname = '') {
  const host = normalizeHostname(hostname);
  return host.endsWith('.github.dev') || host.endsWith('.githubpreview.dev') || host.endsWith('.railway.app') || host.endsWith('.vercel.app');
}

function getHostnameLookup(hostname = '', fallbackSubdomain = null) {
  const host = normalizeHostname(hostname);
  if (!host) return fallbackSubdomain || null;
  if (isPlatformRootHost(host)) return fallbackSubdomain || null;
  return host;
}

module.exports = {
  normalizeHostname,
  isPlatformRootHost,
  buildHostnameCandidates,
  getHostnameLookup,
};
