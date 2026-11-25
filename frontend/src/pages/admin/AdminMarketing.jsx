import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import '../admin/AdminLayout.css';
const SECTIONS = ['Hero', 'Features', 'Pricing', 'Testimonials', 'CTA'];

const HERO_DEFAULTS = {
  heading:  'India\'s smartest HRMS — built for real businesses',
  subhead:  'Payroll. Compliance. KYC automation. All in one place. No per-seat charges.',
  ctaText:  'Start free 14-day trial',
  ctaUrl:   '/register',
  ctaSub:   'No credit card required',
};

const CTA_DEFAULTS = {
  heading: 'Bring HR, payroll and compliance together in one system.',
  subhead: 'Start with a free trial, sign in to continue, or talk to us for enterprise and deployment discussions.',
  primaryText: 'Sign up free',
  primaryUrl: '/register',
  secondaryText: 'Login',
  secondaryUrl: '/login',
  contactText: 'Contact us',
  contactUrl: '/contact',
};

const FEATURE_DEFAULTS = [
  { icon: '₹',  title: 'Payroll on all plans',           desc: 'Payslips, PF, ESI, TDS — included in every plan. Not a paid addon.' },
  { icon: '🤖', title: 'Browser automation (unique)',     desc: 'Auto-file ECR on EPFO. Auto-file ESI challan. Aadhaar KYC auto-fill. No competitor has this.' },
  { icon: '📋', title: 'Compliance made simple',         desc: 'PF, ESI, PT, TDS, LWF — all states, all slabs, auto-computed.' },
  { icon: '♾', title: 'Unlimited employees',            desc: 'Keka charges per employee. We don\'t. Unlimited headcount on all plans.' },
  { icon: '🔒', title: 'Your data, your control',        desc: 'Self-hosted PostgreSQL. Your database, your server, your choice.' },
  { icon: '🌐', title: 'Your own domain',                desc: 'hr.yourcompany.com instead of yourcompany.syntern.in. Starter plan+.' },
];

