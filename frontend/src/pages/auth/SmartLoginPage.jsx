/**
 * @file SmartLoginPage.jsx
 * @description Adaptive login page that handles multi-tenant domain detection and OTT exchange.
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

/**
 * Domain detection utility
 * Handles localhost development, syntern.in subdomains, and custom domains.
 */
function detectDomain() {
  const hostname   = window.location.hostname;
  const params     = new URLSearchParams(window.location.search);
  const devMode    = params.get('devmode') || import.meta.env?.VITE_DEV_SUBDOMAIN || null;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isPrivateNetwork = /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  const isLocalNetwork = isLocalhost || isPrivateNetwork;

  if (isLocalNetwork && devMode && devMode !== 'root') {
    if (devMode === 'custom') {
      return { isPlatformRoot: false, isSubdomain: false, subdomain: null, isCustomDomain: true, hostname };
    }
    return { isPlatformRoot: false, isSubdomain: true, subdomain: devMode, isCustomDomain: false, hostname };
  }

  const isPlatformRoot  = hostname === 'syntern.in' || hostname === 'www.syntern.in' || isLocalNetwork;
  const isSubdomain     = (
    (hostname.endsWith('.syntern.in') && !isPlatformRoot) ||
    (hostname.endsWith('.localhost') && hostname !== 'localhost')
  );
  const subdomain       = isSubdomain ? hostname.split('.')[0] : null;
  const isCustomDomain  = !isPlatformRoot && !isSubdomain;

  return { isPlatformRoot, isSubdomain, subdomain, isCustomDomain, hostname };
}

/**
 * Role-based routing logic
 * @param {Object} user 
 * @returns {string} The destination route
 */
function getRoleRoute(user) {
  // Platform admins always go to the admin console
  if (user?.is_platform_admin) return '/admin/dashboard';

  // ANY user who isn't a platform admin and hasn't completed setup
  // must go through onboarding first (this covers all company roles)
  if (user?.isSetupComplete === false) return '/onboarding';

  // Otherwise, normal tenant routing
  const role = (user?.role || '').toLowerCase();
  switch (role) {
    case 'super_admin':
      return user?.hasEmployeeId ? '/dashboard' : '/settings';
    case 'company_admin':
    case 'hr_manager':
    case 'hr':
    default:
      return '/dashboard';
  }
}

/**
 * Cross-domain session handoff via One-Time Token (OTT)
 * @param {string} subdomain 
 * @param {Object} loginData 
 * @returns {Promise<boolean>}
 */
async function redirectWithOTT(subdomain, loginData) {
  const isLocal = window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1';

  if (isLocal) {
    console.log(`[OTT] DEV: would redirect to ${subdomain}.syntern.in — staying on localhost`);
    return false;
  }

  try {
    const res = await api.post('/auth/ott/create', {
      userId:      loginData.user.id,
      subdomain,
      accessToken: loginData.accessToken,
    });
    const ott = res.data?.data?.ott;
    if (ott) {
      const protocol = window.location.protocol === 'https:' ? 'https' : 'http';
      window.location.href = `${protocol}://${subdomain}.syntern.in/login?ott=${ott}`;
      return true;
    }
  } catch (err) {
    console.error('[OTT] Create failed:', err.response?.data || err.message);
  }
  return false;
}

/**
 * Styling constants
 */
