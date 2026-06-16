import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const animationStyles = `
  :root {
    --app-height: 100vh;
    --nav-height: 74px;
    --section-pad-top: clamp(28px, 4.2vh, 52px);
    --section-pad-bottom: clamp(44px, 7vh, 84px);
    --section-gap: clamp(18px, 2vw, 28px);
    --container-width: min(1400px, calc(100% - 36px));
  }

  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { overflow-x: hidden; }

  @keyframes fadeUp {
    0% { opacity: 0; transform: translateY(24px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes floatY {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
    100% { transform: translateY(0px); }
  }

  .lp-reveal {
    opacity: 0;
    transform: translateY(24px);
  }

  .lp-reveal.lp-visible {
    animation: fadeUp 0.7s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
  }

  .lp-float { animation: floatY 4.8s ease-in-out infinite; }

  .lp-container {
    width: var(--container-width);
    margin-inline: auto;
  }

  .lp-grid-hero {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(520px, 1.05fr);
    gap: clamp(22px, 2vw, 34px);
    align-items: center;
  }

  .lp-grid-split {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: clamp(20px, 2vw, 28px);
    align-items: start;
  }

  .lp-grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  .lp-feature-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .lp-pricing-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    align-items: stretch;
  }

  .lp-nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .lp-mobile-toggle { display: none; }

  .lp-section-copy {
    max-width: 920px;
    margin: 0 auto 24px;
    text-align: center;
  }

  .lp-hero-orbit {
    position: relative;
    min-height: clamp(400px, 58vh, 590px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lp-orb-1, .lp-orb-2, .lp-orb-3 {
    position: absolute;
    border-radius: 999px;
    filter: blur(10px);
    pointer-events: none;
  }

  .lp-orb-1 {
    width: min(240px, 28vw);
    height: min(240px, 28vw);
    background: radial-gradient(circle at 30% 30%, rgba(34,211,238,0.32), rgba(34,211,238,0.02) 72%);
    top: 20px;
    left: 10px;
  }

  .lp-orb-2 {
    width: min(200px, 24vw);
    height: min(200px, 24vw);
    background: radial-gradient(circle at 50% 50%, rgba(59,130,246,0.28), rgba(59,130,246,0.02) 72%);
    right: 6px;
    bottom: 34px;
  }

  .lp-orb-3 {
    width: min(110px, 14vw);
    height: min(110px, 14vw);
    background: radial-gradient(circle at 50% 50%, rgba(168,85,247,0.20), rgba(168,85,247,0.02) 72%);
    right: 78px;
    top: 32px;
  }

  .lp-window {
    position: relative;
    width: min(100%, 650px);
    border-radius: 26px;
    overflow: hidden;
    border: 1px solid rgba(34, 211, 238, 0.18);
    background: linear-gradient(180deg, rgba(20,24,35,0.96), rgba(11,14,21,0.92));
    box-shadow: 0 24px 70px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset;
    backdrop-filter: blur(14px);
  }

  .lp-window-top {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03);
  }

  .lp-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
  }

  .lp-dashboard {
    padding: 14px;
    display: grid;
    gap: 12px;
  }

  .lp-mini-cards {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .lp-mini-card,
  .lp-chart-card,
  .lp-list-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 18px;
  }

  .lp-mini-card { padding: 14px; }
  .lp-chart-card { padding: 16px; }
  .lp-list-card { padding: 14px; }

  .lp-chart-bars {
    display: flex;
    align-items: end;
    gap: 10px;
    height: clamp(96px, 16vh, 132px);
    margin-top: 14px;
  }

  .lp-chart-bar {
    flex: 1;
    border-radius: 14px 14px 6px 6px;
    background: linear-gradient(180deg, rgba(34,211,238,0.92), rgba(59,130,246,0.42));
  }

  .lp-compare-table {
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(34,211,238,0.12);
    background: rgba(16,19,27,0.72);
    backdrop-filter: blur(12px);
  }

  .lp-compare-row, .lp-compare-head {
    display: grid;
    grid-template-columns: 1.15fr 0.9fr 0.95fr;
  }

  .lp-compare-head > div {
    padding: 16px 18px;
    font-size: 13px;
    font-weight: 700;
    color: #CFFAFE;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }

  .lp-compare-row > div {
    padding: 16px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #CBD5E1;
    font-size: 14px;
  }

  .lp-compare-row:last-child > div { border-bottom: none; }

  .lp-scroll-indicator {
    position: fixed;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 110;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .lp-scroll-dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .lp-scroll-dot.active {
    height: 28px;
    background: linear-gradient(180deg, #22D3EE, #3B82F6);
    border-color: transparent;
  }

  .lp-footer-grid {
    display: grid;
    grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
    gap: 28px;
  }

  @media (max-width: 1200px) {
    :root { --container-width: min(100%, calc(100% - 28px)); }

    .lp-grid-hero,
    .lp-grid-split,
    .lp-feature-grid,
    .lp-pricing-grid,
    .lp-footer-grid {
      grid-template-columns: 1fr;
    }

    .lp-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    .lp-window {
      width: min(100%, 720px);
      margin-inline: auto;
    }
  }

  @media (max-width: 860px) {
    :root {
      --container-width: min(100%, calc(100% - 22px));
      --section-pad-top: 24px;
      --section-pad-bottom: 54px;
    }

    .lp-nav-links { display: none; }
    .lp-mobile-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .lp-scroll-indicator { display: none; }

    .lp-compare-head,
    .lp-compare-row {
      grid-template-columns: 1fr;
    }

    .lp-compare-head > div:not(:first-child) { display: none; }

    .lp-compare-row > div:nth-child(1) {
      color: #fff;
      font-weight: 700;
      padding-bottom: 6px;
    }

    .lp-compare-row > div:nth-child(2)::before {
      content: 'Keka / GreytHR: ';
      color: #94A3B8;
      font-weight: 700;
    }

    .lp-compare-row > div:nth-child(3)::before {
      content: 'Syntern HRMS: ';
      color: #94A3B8;
      font-weight: 700;
    }

    .lp-mini-cards,
    .lp-grid-4 {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    .lp-hero-orbit { min-height: 320px; }
    .lp-window { width: 100%; border-radius: 22px; }
    .lp-orb-1 { width: 150px; height: 150px; }
    .lp-orb-2 { width: 110px; height: 110px; }
    .lp-orb-3 { width: 72px; height: 72px; right: 48px; }
  }

  @media (max-height: 860px) {
    :root {
      --section-pad-top: 22px;
      --section-pad-bottom: 44px;
    }

    .lp-hero-orbit { min-height: 360px; }
    .lp-chart-bars { height: 96px; }
  }

  @media (max-height: 760px) {
    :root {
      --section-pad-top: 18px;
      --section-pad-bottom: 36px;
    }
  }
`;

