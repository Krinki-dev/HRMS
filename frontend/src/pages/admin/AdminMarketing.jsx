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

const FEATURE_DEFAULTS = [
  { icon: '₹',  title: 'Payroll on all plans',           desc: 'Payslips, PF, ESI, TDS — included in every plan. Not a paid addon.' },
  { icon: '🤖', title: 'Browser automation (unique)',     desc: 'Auto-file ECR on EPFO. Auto-file ESI challan. Aadhaar KYC auto-fill. No competitor has this.' },
  { icon: '📋', title: 'Compliance made simple',         desc: 'PF, ESI, PT, TDS, LWF — all states, all slabs, auto-computed.' },
  { icon: '♾', title: 'Unlimited employees',            desc: 'Keka charges per employee. We don\'t. Unlimited headcount on all plans.' },
  { icon: '🔒', title: 'Your data, your control',        desc: 'Self-hosted option. Hybrid mode. Your DB, your server, your choice.' },
  { icon: '🌐', title: 'Your own domain',                desc: 'hr.yourcompany.com instead of yourcompany.syntern.in. Starter plan+.' },
];

export default function AdminMarketing() {
  const qc = useQueryClient();
  const [active, setActive]   = useState('Hero');
  const [hero,   setHero]     = useState(HERO_DEFAULTS);
  const [copied, setCopied]   = useState(false);

  // 1. Fetch current marketing settings from DB
  const { data: marketingRes, isLoading } = useQuery({
    queryKey: ['admin-marketing'],
    queryFn: () => api.get('/platform/admin/marketing').then(res => res.data),
  });

  // 1.1 Fetch current plan catalog for preview
  const { data: plansRes } = useQuery({
    queryKey: ['admin-plans-catalog'],
    queryFn: () => api.get('/platform/admin/plans').then(res => res.data),
  });
  const catalogPlans = plansRes?.plans || [];

  // Sync local state when data is loaded
  useEffect(() => {
    if (marketingRes && Object.keys(marketingRes).length > 0) {
      setHero(h => ({ ...h, ...marketingRes }));
    }
  }, [marketingRes]);

  // 2. Mutation to save settings
  const saveM = useMutation({
    mutationFn: (values) => api.put('/platform/admin/settings', { section: 'Marketing', values }),
    onSuccess: () => {
      toast.success('Landing page updated successfully');
      qc.invalidateQueries(['admin-marketing']);
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
    saveM.mutate(hero);
  }

  if (isLoading) return <div className="p-10 text-center text-gray-400">Loading landing page content...</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14 }}>

      {}
      <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 600, color: '#0f172a' }}>
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
            <div style={{ background: '#040c1a', borderRadius: 10, padding: '24px 28px', marginBottom: 14 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3 }}>{hero.heading}</div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>{hero.subhead}</div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ padding: '10px 24px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{hero.ctaText}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{hero.ctaSub}</div>
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
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Feature cards</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>These 6 cards appear in the &quot;Why Syntern?&quot; section on the landing page.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {FEATURE_DEFAULTS.map((f, i) => (
                <div key={i} style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#fffbeb', borderRadius: 6, fontSize: 11, color: '#92400e' }}>
              To edit feature text: modify <code>FEATURE_DEFAULTS</code> in this file and redeploy.
            </div>
          </div>
        )}

        {active === 'Pricing' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Pricing display</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>
              Dynamic pricing (₹1,499 Base Plan) synced with platform catalog.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {catalogPlans.map(p => {
                const color = p.id === 'pro' ? '#8b5cf6' : p.id === 'enterprise' ? '#f59e0b' : '#3b82f6';
                return (
                <div key={p.id} style={{ background: p.highlight ? '#faf5ff' : '#f8fafc', border: `1.5px solid ${p.highlight ? '#c4b5fd' : '#e2e8f0'}`, borderRadius: 10, padding: '14px 14px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: color, textTransform: 'uppercase' }}>{p.name}</div>
                    {p.originalPrice && <div style={{ fontSize: 9, color: '#94a3b8', textDecoration: 'line-through' }}>₹{p.originalPrice}</div>}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>
                    {p.price ? `₹${p.price.toLocaleString('en-IN')}` : 'Custom'}
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>{p.period ? `/${p.period}` : ''}</span>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                    {p.id === 'enterprise' ? 'Own Server Mode' : `First ${p.baseEmployees} Employees`}
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8' }}>+18% GST Extra</div>
                </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
              <strong>To change a price:</strong> Open <code>backend/modules/platform/subscription.routes.js</code> → find the <code>PLANS</code> array → change the <code>price</code> value → commit + deploy.
            </div>
          </div>
        )}

        {active === 'Testimonials' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Testimonials</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 14 }}>Add testimonials from real clients once you have them. These appear on the landing page.</div>
            <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 12 }}>
              No testimonials yet. Once you onboard real clients and collect feedback, add them here.
            </div>
            <div style={{ padding: '10px 12px', background: '#eff6ff', borderRadius: 6, fontSize: 11, color: '#1d4ed8' }}>
              💡 After PCEPL goes live: ask them for a 1-2 sentence quote about using Syntern. Add it here to improve landing page conversion.
            </div>
          </div>
        )}

        {active === 'CTA' && (
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Call-to-action links</div>
            <table className="data-table">
              <thead><tr><th>Section</th><th>CTA text</th><th>URL</th><th>Status</th></tr></thead>
              <tbody>
                {[
                  { section: 'Hero banner',        text: 'Start free trial',     url: '/register', status: 'active' },
                  { section: 'Pricing (Starter)',   text: 'Get Starter',          url: '/register?plan=starter', status: 'active' },
                  { section: 'Pricing (Pro)',        text: 'Get Professional',     url: '/register?plan=pro',     status: 'active' },
                  { section: 'Pricing (Enterprise)', text: 'Contact sales',        url: 'mailto:sales@syntern.in', status: 'active' },
                  { section: 'Bottom banner',       text: 'Book a demo',           url: 'mailto:demo@syntern.in',  status: 'active' },
                ].map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12 }}>{r.section}</td>
                    <td style={{ fontSize: 11, fontWeight: 500 }}>{r.text}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 10, color: '#2563eb' }}>{r.url}</td>
                    <td><span className="badge badge-active" style={{ fontSize: 9 }}>Active</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
