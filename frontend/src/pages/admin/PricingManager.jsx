/**
 * PricingManager.jsx
 * Admin page: Plan & Pricing Manager
 * Route: /admin/pricing   (add to App.jsx / admin router)
 * Access: platform admin only (is_platform_admin === true)
 */
import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';   // project uses react-hot-toast

const fmt = (p) => p != null ? `₹${(p / 100).toLocaleString('en-IN')}` : '—';

const ALL_MODULES = [
  'employees','attendance','leave','payroll','compliance','reports','automation',
  'recruitment','performance','training','expenses','assets','fieldforce','ai',
];

// ── Atoms ─────────────────────────────────────────────────────────────────────
const Input = ({ label, value, onChange, type = 'text', placeholder, small }) => (
  <div>
    {label && <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>}
    <input
      type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-[rgba(148,163,184,0.3)] rounded-xl bg-white px-3 text-sm text-[#111827]
        focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]
        ${small ? 'py-1.5' : 'py-2'}`}
    />
  </div>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div className="relative">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
      <div className={`w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'}`} />
      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[18px] left-0.5' : 'left-0.5'}`} />
    </div>
    {label && <span className="text-sm text-[#475569]">{label}</span>}
  </label>
);

const Btn = ({ children, onClick, variant = 'primary', small, disabled }) => {
  const base = 'font-medium rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50';
  const sz = small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const v = {
    primary:   'bg-[#2563EB] text-white hover:bg-[#1d4ed8]',
    secondary: 'border border-[#2563EB] text-[#2563EB] hover:bg-[#DBEAFE]',
    danger:    'bg-red-50 text-red-600 hover:bg-red-100',
    ghost:     'text-[#475569] hover:bg-[#F1F5F9]',
  };
  return <button onClick={onClick} disabled={disabled} className={`${base} ${sz} ${v[variant] || v.primary}`}>{children}</button>;
};