const S = {
  page: {
    background: '#070B12',
    color: '#E5EEF8',
    fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif",
    minHeight: '100vh',
    overflowX: 'hidden',
    position: 'relative',
    paddingTop: 'var(--nav-height)',
  },
  bgNoise: {
    position: 'fixed',
    inset: 0,
    background: `
      radial-gradient(circle at 12% 18%, rgba(34,211,238,0.12), transparent 32%),
      radial-gradient(circle at 86% 14%, rgba(59,130,246,0.10), transparent 28%),
      radial-gradient(circle at 78% 72%, rgba(139,92,246,0.08), transparent 24%),
      linear-gradient(180deg, #070B12 0%, #090E17 48%, #070B12 100%)
    `,
    pointerEvents: 'none',
    zIndex: 0,
  },
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 200,
    backdropFilter: 'blur(18px)',
    background: 'rgba(7, 11, 18, 0.82)',
    borderBottom: '1px solid rgba(34,211,238,0.10)',
  },
  navInner: {
    width: 'var(--container-width)',
    margin: '0 auto',
    minHeight: 'var(--nav-height)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#fff',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: 20,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #22D3EE, #3B82F6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 15,
    fontWeight: 900,
    boxShadow: '0 12px 30px rgba(34,211,238,0.25)',
  },
  navLink: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
  },
  navBtnGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  btnOutline: {
    padding: '11px 18px',
    borderRadius: 999,
    border: '1px solid rgba(34,211,238,0.32)',
    color: '#67E8F9',
    background: 'rgba(255,255,255,0.02)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '12px 20px',
    borderRadius: 999,
    border: 'none',
    color: '#fff',
    background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    fontSize: 14,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 16px 36px rgba(34,211,238,0.22)',
  },
  mobileToggle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    color: '#fff',
    cursor: 'pointer',
  },
  mobileMenu: {
    width: 'var(--container-width)',
    margin: '0 auto 14px',
  },
  mobileMenuCard: {
    background: 'rgba(17, 22, 31, 0.9)',
    border: '1px solid rgba(34,211,238,0.10)',
    borderRadius: 22,
    padding: 16,
    display: 'grid',
    gap: 10,
  },
  section: {
    padding: 'var(--section-pad-top) 0 var(--section-pad-bottom)',
    position: 'relative',
    zIndex: 2,
    scrollMarginTop: 'calc(var(--nav-height) + 14px)',
  },
  sectionSmall: {
    padding: '18px 0 calc(var(--section-pad-bottom) - 10px)',
    position: 'relative',
    zIndex: 2,
    scrollMarginTop: 'calc(var(--nav-height) + 14px)',
  },
  heroSection: {
    padding: '18px 0 calc(var(--section-pad-bottom) - 6px)',
    position: 'relative',
    zIndex: 2,
    scrollMarginTop: 'calc(var(--nav-height) + 14px)',
    minHeight: 'calc(var(--app-height) - var(--nav-height))',
    display: 'flex',
    alignItems: 'center',
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 14px',
    borderRadius: 999,
    background: 'rgba(34,211,238,0.10)',
    border: '1px solid rgba(34,211,238,0.18)',
    color: '#67E8F9',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  h1: {
    margin: '0 0 14px',
    color: '#fff',
    fontSize: 'clamp(38px, 6vw, 78px)',
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: '-2px',
  },
  h2: {
    margin: '0 0 12px',
    color: '#fff',
    fontSize: 'clamp(28px, 4vw, 48px)',
    lineHeight: 1.08,
    fontWeight: 800,
    letterSpacing: '-1px',
  },
  h3: {
    margin: '0 0 10px',
    color: '#fff',
    fontSize: 20,
    fontWeight: 800,
  },
  lead: {
    margin: '0 0 22px',
    color: '#94A3B8',
    fontSize: 'clamp(16px, 1.6vw, 18px)',
    lineHeight: 1.66,
    maxWidth: 700,
  },
  subLead: {
    margin: 0,
    color: '#A8B4C6',
    fontSize: 15,
    lineHeight: 1.66,
  },
  card: {
    background: 'rgba(17, 22, 31, 0.74)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: 20,
    backdropFilter: 'blur(14px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
  },
  cardHover: {
    transition: 'transform 0.24s ease, border-color 0.24s ease, box-shadow 0.24s ease, background 0.24s ease',
  },
  cardHighlight: {
    background: 'linear-gradient(180deg, rgba(18,24,34,0.94), rgba(11,16,26,0.88))',
    border: '1px solid rgba(34,211,238,0.28)',
    borderRadius: 28,
    padding: 20,
    backdropFilter: 'blur(16px)',
    boxShadow: '0 26px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(34,211,238,0.08) inset',
    position: 'relative',
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(34,211,238,0.18), rgba(59,130,246,0.08))',
    border: '1px solid rgba(34,211,238,0.14)',
    marginBottom: 16,
    fontSize: 24,
    flexShrink: 0,
  },
  statWrap: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 24,
    padding: '22px 18px',
    textAlign: 'center',
    height: '100%',
  },
  statNum: {
    fontSize: 42,
    lineHeight: 1,
    color: '#fff',
    fontWeight: 900,
    letterSpacing: '-2px',
  },
  statLabel: {
    marginTop: 8,
    color: '#7F8CA0',
    fontSize: 13,
    fontWeight: 600,
  },
  badgeSoft: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: 700,
  },
  badgeGreen: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(16,185,129,0.14)',
    color: '#6EE7B7',
    fontSize: 12,
    fontWeight: 800,
  },
  badgeRed: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(239,68,68,0.14)',
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: 800,
  },
  ctaBox: {
    background: `linear-gradient(135deg, rgba(34,211,238,0.10), rgba(59,130,246,0.06)), rgba(17, 22, 31, 0.80)`,
    border: '1px solid rgba(34,211,238,0.16)',
    borderRadius: 32,
    padding: '34px 24px',
    textAlign: 'center',
    backdropFilter: 'blur(14px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.24)',
  },
  footer: {
    padding: '48px 0 84px',
    position: 'relative',
    zIndex: 2,
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(7, 11, 18, 0.62)',
    backdropFilter: 'blur(14px)',
  },
  footerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 800,
    marginBottom: 14,
  },
  footerLink: {
    display: 'block',
    color: '#91A1B7',
    textDecoration: 'none',
    marginBottom: 10,
    fontSize: 14,
  },
  socialIcon: {
    width: 38,
    height: 38,
    borderRadius: 999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#67E8F9',
    border: '1px solid rgba(34,211,238,0.14)',
    background: 'rgba(255,255,255,0.03)',
    textDecoration: 'none',
    marginRight: 10,
  },
  floatingChat: {
    position: 'fixed',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 999,
    border: 'none',
    background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
    color: '#fff',
    fontSize: 24,
    cursor: 'pointer',
    zIndex: 130,
    boxShadow: '0 24px 40px rgba(34,211,238,0.25)',
  },
};

