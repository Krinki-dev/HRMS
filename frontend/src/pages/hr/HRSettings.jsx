import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { settingsApi } from '../../services/settingsApi';
import '../../components/hr/HRLayout.css';
import './HRSettings.css';

const SECTIONS = [
  'Company',
  'Departments',
  'Designations',
  'Branches',
  'Shifts',
  'Holidays',
  'Email & SMS',
  'Roles',
];

const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Chandigarh',
  'Dadra & Nagar Haveli','Daman & Diu','Lakshadweep','Puducherry',
];

function ItemRow({ name, code, onEdit, onDelete, deleting }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px', background: '#f8fafc', borderRadius: 7,
      border: '0.5px solid rgba(0,0,0,0.07)',
    }}>
      <div>
        <span style={{ fontSize: 12, fontWeight: 500 }}>{name}</span>
        {code && <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 8 }}>{code}</span>}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn-sm" onClick={onEdit}>Edit</button>
        <button
          className="btn-sm"
          style={{ color: '#dc2626', borderColor: '#fecaca' }}
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? '…' : '✕'}
        </button>
      </div>
    </div>
  );
}

function InlineForm({ fields, value, onChange, onSave, onCancel, saving, title }) {
  return (
    <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#1d4ed8', marginBottom: 10 }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: fields.length > 1 ? '1fr 1fr' : '1fr', gap: 8, marginBottom: 10 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 3 }}>{f.label}{f.req && ' *'}</label>
            {f.type === 'select' ? (
              <select className="form-input" style={{ fontSize: 11 }} value={value[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}>
                <option value="">— select —</option>
                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input className="form-input" style={{ fontSize: 11 }} type={f.type || 'text'} placeholder={f.placeholder} value={value[f.key] || ''} onChange={e => onChange(f.key, e.target.value)} />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn-sm" style={{ background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8', padding: '5px 14px' }} onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function HRSettings() {
  const qc = useQueryClient();
  const [active, setActive] = useState('Company');

  const { data: companyRes } = useQuery({
    queryKey: ['settings-company'],
    queryFn:  settingsApi.getCompany,
    enabled:  active === 'Company',
  });
  const company = companyRes?.data || {};
  const [companyForm, setCompanyForm] = useState({});
  useEffect(() => { if (company.id) setCompanyForm(company); }, [company.id]);

  const companyM = useMutation({
    mutationFn: (d) => settingsApi.updateCompany(d),
    onSuccess:  () => { toast.success('Company profile updated'); qc.invalidateQueries({ queryKey: ['settings-company'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const { data: deptsRes } = useQuery({
    queryKey: ['settings-depts'],
    queryFn:  settingsApi.listDepts,
    enabled:  active === 'Departments',
  });
  const depts = deptsRes?.data || [];
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });
  const [editingDept, setEditingDept] = useState(null); 
  const [showDeptForm, setShowDeptForm] = useState(false);
  const [deletingDept, setDeletingDept] = useState(null);

  const deptM = useMutation({
    mutationFn: (d) => editingDept
      ? settingsApi.updateDept(editingDept, d)
      : settingsApi.createDept(d),
    onSuccess: () => {
      toast.success(editingDept ? 'Department updated' : 'Department created');
      setShowDeptForm(false); setEditingDept(null); setDeptForm({ name: '', code: '' });
      qc.invalidateQueries({ queryKey: ['settings-depts'] });
      qc.invalidateQueries({ queryKey: ['depts'] }); 
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteDept(id) {
    setDeletingDept(id);
    try {
      await settingsApi.deleteDept(id);
      toast.success('Department deleted');
      qc.invalidateQueries({ queryKey: ['settings-depts'] });
      qc.invalidateQueries({ queryKey: ['depts'] });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setDeletingDept(null); }
  }

  const { data: desigsRes } = useQuery({
    queryKey: ['settings-desigs'],
    queryFn:  settingsApi.listDesigs,
    enabled:  active === 'Designations',
  });
  const desigs = desigsRes?.data || [];
  const [desigForm, setDesigForm] = useState({ name: '' });
  const [editingDesig, setEditingDesig] = useState(null);
  const [showDesigForm, setShowDesigForm] = useState(false);
  const [deletingDesig, setDeletingDesig] = useState(null);

  const desigM = useMutation({
    mutationFn: (d) => editingDesig ? settingsApi.updateDesig(editingDesig, d) : settingsApi.createDesig(d),
    onSuccess:  () => {
      toast.success(editingDesig ? 'Designation updated' : 'Designation created');
      setShowDesigForm(false); setEditingDesig(null); setDesigForm({ name: '' });
      qc.invalidateQueries({ queryKey: ['settings-desigs'] });
      qc.invalidateQueries({ queryKey: ['desigs'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteDesig(id) {
    setDeletingDesig(id);
    try { await settingsApi.deleteDesig(id); toast.success('Designation deleted'); qc.invalidateQueries({ queryKey: ['settings-desigs'] }); qc.invalidateQueries({ queryKey: ['desigs'] }); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setDeletingDesig(null); }
  }

  const { data: branchesRes } = useQuery({
    queryKey: ['settings-branches'],
    queryFn:  settingsApi.listBranches,
    enabled:  active === 'Branches',
  });
  const branches = branchesRes?.data || [];
  const [branchForm, setBranchForm] = useState({ name: '', city: '', state: '' });
  const [editingBranch, setEditingBranch] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [deletingBranch, setDeletingBranch] = useState(null);

  const branchM = useMutation({
    mutationFn: (d) => editingBranch ? settingsApi.updateBranch(editingBranch, d) : settingsApi.createBranch(d),
    onSuccess:  () => {
      toast.success(editingBranch ? 'Branch updated' : 'Branch created');
      setShowBranchForm(false); setEditingBranch(null); setBranchForm({ name: '', city: '', state: '' });
      qc.invalidateQueries({ queryKey: ['settings-branches'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteBranch(id) {
    setDeletingBranch(id);
    try { await settingsApi.deleteBranch(id); toast.success('Branch deleted'); qc.invalidateQueries({ queryKey: ['settings-branches'] }); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setDeletingBranch(null); }
  }

  const { data: shiftsRes } = useQuery({
    queryKey: ['settings-shifts'],
    queryFn:  settingsApi.listShifts,
    enabled:  active === 'Shifts',
  });
  const shifts = shiftsRes?.data || [];
  const [shiftForm, setShiftForm] = useState({ name: '', start_time: '09:00', end_time: '18:00', grace_minutes: 15, shift_type: 'fixed' });
  const [editingShift, setEditingShift] = useState(null);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [deletingShift, setDeletingShift] = useState(null);

  const shiftM = useMutation({
    mutationFn: (d) => editingShift ? settingsApi.updateShift(editingShift, d) : settingsApi.createShift(d),
    onSuccess:  () => {
      toast.success(editingShift ? 'Shift updated' : 'Shift created');
      setShowShiftForm(false); setEditingShift(null);
      setShiftForm({ name: '', start_time: '09:00', end_time: '18:00', grace_minutes: 15, shift_type: 'fixed' });
      qc.invalidateQueries({ queryKey: ['settings-shifts'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteShift(id) {
    setDeletingShift(id);
    try { await settingsApi.deleteShift(id); toast.success('Shift deleted'); qc.invalidateQueries({ queryKey: ['settings-shifts'] }); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setDeletingShift(null); }
  }

  const currentYear = new Date().getFullYear();
  const [holidayYear, setHolidayYear] = useState(currentYear);
  const { data: holidaysRes, isLoading: hLoading } = useQuery({
    queryKey: ['settings-holidays', holidayYear],
    queryFn:  () => settingsApi.listHolidays(holidayYear),
    enabled:  active === 'Holidays',
  });
  const holidays = holidaysRes?.data || [];
  const [hForm, setHForm] = useState({ name: '', date: '', holiday_type: 'national' });
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [showHForm, setShowHForm] = useState(false);
  const [deletingHoliday, setDeletingHoliday] = useState(null);
  const [loadingNational, setLoadingNational] = useState(false);

  const holidayM = useMutation({
    mutationFn: (d) => editingHoliday ? settingsApi.updateHoliday(editingHoliday, d) : settingsApi.addHoliday(d),
    onSuccess:  () => {
      toast.success(editingHoliday ? 'Holiday updated' : 'Holiday added');
      setShowHForm(false); setEditingHoliday(null); setHForm({ name: '', date: '', holiday_type: 'national' });
      qc.invalidateQueries({ queryKey: ['settings-holidays'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  async function deleteHoliday(id) {
    setDeletingHoliday(id);
    try { await settingsApi.deleteHoliday(id); toast.success('Holiday deleted'); qc.invalidateQueries({ queryKey: ['settings-holidays'] }); }
    catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setDeletingHoliday(null); }
  }

  async function loadNational() {
    setLoadingNational(true);
    try {
      const r = await settingsApi.loadNationalHolidays(holidayYear);
      toast.success(`${r.data?.count || 0} national holidays loaded for ${holidayYear}`);
      qc.invalidateQueries({ queryKey: ['settings-holidays'] });
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setLoadingNational(false); }
  }

  const HOLIDAY_TYPE_BADGE = {
    national: 'badge-active',
    festival: 'badge-info',
    regional: 'badge-pending',
    optional: 'badge-gray',
  };

  const { data: notifRes } = useQuery({
    queryKey: ['settings-notif'],
    queryFn:  settingsApi.getNotifications,
    enabled:  active === 'Email & SMS',
  });
  const notifCfg = notifRes?.data?.config || {};
  const [smtpForm, setSmtpForm] = useState({});
  const [smtpDirty, setSmtpDirty] = useState(false);
  const [testEmailTo, setTestEmailTo] = useState('');

  useEffect(() => {
    if (notifCfg.emailHost) {
      setSmtpForm({
        emailHost: notifCfg.emailHost || '',
        emailPort: notifCfg.emailPort || 587,
        emailUser: notifCfg.emailUser || '',
        emailFrom: notifCfg.emailFrom || '',
        emailSsl:  notifCfg.emailSsl  || false,
        smsProvider: notifCfg.smsProvider || 'none',
        smsSenderId: notifCfg.smsSenderId || '',
      });
    }
  }, [notifCfg.emailHost]);

  function setSmtpField(k, v) { setSmtpForm(s => ({ ...s, [k]: v })); setSmtpDirty(true); }

  const notifM = useMutation({
    mutationFn: (d) => settingsApi.saveNotifications(d),
    onSuccess:  () => { toast.success('Email settings saved'); setSmtpDirty(false); qc.invalidateQueries({ queryKey: ['settings-notif'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'Save failed'),
  });

  const testEmailM = useMutation({
    mutationFn: () => settingsApi.testEmail(testEmailTo),
    onSuccess:  (r) => { toast.success(`Test email sent to ${r.data?.sentTo || testEmailTo}`); qc.invalidateQueries({ queryKey: ['settings-notif'] }); },
    onError:    (e) => toast.error(e.response?.data?.message || 'SMTP test failed'),
  });

  function setF(form, setForm) {
    return (k, v) => setForm(f => ({ ...f, [k]: v }));
  }

  return (
    <div className="hr-settings-layout">

      {}
      <div className="card" style={{ padding: 0, overflow: 'hidden', alignSelf: 'start' }}>
        <div className="card-header"><div className="card-title">Settings</div></div>
        {SECTIONS.map(s => (
          <button key={s} className={`hr-settings-btn${active === s ? ' active' : ''}`} onClick={() => setActive(s)}>
            {s}
          </button>
        ))}
      </div>

      {}
      <div>

        {}
        {active === 'Company' && (
          <div className="card card-p">
            <div className="card-title" style={{ marginBottom: 16 }}>Company profile</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { key: 'name',       label: 'Company name *',   req: true },
                { key: 'legal_name', label: 'Legal name'                  },
                { key: 'gstin',      label: 'GSTIN'                        },
                { key: 'pan',        label: 'PAN'                          },
                { key: 'cin',        label: 'CIN / Registration number'    },
                { key: 'phone',      label: 'Company phone'                },
                { key: 'email',      label: 'Company email'                },
                { key: 'website',    label: 'Website'                      },
                { key: 'city',       label: 'City'                         },
                { key: 'pincode',    label: 'Pincode'                      },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input
                    className="form-input"
                    value={companyForm[f.key] || ''}
                    onChange={e => setCompanyForm(c => ({ ...c, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">State</label>
                <select className="form-input" value={companyForm.state || ''} onChange={e => setCompanyForm(c => ({ ...c, state: e.target.value }))}>
                  <option value="">— select —</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Financial year start</label>
                <select className="form-input" value={companyForm.financial_year_start || '4'} onChange={e => setCompanyForm(c => ({ ...c, financial_year_start: e.target.value }))}>
                  <option value="4">April (Indian FY — Apr–Mar)</option>
                  <option value="1">January (Jan–Dec)</option>
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label className="form-label">Registered address</label>
                <textarea className="form-input" rows={2} value={companyForm.address || ''} onChange={e => setCompanyForm(c => ({ ...c, address: e.target.value }))} />
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <button
                className="btn-primary"
                onClick={() => companyM.mutate(companyForm)}
                disabled={companyM.isPending}
              >
                {companyM.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        )}

        {}
        {active === 'Departments' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="card-title">Departments</div>
                <div className="card-sub">{depts.length} department{depts.length !== 1 ? 's' : ''}</div>
              </div>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowDeptForm(true); setEditingDept(null); setDeptForm({ name: '', code: '' }); }}>
                + Add department
              </button>
            </div>
            {showDeptForm && (
              <InlineForm
                title={editingDept ? 'Edit department' : 'New department'}
                fields={[{ key: 'name', label: 'Department name', req: true, placeholder: 'e.g. Engineering' }, { key: 'code', label: 'Short code', placeholder: 'e.g. ENG' }]}
                value={deptForm}
                onChange={(k, v) => setDeptForm(f => ({ ...f, [k]: v }))}
                onSave={() => deptM.mutate(deptForm)}
                onCancel={() => { setShowDeptForm(false); setEditingDept(null); }}
                saving={deptM.isPending}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {depts.map(d => (
                <ItemRow
                  key={d.id}
                  name={d.name}
                  code={d.code}
                  onEdit={() => { setEditingDept(d.id); setDeptForm({ name: d.name, code: d.code || '' }); setShowDeptForm(true); }}
                  onDelete={() => { if (window.confirm(`Delete "${d.name}"?`)) deleteDept(d.id); }}
                  deleting={deletingDept === d.id}
                />
              ))}
              {depts.length === 0 && !showDeptForm && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>No departments yet. Add one above.</div>
              )}
            </div>
          </div>
        )}

        {}
        {active === 'Designations' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="card-title">Designations</div>
                <div className="card-sub">{desigs.length} designation{desigs.length !== 1 ? 's' : ''}</div>
              </div>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowDesigForm(true); setEditingDesig(null); setDesigForm({ name: '' }); }}>
                + Add designation
              </button>
            </div>
            {showDesigForm && (
              <InlineForm
                title={editingDesig ? 'Edit designation' : 'New designation'}
                fields={[{ key: 'name', label: 'Designation name', req: true, placeholder: 'e.g. Software Engineer' }]}
                value={desigForm}
                onChange={(k, v) => setDesigForm(f => ({ ...f, [k]: v }))}
                onSave={() => desigM.mutate(desigForm)}
                onCancel={() => { setShowDesigForm(false); setEditingDesig(null); }}
                saving={desigM.isPending}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {desigs.map(d => (
                <ItemRow
                  key={d.id}
                  name={d.name}
                  onEdit={() => { setEditingDesig(d.id); setDesigForm({ name: d.name }); setShowDesigForm(true); }}
                  onDelete={() => { if (window.confirm(`Delete "${d.name}"?`)) deleteDesig(d.id); }}
                  deleting={deletingDesig === d.id}
                />
              ))}
              {desigs.length === 0 && !showDesigForm && (
                <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>No designations yet.</div>
              )}
            </div>
          </div>
        )}

        {}
        {active === 'Branches' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div className="card-title">Branches / Locations</div>
                <div className="card-sub">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</div>
              </div>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowBranchForm(true); setEditingBranch(null); setBranchForm({ name: '', city: '', state: '' }); }}>
                + Add branch
              </button>
            </div>
            {showBranchForm && (
              <InlineForm
                title={editingBranch ? 'Edit branch' : 'New branch'}
                fields={[
                  { key: 'name',  label: 'Branch name', req: true, placeholder: 'e.g. Mumbai HQ' },
                  { key: 'city',  label: 'City',         placeholder: 'Mumbai' },
                  { key: 'state', label: 'State',         type: 'select', options: INDIA_STATES },
                ]}
                value={branchForm}
                onChange={(k, v) => setBranchForm(f => ({ ...f, [k]: v }))}
                onSave={() => branchM.mutate(branchForm)}
                onCancel={() => { setShowBranchForm(false); setEditingBranch(null); }}
                saving={branchM.isPending}
              />
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {branches.map(b => (
                <ItemRow
                  key={b.id}
                  name={b.name}
                  code={[b.city, b.state].filter(Boolean).join(', ')}
                  onEdit={() => { setEditingBranch(b.id); setBranchForm({ name: b.name, city: b.city || '', state: b.state || '' }); setShowBranchForm(true); }}
                  onDelete={() => { if (window.confirm(`Delete branch "${b.name}"?`)) deleteBranch(b.id); }}
                  deleting={deletingBranch === b.id}
                />
              ))}
              {branches.length === 0 && !showBranchForm && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>No branches yet.</div>
              )}
            </div>
          </div>
        )}

        {}
        {active === 'Shifts' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="card-title">Shift timings</div>
              <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowShiftForm(true); setEditingShift(null); setShiftForm({ name: '', start_time: '09:00', end_time: '18:00', grace_minutes: 15, shift_type: 'fixed' }); }}>
                + Add shift
              </button>
            </div>
            {showShiftForm && (
              <InlineForm
                title={editingShift ? 'Edit shift' : 'New shift'}
                fields={[
                  { key: 'name',          label: 'Shift name',     req: true, placeholder: 'General' },
                  { key: 'shift_type',    label: 'Type',           type: 'select', options: ['fixed', 'rotational', 'flexible'] },
                  { key: 'start_time',    label: 'Start time',     type: 'time' },
                  { key: 'end_time',      label: 'End time',       type: 'time' },
                  { key: 'grace_minutes', label: 'Grace (minutes)', type: 'number', placeholder: '15' },
                ]}
                value={shiftForm}
                onChange={(k, v) => setShiftForm(f => ({ ...f, [k]: v }))}
                onSave={() => shiftM.mutate(shiftForm)}
                onCancel={() => { setShowShiftForm(false); setEditingShift(null); }}
                saving={shiftM.isPending}
              />
            )}
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th>Start</th><th>End</th><th>Grace</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{s.shift_type || 'fixed'}</span></td>
                    <td style={{ fontFamily: 'monospace' }}>{s.start_time || '—'}</td>
                    <td style={{ fontFamily: 'monospace' }}>{s.end_time   || '—'}</td>
                    <td>{s.grace_minutes ? `${s.grace_minutes} min` : '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn-sm" onClick={() => { setEditingShift(s.id); setShiftForm({ name: s.name, start_time: s.start_time || '09:00', end_time: s.end_time || '18:00', grace_minutes: s.grace_minutes || 15, shift_type: s.shift_type || 'fixed' }); setShowShiftForm(true); }}>Edit</button>
                        <button className="btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => { if (window.confirm(`Delete shift "${s.name}"?`)) deleteShift(s.id); }} disabled={deletingShift === s.id}>{deletingShift === s.id ? '…' : '✕'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No shifts yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {}
        {active === 'Holidays' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="card-title">Holidays</div>
                <select className="form-input" style={{ width: 90, fontSize: 11 }} value={holidayYear} onChange={e => setHolidayYear(Number(e.target.value))}>
                  {[currentYear - 1, currentYear, currentYear + 1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-sm" onClick={loadNational} disabled={loadingNational}>
                  {loadingNational ? 'Loading…' : `Load national holidays ${holidayYear}`}
                </button>
                <button className="btn-primary" style={{ fontSize: 11 }} onClick={() => { setShowHForm(true); setEditingHoliday(null); setHForm({ name: '', date: '', holiday_type: 'national' }); }}>
                  + Add holiday
                </button>
              </div>
            </div>
            {showHForm && (
              <InlineForm
                title={editingHoliday ? 'Edit holiday' : 'New holiday'}
                fields={[
                  { key: 'name',         label: 'Holiday name',   req: true, placeholder: 'Republic Day' },
                  { key: 'date',         label: 'Date',           req: true, type: 'date' },
                  { key: 'holiday_type', label: 'Type',           type: 'select', options: ['national', 'festival', 'regional', 'optional'] },
                ]}
                value={hForm}
                onChange={(k, v) => setHForm(f => ({ ...f, [k]: v }))}
                onSave={() => holidayM.mutate(hForm)}
                onCancel={() => { setShowHForm(false); setEditingHoliday(null); }}
                saving={holidayM.isPending}
              />
            )}
            {hLoading ? (
              <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 12 }}>Loading…</div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Date</th><th>Holiday</th><th>Type</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                <tbody>
                  {holidays
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map(h => (
                      <tr key={h.id}>
                        <td style={{ fontFamily: 'monospace', whiteSpace: 'nowrap', fontSize: 11 }}>
                          {new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td style={{ fontWeight: 500 }}>{h.name}</td>
                        <td><span className={`badge ${HOLIDAY_TYPE_BADGE[h.holiday_type] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{h.holiday_type}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button className="btn-sm" onClick={() => { setEditingHoliday(h.id); setHForm({ name: h.name, date: h.date?.slice(0, 10) || '', holiday_type: h.holiday_type || 'national' }); setShowHForm(true); }}>Edit</button>
                            <button className="btn-sm" style={{ color: '#dc2626', borderColor: '#fecaca' }} onClick={() => { if (window.confirm(`Delete "${h.name}"?`)) deleteHoliday(h.id); }} disabled={deletingHoliday === h.id}>{deletingHoliday === h.id ? '…' : '✕'}</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  {holidays.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No holidays for {holidayYear}. Load national holidays or add manually.</td></tr>}
                </tbody>
              </table>
            )}
          </div>
        )}

        {}
        {active === 'Email & SMS' && (
          <div className="card card-p" style={{ maxWidth: 560 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div className="card-title">Email configuration (SMTP)</div>
                <div className="card-sub">Emails for leave approvals, payslips, OTPs will be sent from here</div>
              </div>
              {notifCfg.emailVerified && <span className="badge badge-active">✓ Verified</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label className="form-label">SMTP host *</label>
                <input className="form-input" placeholder="smtp.gmail.com" value={smtpForm.emailHost || ''} onChange={e => setSmtpField('emailHost', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Port</label>
                <input className="form-input" type="number" placeholder="587" value={smtpForm.emailPort || 587} onChange={e => setSmtpField('emailPort', Number(e.target.value))} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">SSL / TLS</label>
                <select className="form-input" value={smtpForm.emailSsl ? 'true' : 'false'} onChange={e => setSmtpField('emailSsl', e.target.value === 'true')}>
                  <option value="false">STARTTLS (port 587)</option>
                  <option value="true">SSL (port 465)</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Username *</label>
                <input className="form-input" placeholder="your@email.com" value={smtpForm.emailUser || ''} onChange={e => setSmtpField('emailUser', e.target.value)} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Password {notifCfg.hasEmailPass ? '(leave blank to keep)' : ''}</label>
                <input className="form-input" type="password" placeholder={notifCfg.hasEmailPass ? '••••••••' : 'App password'} onChange={e => setSmtpField('emailPass', e.target.value)} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                <label className="form-label">From address</label>
                <input className="form-input" placeholder="HR Team <hr@yourcompany.com>" value={smtpForm.emailFrom || ''} onChange={e => setSmtpField('emailFrom', e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={() => notifM.mutate(smtpForm)}
                disabled={notifM.isPending}
              >
                {notifM.isPending ? 'Saving…' : smtpDirty ? 'Save changes' : 'Save'}
              </button>
            </div>

            {}
            <div style={{ marginTop: 16, padding: '12px 14px', background: '#f8fafc', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Test email configuration</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  type="email"
                  placeholder="Send test to…"
                  value={testEmailTo}
                  onChange={e => setTestEmailTo(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn-sm"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => testEmailM.mutate()}
                  disabled={testEmailM.isPending || !testEmailTo || !notifCfg.emailHost}
                >
                  {testEmailM.isPending ? 'Sending…' : 'Send test'}
                </button>
              </div>
              {notifCfg.emailVerified && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#15803d' }}>✓ Last test passed — SMTP is working</div>
              )}
              {notifCfg.emailHost && !notifCfg.emailVerified && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#92400e' }}>⚠ Saved but not yet verified — send a test email above</div>
              )}
            </div>

            {}
            <div style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 10 }}>SMS configuration</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">SMS provider</label>
                  <select className="form-input" value={smtpForm.smsProvider || 'none'} onChange={e => setSmtpField('smsProvider', e.target.value)}>
                    <option value="none">Disabled</option>
                    <option value="fast2sms">Fast2SMS</option>
                    <option value="msg91">MSG91</option>
                  </select>
                </div>
                {(smtpForm.smsProvider && smtpForm.smsProvider !== 'none') && (
                  <>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Sender ID</label>
                      <input className="form-input" placeholder="SYNTRN" value={smtpForm.smsSenderId || ''} onChange={e => setSmtpField('smsSenderId', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1', margin: 0 }}>
                      <label className="form-label">API key {notifCfg.hasSmsKey ? '(leave blank to keep)' : ''}</label>
                      <input className="form-input" type="password" placeholder={notifCfg.hasSmsKey ? '••••••••' : 'Paste API key'} onChange={e => setSmtpField('smsApiKey', e.target.value)} />
                    </div>
                  </>
                )}
              </div>
              {smtpForm.smsProvider && smtpForm.smsProvider !== 'none' && (
                <div style={{ marginTop: 10 }}>
                  <button className="btn-primary" onClick={() => notifM.mutate(smtpForm)} disabled={notifM.isPending}>
                    {notifM.isPending ? 'Saving…' : 'Save SMS settings'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {active === 'Roles' && (
          <div className="card card-p">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="card-title">Roles & permissions</div>
              <Link to="/settings/roles" className="btn-primary" style={{ fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                Manage roles →
              </Link>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
              Full role and permission management is in the <strong>Settings → Roles</strong> page where you can create custom roles, set module-level permissions (view / create / edit / delete), and assign roles to employees.
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', background: '#f0fdf4', borderRadius: 6, fontSize: 11, color: '#15803d' }}>
              Default roles: Super Admin · HR Admin · HR Manager · Manager · Employee · Accountant
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

