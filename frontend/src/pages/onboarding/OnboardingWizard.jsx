import LogoUploadStep from './.LogoUploadStep';
﻿﻿/**
 * @file OnboardingWizard.jsx
 * @description Multi-step wizard to guide new tenants through initial configuration.
 */
import { useState, useCallback, useId, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { settingsApi } from '../../services/settingsApi';
import PlanSelectionStep from './PlanSelectionStep';

// ==================== THEME CONSTANTS ====================
const C = {
  bg:      '#06101E',
  surface: '#0A1628',
  panel:   '#0D1A2D',
  border:  '#1E3355',
  blue:    '#2563EB',
  blueHi:  '#1D4ED8',
  green:   '#22C55E',
  amber:   '#F59E0B',
  purple:  '#8B5CF6',
  text:    '#E2E8F8',
  label:   '#90A4C8',
  muted:   '#5A7090',
  white:   '#FFFFFF',
  red:     '#EF4444',
};

// ==================== PLAN & MODULE DEFINITIONS ====================
const BASIC_INCLUDED_MODULES = [
  'Employee management', 'Attendance', 'Leave', 'Payroll', 'Compliance'
];

const ALL_MODULES = [
  'Employee management', 'Attendance', 'Leave', 'Payroll', 'Compliance',
  'Recruitment', 'Performance', 'Training', 'Assets', 'Expenses',
  'Reports', 'Automation', 'Documents', 'Notifications', 'Settings'
];

// ==================== DEFAULT PAYROLL COMPONENTS (MOVED UP) ====================
const DEFAULT_COMPONENTS = [
  { key: 'basic', label: 'Basic salary', type: 'earning', selected: true, required: true, pct: 40, desc: '40% of CTC typically' },
  { key: 'hra', label: 'House Rent Allowance', type: 'earning', selected: true, required: false, pct: 20, desc: '50% of basic (metro) / 40% (non-metro)' },
  { key: 'conveyance', label: 'Conveyance allowance', type: 'earning', selected: true, required: false, fixed: 1600, desc: 'Tax-free up to ₹1,600/month' },
  { key: 'medical', label: 'Medical allowance', type: 'earning', selected: true, required: false, fixed: 1250, desc: 'Tax-free up to ₹15,000/year' },
  { key: 'special', label: 'Special allowance', type: 'earning', selected: true, required: false, desc: 'Balancing component' },
  { key: 'lta', label: 'Leave Travel Allowance', type: 'earning', selected: false, required: false, desc: 'Tax-free 2x in 4 years' },
  { key: 'pf', label: 'PF (employee 12%)', type: 'deduction', selected: true, required: true, pct: 12, desc: 'On basic, mandatory if basic > ₹15,000' },
  { key: 'esi', label: 'ESI (employee 0.75%)', type: 'deduction', selected: true, required: false, pct: 0.75, desc: 'On gross, if gross ≤ ₹21,000' },
  { key: 'pt', label: 'Professional tax', type: 'deduction', selected: true, required: false, desc: 'State-wise slab, max ₹2,500/year' },
  { key: 'tds', label: 'TDS (Income Tax)', type: 'deduction', selected: true, required: false, desc: 'Computed on projected annual income' },
];

// ==================== WIZARD STEPS ====================
const STEPS = [
  { key: 'plan',        label: 'Choose plan',     icon: '🚀' },
  { key: 'org',         label: 'Organisation',    icon: '🏢' },
  { key: 'branding', label: 'Branding',        icon: 'U0001F3A8' },
  { key: 'work',        label: 'Work settings',   icon: '⏰' },
  { key: 'payroll',     label: 'Payroll',         icon: '₹' },
  { key: 'email',       label: 'Email',           icon: '✉' },
  { key: 'compliance',  label: 'Compliance',      icon: '📋' },
  { key: 'done',        label: 'Launch',          icon: '✅' },
];

// ==================== REUSABLE COMPONENTS ====================
function Inp({ label, value, onChange, placeholder, type = 'text', hint, required, half, disabled }) {
  const inputId = useId();
  return (
    <div style={{ marginBottom: 14, width: half ? 'calc(50% - 6px)' : '100%' }}>
      <label htmlFor={inputId} style={styles.label}>{label}{required && <span style={{ color: C.red }}> *</span>}</label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={styles.input}
      />
      {hint && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

function Tag({ text, color }) {
  return <span style={{ fontSize: 10, fontWeight: 700, background: `${color}22`, color, padding: '2px 8px', borderRadius: 4, border: `1px solid ${color}44` }}>{text}</span>;
}

function WizBtn({ children, onClick, disabled, variant = 'primary', small }) {
  const base = {
    padding: small ? '8px 18px' : '12px 24px',
    borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none', fontFamily: 'inherit', transition: 'all 0.15s',
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { ...base, background: C.blue, color: C.white },
    outline: { ...base, background: 'transparent', color: C.label, border: `1px solid ${C.border}` },
    green:   { ...base, background: C.green, color: '#000' },
    ghost:   { ...base, background: 'transparent', color: C.muted, textDecoration: 'underline' },
  };
  return <button style={variants[variant] || variants.primary} onClick={onClick} disabled={disabled}>{children}</button>;
}

const styles = {
  label: { display: 'block', fontSize: 11, fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5 },
  input: { width: '100%', padding: '10px 13px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  card: { background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` },
};

// ==================== MAIN COMPONENT ====================
export default function OnboardingWizard({ onComplete }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // ---------- Payment mutations ----------
  const orderM = useMutation({
    mutationFn: (data) => api.post('/platform/subscribe/order', data),
    onError: (e) => toast.error(e.response?.data?.message || 'Payment error'),
  });
  const verifyM = useMutation({
    mutationFn: (data) => api.post('/platform/subscribe/verify', data),
    onError: (e) => toast.error(e.response?.data?.message || 'Verification failed'),
  });
  const completeM = useMutation({
    mutationFn: () => api.post('/platform/onboarding/complete'),
    onSuccess: () => { onComplete?.(); navigate('/dashboard', { replace: true }); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function handlePlanNext({ planSlug, selectedAddons, billingMonths, promoCode, priceResult, startTrial, method }) {
    try {
      if (startTrial) {
        // Free trial path — no payment
        await api.post('/platform/subscribe/trial', {
          planSlug,
          selectedAddons,
          billingMonths: 1,
        });
        toast.success('🎉 Free trial activated!');
        setStep(STEPS.findIndex(s => s.key === 'org'));
        return;
      }

      if (!priceResult || priceResult.total_paise === 0) {
        // Custom quote (Enterprise) — just advance without payment
        setStep(STEPS.findIndex(s => s.key === 'org'));
        return;
      }

      // Paid path — initiate payment order
      const orderResp = await api.post('/platform/subscribe/order', {
        planSlug,
        selectedAddons,
        billingMonths,
        promoCode,
        employeeCount: 0,
        method: method || 'razorpay',
      });

      const orderData = orderResp.data?.data;

      if (orderData?.mock) {
        // Dev mode: skip real payment
        await api.post('/platform/subscribe/verify', {
          planSlug, billingMonths, selectedAddons, promoCode,
          mock: true, razorpay_payment_id: 'mock', razorpay_order_id: 'mock', razorpay_signature: 'mock',
        });
        toast.success('Plan activated (dev mode)!');
        setStep(STEPS.findIndex(s => s.key === 'org'));
        return;
      }

      // Open Razorpay checkout
      const rzp = new window.Razorpay({
        key:         orderData.keyId,
        amount:      orderData.amount,
        currency:    orderData.currency || 'INR',
        order_id:    orderData.orderId,
        name:        orderData.companyName,
        description: orderData.description,
        prefill:     orderData.prefill || {},
        handler:     async function (response) {
          try {
            await api.post('/platform/subscribe/verify', {
              planSlug, billingMonths, selectedAddons, promoCode,
              razorpay_payment_id:  response.razorpay_payment_id,
              razorpay_order_id:    response.razorpay_order_id,
              razorpay_signature:   response.razorpay_signature,
            });
            toast.success('Payment successful! Plan activated.');
            setStep(STEPS.findIndex(s => s.key === 'org'));
          } catch { toast.error('Payment verification failed. Contact support.'); }
        },
        modal: { ondismiss: () => toast.error('Payment cancelled.') },
        theme: { color: '#2563EB' },
      });
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not initiate payment');
    }
  }

  // ---------- Other step handlers (unchanged) ----------
  const [depts, setDepts] = useState(['HR', 'Finance', 'Operations', 'IT', 'Admin']);
  const [desigs, setDesigs] = useState(['Manager', 'Senior Executive', 'Executive', 'Intern']);
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [savingOrg, setSavingOrg] = useState(false);

  const [shiftName, setShiftName] = useState('General');
  const [shiftStart, setShiftStart] = useState('09:30');
  const [shiftEnd, setShiftEnd] = useState('18:30');
  const [grace, setGrace] = useState('15');
  const [loadingHol, setLoadingHol] = useState(false);
  const [holLoaded, setHolLoaded] = useState(false);

  const [components, setComponents] = useState(DEFAULT_COMPONENTS);

  const [smtp, setSmtp] = useState({ emailHost: '', emailPort: '587', emailUser: '', emailPass: '', emailFrom: '', emailSsl: false });
  const [skipEmail, setSkipEmail] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpVerified, setSmtpVerified] = useState(false);

  const [pf, setPf] = useState({ username: '', password: '', employerCode: '' });
  const [esi, setEsi] = useState({ username: '', password: '' });
  const [skipCompliance, setSkipCompliance] = useState(false);

  async function saveOrg() {
    setSavingOrg(true);
    try {
      for (const name of depts) await settingsApi.createDept({ name }).catch(() => {});
      for (const name of desigs) await settingsApi.createDesig({ name }).catch(() => {});
      await api.post('/platform/onboarding/save-step', { step: 'org' });
      toast.success('Organisation saved');
      setStep(s => s + 1);
    } finally { setSavingOrg(false); }
  }

  async function saveWork() {
    setBusy(true);
    try {
      await settingsApi.createShift({ name: shiftName, start_time: shiftStart, end_time: shiftEnd, grace_minutes: Number(grace), shift_type: 'fixed' });
      if (!holLoaded) { await settingsApi.loadNationalHolidays(new Date().getFullYear()); setHolLoaded(true); }
      await api.post('/platform/onboarding/save-step', { step: 'work' });
      toast.success('Work settings saved');
      setStep(s => s + 1);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setBusy(false); }
  }

  async function savePayroll() {
    setBusy(true);
    try {
      const selected = components.filter(c => c.selected);
      await api.post('/platform/onboarding/save-step', { step: 'payroll', data: { components: selected.map(c => c.key) } });
      for (const comp of selected) {
        await api.post('/payroll/salary-components', {
          name: comp.label, code: comp.key.toUpperCase(), type: comp.type,
          calculation_type: comp.pct ? 'percentage' : 'fixed',
          value: comp.pct || comp.fixed || 0, is_taxable: comp.type === 'earning', is_active: true,
        }).catch(() => {});
      }
      toast.success(`${selected.length} salary components configured`);
      setStep(s => s + 1);
    } catch (e) { toast.error('Failed to save payroll settings'); }
    finally { setBusy(false); }
  }

  async function saveEmail() {
    if (skipEmail) { setStep(s => s + 1); return; }
    setBusy(true);
    try {
      await settingsApi.saveNotifications(smtp);
      toast.success('Email settings saved');
      setStep(s => s + 1);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to save email'); }
    finally { setBusy(false); }
  }

  async function testSmtp() {
    setTestingSmtp(true);
    try {
      await settingsApi.testEmail(smtp.emailUser);
      setSmtpVerified(true);
      toast.success('SMTP test email sent!');
    } catch (e) { toast.error('SMTP test failed'); }
    finally { setTestingSmtp(false); }
  }

  async function saveCompliance() {
    setBusy(true);
    try {
      if (!skipCompliance && (pf.username || esi.username)) {
        await api.post('/platform/onboarding/save-step', { step: 'compliance', data: { pf, esi } });
      }
      toast.success(skipCompliance ? 'Skipped' : 'Compliance saved');
      setStep(s => s + 1);
    } finally { setBusy(false); }
  }

  const currentStep = STEPS[step];
  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans','DM Sans',system-ui,sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, background: C.blue, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff' }}>S</div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Syntern HRMS</span>
          <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>— Setup wizard</span>
        </div>
        <WizBtn variant="ghost" onClick={() => { window.location.href = '/login'; }}>Logout</WizBtn>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.border }}><div style={{ height: '100%', width: `${pct}%`, background: C.blue, transition: 'width 0.4s' }} /></div>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, padding: '14px 32px', borderBottom: `1px solid ${C.border}`, overflowX: 'auto' }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: current ? 'rgba(37,99,235,0.12)' : 'transparent', cursor: done ? 'pointer' : 'default' }}
                onClick={() => done && setStep(i)}>
                <span style={{ fontSize: 13 }}>{done ? '✓' : s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: current ? 700 : 400, color: done ? C.green : current ? '#60a5fa' : C.muted }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ width: 20, height: 1, background: C.border }} />}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '36px 24px' }}>
        <div style={{ width: '100%', maxWidth: 'calc(100vw - 48px)' }}>
          {currentStep.key === 'plan' && (
            <div style={{ background: 'transparent', padding: 0 }}>
              <PlanSelectionStep
                onNext={handlePlanNext}
                employeeCount={0}
              />
            </div>
          )}

          {/* ========== OTHER STEPS (COMPLETELY UNCHANGED) ========== */}
          {currentStep.key === 'org' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Set up your organisation</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Add departments and designations. You can edit these anytime in Settings.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#60a5fa' }}>🏢 Departments</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {depts.map(d => (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 6, padding: '3px 8px', fontSize: 11 }}>
                        {d}
                        <button style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }} onClick={() => setDepts(ds => ds.filter(x => x !== d))}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={newDept} onChange={e => setNewDept(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newDept.trim()) { setDepts(ds => [...ds, newDept.trim()]); setNewDept(''); } }} placeholder="Add department + Enter" style={{ flex: 1, padding: '7px 10px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 }} />
                    <button style={{ padding: '7px 12px', background: C.blue, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }} onClick={() => { if (newDept.trim()) { setDepts(ds => [...ds, newDept.trim()]); setNewDept(''); } }}>Add</button>
                  </div>
                </div>
                <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, color: '#a78bfa' }}>👤 Designations</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {desigs.map(d => (
                      <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 6, padding: '3px 8px', fontSize: 11 }}>
                        {d}
                        <button style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 12, padding: 0 }} onClick={() => setDesigs(ds => ds.filter(x => x !== d))}>×</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input value={newDesig} onChange={e => setNewDesig(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && newDesig.trim()) { setDesigs(ds => [...ds, newDesig.trim()]); setNewDesig(''); } }} placeholder="Add designation + Enter" style={{ flex: 1, padding: '7px 10px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 }} />
                    <button style={{ padding: '7px 12px', background: C.purple, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer' }} onClick={() => { if (newDesig.trim()) { setDesigs(ds => [...ds, newDesig.trim()]); setNewDesig(''); } }}>Add</button>
                  </div>
                </div>
              </div>
            </div>
          )}

              {currentStep.key === 'branding' && (\n                <LogoUploadStep\n                  onNext={() => setStep((s) => s + 1)}\n                  onSkip={() => setStep((s) => s + 1)}\n                />\n              )}
          {currentStep.key === 'work' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Work settings</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Configure your default shift and load national holidays.</div>
              <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#60a5fa', marginBottom: 14 }}>⏰ Default shift</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <Inp label="Shift name" value={shiftName} onChange={setShiftName} placeholder="General" required />
                  <Inp label="Start time" value={shiftStart} onChange={setShiftStart} type="time" required />
                  <Inp label="End time"   value={shiftEnd}   onChange={setShiftEnd}   type="time" required />
                  <Inp label="Grace (min)" value={grace}     onChange={setGrace}       type="number" placeholder="15" />
                </div>
              </div>
              <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}`, marginBottom: 24 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#fbbf24', marginBottom: 8 }}>📅 National holidays {new Date().getFullYear()}</div>
                {holLoaded ? <div style={{ color: C.green, fontSize: 12 }}>✓ National holidays loaded</div> : (
                  <button onClick={async () => { setLoadingHol(true); try { await settingsApi.loadNationalHolidays(new Date().getFullYear()); setHolLoaded(true); toast.success('Holidays loaded'); } catch { toast.error('Failed'); } finally { setLoadingHol(false); } }} disabled={loadingHol} style={{ padding: '8px 16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 7, color: '#fbbf24', fontSize: 12, cursor: 'pointer' }}>{loadingHol ? 'Loading…' : `Load national holidays ${new Date().getFullYear()}`}</button>
                )}
              </div>
            </div>
          )}

          {currentStep.key === 'payroll' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Payroll components</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Select the salary components for your company.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
                {[{ type: 'earning', label: 'Earnings', color: C.green }, { type: 'deduction', label: 'Deductions', color: C.red }].map(section => (
                  <div key={section.type} style={{ background: C.surface, borderRadius: 10, padding: 14, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: section.color, marginBottom: 10 }}>{section.label}</div>
                    {components.filter(c => c.type === section.type).map(c => (
                      <label key={c.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, cursor: c.required ? 'not-allowed' : 'pointer' }}>
                        <input type="checkbox" checked={c.selected} disabled={c.required} onChange={e => setComponents(cs => cs.map(x => x.key === c.key ? { ...x, selected: e.target.checked } : x))} style={{ marginTop: 2 }} />
                        <div><div style={{ fontSize: 12 }}>{c.label}{c.required && <span style={{ fontSize: 9, color: section.color, marginLeft: 4 }}>required</span>}{c.pct && <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>{c.pct}%</span>}{c.fixed && <span style={{ fontSize: 10, color: C.muted, marginLeft: 4 }}>₹{c.fixed}/mo</span>}</div><div style={{ fontSize: 10, color: C.muted }}>{c.desc}</div></div>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep.key === 'email' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Email configuration</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Configure SMTP. <span style={{ color: C.amber }}>Recommended.</span></div>
              {!skipEmail && (
                <div style={{ background: C.surface, borderRadius: 10, padding: 18, border: `1px solid ${C.border}`, marginBottom: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ gridColumn: '1/-1' }}><Inp label="SMTP host *" value={smtp.emailHost} onChange={v => setSmtp(s=>({...s,emailHost:v}))} placeholder="smtp.gmail.com" required /></div>
                    <Inp label="Port" value={smtp.emailPort} onChange={v => setSmtp(s=>({...s,emailPort:v}))} placeholder="587" type="number" />
                    <div><label style={styles.label}>SSL</label><select value={smtp.emailSsl ? 'true' : 'false'} onChange={e => setSmtp(s=>({...s,emailSsl:e.target.value==='true'}))} style={{ ...styles.input, padding: '8px' }}><option value="false">STARTTLS (port 587)</option><option value="true">SSL (port 465)</option></select></div>
                    <Inp label="Username *" value={smtp.emailUser} onChange={v => setSmtp(s=>({...s,emailUser:v}))} placeholder="hr@yourcompany.com" required />
                    <Inp label="Password" value={smtp.emailPass} onChange={v => setSmtp(s=>({...s,emailPass:v}))} placeholder="App password" type="password" />
                    <div style={{ gridColumn: '1/-1' }}><Inp label="From address" value={smtp.emailFrom} onChange={v => setSmtp(s=>({...s,emailFrom:v}))} placeholder="HR Team <hr@yourcompany.com>" hint="Name employees see" /></div>
                  </div>
                  <button onClick={testSmtp} disabled={testingSmtp || !smtp.emailHost || !smtp.emailUser} style={{ marginTop: 12, padding: '6px 12px', background: smtpVerified ? 'rgba(34,197,94,0.1)' : 'rgba(37,99,235,0.1)', border: `1px solid ${smtpVerified ? 'rgba(34,197,94,0.3)' : 'rgba(37,99,235,0.3)'}`, borderRadius: 6, color: smtpVerified ? C.green : '#60a5fa', cursor: 'pointer' }}>{testingSmtp ? 'Sending…' : smtpVerified ? '✓ Verified' : 'Send test email'}</button>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.muted }}><input type="checkbox" checked={skipEmail} onChange={e => setSkipEmail(e.target.checked)} /> Skip for now — configure later</label>
            </div>
          )}

          {currentStep.key === 'compliance' && (
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Compliance portal credentials</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Syntern can auto-file PF ECR and ESI challan.</div>
              <div style={{ padding: '10px 14px', background: 'rgba(37,99,235,0.07)', borderRadius: 8, fontSize: 12, marginBottom: 20 }}>🔒 Credentials encrypted with AES-256.</div>
              {!skipCompliance && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#fbbf24', marginBottom: 12 }}>PF / EPFO Portal</div>
                    <Inp label="Username" value={pf.username} onChange={v => setPf(p=>({...p,username:v}))} placeholder="DLCPM0XXXXXX" />
                    <Inp label="Password" value={pf.password} onChange={v => setPf(p=>({...p,password:v}))} type="password" placeholder="EPFO password" />
                    <Inp label="Establishment code" value={pf.employerCode} onChange={v => setPf(p=>({...p,employerCode:v}))} placeholder="Establishment code" hint="For ECR file" />
                  </div>
                  <div style={{ background: C.surface, borderRadius: 10, padding: 16, border: `1px solid ${C.border}` }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#34d399', marginBottom: 12 }}>ESI / ESIC Portal</div>
                    <Inp label="Username" value={esi.username} onChange={v => setEsi(e=>({...e,username:v}))} placeholder="ESIC username" />
                    <Inp label="Password" value={esi.password} onChange={v => setEsi(e=>({...e,password:v}))} type="password" placeholder="ESIC password" />
                  </div>
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, marginTop: 16 }}><input type="checkbox" checked={skipCompliance} onChange={e => setSkipCompliance(e.target.checked)} /> Skip — add later in Settings</label>
            </div>
          )}

          {currentStep.key === 'done' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px' }}>🎉</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>You're all set!</div>
              <div style={{ fontSize: 15, color: C.muted, marginBottom: 32 }}>Your Syntern HRMS is configured and ready to use.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 32, textAlign: 'left' }}>
                {[{ icon: '👥', title: 'Add employees', desc: 'Import CSV or add individually' }, { icon: '₹', title: 'Set up salaries', desc: 'CTC structures per role' }, { icon: '📋', title: 'Configure compliance', desc: 'PF/ESI numbers' }].map(card => (
                  <div key={card.title} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}><div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div><div style={{ fontWeight: 600 }}>{card.title}</div><div style={{ fontSize: 11, color: C.muted }}>{card.desc}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent footer button */}
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 20, zIndex: 60 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {currentStep.key !== 'plan' && (
            <WizBtn onClick={async () => {
              if (currentStep.key === 'org') return saveOrg();
              if (currentStep.key === 'work') return saveWork();
              if (currentStep.key === 'payroll') return savePayroll();
              if (currentStep.key === 'email') return saveEmail();
              if (currentStep.key === 'compliance') return saveCompliance();
              if (currentStep.key === 'done') return completeM.mutate();
            }} disabled={busy || savingOrg || completeM.isPending}>
              {currentStep.key === 'org' ? (savingOrg ? 'Saving…' : 'Save & continue →') :
            currentStep.key === 'work' ? (busy ? 'Saving…' : 'Save & continue →') :
            currentStep.key === 'payroll' ? (busy ? 'Saving…' : `Save ${components.filter(c=>c.selected).length} components & continue →`) :
            currentStep.key === 'email' ? (busy ? 'Saving…' : 'Continue →') :
            currentStep.key === 'compliance' ? (busy ? 'Saving…' : 'Continue →') :
            currentStep.key === 'done' ? (completeM.isPending ? 'Launching…' : '🚀 Launch dashboard →') : 'Continue'
            }</WizBtn>
          )}
          {(currentStep.key === 'org' || currentStep.key === 'work') && (
            <WizBtn variant="ghost" onClick={() => setStep(s => s + 1)}>Skip</WizBtn>
          )}
        </div>
      </div>
    </div>
  );
}