const FEATURES = [
  { icon: '⚡', title: 'Aadhaar-first onboarding', desc: 'Zero data entry with Aadhaar-based onboarding flow, smart prefills, and guided employee setup.' },
  { icon: '🏛', title: 'All compliance included', desc: 'PF, ESI, PT, TDS and LWF stay available on every plan without hidden compliance add-ons.' },
  { icon: '🤖', title: 'Browser automation', desc: 'Built-in automation handles repetitive filing work and reduces dependence on manual portal steps.' },
  { icon: '∞', title: 'Unlimited employees', desc: 'No per-seat pricing, so your cost remains stable whether you manage a small team or a large workforce.' },
  { icon: '🔒', title: 'Deployment flexibility', desc: 'Run in cloud, on-premise or hybrid mode according to business, client and security requirements.' },
  { icon: '📊', title: 'Complete payroll engine', desc: 'Payroll, earnings, deductions, settlements, reports, bank files and payslip generation work from one system.' },
];

const COMPARISON_ROWS = [
  { label: 'Payroll', them: 'Paid addon', us: 'Included on all plans' },
  { label: 'Compliance', them: 'Paid addon', us: 'Included on all plans' },
  { label: 'Portal filing automation', them: 'Not available', us: 'Built in' },
  { label: 'Per-seat billing', them: 'Yes', us: 'No per-seat charges' },
  { label: 'Deployment choice', them: 'Mostly cloud only', us: 'Cloud / On-prem / Hybrid' },
  { label: 'Unlimited scale', them: 'Variable cost', us: 'Flat structure' },
];