const Badge = ({ children, color = 'blue' }) => {
  const c = { blue:'bg-blue-50 text-blue-700', green:'bg-green-50 text-green-700', gray:'bg-gray-100 text-gray-600', amber:'bg-amber-50 text-amber-700' };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c[color]}`}>{children}</span>;
};

// ── Plan Modal ────────────────────────────────────────────────────────────────
function PlanModal({ plan, onSave, onClose }) {
  const [f, setF] = useState({
    name:'', slug:'', tagline:'', badge:'', is_active:true, is_popular:false,
    base_price_paise:'', employee_cap:'', per_employee_excess_paise:5000,
    included_modules:['employees','attendance','leave','payroll','compliance','reports','automation','notifications','settings','documents'],
    is_trial_eligible:true, trial_days:90, sort_order:99,
    ...plan, highlights: plan.highlights?.length ? plan.highlights : [''],
  });
  const [saving, setSaving] = useState(false);
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));

  const toggleMod = (list, mod) => s(list, f[list].includes(mod) ? f[list].filter(m=>m!==mod) : [...f[list], mod]);

  const save = async () => {
    if (!f.name || !f.slug) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      await onSave({
        ...f,
        base_price_paise: f.base_price_paise ? Number(f.base_price_paise) : null,
        employee_cap: f.employee_cap ? Number(f.employee_cap) : null,
        per_employee_excess_paise: Number(f.per_employee_excess_paise) || 5000,
        highlights: f.highlights.filter(Boolean),
        sort_order: Number(f.sort_order) || 99,
        trial_days: Number(f.trial_days) || 0,
      });
      toast.success(!plan.id ? 'Plan created!' : 'Plan saved!');
      onClose();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[rgba(148,163,184,0.2)]">
          <h2 className="text-base font-semibold">{!plan.id ? 'New Plan' : 'Edit Plan'}</h2>
          <button onClick={onClose} className="text-[#94A3B8] hover:text-[#475569]">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name *" value={f.name} onChange={v => s('name', v)} placeholder="Starter" />
            <Input label="Slug *" value={f.slug} onChange={v => s('slug', v.toLowerCase().replace(/\s+/g,'-'))} placeholder="starter" />
          </div>
          <Input label="Tagline" value={f.tagline} onChange={v => s('tagline', v)} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Badge" value={f.badge} onChange={v => s('badge', v)} placeholder="Most Popular" />
            <Input label="Sort Order" type="number" value={f.sort_order} onChange={v => s('sort_order', v)} />
            <div className="flex flex-col gap-2 pt-5">
              <Toggle checked={f.is_active} onChange={v => s('is_active', v)} label="Active" />
              <Toggle checked={f.is_popular} onChange={v => s('is_popular', v)} label="Popular" />
            </div>
          </div>

          <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[rgba(148,163,184,0.2)]">
            <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">Pricing</p>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Base Price (paise)" type="number" value={f.base_price_paise} onChange={v => s('base_price_paise', v)} placeholder="149900" />
              <Input label="Employee Cap" type="number" value={f.employee_cap} onChange={v => s('employee_cap', v)} placeholder="25" />
              <Input label="Overage/emp (paise)" type="number" value={f.per_employee_excess_paise} onChange={v => s('per_employee_excess_paise', v)} />
            </div>
            {f.base_price_paise && (
              <p className="text-xs text-[#2563EB] mt-2">= {fmt(Number(f.base_price_paise))}/mo · +{fmt(Number(f.per_employee_excess_paise))}/extra emp</p>
            )}
          </div>

          <div className="flex items-center gap-5">
            <Toggle checked={f.is_trial_eligible} onChange={v => s('is_trial_eligible', v)} label="Trial eligible" />
            {f.is_trial_eligible && (
              <div className="w-24"><Input small type="number" value={f.trial_days} onChange={v => s('trial_days', v)} placeholder="90" /></div>
            )}
          </div>

          {['included_modules','addon_modules'].map(k => (
            <div key={k} className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[rgba(148,163,184,0.2)]">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2.5">
                {k === 'included_modules' ? '✅ Included in plan' : '➕ Available as add-ons'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_MODULES.map(mod => (
                  <button key={mod} onClick={() => toggleMod(k, mod)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      f[k].includes(mod)
                        ? k === 'included_modules' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-[#64748B] border-[rgba(148,163,184,0.3)] hover:border-[#2563EB]'
                    }`}
                  >{mod}</button>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">Selling Points</p>
            <div className="space-y-2">
              {f.highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input value={h} onChange={e => { const hl = [...f.highlights]; hl[i]=e.target.value; s('highlights',hl); }}
                    placeholder={`Feature ${i+1}…`}
                    className="flex-1 border border-[rgba(148,163,184,0.3)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB]" />
                  <button onClick={() => s('highlights', f.highlights.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 px-2">✕</button>
                </div>
              ))}
              <Btn small variant="ghost" onClick={() => s('highlights', [...f.highlights,''])}>+ Add point</Btn>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[rgba(148,163,184,0.2)]">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : !plan.id ? 'Create Plan' : 'Save Changes'}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Plans ────────────────────────────────────────────────────────────────