const S = {
  page: (bgColor = '#040C1A') => ({
    minHeight: '100vh',
    display: 'flex',
    fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, sans-serif",
    background: bgColor,
    color: '#E8EEFF',
  }),
  hero: (primaryColor = '#2563EB') => ({
    flex: '0 0 46%',
    background: `linear-gradient(160deg, ${primaryColor}10 0%, ${primaryColor}20 60%, ${primaryColor}30 100%)`,
    borderRight: `1px solid ${primaryColor}20`,
    display: 'flex',
    flexDirection: 'column',
    padding: '48px 52px',
    position: 'relative',
    overflow: 'hidden',
  }),
  heroGlow: (primaryColor = '#2563EB') => ({
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: `radial-gradient(circle, ${primaryColor}14 0%, transparent 70%)`,
    top: '10%', left: '-20%', pointerEvents: 'none',
  }),
  heroDots: (primaryColor = '#2563EB') => ({
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(circle, ${primaryColor}12 1px, transparent 1px)`,
    backgroundSize: '32px 32px', pointerEvents: 'none',
  }),
  formPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '40px 48px', overflowY: 'auto',
  },
  formInner:    { width: '100%', maxWidth: 400 },
  label: {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6,
  },
  input: (primaryColor = '#2563EB') => ({
    width: '100%', padding: '11px 14px',
    background: '#0D1A30', border: `1px solid ${primaryColor}30`,
    borderRadius: 8, color: '#E8EEFF', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'inherit',
  }),
  btnPrimary: (primaryColor = '#2563EB') => ({
    width: '100%', padding: '12px', background: primaryColor, color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s', fontFamily: 'inherit',
  }),
  companyBadge: (primaryColor = '#2563EB') => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
    background: `${primaryColor}14`, border: `1px solid ${primaryColor}30`,
    borderRadius: 10, marginBottom: 24,
  }),
  errorBox: {
    padding: '10px 14px', background: 'rgba(220,38,38,0.08)',
    border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8,
    color: '#F87171', fontSize: 13, marginBottom: 16,
  },
  dividerRow:  { display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' },
  dividerLine: { flex: 1, height: 1, background: 'rgba(99,120,255,0.08)' },
};

/**
 * Marketing highlights for the hero section
 */
const PRODUCT_HIGHLIGHTS = [
  { icon: '🤖', text: 'Auto-files PF & ESI every month' },
  { icon: '⚡', text: 'Aadhaar KYC fills forms instantly' },
  { icon: '∞',  text: 'Unlimited employees, flat pricing' },
  { icon: '🔒', text: 'Cloud, on-premise, or hybrid' },
];

export default function SmartLoginPage() {
  const navigate      = useNavigate();
  const [searchParams] = useSearchParams();
  const { login }     = useAuthStore();
  const domain        = detectDomain();

  

  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState(searchParams.get('email') || '');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [company,     setCompany]     = useState(null);
  const [error,       setError]       = useState('');
  const [tenantError, setTenantError] = useState('');

  // Dev bypass: if enabled, prefill company and skip tenant lookup
  useEffect(() => {
    if (import.meta.env.VITE_DEV_BYPASS === 'true') {
      const devSub = import.meta.env.VITE_DEV_SUBDOMAIN || 'pcepl';
      setCompany({
        companyName: `DEV - ${devSub.toUpperCase()} (local)`,
        subdomain: devSub,
        logoUrl: null,
        primaryColor: '#2563EB',
        backgroundColor: '#040C1A',
      });
      setBrandLoaded(true);
      setTenantError('');
    }
  }, []);

  const normalizeEmail = (value = '') => value.toLowerCase().trim();

  const [brandLoaded, setBrandLoaded] = useState(
    
    domain.isPlatformRoot ? true : false
  );

  const [activeHighlight, setActiveHighlight] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => {
      setActiveHighlight(prev => (prev + 1) % PRODUCT_HIGHLIGHTS.length);
    }, 6000);
    return () => clearInterval(iv);
  }, []);

  const passwordRef    = useRef(null);
  const lookupFiredRef = useRef(false);

  const primaryColor = company?.primaryColor || '#2563EB';
  const bgColor      = company?.backgroundColor || '#040C1A';
  const logoUrl      = company?.logoUrl || null;
  const companyName  = company?.companyName || 'Your Company';

  useEffect(() => {
    const ott = searchParams.get('ott');
    if (!ott) return;

    api.post('/auth/ott/exchange', { ott })
      .then(res => {
        const data = res.data?.data;
        if (data?.accessToken) {
          login(data);
          const firstName = data.user?.name?.split(' ')[0] || '';
          toast.success(`Welcome back${firstName ? `, ${firstName}` : ''}!`);
          navigate(getRoleRoute(data.user), { replace: true });
        } else {
          toast.error('Login link expired. Please sign in again.');
        }
      })
      .catch((err) => {
        const message = err.response?.data?.message || err.message || 'Login link expired. Please sign in again.';
        setError(message);
        toast.error(message);
      });
  }, []); 

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !lookupFiredRef.current) {
      lookupFiredRef.current = true;
      setEmail(emailParam);
      fireLookup(emailParam);
    }
  }, []); 

  useEffect(() => {
    if (import.meta.env.VITE_DEV_BYPASS === 'true') return;
    if (domain.isPlatformRoot || searchParams.get('email')) return;

    const query = domain.isSubdomain
      ? `subdomain=${domain.subdomain}`
      : `hostname=${encodeURIComponent(domain.hostname)}`;

    api.get(`/platform/brand?${query}`)
      .then(res => {
        const data = res.data?.data;
        if (data) {
          setCompany({
            companyName:     data.companyName || data.name,
            subdomain:       data.subdomain,
            logoUrl:         data.logoUrl || null,
            primaryColor:    data.primaryColor || '#2563EB',
            backgroundColor: data.backgroundColor || '#040C1A',
            backgroundUrl:   data.backgroundUrl || null,
          });
          setTenantError('');
        } else {
          setTenantError('not_found');
        }
        setBrandLoaded(true);
      })
      .catch(() => {
        setTenantError('not_found');
        setBrandLoaded(true);
      });
  }, []); 

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, [step]);

  const lookupMutation = useMutation({
    mutationFn: async (emailVal) => {
      const res = await api.post('/auth/lookup', {
        email: emailVal.toLowerCase().trim(),
      });
      return res.data?.data ?? res.data;
    },
    onSuccess: (lookupData) => {
      if (!lookupData?.found) {
        setError('Account not found for this email on this portal. Check the email or contact your administrator.');
        return;
      }

      const sub = lookupData.subdomain;
      if (sub && sub !== 'dev') {
        api.get(`/platform/brand?subdomain=${sub}`)
          .then(res => {
            const brand = res.data?.data || {};
            setCompany({
              companyName:     lookupData.companyName || brand.companyName || 'Your Company',
              subdomain:       sub,
              logoUrl:         lookupData.logoUrl || brand.logoUrl || null,
              primaryColor:    brand.primaryColor || '#2563EB',
              backgroundColor: brand.backgroundColor || '#040C1A',
              backgroundUrl:   brand.backgroundUrl || null,
            });
          })
          .catch(() => {
            setCompany({
              companyName: lookupData.companyName,
              subdomain:   sub,
              logoUrl:     lookupData.logoUrl,
            });
          });
      } else {
        setCompany({
          companyName: lookupData.companyName,
          subdomain:   lookupData.subdomain,
          logoUrl:     lookupData.logoUrl,
        });
      }

      setStep(2);
      setError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.message;
      setError(msg || 'Could not look up this email. Try again.');
    },
  });

  const loginMutation = useMutation({
    mutationFn: async () => {
      const subdomain = company?.subdomain;
      const headers   = subdomain ? { 'X-Tenant-Subdomain': subdomain } : {};
      const normalizedEmail = normalizeEmail(email);

      const res = await api.post(
        '/auth/login',
        { email: normalizedEmail, password },
        { headers }
      );

      return res.data?.data ?? res.data;
    },

    onSuccess: async (payload) => {
      login({ ...payload, companyLogoUrl: company?.logoUrl || payload?.logoUrl || null, companyName: company?.companyName || payload?.companyName || null });

      const firstName = payload.user?.name?.split(' ')[0] || '';
      toast.success(`Welcome back${firstName ? `, ${firstName}` : ''}!`);

      if (payload.user?.isFirstLogin) {
        navigate('/change-password', {
          replace: true,
          state: {
            fromFirstLogin: true,
            panHint: !!payload.user?.employeeId,
          },
        });
        return;
      }

      if (domain.isPlatformRoot && company?.subdomain) {
        const redirected = await redirectWithOTT(company.subdomain, payload);
        if (redirected) return;
      }

      navigate(getRoleRoute(payload.user), { replace: true });
    },

    onError: (err) => {
      const msg = err.response?.data?.message;
      if (msg === 'INVALID_CREDENTIALS') {
        setError('Email or password is incorrect. Please try again.');
      } else if (msg === 'ACCOUNT_INACTIVE') {
        setError('Your account is disabled. Please contact your HR administrator.');
      } else {
        setError(msg || 'Login failed. Please try again later.');
      }
    },
  });

  function fireLookup(emailVal = email) {
    setTenantError('');
    setError('');
    const trimmed = normalizeEmail(emailVal);
    if (!trimmed || !trimmed.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }
    lookupMutation.mutate(trimmed);
  }

  function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Enter your email address.');
      setStep(1);
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    loginMutation.mutate();
  }

  function handleBack() {
    setStep(1);
    setPassword('');
    setCompany(null);
    setError('');
    lookupFiredRef.current = false;
  }

  const isLoading = lookupMutation.isPending || loginMutation.isPending;
  const isTenant  = domain.isSubdomain || domain.isCustomDomain;

  const isUnregisteredPortal = isTenant && brandLoaded && tenantError === 'not_found';

  if (isUnregisteredPortal) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#040C1A',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        padding: '40px 24px', textAlign: 'center',
      }}>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {}
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, marginBottom: 24,
        }}>
          🔍
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
          Company portal not found
        </h1>

        <p style={{ fontSize: 15, color: '#94A3B8', maxWidth: 420, lineHeight: 1.7, margin: '0 0 8px' }}>
          <span style={{
            fontFamily: 'monospace', fontSize: 14,
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            padding: '2px 8px', borderRadius: 5, color: '#F87171',
          }}>
            {window.location.hostname}
          </span>
        </p>

        <p style={{ fontSize: 14, color: '#94A3B8', maxWidth: 420, lineHeight: 1.7, margin: '8px 0 36px' }}>
          This address is not registered with Syntern HRMS. Check the URL with
          your HR administrator, or register your company below.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a
            href="https://syntern.in/login"
            style={{
              padding: '11px 28px', background: '#2563EB', color: '#fff',
              borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}
          >
            Go to syntern.in
          </a>
          <a
            href="https://syntern.in/register"
            style={{
              padding: '11px 28px', background: 'transparent', color: '#94A3CE',
              borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none',
              border: '1px solid rgba(99,120,255,0.25)',
            }}
          >
            Register your company →
          </a>
        </div>

        <p style={{ marginTop: 48, fontSize: 12, color: '#64748B' }}>
          <a href="https://syntern.in" style={{ color: '#64748B', textDecoration: 'none' }}>
            syntern.in
          </a>{' '}· Made for India
        </p>
      </div>
    );
  }

  if (isTenant && !brandLoaded) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#040C1A', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{
          width: 20, height: 20, border: '2px solid #2563EB',
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const heroTitle = isTenant
    ? (company?.companyName || `${domain.subdomain ? `${domain.subdomain.toUpperCase()} HRMS Portal` : 'Your HRMS Portal'}`)
    : 'Syntern HRMS';
  const heroSub = isTenant
    ? 'Sign in to access your HR dashboard'
    : 'Complete HRMS with payroll, compliance, and automation — built for India.';

  const heroBackgroundStyle = company?.backgroundUrl
    ? {
        backgroundImage: `url(${company.backgroundUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'overlay',
      }
    : {};

  return (
    <div style={S.page(bgColor)}>
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {}
      <div style={{ ...S.hero(primaryColor), ...heroBackgroundStyle }}>
        <div style={S.heroGlow(primaryColor)} />
        <div style={S.heroDots(primaryColor)} />

        <a href={domain.isPlatformRoot ? '/' : '#'} style={{
          display: 'flex', alignItems: 'center', gap: 10, fontSize: 18,
          fontWeight: 700, color: '#fff', textDecoration: 'none',
          marginBottom: 56, position: 'relative',
        }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: 32, height: 32, background: primaryColor, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 14, color: '#fff',
            }}>S</div>
          )}
          {domain.isPlatformRoot ? 'Syntern HRMS' : companyName}
        </a>

        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-block', padding: '3px 12px', borderRadius: 20,
            background: `${primaryColor}20`, border: `1px solid ${primaryColor}40`,
            color: '#93C5FD', fontSize: 11, fontWeight: 600, letterSpacing: '0.6px',
            textTransform: 'uppercase', marginBottom: 20,
          }}>
            {isTenant ? 'HR Portal' : "India's Automation-Native HRMS"}
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 3.5vw, 42px)', fontWeight: 800,
            letterSpacing: '-1px', lineHeight: 1.1, color: '#fff', margin: '0 0 16px',
          }}>
            {heroTitle}
          </h1>

          <p style={{ fontSize: 15, color: '#94A3B8', lineHeight: 1.65, margin: '0 0 40px', maxWidth: 340 }}>
            {heroSub}
          </p>

          {!isTenant && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PRODUCT_HIGHLIGHTS.map((h, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: 'rgba(13,26,48,0.7)', border: `1px solid ${primaryColor}20`, borderRadius: 10,
                  opacity: activeHighlight === i ? 1 : 0.4,
                  transform: activeHighlight === i ? 'translateX(10px)' : 'none',
                  transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, background: `${primaryColor}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0,
                  }}>{h.icon}</span>
                  <span style={{ fontSize: 14, color: '#94A3CE', fontWeight: 500 }}>{h.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {domain.isPlatformRoot && (
          <div style={{
            position: 'relative', paddingTop: 28,
            borderTop: '1px solid rgba(99,120,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ fontSize: 13, color: '#CBD5E1', margin: 0 }}>Don't have an account?</p>
            <Link to="/register" style={{
              fontSize: 13, fontWeight: 600, color: primaryColor, textDecoration: 'none',
              padding: '6px 14px', borderRadius: 6, border: `1px solid ${primaryColor}50`,
            }}>
              Register →
            </Link>
          </div>
        )}
      </div>

      {/* ── RIGHT FORM ──────────────────────────────────────────── */}
      <div style={S.formPanel}>
        <div style={S.formInner}>

          {/* Dev mode banner */}
          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div style={{
              marginBottom: 20, padding: '10px 14px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 8, fontSize: 11, color: '#FCD34D', lineHeight: 1.6,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>🛠 Dev Mode</div>
              {domain.isSubdomain ? (
                <span>Simulating tenant: <strong style={{ fontFamily: 'monospace', color: '#fff' }}>{domain.subdomain}</strong></span>
              ) : (
                <span>
                  To test a tenant portal locally, use{' '}
                  <code style={{ background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: 3 }}>
                    ?devmode=<em>subdomain</em>
                  </code>
                  {' '}or set{' '}
                  <code style={{ background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: 3 }}>
                    VITE_DEV_SUBDOMAIN=pcepl
                  </code>
                  {' '}in <code style={{ background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: 3 }}>frontend/.env.local</code>
                </span>
              )}
            </div>
          )}

          {/* Step progress bar */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
            <div style={{ height: 3, flex: 1, borderRadius: 2, background: primaryColor }} />
            <div style={{ height: 3, flex: 1, borderRadius: 2, background: step >= 2 ? primaryColor : 'rgba(99,120,255,0.12)' }} />
          </div>

          {/* ── STEP 1: Email ─────────────────────────────────── */}
          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 28px' }}>
                Enter your work email to continue
              </p>

              {error && <div style={S.errorBox}>{error}</div>}

              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Work email</label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={e => e.key === 'Enter' && fireLookup()}
                  placeholder="you@yourcompany.com"
                  style={S.input(primaryColor)}
                  autoFocus
                  onFocus={e  => (e.target.style.borderColor = primaryColor)}
                  onBlur={e   => (e.target.style.borderColor = `${primaryColor}30`)}
                />
              </div>

              <button
                style={{ ...S.btnPrimary(primaryColor), opacity: isLoading ? 0.7 : 1 }}
                onClick={() => fireLookup()}
                disabled={isLoading}
                onMouseEnter={e => !isLoading && (e.target.style.background = `${primaryColor}DD`)}
                onMouseLeave={e => (e.target.style.background = primaryColor)}
              >
                {lookupMutation.isPending ? 'Looking up…' : 'Continue →'}
              </button>

              {domain.isPlatformRoot && (
                <>
                  <div style={S.dividerRow}>
                    <div style={S.dividerLine} />
                    <span style={{ fontSize: 12, color: '#64748B' }}>or</span>
                    <div style={S.dividerLine} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 14, color: '#CBD5E1' }}>New to Syntern? </span>
                    <Link to="/register" style={{ fontSize: 14, color: primaryColor, textDecoration: 'none', fontWeight: 500 }}>
                      Register your company
                    </Link>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── STEP 2: Password ──────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleLogin}>
              {company && (
                <div style={S.companyBadge(primaryColor)}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${primaryColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 14, color: '#60A5FA', flexShrink: 0,
                    }}>
                      {company.companyName?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                      {company.companyName}
                    </div>
                    <div style={{ fontSize: 12, color: '#94A3B8' }}>{email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleBack}
                    style={{
                      background: 'none', border: 'none', color: '#94A3B8',
                      fontSize: 12, cursor: 'pointer', marginLeft: 'auto', fontFamily: 'inherit',
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                Enter your password
              </h2>
              <p style={{ fontSize: 14, color: '#94A3B8', margin: '0 0 24px' }}>
                Welcome back — enter your password to continue.
              </p>

              {error && <div style={S.errorBox}>{error}</div>}

              <div style={{ marginBottom: 24 }}>
                <label style={S.label}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={passwordRef}
                    name="password"
                    autoComplete="current-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Your password"
                    style={{ ...S.input(primaryColor), paddingRight: 52 }}
                    onFocus={e  => (e.target.style.borderColor = primaryColor)}
                    onBlur={e   => (e.target.style.borderColor = `${primaryColor}30`)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94A3B8',
                      cursor: 'pointer', fontSize: 12, padding: 4, fontFamily: 'inherit',
                    }}
                  >
                    {showPass ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{ ...S.btnPrimary(primaryColor), opacity: isLoading ? 0.7 : 1 }}
                disabled={isLoading}
                onMouseEnter={e => !isLoading && (e.target.style.background = `${primaryColor}DD`)}
                onMouseLeave={e => (e.target.style.background = primaryColor)}
              >
                {loginMutation.isPending ? 'Signing in…' : 'Sign in →'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link
                  to="/forgot-password"
                  style={{ fontSize: 13, color: '#CBD5E1', textDecoration: 'none' }}
                  onMouseEnter={e => (e.target.style.color = '#94A3CE')}
                  onMouseLeave={e => (e.target.style.color = '#374151')}
                >
                  Forgot your password?
                </Link>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 12, color: '#64748B' }}>
            {domain.isPlatformRoot
              ? <><a href="/" style={{ color: '#64748B', textDecoration: 'none' }}>syntern.in</a> · Made for India</>
              : <>Powered by <a href="https://syntern.in" target="_blank" rel="noreferrer" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Syntern HRMS</a></>
            }
          </p>
        </div>
      </div>
    </div>
  );
}