const PRICING = [
  {
    name: 'Starter',
    price: 2999,
    period: 'mo',
    desc: 'For small teams getting started',
    features: ['Up to 3 companies', 'Core HR modules', 'Payroll + Compliance', 'Browser automation', 'Email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Professional',
    price: 7999,
    period: 'mo',
    desc: 'For growing businesses',
    features: ['Unlimited companies', 'All major modules', 'Recruitment + Performance', 'White label support', 'Custom domain', 'Priority support', 'API access'],
    cta: 'Get started',
    highlight: true,
    tag: 'Most popular',
  },
  {
    name: 'Enterprise',
    price: null,
    period: null,
    desc: 'For large organisations',
    features: ['Self-hosted deployment', 'Custom integrations', 'Dedicated support', 'SLA commitments', 'Hybrid architecture', 'Custom commercial terms'],
    cta: 'Contact us',
    highlight: false,
  },
];

const TRUST_BADGES = ['Payroll + Compliance included', 'No per-seat pricing', 'Cloud / On-prem / Hybrid', 'Automation-ready workflows'];
const SECTION_IDS = ['hero', 'stats', 'features-section', 'compliance-section', 'pricing-section', 'automation-section', 'cta-section'];

function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1500;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.35 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

function HoverCard({ children, style = {} }) {
  return (
    <div
      style={{ ...S.card, ...S.cardHover, ...style }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.24)';
        e.currentTarget.style.boxShadow = '0 26px 50px rgba(0,0,0,0.22)';
        e.currentTarget.style.background = 'rgba(20, 26, 36, 0.88)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.18)';
        e.currentTarget.style.background = 'rgba(17, 22, 31, 0.74)';
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tourCompleted, setTourCompleted] = useState(false);
  const autoScrollTimerRef = useRef(null);
  const sectionsRef = useRef([]);
  const isScrollingRef = useRef(false);
  const resumeTimeoutRef = useRef(null);

  const goto = (path) => navigate(path);

  useEffect(() => {
    const setAppHeight = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--app-height', `${vh}px`);
    };

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.visualViewport?.addEventListener('resize', setAppHeight);

    return () => {
      window.removeEventListener('resize', setAppHeight);
      window.visualViewport?.removeEventListener('resize', setAppHeight);
    };
  }, []);

  const pauseAutoScroll = useCallback((resume = true) => {
    if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    setAutoScrollEnabled(false);

    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    if (resume && !tourCompleted) {
      resumeTimeoutRef.current = setTimeout(() => {
        setAutoScrollEnabled(true);
      }, 10000);
    }
  }, [tourCompleted]);

  const scrollToSection = useCallback((index) => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    const el = sectionsRef.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentSectionIndex(index);
      const id = SECTION_IDS[index];
      if (id && id !== 'hero') {
        window.history.replaceState(null, '', `#${id}`);
      } else {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);
  }, []);

  useEffect(() => {
    if (!autoScrollEnabled || tourCompleted) return;

    autoScrollTimerRef.current = setInterval(() => {
      if (currentSectionIndex >= SECTION_IDS.length - 1) {
        clearInterval(autoScrollTimerRef.current);
        setAutoScrollEnabled(false);
        setTourCompleted(true);
        return;
      }
      scrollToSection(currentSectionIndex + 1);
    }, 5000);

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [autoScrollEnabled, currentSectionIndex, scrollToSection, tourCompleted]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        pauseAutoScroll(false);
        const nextIndex = Math.min(currentSectionIndex + 1, SECTION_IDS.length - 1);
        if (nextIndex !== currentSectionIndex) scrollToSection(nextIndex);
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        pauseAutoScroll(false);
        const prevIndex = Math.max(currentSectionIndex - 1, 0);
        if (prevIndex !== currentSectionIndex) scrollToSection(prevIndex);
      }

      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    const handleWheel = () => pauseAutoScroll(false);
    const handleTouch = () => pauseAutoScroll(false);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouch, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouch);
    };
  }, [currentSectionIndex, pauseAutoScroll, scrollToSection]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.52) {
          const index = sectionsRef.current.findIndex((node) => node === entry.target);
          if (index !== -1 && index !== currentSectionIndex) {
            setCurrentSectionIndex(index);
            if (index === SECTION_IDS.length - 1) setTourCompleted(true);
          }
          break;
        }
      }
    }, { threshold: 0.52, rootMargin: '-90px 0px 0px 0px' });

    sectionsRef.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, [currentSectionIndex]);

  useEffect(() => {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('lp-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.lp-reveal').forEach((el) => revealObserver.observe(el));
    return () => revealObserver.disconnect();
  }, []);

  const navItems = [
    { label: 'Features', index: 2 },
    { label: 'Compliance', index: 3 },
    { label: 'Pricing', index: 4 },
    { label: 'Automation', index: 5 },
    { label: 'Contact', index: 6 },
  ];

  return (
    <div style={S.page}>
      <style>{animationStyles}</style>
      <div style={S.bgNoise} />

      <div className="lp-scroll-indicator" aria-hidden="true">
        {SECTION_IDS.map((id, i) => (
          <button
            key={id}
            className={`lp-scroll-dot ${currentSectionIndex === i ? 'active' : ''}`}
            onClick={() => {
              pauseAutoScroll(false);
              scrollToSection(i);
            }}
          />
        ))}
      </div>

      <nav style={S.nav}>
        <div style={S.navInner}>
          <div style={S.logo}>
            <div style={S.logoMark}>S</div>
            <span>SYNTERN</span>
          </div>

          <ul className="lp-nav-links">
            {navItems.map((item) => (
              <li
                key={item.label}
                style={{ ...S.navLink, color: currentSectionIndex === item.index ? '#fff' : '#94A3B8' }}
                onClick={() => {
                  pauseAutoScroll(false);
                  scrollToSection(item.index);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = currentSectionIndex === item.index ? '#fff' : '#94A3B8')}
              >
                {item.label}
              </li>
            ))}
          </ul>

          <div style={S.navBtnGroup}>
            <button style={S.btnOutline} onClick={() => goto('/login')}>Login</button>
            <button style={S.btnPrimary} onClick={() => goto('/register')}>Sign up free</button>
            <button className="lp-mobile-toggle" style={S.mobileToggle} onClick={() => setMobileMenuOpen((v) => !v)}>☰</button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div style={S.mobileMenu}>
            <div style={S.mobileMenuCard}>
              {navItems.map((item) => (
                <button
                  key={item.label}
                  style={{
                    textAlign: 'left',
                    color: '#D6E2F1',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 14,
                    padding: '12px 14px',
                    fontWeight: 700,
                  }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    pauseAutoScroll(false);
                    scrollToSection(item.index);
                  }}
                >
                  {item.label}
                </button>
              ))}
              <button style={S.btnOutline} onClick={() => goto('/login')}>Login</button>
              <button style={S.btnPrimary} onClick={() => goto('/register')}>Create account</button>
            </div>
          </div>
        )}
      </nav>

      <section id="hero" ref={(el) => (sectionsRef.current[0] = el)} style={S.heroSection}>
        <div className="lp-container lp-grid-hero">
          <div className="lp-reveal">
            <div style={S.heroBadge}>✨ Full HRMS + Payroll + Compliance + Automation</div>
            <h1 style={S.h1}>Complete HRMS for <span style={{ color: '#67E8F9' }}>modern</span> teams.</h1>
            <p style={S.lead}>
              Manage employees, payroll, compliance, onboarding, automation and monthly filing from one powerful platform.
              No add-ons. No per-seat billing.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 }}>
              <button style={{ ...S.btnPrimary, padding: '14px 26px', fontSize: 15 }} onClick={() => goto('/register')}>Start 14-day free trial</button>
              <button style={{ ...S.btnOutline, padding: '14px 26px', fontSize: 15, color: '#fff', borderColor: 'rgba(255,255,255,0.14)' }} onClick={() => { pauseAutoScroll(false); scrollToSection(2); }}>
                Explore features
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {TRUST_BADGES.map((item) => <span key={item} style={S.badgeSoft}>{item}</span>)}
            </div>
          </div>

          <div className="lp-reveal lp-float">
            <div className="lp-hero-orbit">
              <div className="lp-orb-1" />
              <div className="lp-orb-2" />
              <div className="lp-orb-3" />

              <div className="lp-window">
                <div className="lp-window-top">
                  <div className="lp-dot" style={{ background: '#F87171' }} />
                  <div className="lp-dot" style={{ background: '#FBBF24' }} />
                  <div className="lp-dot" style={{ background: '#34D399' }} />
                  <div style={{ marginLeft: 8, color: '#94A3B8', fontSize: 12, fontWeight: 700 }}>Syntern HRMS Dashboard</div>
                </div>

                <div className="lp-dashboard">
                  <div className="lp-mini-cards">
                    <div className="lp-mini-card"><div style={{ color: '#7DD3FC', fontSize: 12, fontWeight: 800 }}>EMPLOYEES</div><div style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginTop: 6 }}>4,268</div><div style={{ color: '#7F8CA0', fontSize: 12, marginTop: 4 }}>Live workforce</div></div>
                    <div className="lp-mini-card"><div style={{ color: '#67E8F9', fontSize: 12, fontWeight: 800 }}>PAYROLL</div><div style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginTop: 6 }}>Ready</div><div style={{ color: '#7F8CA0', fontSize: 12, marginTop: 4 }}>Cycle approved</div></div>
                    <div className="lp-mini-card"><div style={{ color: '#C4B5FD', fontSize: 12, fontWeight: 800 }}>COMPLIANCE</div><div style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginTop: 6 }}>Auto</div><div style={{ color: '#7F8CA0', fontSize: 12, marginTop: 4 }}>Filed faster</div></div>
                  </div>

                  <div className="lp-chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: 16, fontWeight: 800 }}>Monthly processing health</div>
                        <div style={{ color: '#7F8CA0', fontSize: 13, marginTop: 4 }}>Payroll, attendance and filing timeline</div>
                      </div>
                      <span style={S.badgeGreen}>Stable</span>
                    </div>
                    <div className="lp-chart-bars">{[54,82,64,92,74,108,94].map((h, i) => <div key={i} className="lp-chart-bar" style={{ height: h }} />)}</div>
                  </div>

                  <div className="lp-list-card">
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, marginBottom: 12 }}>Workflow checkpoints</div>
                    {[
                      ['Employee onboarding', 'Auto-filled KYC'],
                      ['Payroll approval', 'Ready for release'],
                      ['PF / ESI filing', 'Automation prepared'],
                    ].map(([title, status]) => (
                      <div key={title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#D5E2EF', fontSize: 14 }}>{title}</span>
                        <span style={S.badgeSoft}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="stats" ref={(el) => (sectionsRef.current[1] = el)} style={S.sectionSmall}>
        <div className="lp-container lp-reveal">
          <div className="lp-grid-4">
            <div style={S.statWrap}><div style={S.statNum}><Counter target={14} suffix="d" /></div><div style={S.statLabel}>Free trial period</div></div>
            <div style={S.statWrap}><div style={S.statNum}><Counter target={3} suffix="+" /></div><div style={S.statLabel}>Starter company support</div></div>
            <div style={S.statWrap}><div style={S.statNum}><Counter target={24} suffix="/7" /></div><div style={S.statLabel}>Always available access</div></div>
            <div style={S.statWrap}><div style={S.statNum}><Counter target={10} suffix="k+" /></div><div style={S.statLabel}>Scalable workforce handling</div></div>
          </div>
        </div>
      </section>

      <section id="features-section" ref={(el) => (sectionsRef.current[2] = el)} style={S.section}>
        <div className="lp-container">
          <div className="lp-reveal lp-section-copy">
            <div style={S.heroBadge}>FEATURES</div>
            <h2 style={S.h2}>Everything your HR team needs in one platform.</h2>
            <p style={{ ...S.lead, marginInline: 'auto' }}>
              From onboarding to payroll to statutory workflows, every major function stays connected in one clean system.
            </p>
          </div>

          <div className="lp-feature-grid">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="lp-reveal">
                <HoverCard>
                  <div style={S.iconBox}>{feature.icon}</div>
                  <h3 style={S.h3}>{feature.title}</h3>
                  <p style={S.subLead}>{feature.desc}</p>
                </HoverCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="compliance-section" ref={(el) => (sectionsRef.current[3] = el)} style={S.section}>
        <div className="lp-container lp-grid-split">
          <div className="lp-reveal">
            <div style={S.heroBadge}>COMPLIANCE ADVANTAGE</div>
            <h2 style={S.h2}>Compliance should be standard, not an upgrade.</h2>
            <p style={S.lead}>
              Syntern keeps payroll, filing support and operational readiness inside the core product so growing teams are not forced into fragmented add-ons.
            </p>

            <div style={{ display: 'grid', gap: 14 }}>
              <HoverCard>
                <div style={S.iconBox}>🧾</div>
                <h3 style={S.h3}>Compliance-first design</h3>
                <p style={S.subLead}>Monthly statutory work stays close to payroll operations instead of becoming a disconnected process.</p>
              </HoverCard>

              <HoverCard>
                <div style={S.iconBox}>💡</div>
                <h3 style={S.h3}>Clear commercial positioning</h3>
                <p style={S.subLead}>A simpler structure makes adoption easier for internal teams, partners and decision makers.</p>
              </HoverCard>
            </div>
          </div>

          <div className="lp-reveal">
            <div className="lp-compare-table">
              <div className="lp-compare-head"><div>Feature</div><div>Keka / GreytHR</div><div>Syntern HRMS</div></div>
              {COMPARISON_ROWS.map((row) => (
                <div key={row.label} className="lp-compare-row">
                  <div style={{ fontWeight: 700, color: '#fff' }}>{row.label}</div>
                  <div>{['Paid addon', 'Not available', 'Yes'].includes(row.them) ? <span style={S.badgeRed}>{row.them}</span> : row.them}</div>
                  <div>{['Built in', 'Included on all plans'].includes(row.us) ? <span style={S.badgeGreen}>{row.us}</span> : row.us}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, color: '#7F8CA0', fontSize: 13, lineHeight: 1.7 }}>All pricing shown in INR. Taxes can be handled separately during commercial closure.</div>
          </div>
        </div>
      </section>

      <section id="pricing-section" ref={(el) => (sectionsRef.current[4] = el)} style={S.section}>
        <div className="lp-container">
          <div className="lp-reveal lp-section-copy">
            <div style={S.heroBadge}>PRICING</div>
            <h2 style={S.h2}>Simple plans with no per-seat surprise.</h2>
            <p style={{ ...S.lead, marginInline: 'auto' }}>Choose the package that fits your company size and rollout model.</p>
          </div>

          <div className="lp-pricing-grid">
            {PRICING.map((plan) => (
              <div key={plan.name} className="lp-reveal">
                <div
                  style={plan.highlight ? S.cardHighlight : S.card}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = plan.highlight ? 'translateY(-8px) scale(1.01)' : 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 28px 58px rgba(0,0,0,0.24)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = plan.highlight ? 'translateY(0) scale(1)' : 'translateY(0)';
                    e.currentTarget.style.boxShadow = plan.highlight ? '0 26px 60px rgba(0,0,0,0.22), 0 0 0 1px rgba(34,211,238,0.08) inset' : '0 20px 40px rgba(0,0,0,0.18)';
                  }}
                >
                  {plan.tag && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', padding: '7px 14px', borderRadius: 999, background: 'linear-gradient(135deg, #22D3EE, #3B82F6)', color: '#fff', fontSize: 12, fontWeight: 900 }}>
                      {plan.tag.toUpperCase()}
                    </div>
                  )}

                  <div style={{ color: plan.highlight ? '#67E8F9' : '#CBD5E1', fontWeight: 900, fontSize: 22, marginBottom: 8 }}>{plan.name}</div>
                  <div style={{ color: '#8EA0B8', fontSize: 14, marginBottom: 20 }}>{plan.desc}</div>

                  <div style={{ display: 'flex', alignItems: 'end', gap: 8, marginBottom: 22 }}>
                    <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>{plan.price !== null ? `₹${plan.price.toLocaleString()}` : 'Custom'}</div>
                    {plan.period && <div style={{ color: '#7F8CA0', fontSize: 15, marginBottom: 8, fontWeight: 700 }}>/ {plan.period}</div>}
                  </div>

                  <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
                    {plan.features.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 22, height: 22, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#67E8F9', background: 'rgba(34,211,238,0.10)', flexShrink: 0, fontSize: 12, marginTop: 1 }}>✓</div>
                        <div style={{ color: '#D3DEEB', fontSize: 14, lineHeight: 1.62 }}>{item}</div>
                      </div>
                    ))}
                  </div>

                  <button style={plan.highlight ? { ...S.btnPrimary, width: '100%', paddingBlock: 14 } : { ...S.btnOutline, width: '100%', paddingBlock: 14 }} onClick={() => goto(plan.name === 'Enterprise' ? '/contact' : '/register')}>
                    {plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="lp-reveal" style={{ textAlign: 'center', color: '#7F8CA0', fontSize: 13, marginTop: 16 }}>All prices + GST. Annual billing can be customized if required.</div>
        </div>
      </section>

      <section id="automation-section" ref={(el) => (sectionsRef.current[5] = el)} style={S.section}>
        <div className="lp-container lp-grid-split">
          <div className="lp-reveal">
            <div style={S.heroBadge}>AUTOMATION</div>
            <h2 style={S.h2}>Automate repetitive payroll and compliance workflows.</h2>
            <p style={S.lead}>
              Syntern is designed to reduce manual operational work and improve consistency across recurring monthly processes.
            </p>

            <div style={{ display: 'grid', gap: 14 }}>
              {[
                ['Portal-ready actions', 'Prepare, verify and trigger repeatable sequences with reduced repetitive effort.'],
                ['Monthly workflow acceleration', 'Keep HR, payroll and compliance teams aligned on one controlled flow.'],
                ['Better operational confidence', 'Reduce dependence on memory-based manual steps and improve workflow reliability.'],
              ].map(([title, desc]) => (
                <HoverCard key={title}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={S.iconBox}>⚙️</div>
                    <div>
                      <h3 style={{ ...S.h3, marginBottom: 6 }}>{title}</h3>
                      <p style={S.subLead}>{desc}</p>
                    </div>
                  </div>
                </HoverCard>
              ))}
            </div>
          </div>

          <div className="lp-reveal">
            <div style={S.cardHighlight}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <div style={{ color: '#fff', fontSize: 22, fontWeight: 900 }}>Automation pipeline</div>
                  <div style={{ color: '#8EA0B8', fontSize: 14, marginTop: 6 }}>From structured input to tracked output</div>
                </div>
                <span style={S.badgeGreen}>Live-ready</span>
              </div>

              {[
                ['1', 'Collect structured HR inputs'],
                ['2', 'Run payroll and compliance preparation'],
                ['3', 'Generate output files and portal-ready data'],
                ['4', 'Trigger browser-driven repetitive actions'],
                ['5', 'Track status, logs and confirmations'],
              ].map(([step, title], index) => (
                <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 0', borderTop: index === 0 ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, rgba(34,211,238,0.22), rgba(59,130,246,0.12))', border: '1px solid rgba(34,211,238,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67E8F9', fontWeight: 900, flexShrink: 0 }}>{step}</div>
                  <div style={{ color: '#D7E3F1', fontSize: 15, fontWeight: 700 }}>{title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cta-section" ref={(el) => (sectionsRef.current[6] = el)} style={S.section}>
        <div className="lp-container lp-reveal">
          <div style={S.ctaBox}>
            <div style={{ ...S.heroBadge, marginInline: 'auto', marginBottom: 16 }}>GET STARTED</div>
            <h2 style={{ ...S.h2, maxWidth: 860, marginInline: 'auto', marginBottom: 14 }}>Bring HR, payroll and compliance together in one system.</h2>
            <p style={{ ...S.lead, marginInline: 'auto', marginBottom: 22 }}>
              Start with a free trial, sign in to continue, or talk to us for enterprise and deployment discussions.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
              <button style={{ ...S.btnPrimary, padding: '15px 28px', fontSize: 15 }} onClick={() => goto('/register')}>Sign up free</button>
              <button style={{ ...S.btnOutline, padding: '15px 28px', fontSize: 15, color: '#fff', borderColor: 'rgba(255,255,255,0.14)' }} onClick={() => goto('/login')}>Login</button>
              <button style={{ ...S.btnOutline, padding: '15px 28px', fontSize: 15, color: '#fff', borderColor: 'rgba(255,255,255,0.14)' }} onClick={() => goto('/contact')}>Contact us</button>
            </div>
          </div>
        </div>
      </section>

      <footer style={S.footer}>
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div>
              <div style={{ ...S.logo, marginBottom: 16 }}><div style={S.logoMark}>S</div><span>SYNTERN</span></div>
              <p style={{ color: '#8FA1B8', fontSize: 14, lineHeight: 1.8, maxWidth: 360, margin: '0 0 18px' }}>
                Complete HRMS with payroll, compliance and automation-oriented workflows for modern organisations.
              </p>
              <div>
                <a href="#" style={S.socialIcon}>in</a>
                <a href="#" style={S.socialIcon}>𝕏</a>
                <a href="#" style={S.socialIcon}>▶</a>
              </div>
            </div>

            <div>
              <div style={S.footerTitle}>Platform</div>
              {['Features', 'Pricing', 'Compliance', 'Automation'].map((item) => <a key={item} href="#" style={S.footerLink} onClick={(e) => e.preventDefault()}>{item}</a>)}
            </div>

            <div>
              <div style={S.footerTitle}>Company</div>
              {['About', 'Contact', 'Support', 'Privacy'].map((item) => <a key={item} href="#" style={S.footerLink} onClick={(e) => e.preventDefault()}>{item}</a>)}
            </div>

            <div>
              <div style={S.footerTitle}>Contact</div>
              <div style={{ color: '#91A1B7', fontSize: 14, lineHeight: 1.9 }}>
                hello@syntern.in<br />
                +91 9466806190<br />
                India
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', color: '#738399', fontSize: 13 }}>
            <span>© 2026 Syntern. All rights reserved.</span>
            <span>Built for responsive desktop, laptop, tablet and mobile usage.</span>
          </div>
        </div>
      </footer>

      <button style={S.floatingChat} onClick={() => goto('/contact')} aria-label="Open contact">
        💬
      </button>
    </div>
  );
}