function PlansTab({ data, reload }) {
  const [modal, setModal] = useState(null);
  const save = async (payload) => {
    if (payload.id) await api.put(`/platform/admin/plans/${payload.id}`, payload);
    else await api.post('/platform/admin/plans', payload);
    await reload();
  };
  const del = async (id, name) => {
    if (!confirm(`Delete plan "${name}"?`)) return;
    await api.delete(`/platform/admin/plans/${id}`);
    toast.success('Plan deleted'); await reload();
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Plan Catalog</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Plans shown on the onboarding plan selection screen</p>
        </div>
        <Btn onClick={() => setModal({})}>+ New Plan</Btn>
      </div>
      <div className="space-y-3">
        {(data.plans || []).map(plan => (
          <div key={plan.id} className="bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#111827]">{plan.name}</span>
                  {plan.badge && <Badge color="amber">{plan.badge}</Badge>}
                  {plan.is_popular && <Badge color="blue">Popular</Badge>}
                  {!plan.is_active && <Badge color="gray">Inactive</Badge>}
                  <span className="text-xs text-[#94A3B8] font-mono">/{plan.slug}</span>
                </div>
                <p className="text-sm text-[#64748B] mt-0.5">{plan.tagline}</p>
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-[#111827]">{plan.base_price_paise ? fmt(plan.base_price_paise) : 'Custom'}</p>
                {plan.base_price_paise && <p className="text-xs text-[#94A3B8]">/month · cap {plan.employee_cap ?? '∞'} emp</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#64748B]">
              <span>✅ {plan.included_modules?.length || 0} included</span>
              <span>➕ {plan.addon_modules?.length || 0} add-ons</span>
              {plan.is_trial_eligible && <span>🎁 {plan.trial_days}d trial</span>}
              {plan.employee_cap && <span>📊 +{fmt(plan.per_employee_excess_paise)}/extra emp</span>}
            </div>
            {plan.highlights?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {plan.highlights.map((h,i) => <span key={i} className="text-xs bg-[#F1F5F9] text-[#475569] px-2 py-0.5 rounded-full">{h}</span>)}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Btn small variant="secondary" onClick={() => setModal(plan)}>Edit</Btn>
              <Btn small variant="danger" onClick={() => del(plan.id, plan.name)}>Delete</Btn>
            </div>
          </div>
        ))}
      </div>
      {modal !== null && <PlanModal plan={modal} onSave={save} onClose={() => setModal(null)} />}
    </div>
  );
}

// ── Tab: Module Pricing ───────────────────────────────────────────────────────
function PricingTab({ data, reload }) {
  const [pricing, setPricing] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (data.modulePricing) setPricing(data.modulePricing); }, [data.modulePricing]);
  const setField = (mod, field, val) => setPricing(p => ({ ...p, [mod]: { ...p[mod], [field]: val } }));
  const save = async () => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(Object.entries(pricing).map(([m,c]) => [m, { ...c, price_paise: Number(c.price_paise) }]));
      await api.put('/platform/admin/plans/pricing', payload);
      toast.success('Pricing saved!'); await reload();
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Module Pricing</h2>
          <p className="text-xs text-[#64748B] mt-0.5">Default add-on price per module. Used in plan selection and billing.</p>
        </div>
        <Btn onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save All'}</Btn>
      </div>
      <div className="bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#F8FAFC]">
            <tr>{['Module','Label','Type','Price (paise)','Preview','Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#475569] uppercase tracking-wider">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {Object.entries(pricing).map(([mod, cfg]) => (
              <tr key={mod} className="border-t border-[rgba(148,163,184,0.1)] hover:bg-[#F8FAFC]/60">
                <td className="px-4 py-2.5 font-mono text-xs text-[#64748B]">{mod}</td>
                <td className="px-4 py-2.5">
                  <input value={cfg.label||''} onChange={e => setField(mod,'label',e.target.value)}
                    className="w-32 border border-[rgba(148,163,184,0.3)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#2563EB]" />
                </td>
                <td className="px-4 py-2.5">
                  <select value={cfg.type} onChange={e => setField(mod,'type',e.target.value)}
                    className="border border-[rgba(148,163,184,0.3)] rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                    <option value="per_employee">Per Employee</option>
                    <option value="flat">Flat Monthly</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  <input type="number" value={cfg.price_paise||''} onChange={e => setField(mod,'price_paise',e.target.value)}
                    className="w-24 border border-[rgba(148,163,184,0.3)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#2563EB]" />
                </td>
                <td className="px-4 py-2.5 text-[#2563EB] font-medium text-xs">
                  {fmt(Number(cfg.price_paise))}{cfg.type==='per_employee'?'/emp':'/mo'}
                </td>
                <td className="px-4 py-2.5">
                  <input value={cfg.desc||''} onChange={e => setField(mod,'desc',e.target.value)}
                    placeholder="Short description"
                    className="w-48 border border-[rgba(148,163,184,0.3)] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#2563EB]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab: Discounts & Promos ───────────────────────────────────────────────────
function DiscountsTab({ data, reload }) {
  const [disc, setDisc] = useState({ tenure: [], bundle: {} });
  const [promos, setPromos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [np, setNp] = useState({ code:'', type:'flat', value_paise:'', value_pct:'', expiry:'', description:'', is_active:true });

  useEffect(() => { if (data.discounts) setDisc(data.discounts); }, [data.discounts]);
  useEffect(() => { if (data.promoCodes) setPromos(data.promoCodes); }, [data.promoCodes]);

  const setTenure = (i, field, val) => { const t=[...disc.tenure]; t[i]={...t[i],[field]:field==='pct'||field==='months'?Number(val):val}; setDisc(d=>({...d,tenure:t})); };
  const setBundle = (k, v) => setDisc(d => ({ ...d, bundle: { ...d.bundle, [k]: v } }));

  const saveDisc = async () => {
    setSaving(true);
    try { await api.put('/platform/admin/plans/discounts', disc); toast.success('Discounts saved!'); await reload(); }
    catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const addPromo = async () => {
    if (!np.code||!np.type) { toast.error('Code and type required'); return; }
    try {
      await api.post('/platform/admin/plans/promos', { ...np, value_paise: np.value_paise?Number(np.value_paise):undefined, value_pct: np.value_pct?Number(np.value_pct):undefined });
      toast.success('Promo saved!'); await reload();
      setNp({ code:'', type:'flat', value_paise:'', value_pct:'', expiry:'', description:'', is_active:true });
    } catch { toast.error('Failed'); }
  };

  const delPromo = async (code) => {
    if (!confirm(`Delete promo "${code}"?`)) return;
    await api.delete(`/platform/admin/plans/promos/${code}`);
    toast.success('Deleted'); await reload();
  };

  return (
    <div className="space-y-5">
      {/* Tenure Discounts */}
      <div className="bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-[#111827]">Tenure Discounts</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Discount % for longer billing commitments</p>
          </div>
          <div className="flex gap-2">
            <Btn small variant="ghost" onClick={() => setDisc(d=>({...d,tenure:[...(d.tenure||[]),{months:3,pct:3,label:'3 Months',note:''}]}))}>+ Add Tier</Btn>
            <Btn small onClick={saveDisc} disabled={saving}>{saving?'Saving…':'Save'}</Btn>
          </div>
        </div>
        <div className="space-y-2">
          {(disc.tenure||[]).map((t, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 items-end">
              <Input small label="Months" type="number" value={t.months} onChange={v=>setTenure(i,'months',v)} />
              <Input small label="Label" value={t.label} onChange={v=>setTenure(i,'label',v)} placeholder="1 Year" />
              <Input small label="Discount %" type="number" value={t.pct} onChange={v=>setTenure(i,'pct',v)} />
              <Input small label="Display Note" value={t.note} onChange={v=>setTenure(i,'note',v)} placeholder="~2 months free" />
              <button onClick={() => setDisc(d=>({...d,tenure:d.tenure.filter((_,j)=>j!==i)}))} className="text-red-400 hover:text-red-600 text-lg pb-1">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Bundle Discount */}
      <div className="bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-[#111827] mb-4">Bundle Discount</h3>
        <div className="grid grid-cols-4 gap-3 items-end">
          <Input label="Min add-ons" type="number" value={disc.bundle?.trigger_count??3} onChange={v=>setBundle('trigger_count',Number(v))} />
          <Input label="Discount %" type="number" value={disc.bundle?.pct??15} onChange={v=>setBundle('pct',Number(v))} />
          <div className="pb-2"><Toggle checked={disc.bundle?.is_stackable??false} onChange={v=>setBundle('is_stackable',v)} label="Stack with tenure?" /></div>
          <Btn onClick={saveDisc} disabled={saving}>{saving?'…':'Save Bundle'}</Btn>
        </div>
      </div>

      {/* Promo Codes */}
      <div className="bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-[#111827] mb-4">Promo Codes</h3>
        <div className="grid grid-cols-6 gap-2 items-end p-3.5 bg-[#F8FAFC] rounded-xl mb-4">
          <Input small label="Code" value={np.code} onChange={v=>setNp(p=>({...p,code:v.toUpperCase()}))} placeholder="LAUNCH50" />
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Type</label>
            <select value={np.type} onChange={e=>setNp(p=>({...p,type:e.target.value}))}
              className="w-full border border-[rgba(148,163,184,0.3)] rounded-xl px-2 py-1.5 text-sm bg-white focus:outline-none">
              <option value="flat">Flat ₹ Off</option>
              <option value="percent">% Off</option>
            </select>
          </div>
          {np.type==='flat'
            ? <Input small label="Amount (paise)" type="number" value={np.value_paise} onChange={v=>setNp(p=>({...p,value_paise:v}))} placeholder="50000" />
            : <Input small label="Percent Off" type="number" value={np.value_pct} onChange={v=>setNp(p=>({...p,value_pct:v}))} placeholder="10" />}
          <Input small label="Expiry" type="date" value={np.expiry} onChange={v=>setNp(p=>({...p,expiry:v}))} />
          <Input small label="Description" value={np.description} onChange={v=>setNp(p=>({...p,description:v}))} placeholder="Launch offer" />
          <Btn small onClick={addPromo}>Add Code</Btn>
        </div>
        {promos.length === 0
          ? <p className="text-sm text-[#94A3B8] text-center py-4">No promo codes yet</p>
          : (
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr>{['Code','Type','Value','Expiry','Description','Status',''].map(h=>(
                  <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#475569]">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {promos.map(p => {
                  const expired = p.expiry && new Date(p.expiry) < new Date();
                  return (
                    <tr key={p.code} className="border-t border-[rgba(148,163,184,0.1)]">
                      <td className="px-3 py-2 font-mono font-bold text-[#2563EB]">{p.code}</td>
                      <td className="px-3 py-2 text-[#475569]">{p.type}</td>
                      <td className="px-3 py-2 font-medium">{p.type==='flat'?fmt(p.value_paise):`${p.value_pct}%`}</td>
                      <td className="px-3 py-2 text-[#64748B]">{p.expiry||'—'}</td>
                      <td className="px-3 py-2 text-[#64748B]">{p.description||'—'}</td>
                      <td className="px-3 py-2">{!p.is_active||expired?<Badge color="gray">Inactive</Badge>:<Badge color="green">Active</Badge>}</td>
                      <td className="px-3 py-2"><Btn small variant="danger" onClick={()=>delPromo(p.code)}>Delete</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PricingManager() {
  const [tab,     setTab]     = useState('plans');
  const [data,    setData]    = useState({ plans:[], modulePricing:{}, discounts:{}, promoCodes:[] });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/platform/admin/plans');
      const payload = res.data?.data || res.data || {};
      setData({ 
        plans: payload.plans || [], 
        modulePricing: payload.modulePricing || {}, 
        discounts: payload.discounts || { tenure: [], bundle: {} }, 
        promoCodes: payload.promoCodes || [],
        gstRate: payload.gstRate || 18
      });
    } catch { toast.error('Failed to load pricing data'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const TABS = [
    { key:'plans',     label:'Plans',             icon:'🏷️' },
    { key:'pricing',   label:'Module Pricing',     icon:'💰' },
    { key:'discounts', label:'Discounts & Promos', icon:'🎁' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#111827]">Plan & Pricing Manager</h1>
          <p className="text-sm text-[#64748B] mt-1">Configure plans, pricing, and discounts shown during tenant onboarding</p>
        </div>
        <div className="flex gap-1 bg-white border border-[rgba(148,163,184,0.2)] rounded-2xl p-1 shadow-sm mb-6 w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                tab===t.key ? 'bg-[#2563EB] text-white shadow-sm' : 'text-[#475569] hover:text-[#111827] hover:bg-[#F1F5F9]'
              }`}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {loading
          ? <div className="flex justify-center py-24"><div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" /></div>
          : (
            <>
              {tab==='plans'     && <PlansTab data={data} reload={load} />}
              {tab==='pricing'   && <PricingTab data={data} reload={load} />}
              {tab==='discounts' && <DiscountsTab data={data} reload={load} />}
            </>
          )}
      </div>
    </div>
  );
}