export default function AdminMarketing() {
  const qc = useQueryClient();
  const [active, setActive]   = useState('Hero');
  const [hero,   setHero]     = useState(HERO_DEFAULTS);
  const [features, setFeatures] = useState(FEATURE_DEFAULTS);
  const [testimonials, setTestimonials] = useState([]);
  const [cta, setCta] = useState(CTA_DEFAULTS);
  const [copied, setCopied]   = useState(false);

  // 1. Fetch current marketing settings from DB
  const { data: marketingRes, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-marketing'],
    queryFn: () => api.get('/platform/admin/settings').then(res => res.data?.data?.Marketing || {}),
  });

  // 1.1 Fetch current plan catalog for preview
  const { data: plansRes } = useQuery({
    queryKey: ['admin-plans-catalog'],
    queryFn: () => api.get('/platform/admin/plans').then(res => res.data?.data || {}),
  });
  const catalogPlans = plansRes?.plans || [];

  // Sync local state when data is loaded
  useEffect(() => {
    if (marketingRes && Object.keys(marketingRes).length > 0) {
      setHero(h => ({ ...h, ...marketingRes, heading: marketingRes.heroHeading || marketingRes.heading || h.heading, subhead: marketingRes.heroSubhead || marketingRes.subhead || h.subhead }));
      if (Array.isArray(marketingRes.features)) setFeatures(marketingRes.features);
      if (Array.isArray(marketingRes.testimonials)) setTestimonials(marketingRes.testimonials);
      setCta(current => ({ ...current,
        heading: marketingRes.bottomCtaHeading || current.heading,
        subhead: marketingRes.bottomCtaSubhead || current.subhead,
        primaryText: marketingRes.bottomCtaPrimaryText || current.primaryText,
        primaryUrl: marketingRes.bottomCtaPrimaryUrl || current.primaryUrl,
        secondaryText: marketingRes.bottomCtaSecondaryText || current.secondaryText,
        secondaryUrl: marketingRes.bottomCtaSecondaryUrl || current.secondaryUrl,
        contactText: marketingRes.bottomCtaContactText || current.contactText,
        contactUrl: marketingRes.bottomCtaContactUrl || current.contactUrl,
      }));
    }
  }, [marketingRes]);

  // 2. Mutation to save settings
  const saveM = useMutation({
    mutationFn: (values) => api.put('/platform/admin/settings', { section: 'Marketing', values }),
    onSuccess: () => {
      toast.success('Landing page updated successfully');
      qc.invalidateQueries({ queryKey: ['admin-marketing'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  function copyEmbed() {
    const code = `<a href="https://syntern.in/register" style="display:inline-block;padding:12px 24px;background:#2563EB;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${hero.ctaText}</a>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Embed code copied');
  }

  function handleSave() {
    saveM.mutate({
      ...(marketingRes || {}),
      heroHeading: hero.heading,
      heroSubhead: hero.subhead,
      ctaText: hero.ctaText,
      ctaUrl: hero.ctaUrl,
      ctaSub: hero.ctaSub,
    });
  }

  if (isLoading) return <div className="admin-empty-state">Loading landing page content…</div>;
  if (isError) return <div className="admin-alert admin-alert--warning">Could not load saved marketing content. Nothing has been changed. <button className="btn-sm" onClick={() => refetch()}>Retry</button></div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14 }}>

      {}
      <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--admin-border)', fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>
          Landing page
        </div>
        {SECTIONS.map(s => (
          <button key={s}
            className={`hr-settings-btn${active === s ? ' active' : ''}`}
            onClick={() => setActive(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {}
      <div>

        {active === 'Hero' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Hero section</div>
            {[
              { key: 'heading',  label: 'Main heading *',        multiline: false },
              { key: 'subhead',  label: 'Sub-heading',           multiline: true  },
              { key: 'ctaText',  label: 'CTA button text',       multiline: false },
              { key: 'ctaUrl',   label: 'CTA URL',               multiline: false },
              { key: 'ctaSub',   label: 'Text below CTA button', multiline: false },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="form-label">{f.label}</label>
                {f.multiline
                  ? <textarea className="form-input" rows={2} value={hero[f.key]} onChange={e => setHero(h => ({ ...h, [f.key]: e.target.value }))} />
                  : <input   className="form-input"          value={hero[f.key]} onChange={e => setHero(h => ({ ...h, [f.key]: e.target.value }))} />
                }
              </div>
            ))}

            {}
            <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 10, padding: '24px 28px', marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 8, lineHeight: 1.3 }}>{hero.heading}</div>
              <div style={{ fontSize: 13, color: 'var(--admin-text-soft)', marginBottom: 20 }}>{hero.subhead}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ padding: '10px 24px', background: 'var(--admin-accent)', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{hero.ctaText}</div>
                <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{hero.ctaSub}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={handleSave} disabled={saveM.isPending}>
                {saveM.isPending ? 'Saving…' : 'Save hero section'}
              </button>
              <button className="btn-sm" onClick={copyEmbed}>{copied ? '✓ Copied!' : 'Copy embed code'}</button>
            </div>
          </div>
        )}

        {active === 'Features' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Editable landing-page feature cards</div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-soft)', marginBottom: 14 }}>Changes are saved centrally and shown on the public landing page.</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {features.map((feature, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                  <input className="form-input" aria-label="Feature icon" value={feature.icon} maxLength={8} onChange={e => setFeatures(items => items.map((item, i) => i === index ? { ...item, icon: e.target.value } : item))} />
                  <input className="form-input" aria-label="Feature title" value={feature.title} maxLength={100} onChange={e => setFeatures(items => items.map((item, i) => i === index ? { ...item, title: e.target.value } : item))} />
                  <textarea className="form-input" aria-label="Feature description" rows={2} maxLength={300} value={feature.desc} onChange={e => setFeatures(items => items.map((item, i) => i === index ? { ...item, desc: e.target.value } : item))} />
                  <button className="btn-sm" type="button" onClick={() => setFeatures(items => items.filter((_, i) => i !== index))}>Remove</button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-sm" type="button" onClick={() => setFeatures(items => items.length < 12 ? [...items, { icon: '✨', title: '', desc: '' }] : items)} disabled={features.length >= 12}>+ Add feature</button>
              <button className="btn-primary" type="button" onClick={() => saveM.mutate({ ...(marketingRes || {}), features })} disabled={saveM.isPending || features.some(item => !item.title.trim() || !item.desc.trim())}>{saveM.isPending ? 'Saving…' : 'Save features'}</button>
            </div>
          </div>
        )}

        {active === 'Pricing' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Pricing display</div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-soft)', marginBottom: 14 }}>
              Read-only preview of the live plan catalog used by onboarding and server-side checkout calculations.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {catalogPlans.map(p => {
                const color = p.is_popular ? '#8b5cf6' : p.slug === 'custom' ? '#f59e0b' : '#3b82f6';
                const hasFixedPrice = Number.isFinite(Number(p.base_price_paise)) && p.base_price_paise !== null;
                return (
                <div key={p.id} style={{ background: p.is_popular ? 'rgba(236, 232, 255, 0.5)' : 'var(--admin-surface-alt)', border: `1.5px solid ${p.is_popular ? 'rgba(196,181,253,0.8)' : 'var(--admin-border)'}`, borderRadius: 10, padding: '14px 14px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase' }}>{p.name}</div>
                    {p.badge && <div style={{ fontSize: 9, color: 'var(--admin-text-soft)' }}>{p.badge}</div>}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {hasFixedPrice ? `₹${(Number(p.base_price_paise) / 100).toLocaleString('en-IN')}` : 'Custom quote'}
                    <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--admin-text-soft)' }}>{hasFixedPrice ? '/mo' : ''}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--admin-text-soft)', marginTop: 4 }}>
                    {p.employee_cap == null ? 'Unlimited employees' : `Up to ${p.employee_cap} employees`}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--admin-text-soft)' }}>GST at checkout</div>
                </div>
                );
              })}
              {catalogPlans.length === 0 && <div className="admin-empty-state">Plan catalog is unavailable.</div>}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--admin-text-soft)', lineHeight: 1.7 }}>
              <strong>To change a price:</strong> Use the <strong>Pricing &amp; Plans</strong> menu. Checkout totals are recalculated by the backend before a Razorpay order is created.
            </div>
          </div>
        )}

        {active === 'Testimonials' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Customer testimonials</div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-soft)', marginBottom: 14 }}>Publish only genuine customer quotes with permission. Empty entries are not shown publicly.</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {testimonials.map((item, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'start' }}>
                  <textarea className="form-input" aria-label="Customer quote" rows={2} maxLength={500} placeholder="Customer quote" value={item.quote} onChange={e => setTestimonials(items => items.map((row, i) => i === index ? { ...row, quote: e.target.value } : row))} />
                  <input className="form-input" aria-label="Author" maxLength={100} placeholder="Name" value={item.author} onChange={e => setTestimonials(items => items.map((row, i) => i === index ? { ...row, author: e.target.value } : row))} />
                  <input className="form-input" aria-label="Role" maxLength={100} placeholder="Role" value={item.role || ''} onChange={e => setTestimonials(items => items.map((row, i) => i === index ? { ...row, role: e.target.value } : row))} />
                  <input className="form-input" aria-label="Company" maxLength={100} placeholder="Company" value={item.company || ''} onChange={e => setTestimonials(items => items.map((row, i) => i === index ? { ...row, company: e.target.value } : row))} />
                  <button className="btn-sm" type="button" onClick={() => setTestimonials(items => items.filter((_, i) => i !== index))}>Remove</button>
                </div>
              ))}
              {testimonials.length === 0 && <div className="admin-empty-state">No testimonials published. Add a verified customer quote when permission is available.</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-sm" type="button" onClick={() => setTestimonials(items => items.length < 8 ? [...items, { quote: '', author: '', role: '', company: '' }] : items)} disabled={testimonials.length >= 8}>+ Add testimonial</button>
              <button className="btn-primary" type="button" onClick={() => saveM.mutate({ ...(marketingRes || {}), testimonials })} disabled={saveM.isPending || testimonials.some(item => !item.quote.trim() || !item.author.trim())}>{saveM.isPending ? 'Saving…' : 'Save testimonials'}</button>
            </div>
          </div>
        )}

        {active === 'CTA' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Bottom banner actions</div>
            <div style={{ fontSize: 11, color: 'var(--admin-text-soft)', marginBottom: 14 }}>
              Edit the public landing-page headline, supporting text and navigation actions. URLs must be internal paths beginning with /.
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              <label style={{ fontSize: 11, color: 'var(--admin-text-soft)' }}>Headline
                <input className="form-input" maxLength={180} value={cta.heading} onChange={e => setCta(v => ({ ...v, heading: e.target.value }))} />
              </label>
              <label style={{ fontSize: 11, color: 'var(--admin-text-soft)' }}>Supporting text
                <textarea className="form-input" rows={3} maxLength={400} value={cta.subhead} onChange={e => setCta(v => ({ ...v, subhead: e.target.value }))} />
              </label>
              {[
                ['Primary button', 'primaryText', 'primaryUrl'],
                ['Secondary button', 'secondaryText', 'secondaryUrl'],
                ['Contact button', 'contactText', 'contactUrl'],
              ].map(([label, textKey, urlKey]) => (
                <div key={textKey} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <label style={{ fontSize: 11, color: 'var(--admin-text-soft)' }}>{label} text
                    <input className="form-input" maxLength={50} value={cta[textKey]} onChange={e => setCta(v => ({ ...v, [textKey]: e.target.value }))} />
                  </label>
                  <label style={{ fontSize: 11, color: 'var(--admin-text-soft)' }}>{label} URL
                    <input className="form-input" maxLength={180} value={cta[urlKey]} onChange={e => setCta(v => ({ ...v, [urlKey]: e.target.value }))} placeholder="/register" />
                  </label>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" type="button" disabled={saveM.isPending || !cta.heading.trim() || !cta.subhead.trim() || ![cta.primaryUrl, cta.secondaryUrl, cta.contactUrl].every(url => /^\/(?!\/)/.test(url))} onClick={() => saveM.mutate({
                  ...(marketingRes || {}),
                  bottomCtaHeading: cta.heading,
                  bottomCtaSubhead: cta.subhead,
                  bottomCtaPrimaryText: cta.primaryText,
                  bottomCtaPrimaryUrl: cta.primaryUrl,
                  bottomCtaSecondaryText: cta.secondaryText,
                  bottomCtaSecondaryUrl: cta.secondaryUrl,
                  bottomCtaContactText: cta.contactText,
                  bottomCtaContactUrl: cta.contactUrl,
                })}>{saveM.isPending ? 'Saving…' : 'Save CTA section'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
